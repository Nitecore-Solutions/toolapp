import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ActivityIndicator, StyleSheet, Dimensions, Platform, ToastAndroid } from 'react-native';
import { usePassport } from './PassportContext';
import { styles } from './styles';
import { uploadFile } from '../../../../../api/client';
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system/legacy';
import { useAlert } from '../../../../../context/AlertContext';
import { ArrowLeft, Download, Shirt } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';

export default function Step4BackgroundSelect() {
  const {
    croppedUri, bgRemovedUri,
    selectedBg, setSelectedBg,
    sizePreset, customWidth, customHeight, customUnit,
    dpi, brightness, contrast, saturation,
    setStep, loading, setLoading, clothedUri
  } = usePassport();

  const [addNameDate, setAddNameDate] = useState(false);
  const [nameText, setNameText] = useState('');
  
  const getTodayDateString = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  const [dateText, setDateText] = useState(getTodayDateString());

  const { showAlert } = useAlert();

  const handleDownload = async () => {
    const sourceUri = clothedUri || (selectedBg === 'original' ? croppedUri : bgRemovedUri);
    if (!sourceUri) return;
    
    setLoading(true);
    try {
      const fileName = sourceUri.split('/').pop() || 'image.png';
      
      let width = 3.5;
      let height = 4.5;
      let unit = 'cm';
      
      if (sizePreset === 'india') {
        width = 3.5;
        height = 4.5;
        unit = 'cm';
      } else if (sizePreset === 'usa') {
        width = 2.0;
        height = 2.0;
        unit = 'inch';
      } else if (sizePreset === 'canada') {
        width = 5.0;
        height = 7.0;
        unit = 'cm';
      } else {
        width = parseFloat(customWidth) || 3.5;
        height = parseFloat(customHeight) || 4.5;
        unit = customUnit;
      }

      // Hardcoded file size bounds (20-50kb)
      const params: any = { 
        min_kb: 20, 
        max_kb: 50,
        width,
        height,
        unit,
        dpi: parseInt(dpi) || 300,
        brightness, // Send filters in case backend applies them, but we might want them applied before BG removal actually. Our backend supports it.
        contrast,
        saturation,
        zoom: 1 
      };
      
      if (addNameDate) {
        if (nameText.trim()) params.name = nameText.trim();
        if (dateText.trim()) params.date_str = dateText.trim();
      }

      // Final process to get the 20-50KB image with Name/Date
      const arrayBuffer = await uploadFile('/api/image/passport-photo', sourceUri, fileName, 'image/png', params);
      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const ext = 'jpg';
      const tempUri = `${FileSystem.cacheDirectory}final_passport_${Date.now()}.${ext}`;
      await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      
      // Share/Save the image
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(tempUri);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Image downloaded to gallery!', ToastAndroid.SHORT);
        }
        showAlert({ title: "Download Complete! 🎉", message: "Passport photo gallery me save ho gayi hai.", type: 'success' });
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(tempUri);
        }
      }
    } catch (error) {
      console.log("Backend offline, sharing fallback photo");
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          sourceUri,
          [],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        const { status } = await MediaLibrary.requestPermissionsAsync(true);
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(manipResult.uri);
          if (Platform.OS === 'android') {
            ToastAndroid.show('Image downloaded to gallery!', ToastAndroid.SHORT);
          }
          showAlert({ title: "Download Complete! 🎉", message: "Passport photo gallery me save ho gayi hai.", type: 'success' });
        } else {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(manipResult.uri);
          }
        }
      } catch (localErr) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(sourceUri);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitlePurple}>Select Background Style</Text>
      
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24, marginTop: 10 }}>
        {/* Original Image Card */}
        <TouchableOpacity 
          style={[{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', padding: 8, backgroundColor: '#FFF', position: 'relative' }, selectedBg === 'original' && { borderColor: '#4F46E5', borderWidth: 2 }]} 
          onPress={() => setSelectedBg('original')}
          activeOpacity={0.9}
        >
          {selectedBg === 'original' && (
            <View style={{ position: 'absolute', top: 0, left: 0, backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 4, zIndex: 10 }}>
              <Text style={{ color: '#FFF', fontSize: 12, fontFamily: 'Outfit-Bold' }}>✓ Selected</Text>
            </View>
          )}
          <View style={{ width: '100%', aspectRatio: 3.5/4.5, backgroundColor: '#F8FAFC', marginBottom: 8, position: 'relative' }}>
            {croppedUri && <Image source={{ uri: croppedUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />}
            {addNameDate && (
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', paddingVertical: 6, alignItems: 'center' }}>
                <Text style={{ color: '#1E293B', fontSize: 13, fontFamily: 'Outfit-Bold', lineHeight: 16 }}>{nameText || ' '}</Text>
                <Text style={{ color: '#1E293B', fontSize: 11, fontFamily: 'Outfit-Bold', lineHeight: 14 }}>{dateText || ' '}</Text>
              </View>
            )}
          </View>
          <View style={{ backgroundColor: '#EEF2FF', padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#4B429F', fontFamily: 'Outfit-Medium', fontSize: 13 }}>Original</Text>
            {selectedBg !== 'original' && <View style={{ width: 16, height: 16, borderWidth: 1, borderColor: '#94A3B8', backgroundColor: '#E2E8F0' }} />}
          </View>
        </TouchableOpacity>

        {/* BG Removed Image Card */}
        <TouchableOpacity 
          style={[{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', padding: 8, backgroundColor: '#FFF', position: 'relative' }, selectedBg === 'removed' && { borderColor: '#4F46E5', borderWidth: 2 }]} 
          onPress={() => setSelectedBg('removed')}
          activeOpacity={0.9}
        >
          {selectedBg === 'removed' && (
            <View style={{ position: 'absolute', top: 0, left: 0, backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 4, zIndex: 10 }}>
              <Text style={{ color: '#FFF', fontSize: 12, fontFamily: 'Outfit-Bold' }}>✓ Selected</Text>
            </View>
          )}
          <View style={{ width: '100%', aspectRatio: 3.5/4.5, backgroundColor: '#F8FAFC', marginBottom: 8, position: 'relative' }}>
            {(clothedUri || bgRemovedUri) && <Image source={{ uri: clothedUri || bgRemovedUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />}
            {addNameDate && (
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', paddingVertical: 6, alignItems: 'center' }}>
                <Text style={{ color: '#1E293B', fontSize: 13, fontFamily: 'Outfit-Bold', lineHeight: 16 }}>{nameText || ' '}</Text>
                <Text style={{ color: '#1E293B', fontSize: 11, fontFamily: 'Outfit-Bold', lineHeight: 14 }}>{dateText || ' '}</Text>
              </View>
            )}
          </View>
          <View style={{ backgroundColor: '#EEF2FF', padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#4B429F', fontFamily: 'Outfit-Medium', fontSize: 13 }}>Background</Text>
            {selectedBg !== 'removed' && <View style={{ width: 16, height: 16, borderWidth: 1, borderColor: '#94A3B8', backgroundColor: '#E2E8F0' }} />}
          </View>
        </TouchableOpacity>
      </View>

      {/* Name and Date Checkbox */}
      <TouchableOpacity 
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}
        onPress={() => setAddNameDate(!addNameDate)}
        activeOpacity={0.7}
      >
        <View style={{ width: 18, height: 18, borderWidth: 1, borderColor: '#94A3B8', marginRight: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
            {addNameDate && <View style={{ width: 10, height: 10, backgroundColor: '#94A3B8' }} />}
        </View>
        <Text style={{ color: '#64748B', fontSize: 15, fontFamily: 'Outfit-Regular' }}>Write Name & Date on Image</Text>
      </TouchableOpacity>

      {/* Name and Date Inputs if Checked */}
      {addNameDate && (
        <View style={styles.nameDateRow}>
          <View style={[styles.inputGroup, { marginRight: 8 }]}>
            <Text style={styles.label}>Name</Text>
            <TextInput 
              style={styles.input} 
              value={nameText} 
              onChangeText={setNameText} 
              placeholder="ARJUN GUPTA" 
              placeholderTextColor="#94A3B8"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TextInput 
              style={styles.input} 
              value={dateText} 
              onChangeText={setDateText} 
              placeholder="DD/MM/YYYY" 
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#4B429F', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 }} onPress={() => setStep(3)}>
          <ArrowLeft color="#4B429F" width={18} height={18} style={{ marginRight: 6 }} />
          <Text style={{ color: '#4B429F', fontSize: 15, fontFamily: 'Outfit-Bold' }}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#4B429F', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 }} onPress={() => setStep(5)}>
          <Shirt color="#4B429F" width={18} height={18} style={{ marginRight: 6 }} />
          <Text style={{ color: '#4B429F', fontSize: 15, fontFamily: 'Outfit-Bold' }}>Change Cloth</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 6, marginHorizontal: 20 }}
        onPress={() => setStep(6)}
      >
        <Text style={{ color: '#FFF', fontSize: 16, fontFamily: 'Outfit-Bold' }}>Next</Text>
      </TouchableOpacity>

    </View>
  );
}
