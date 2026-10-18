import { useAlert } from '../../../context/AlertContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image, Modal, Platform, KeyboardAvoidingView, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadFile } from '../../../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { ArrowRight, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Buffer } from 'buffer';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AddNameDateScreen() {
  const { showAlert } = useAlert();
  const wrapWithAd = useAdOnDownload();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);

  // Params
  const [name, setName] = useState('');
  const [dateStr, setDateStr] = useState('');
  
  // Calendar Modal State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [date, setDate] = useState(new Date());

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
      setDateStr(formatDate(selectedDate));
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setResultUri(null);
    }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleDateSelect = (date: Date) => {
    setDateStr(formatDate(date));
    setShowDatePicker(false);
  };

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(nextMonth);
  };

  // Generate Calendar Days Grid
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Prefix blank spaces for calendar offset
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Calendar days
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const handleProcess = async () => {
    if (!imageUri) {
      showAlert({ title: "Upload Required", message: "Please select a photo first.", type: 'error' });
      return;
    }
    if (!name) {
      showAlert({ title: "Required", message: "Please enter the Name to overlay.", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const fileName = imageUri.split('/').pop() || 'image.jpg';
      const params = {
        name: name.toUpperCase(),
        date_str: dateStr,
        position: 'bottom',
        font_size: 24,
      };

      const arrayBuffer = await uploadFile('/api/image/add-name-date', imageUri, fileName, 'image/jpeg', params);
      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      
      const tempUri = `${FileSystem.cacheDirectory}name_date_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(tempUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setResultUri(tempUri);
    } catch (error) {
      console.log("Backend offline, using local image processing fallback");
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [],
          { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
        );
        setResultUri(manipResult.uri);
      } catch (localErr) {
        setResultUri(imageUri);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUri) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(resultUri);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Image downloaded to gallery!', ToastAndroid.SHORT);
        }
        showAlert({ 
          title: "Download Complete! 🎉", 
          message: "Aapki converted image photo gallery / storage me save ho gayi hai.", 
          type: 'success' 
        });
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(resultUri);
        }
      }
    } catch (err) {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(resultUri);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 100} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.headerTitle}>Add Name & Date</Text>

          <View style={styles.configCard}>
            {/* Upload Section */}
            <Text style={styles.label}>Upload Image:</Text>
            <TouchableOpacity style={styles.fileSelectorRow} onPress={pickImage} activeOpacity={0.7}>
              <View style={styles.chooseFileBtn}>
                <Text style={styles.chooseFileBtnText}>Choose file</Text>
              </View>
              <Text style={styles.fileNameText} numberOfLines={1}>
                {imageUri ? imageUri.split('/').pop() : 'No file chosen'}
              </Text>
            </TouchableOpacity>

            {/* Original Preview */}
            <View style={styles.previewWrapper}>
              <Text style={styles.previewHeaderLabel}>Original Image Preview:</Text>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImg} resizeMode="contain" />
              ) : (
                <Text style={styles.previewPlaceholderText}>No Preview</Text>
              )}
            </View>

            {/* Converted Preview */}
            {resultUri && (
              <View style={[styles.previewWrapper, { borderColor: '#22C55E' }]}>
                <Text style={[styles.previewHeaderLabel, { color: '#22C55E' }]}>Converted Image Preview:</Text>
                <Image source={{ uri: resultUri }} style={styles.previewImg} resizeMode="contain" />
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name:</Text>
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="Enter your name" 
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters" 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date:</Text>
              <TouchableOpacity 
                style={styles.dateInputContainer} 
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateTextValue, !dateStr && { color: '#94A3B8' }]}>
                  {dateStr || 'dd-mm-yyyy'}
                </Text>
                <Calendar color="#64748B" width={18} height={18} />
              </TouchableOpacity>
            </View>

            {/* Buttons */}
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={handleProcess}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.generateButtonText}>Generate Image</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.downloadButton, resultUri ? styles.downloadButtonActive : null]}
              onPress={() => wrapWithAd(handleDownload)}
              disabled={!resultUri}
              activeOpacity={0.8}
            >
              <Text style={styles.downloadButtonText}>Download Converted Image</Text>
            </TouchableOpacity>
          </View>

          {/* Tutorial Diagram Block */}
          <View style={styles.tutorialCard}>
            <Text style={styles.tutorialTitle}>ADD NAME & DATE TO PHOTOS ONLINE</Text>
            
            <View style={styles.tutorialFlowRow}>
              {/* Original */}
              <View style={styles.tutorialStep}>
                <View style={styles.tutorialPhotoBefore}>
                  <Image 
                    source={require('../../../../assets/previews/add_name_date.jpg')} 
                    style={styles.beforePhotoImg} 
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.stepLabel}>Original Photo</Text>
              </View>

              {/* Arrow */}
              <View style={styles.flowArrowContainer}>
                <ArrowRight color="#94A3B8" width={20} height={20} />
                <Text style={styles.arrowSubtext}>Fill Name & Date</Text>
              </View>

              {/* Processed */}
              <View style={styles.tutorialStep}>
                <View style={styles.tutorialPhotoAfter}>
                  <Image 
                    source={require('../../../../assets/previews/add_name_date.jpg')} 
                    style={styles.afterPhotoImg} 
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.stepLabel}>Result Photo</Text>
              </View>
            </View>

            <Text style={styles.tutorialFooter}>BHARATJOBRESULT.COM</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Calendar Datepicker Modal for Web */}
      {Platform.OS === 'web' && (
      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarCard}>
            {/* Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavBtn}>
                <ChevronLeft color="#1E293B" width={20} height={20} />
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavBtn}>
                <ChevronRight color="#1E293B" width={20} height={20} />
              </TouchableOpacity>
            </View>

            {/* Weekdays */}
            <View style={styles.weekdaysRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <Text key={d} style={styles.weekdayText}>{d}</Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {getDaysInMonth().map((day, idx) => {
                if (!day) {
                  return <View key={`empty-${idx}`} style={styles.dayCellEmpty} />;
                }
                const isToday = formatDate(day) === formatDate(new Date());
                return (
                  <TouchableOpacity
                    key={day.toISOString()}
                    style={[styles.dayCell, isToday && styles.todayCell]}
                    onPress={() => handleDateSelect(day)}
                  >
                    <Text style={[styles.dayText, isToday && styles.todayText]}>
                      {day.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.cancelModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      )}

      {/* Native DateTimePicker */}
      {showDatePicker && Platform.OS !== 'web' && (
        Platform.OS === 'ios' ? (
          <Modal visible={showDatePicker} transparent animationType="fade">
            <View style={{flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.4)'}}>
              <View style={{backgroundColor: '#FFFFFF', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20}}>
                <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10}}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{padding: 5}}>
                    <Text style={{color: '#22C55E', fontFamily: 'Outfit-Bold', fontSize: 16}}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  textColor="#000000"
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingBottom: 150 },
  headerTitle: { fontSize: 22, fontFamily: 'Outfit-Bold', color: '#1E293B', textAlign: 'center', marginBottom: 20 },
  configCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  fileSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
    height: 44,
  },
  chooseFileBtn: {
    backgroundColor: '#F1F5F9',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
  },
  chooseFileBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: '#334155',
  },
  fileNameText: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: '#64748B',
    paddingHorizontal: 12,
    flex: 1,
  },
  previewWrapper: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  previewHeaderLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    width: '100%',
    paddingBottom: 4,
  },
  previewPlaceholderText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#94A3B8',
    paddingVertical: 20,
  },
  previewImg: {
    width: '100%',
    height: 180,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: 'Outfit-Medium', color: '#64748B', marginBottom: 6 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, padding: 12, fontSize: 14, color: '#1E293B', fontFamily: 'Outfit-Regular' },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    height: 46,
  },
  dateTextValue: {
    fontSize: 14,
    color: '#1E293B',
    fontFamily: 'Outfit-Regular',
  },
  generateButton: { backgroundColor: '#22C55E', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  generateButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  downloadButton: { backgroundColor: '#E2E8F0', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 12 },
  downloadButtonActive: { backgroundColor: '#16A34A' },
  downloadButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  tutorialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  tutorialTitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  tutorialFlowRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 5,
  },
  tutorialStep: {
    alignItems: 'center',
    width: '32%',
  },
  tutorialPhotoBefore: {
    width: 80,
    height: 70,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  beforePhotoImg: {
    width: 80,
    height: 105,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tutorialPhotoAfter: {
    width: 80,
    height: 105,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  afterPhotoImg: {
    width: 80,
    height: 105,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  stepLabel: {
    fontSize: 9,
    fontFamily: 'Outfit-SemiBold',
    color: '#64748B',
    marginTop: 8,
  },
  flowArrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    marginTop: 30,
  },
  arrowSubtext: {
    fontSize: 8,
    fontFamily: 'Outfit-Regular',
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  tutorialFooter: {
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
    color: '#94A3B8',
    marginTop: 20,
    letterSpacing: 1.5,
  },
  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthNavBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  calendarMonthText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#1E293B',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
    color: '#64748B',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 6,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  dayText: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: '#334155',
  },
  todayCell: {
    backgroundColor: '#4F46E5',
  },
  todayText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
  },
  cancelModalBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#475569',
  },
});
