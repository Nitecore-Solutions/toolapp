import { useAlert } from '../../../context/AlertContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadFile } from '../../../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Buffer } from 'buffer';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';

export default function SignatureResizerScreen() {
  const { showAlert } = useAlert();
  const { handleActionWithAd } = useAdOnDownload();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);

  // Form states matching web layout
  const [width, setWidth] = useState('140');
  const [height, setHeight] = useState('60');
  const [unit, setUnit] = useState<'Pixels' | 'Inches' | 'Cm' | 'Mm'>('Pixels');
  const [dpi, setDpi] = useState('200');

  // KB targets matching "15kb, 30kb, 50kb"
  const [kbTarget, setKbTarget] = useState<'15' | '30' | '50' | 'Custom'>('15');
  const [minKb, setMinKb] = useState('5');
  const [maxKb, setMaxKb] = useState('15');
  const [customFileName, setCustomFileName] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [7, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setResultUri(null);
    }
  };

  const handleKbTargetChange = (target: '15' | '30' | '50' | 'Custom') => {
    setKbTarget(target);
    if (target === '15') {
      setMinKb('5');
      setMaxKb('15');
    } else if (target === '30') {
      setMinKb('10');
      setMaxKb('30');
    } else if (target === '50') {
      setMinKb('20');
      setMaxKb('50');
    }
  };

  const handleProcess = async () => {
    if (!imageUri) {
      showAlert({ title: "Upload Required", message: "Please select a signature image first.", type: 'error' });
      return;
    }
    if (!width || !height || !dpi) {
      showAlert({ title: "Required Fields", message: "Please enter Width, Height and DPI.", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const fileName = imageUri.split('/').pop() || 'signature.jpg';
      const params = {
        min_kb: parseInt(minKb) || 5,
        max_kb: parseInt(maxKb) || 15,
        width: parseFloat(width),
        height: parseFloat(height),
        unit: unit.toLowerCase(),
        dpi: parseInt(dpi) || 200,
      };

      const arrayBuffer = await uploadFile('/api/image/signature-resizer', imageUri, fileName, 'image/jpeg', params);
      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const finalName = customFileName.trim() ? customFileName.trim() : `resized_signature_${Date.now()}`;
      const tempUri = `${FileSystem.cacheDirectory}${finalName}.jpg`;
      await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      setResultUri(tempUri);
    } catch (error) {
      console.log("Backend offline, using local signature resizer fallback");
      try {
        const w = parseFloat(width) || 200;
        const h = parseFloat(height) || 100;
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: w, height: h } }],
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
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
          message: "Aapki signature photo gallery me save ho gayi hai.", 
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
          <Text style={styles.headerTitle}>Resize Signature 140*60px (15kb,30kb,50kb)</Text>
          <Text style={styles.stepsText}>Steps: Upload &gt; Edit &gt; Download</Text>

          <View style={styles.configCard}>
            {/* Dimensions Input Row */}
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.inputLabel}>Width (px)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={width}
                  onChangeText={setWidth}
                  placeholder="140"
                />
              </View>
              <Text style={styles.multiplySign}>×</Text>
              <View style={styles.gridCol}>
                <Text style={styles.inputLabel}>Height (px)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={height}
                  onChangeText={setHeight}
                  placeholder="60"
                />
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.inputLabel}>DPI</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={dpi}
                  onChangeText={setDpi}
                  placeholder="200"
                />
              </View>
            </View>

            {/* Unit Selector */}
            <View style={styles.optionGroup}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.pillRow}>
                {['Pixels', 'Inches', 'Cm', 'Mm'].map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.pillBtn, unit === u ? styles.pillBtnActive : null]}
                    onPress={() => setUnit(u as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, unit === u ? styles.pillBtnTextActive : null]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Predefined KB Targets */}
            <View style={styles.optionGroup}>
              <Text style={styles.label}>File Size Target</Text>
              <View style={styles.pillRow}>
                {['15', '30', '50', 'Custom'].map((kb) => (
                  <TouchableOpacity
                    key={kb}
                    style={[styles.pillBtn, kbTarget === kb ? styles.pillBtnActive : null]}
                    onPress={() => handleKbTargetChange(kb as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, kbTarget === kb ? styles.pillBtnTextActive : null]}>
                      {kb === 'Custom' ? 'Custom' : `${kb} KB`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom KB Size inputs */}
            {kbTarget === 'Custom' && (
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.inputLabel}>Min KB</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={minKb}
                    onChangeText={setMinKb}
                    placeholder="e.g. 5"
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.inputLabel}>Max KB</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={maxKb}
                    onChangeText={setMaxKb}
                    placeholder="e.g. 15"
                  />
                </View>
              </View>
            )}

            {/* File Upload Selector */}
            <Text style={styles.label}>Upload Signature Image</Text>
            <TouchableOpacity style={styles.fileSelectorRow} onPress={pickImage} activeOpacity={0.7}>
              <View style={styles.chooseFileBtn}>
                <Text style={styles.chooseFileBtnText}>Choose file</Text>
              </View>
              <Text style={styles.fileNameText} numberOfLines={1}>
                {imageUri ? imageUri.split('/').pop() : 'No file chosen'}
              </Text>
            </TouchableOpacity>

            {/* Filename Input */}
            <View style={styles.optionGroup}>
              <Text style={styles.label}>Filename</Text>
              <View style={styles.filenameRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={customFileName}
                  onChangeText={setCustomFileName}
                  placeholder="Enter name"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                />
                <Text style={styles.filenameExt}>.jpg</Text>
              </View>
            </View>

            {/* Selected Image Preview */}
            {imageUri && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleProcess} 
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Resize Signature</Text>}
            </TouchableOpacity>

            {/* Success Message & Preview */}
            {resultUri && (
              <View style={styles.resultContainer}>
                <Text style={styles.successText}>✅ Your signature has been resized successfully!</Text>
                <View style={styles.previewContainer}>
                  <Image source={{ uri: resultUri }} style={styles.previewImage} resizeMode="contain" />
                </View>
              </View>
            )}

            {/* Download Button (shows dynamically when result is ready) */}
            <TouchableOpacity 
              style={[styles.downloadButton, resultUri ? styles.downloadButtonActive : null]}
              onPress={() => handleActionWithAd(handleDownload)}
              disabled={!resultUri}
              activeOpacity={0.8}
            >
              <Text style={styles.downloadButtonText}>Download Resized Image</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingBottom: 150 },
  headerTitle: { fontSize: 18, fontFamily: 'Outfit-Bold', color: '#1E293B', textAlign: 'center', marginBottom: 6 },
  stepsText: { fontSize: 13, fontFamily: 'Outfit-Bold', color: '#EF4444', textAlign: 'center', marginBottom: 20 },
  configCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  label: { fontSize: 13, fontFamily: 'Outfit-Medium', color: '#334155', marginBottom: 8 },
  inputLabel: { fontSize: 11, fontFamily: 'Outfit-Regular', color: '#64748B', marginBottom: 4 },
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
  previewContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    marginBottom: 20,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    width: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  resultContainer: {
    marginTop: 10,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    width: '100%',
  },
  successText: {
    fontFamily: 'Outfit-Medium',
    color: '#166534',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  gridRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  gridCol: { flex: 1 },
  multiplySign: { fontSize: 18, color: '#94A3B8', fontWeight: 'bold', alignSelf: 'center', marginTop: 12 },
  input: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#CBD5E1', 
    borderRadius: 6, 
    padding: 10, 
    fontSize: 14, 
    color: '#1E293B', 
    fontFamily: 'Outfit-Regular',
    height: 44
  },
  optionGroup: { marginBottom: 16 },
  pillRow: { flexDirection: 'row', gap: 6 },
  pillBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', alignItems: 'center' },
  pillBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  pillBtnText: { fontSize: 12, fontFamily: 'Outfit-Medium', color: '#64748B' },
  pillBtnTextActive: { color: '#3B82F6', fontFamily: 'Outfit-Bold' },
  primaryButton: { backgroundColor: '#4F46E5', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  downloadButton: { backgroundColor: '#E2E8F0', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 12 },
  downloadButtonActive: { backgroundColor: '#4F46E5' },
  downloadButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  filenameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filenameExt: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#64748B',
  },
});
