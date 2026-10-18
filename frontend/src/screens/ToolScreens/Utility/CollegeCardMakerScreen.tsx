import { useAlert } from '../../../context/AlertContext';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  ToastAndroid
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { captureRef } from 'react-native-view-shot';
import { Award, PenTool, Upload } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

// Import layout components & constants
import { CollegeCard } from '../../../components/CardMaker/CollegeCard';
import { SchoolHorizCard } from '../../../components/CardMaker/SchoolHorizCard';
import { SchoolVertCard } from '../../../components/CardMaker/SchoolVertCard';
import { InterCollegeCard } from '../../../components/CardMaker/InterCollegeCard';
import { PressCard } from '../../../components/CardMaker/PressCard';
import { CardData, TemplateType, DEFAULT_VALUES } from '../../../components/CardMaker/constants';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';

export default function CollegeCardMakerScreen() {
  const { showAlert } = useAlert();
  const wrapWithAd = useAdOnDownload();
  const [template, setTemplate] = useState<TemplateType>('college');

  // Track separate forms for each layout to preserve details on toggle
  const [collegeData, setCollegeData] = useState<CardData>(DEFAULT_VALUES.college);
  const [schoolHorizData, setSchoolHorizData] = useState<CardData>(DEFAULT_VALUES.school_horiz);
  const [schoolVertData, setSchoolVertData] = useState<CardData>(DEFAULT_VALUES.school_vert);
  const [interCollegeData, setInterCollegeData] = useState<CardData>(DEFAULT_VALUES.inter_college);
  const [pressData, setPressData] = useState<CardData>(DEFAULT_VALUES.press);

  const [photo, setPhoto] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<View>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const SESSIONS = ['2023-24', '2024-25', '2025-26', '2026-27', '2027-28'];

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      if (Platform.OS === 'android') setShowDatePicker(false);
      const formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`;
      updateField('dob')(formattedDate);
    } else {
      setShowDatePicker(false);
    }
  };

  const activeData =
    template === 'college' ? collegeData :
      template === 'school_horiz' ? schoolHorizData :
        template === 'school_vert' ? schoolVertData :
          template === 'inter_college' ? interCollegeData : pressData;

  const updateField = (key: keyof CardData) => (value: string) => {
    const updateMap: Record<TemplateType, React.Dispatch<React.SetStateAction<CardData>>> = {
      college: setCollegeData,
      school_horiz: setSchoolHorizData,
      school_vert: setSchoolVertData,
      inter_college: setInterCollegeData,
      press: setPressData,
    };
    updateMap[template]((prev) => ({ ...prev, [key]: value }));
  };

  const pickMedia = async (setter: (uri: string) => void, aspect: [number, number] = [1, 1]) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: aspect,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setter(result.assets[0].uri);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const localUri = await captureRef(cardRef, { format: 'png', quality: 1.0 });
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(localUri);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Image downloaded to gallery!', ToastAndroid.SHORT);
        }
        showAlert({ title: "Download Complete! 🎉", message: 'ID Card photo gallery me save ho gaya hai.', type: 'success' });
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(localUri, { mimeType: 'image/png' });
        }
      }
    } catch (error) {
      console.error(error);
      showAlert({ title: "Error", message: 'Failed to generate ID Card.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {showDatePicker && Platform.OS !== 'web' && (
        Platform.OS === 'ios' ? (
          <Modal visible={showDatePicker} transparent animationType="fade">
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
              <View style={{ backgroundColor: '#FFFFFF', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ padding: 5 }}>
                    <Text style={{ color: '#4F46E5', fontFamily: 'Outfit-Bold', fontSize: 16 }}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      const formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`;
                      updateField('dob')(formattedDate);
                    }
                  }}
                  textColor="#000000"
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                const formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`;
                updateField('dob')(formattedDate);
              }
            }}
          />
        )
      )}
      <Modal visible={showSessionPicker} transparent={true} animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setShowSessionPicker(false)}>
          <View style={{ backgroundColor: '#fff', width: '80%', borderRadius: 10, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Select Session</Text>
            <FlatList
              data={SESSIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                  onPress={() => { updateField('session')(item); setShowSessionPicker(false); }}
                >
                  <Text style={{ fontSize: 16 }}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Template Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
            {(['college', 'school_horiz', 'school_vert', 'inter_college', 'press'] as TemplateType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, template === t && styles.tabActive]}
                onPress={() => setTemplate(t)}
              >
                <Text style={[styles.tabText, template === t && styles.tabTextActive]}>
                  {t === 'college' ? 'College' : t === 'school_horiz' ? 'Sch Blue' : t === 'school_vert' ? 'Sch Green' : t === 'inter_college' ? 'Inter Blue' : 'Press ID'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Card Render Wrapper */}
          <Text style={styles.sectionTitle}>Live Card Preview</Text>
          <View style={styles.previewContainer}>
            <View ref={cardRef} collapsable={false}>
              {template === 'college' && <CollegeCard data={activeData} photoUri={photo} signatureUri={signature} onPickPhoto={() => pickMedia(setPhoto)} />}
              {template === 'school_horiz' && <SchoolHorizCard data={activeData} photoUri={photo} onPickPhoto={() => pickMedia(setPhoto)} />}
              {template === 'school_vert' && <SchoolVertCard data={activeData} photoUri={photo} signatureUri={signature} onPickPhoto={() => pickMedia(setPhoto)} />}
              {template === 'inter_college' && <InterCollegeCard data={activeData} photoUri={photo} logoUri={logo} onPickPhoto={() => pickMedia(setPhoto)} />}
              {template === 'press' && <PressCard data={activeData} photoUri={photo} signatureUri={signature} onPickPhoto={() => pickMedia(setPhoto)} />}
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Fill Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {template === 'press' ? 'Channel/Agency Name' : 'School/College Name'}
              </Text>
              <TextInput style={styles.textInput} value={activeData.collegeName} onChangeText={updateField('collegeName')} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{template === 'press' ? 'Tagline' : 'Place/Address'}</Text>
              <TextInput style={styles.textInput} value={activeData.collegeAddress} onChangeText={updateField('collegeAddress')} />
            </View>

            <View style={styles.rowInputs}>
              {template !== 'press' && (
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Session</Text>
                  <TouchableOpacity style={[styles.textInput, { justifyContent: 'center' }]} onPress={() => setShowSessionPicker(true)}>
                    <Text style={{ color: activeData.session ? '#000' : '#999' }}>{activeData.session || 'Select Session'}</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={[styles.inputGroup, { flex: 1, marginLeft: template === 'press' ? 0 : 8 }]}>
                <Text style={styles.inputLabel}>ID Number</Text>
                <TextInput style={styles.textInput} value={activeData.rollNo} onChangeText={updateField('rollNo')} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{template === 'press' ? 'Reporter Name' : 'Student Name'}</Text>
              <TextInput style={styles.textInput} value={activeData.studentName} onChangeText={updateField('studentName')} />
            </View>

            {template !== 'press' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Father Name</Text>
                <TextInput style={styles.textInput} value={activeData.fatherName} onChangeText={updateField('fatherName')} />
              </View>
            )}

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>
                  {template === 'college' ? 'Course' : template === 'press' ? 'Valid Upto' : 'Class'}
                </Text>
                <TextInput style={styles.textInput} value={activeData.courseOrClass} onChangeText={updateField('courseOrClass')} />
              </View>
              {template !== 'inter_college' && template !== 'press' && (
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>DOB</Text>
                  <TouchableOpacity style={[styles.textInput, { justifyContent: 'center' }]} onPress={() => setShowDatePicker(true)}>
                    <Text style={{ color: activeData.dob ? '#000' : '#999' }}>{activeData.dob || 'DD/MM/YYYY'}</Text>
                  </TouchableOpacity>
                </View>
              )}
              {template === 'press' && (
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput style={styles.textInput} value={activeData.dob} onChangeText={updateField('dob')} />
                </View>
              )}
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, template === 'college' || template === 'press' ? { flex: 1, marginRight: 8 } : { flex: 1 }]}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput style={styles.textInput} value={activeData.phone} onChangeText={updateField('phone')} keyboardType="phone-pad" />
              </View>
              {template === 'college' && (
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Valid Until</Text>
                  <TextInput style={styles.textInput} value={activeData.valid} onChangeText={updateField('valid')} />
                </View>
              )}
              {template === 'press' && (
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Designation</Text>
                  <TextInput style={styles.textInput} value={activeData.valid} onChangeText={updateField('valid')} />
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{template === 'press' ? 'Issued By' : 'Address'}</Text>
              <TextInput style={[styles.textInput, { height: 50 }]} value={activeData.address} onChangeText={updateField('address')} multiline />
            </View>

            {/* School Logo File Picker (Inter College template only) */}
            {template === 'inter_college' && (
              <TouchableOpacity style={styles.photoButton} onPress={() => pickMedia(setLogo)} activeOpacity={0.85}>
                <Award color="#64748B" size={18} style={{ marginRight: 8 }} />
                <Text style={styles.photoButtonText}>{logo ? 'Change School Logo' : 'Upload School Logo'}</Text>
              </TouchableOpacity>
            )}

            {/* Photo Selection Button */}
            <TouchableOpacity style={styles.photoButton} onPress={() => pickMedia(setPhoto)} activeOpacity={0.85}>
              <Upload color="#64748B" size={18} style={{ marginRight: 8 }} />
              <Text style={styles.photoButtonText}>
                {photo ? 'Change Photo' : template === 'press' ? 'Upload Reporter Photo' : 'Upload Student Photo'}
              </Text>
            </TouchableOpacity>

            {/* Signature Selection Button */}
            {(template !== 'school_horiz' && template !== 'inter_college') ? (
              <TouchableOpacity style={styles.photoButton} onPress={() => pickMedia(setSignature, [7, 3])} activeOpacity={0.85}>
                <PenTool color="#64748B" size={18} style={{ marginRight: 8 }} />
                <Text style={styles.photoButtonText}>
                  {signature ? 'Change Authority Signature' : 'Upload Authority Signature'}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.generateButton} onPress={() => wrapWithAd(handleDownload)} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateButtonText}>Download ID Card</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, alignItems: 'center', paddingBottom: 40 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginHorizontal: 2 },
  tabActive: { backgroundColor: '#4F46E5' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  tabTextActive: { color: '#FFFFFF' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 12, alignSelf: 'flex-start' },
  previewContainer: { width: '100%', alignItems: 'center', marginBottom: 20 },
  formCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6 },
  textInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#1E293B', backgroundColor: '#FFF' },
  photoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, borderStyle: 'dashed', paddingVertical: 12, marginBottom: 20, backgroundColor: '#F8FAFC' },
  photoButtonText: { fontSize: 14, color: '#475569', fontWeight: '600' },
  generateButton: { backgroundColor: '#4F46E5', borderRadius: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  generateButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
