import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Dimensions, ScrollView, TextInput, Platform, ToastAndroid } from 'react-native';
import { usePassport } from './PassportContext';
import { styles } from './styles';
import { uploadFile } from '../../../../../api/client';
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system/legacy';
import { useAlert } from '../../../../../context/AlertContext';
import { Download, RefreshCw, ArrowLeft } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useAdOnDownload } from '../../../../../utils/useAdOnDownload';

export default function Step6Download() {
  const {
    croppedUri, bgRemovedUri, clothedUri,
    selectedBg, sizePreset, customWidth, customHeight, customUnit,
    dpi, brightness, contrast, saturation,
    loading, setLoading, setStep, addNameDate, nameText, dateText
  } = usePassport();

  const [sheetType, setSheetType] = useState('A4');
  const [customSheetW, setCustomSheetW] = useState('210');
  const [customSheetH, setCustomSheetH] = useState('297');
  const [appliedW, setAppliedW] = useState(210);
  const [appliedH, setAppliedH] = useState(297);
  const { showAlert } = useAlert();
  const { handleActionWithAd } = useAdOnDownload();

  // Passport photo size in mm (India standard 35x45)
  const PHOTO_W_MM = 35;
  const PHOTO_H_MM = 45;
  const SPACING_MM = 2;

  // Dynamically compute how many photos fit in the custom sheet
  const customGridCount = useMemo(() => {
    const cols = Math.max(1, Math.floor((appliedW + SPACING_MM) / (PHOTO_W_MM + SPACING_MM)));
    const rows = Math.max(1, Math.floor((appliedH + SPACING_MM) / (PHOTO_H_MM + SPACING_MM)));
    return { cols, rows, total: cols * rows };
  }, [appliedW, appliedH]);

  // Cell dimensions for the preview grid
  const previewCellW = useMemo(() => {
    if (sheetType === '3 / A4') return 22;
    if (sheetType === 'A4') return 15;
    const cols = customGridCount.cols;
    return Math.max(10, Math.min(22, Math.floor(120 / cols) - 2));
  }, [sheetType, customGridCount]);

  const previewCellH = useMemo(() => {
    if (sheetType === '3 / A4') return 31;
    if (sheetType === 'A4') return 21;
    return Math.round(previewCellW * (PHOTO_H_MM / PHOTO_W_MM));
  }, [sheetType, previewCellW]);

  const sourceUri = clothedUri || (selectedBg === 'original' ? croppedUri : bgRemovedUri);

  const getPassportImageBase64 = async () => {
    if (!sourceUri) return null;
    const fileName = sourceUri.split('/').pop() || 'image.png';
    let width = 3.5;
    let height = 4.5;
    let unit = 'cm';
    
    if (sizePreset === 'india') {
      width = 3.5; height = 4.5; unit = 'cm';
    } else if (sizePreset === 'usa') {
      width = 2.0; height = 2.0; unit = 'inch';
    } else if (sizePreset === 'canada') {
      width = 5.0; height = 7.0; unit = 'cm';
    } else {
      width = parseFloat(customWidth) || 3.5;
      height = parseFloat(customHeight) || 4.5;
      unit = customUnit;
    }

    const params: any = { 
      min_kb: 20, max_kb: 50,
      width, height, unit,
      dpi: parseInt(dpi) || 300,
      brightness, contrast, saturation, zoom: 1 
    };
    
    if (addNameDate) {
      if (nameText.trim()) params.name = nameText.trim();
      if (dateText.trim()) params.date_str = dateText.trim();
    }

    const arrayBuffer = await uploadFile('/api/image/passport-photo', sourceUri, fileName, 'image/png', params);
    return Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
  };

  const handleDownloadSingle = async () => {
    setLoading(true);
    try {
      const base64 = await getPassportImageBase64();
      if (!base64) return;
      const tempUri = `${FileSystem.cacheDirectory}final_passport_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      
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
      console.error(error);
      showAlert({ title: "Error", message: "Failed to download image.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadGrid = async () => {
    setLoading(true);
    try {
      // First get the single passport image
      const base64 = await getPassportImageBase64();
      if (!base64) return;
      const tempPassportUri = `${FileSystem.cacheDirectory}temp_passport.jpg`;
      await FileSystem.writeAsStringAsync(tempPassportUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      // Now send it to the sheet endpoint
      const params: any = { sheet_type: sheetType };
      if (sheetType === 'Custom') {
        params.sheet_w = parseFloat(customSheetW) || 10;
        params.sheet_h = parseFloat(customSheetH) || 15;
      }
      const arrayBuffer = await uploadFile('/api/image/passport-sheet', tempPassportUri, 'passport.jpg', 'image/jpeg', params);
      const sheetBase64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      
      const safeSheetType = sheetType.replace(/[\s/\\]+/g, '_');
      const finalUri = `${FileSystem.cacheDirectory}passport_sheet_${safeSheetType}_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(finalUri, sheetBase64, { encoding: FileSystem.EncodingType.Base64 });
      
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(finalUri);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Image downloaded to gallery!', ToastAndroid.SHORT);
        }
        showAlert({ title: "Download Complete! 🎉", message: "Passport sheet photo gallery me save ho gayi hai.", type: 'success' });
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(finalUri);
        }
      }
    } catch (error) {
      console.error(error);
      showAlert({ title: "Error", message: "Failed to create passport sheet.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={[styles.sectionTitlePurple, { textAlign: 'center', marginBottom: 20, fontSize: 18 }]}>Download Passport Size Image</Text>
      
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        
        {/* Left Column: Online Submission */}
        <View style={{ flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, overflow: 'hidden', backgroundColor: '#FFF' }}>
          <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
            <Text style={{ textAlign: 'center', color: '#4B429F', fontFamily: 'Outfit-Medium', fontSize: 13 }}>Online Submission</Text>
          </View>
          <View style={{ padding: 12, alignItems: 'center', flex: 1 }}>
            <View style={{ width: 100, height: 130, backgroundColor: '#F1F5F9', marginBottom: 16 }}>
              {sourceUri && <Image source={{ uri: sourceUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />}
            </View>
            <TouchableOpacity 
              style={{ backgroundColor: '#4F46E5', width: '100%', paddingVertical: 10, borderRadius: 4, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
              onPress={() => handleActionWithAd(handleDownloadSingle)}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ color: '#FFF', fontFamily: 'Outfit-Bold', fontSize: 14 }}>Download</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Column: Sheet Print */}
        <View style={{ flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, overflow: 'hidden', backgroundColor: '#FFF' }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 6, gap: 6, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
            <TouchableOpacity onPress={() => setSheetType('A4')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: sheetType === 'A4' ? '#4F46E5' : '#94A3B8', justifyContent: 'center', alignItems: 'center' }}>
                {sheetType === 'A4' && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4F46E5' }} />}
              </View>
              <Text style={{ fontSize: 11, fontFamily: 'Outfit-Medium', color: sheetType === 'A4' ? '#4F46E5' : '#64748B' }}>A4</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setSheetType('3 / A4')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: sheetType === '3 / A4' ? '#4F46E5' : '#94A3B8', justifyContent: 'center', alignItems: 'center' }}>
                {sheetType === '3 / A4' && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4F46E5' }} />}
              </View>
              <Text style={{ fontSize: 11, fontFamily: 'Outfit-Medium', color: sheetType === '3 / A4' ? '#4F46E5' : '#64748B' }}>3 / A4</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSheetType('Custom')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: sheetType === 'Custom' ? '#4F46E5' : '#94A3B8', justifyContent: 'center', alignItems: 'center' }}>
                {sheetType === 'Custom' && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4F46E5' }} />}
              </View>
              <Text style={{ fontSize: 11, fontFamily: 'Outfit-Medium', color: sheetType === 'Custom' ? '#4F46E5' : '#64748B' }}>Custom</Text>
            </TouchableOpacity>
          </View>

          {sheetType === 'Custom' && (
            <View style={{ padding: 6, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', alignItems: 'center' }}>
               <Text style={{ textAlign: 'center', color: '#4B429F', fontFamily: 'Outfit-Bold', marginBottom: 4, fontSize: 11 }}>(Width X Height) MM</Text>
               <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                 <TextInput
                   style={{ borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFF', borderRadius: 4, width: 44, padding: 2, textAlign: 'center', fontSize: 12 }}
                   value={customSheetW}
                   onChangeText={setCustomSheetW}
                   keyboardType="numeric"
                 />
                 <Text style={{ fontFamily: 'Outfit-Medium', color: '#64748B', fontSize: 12 }}>X</Text>
                 <TextInput
                   style={{ borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFF', borderRadius: 4, width: 44, padding: 2, textAlign: 'center', fontSize: 12 }}
                   value={customSheetH}
                   onChangeText={setCustomSheetH}
                   keyboardType="numeric"
                 />
                 <TouchableOpacity
                   style={{ backgroundColor: '#4B429F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}
                   onPress={() => {
                     setAppliedW(parseFloat(customSheetW) || 210);
                     setAppliedH(parseFloat(customSheetH) || 297);
                   }}
                 >
                   <Text style={{ color: '#FFF', fontFamily: 'Outfit-Medium', fontSize: 11 }}>Make</Text>
                 </TouchableOpacity>
               </View>
               <Text style={{ fontSize: 10, color: '#64748B', marginTop: 3, fontFamily: 'Outfit-Medium' }}>
                 {customGridCount.cols} cols x {customGridCount.rows} rows = {customGridCount.total} photos
               </Text>
            </View>
          )}

          <View style={{ padding: 8, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: 'center', gap: 2, marginBottom: 12 }}>
              {[...Array(
                sheetType === '3 / A4' ? 10 :
                sheetType === 'A4' ? 30 :
                customGridCount.total
              )].map((_, i) => (
                <View key={i} style={{ width: previewCellW, height: previewCellH, backgroundColor: '#F1F5F9' }}>
                   {sourceUri && <Image source={{ uri: sourceUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />}
                </View>
              ))}
            </View>
            <TouchableOpacity 
              style={{ backgroundColor: '#4F46E5', width: '100%', paddingVertical: 10, borderRadius: 4, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto' }}
              onPress={() => handleActionWithAd(handleDownloadGrid)}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ color: '#FFF', fontFamily: 'Outfit-Bold', fontSize: 14 }}>Download</Text>}
            </TouchableOpacity>
            {loading && sheetType === 'A4' && (
              <Text style={{ color: '#64748B', fontFamily: 'Outfit-Medium', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
                Processing.. A4 Sheet Takes Approx 30-40 Sec :)
              </Text>
            )}
          </View>
        </View>

      </View>

      {/* Bottom Actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 12 }}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#4B429F', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 }} onPress={() => setStep(1)}>
          <RefreshCw color="#4B429F" width={18} height={18} style={{ marginRight: 6 }} />
          <Text style={{ color: '#4B429F', fontSize: 15, fontFamily: 'Outfit-Bold' }}>Make New Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#4B429F', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 }} onPress={() => setStep(5)}>
          <ArrowLeft color="#4B429F" width={18} height={18} style={{ marginRight: 6 }} />
          <Text style={{ color: '#4B429F', fontSize: 15, fontFamily: 'Outfit-Bold' }}>Back</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
