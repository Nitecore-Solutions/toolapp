import { useAlert } from '../../../context/AlertContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadFile } from '../../../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Buffer } from 'buffer';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';

type UnitType = 'Pixels' | 'Centimeters' | 'Millimeters' | 'Inches';
type FormatType = 'JPG' | 'PNG' | 'WEBP';

export default function CompressToKBScreen() {
  const { showAlert } = useAlert();
  const wrapWithAd = useAdOnDownload();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);

  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [unit, setUnit] = useState<UnitType>('Pixels');
  const [format, setFormat] = useState<FormatType>('JPG');
  const [targetKb, setTargetKb] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setResultUri(null);
    }
  };

  const handleProcess = async () => {
    if (!imageUri) {
      showAlert({ title: "Upload Required", message: 'Please select an image first.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const fileName = imageUri.split('/').pop() || 'image.jpg';

      // If width/height provided → use resize endpoint (supports all options)
      // If only targetKb → use compress-to-kb endpoint
      let arrayBuffer: ArrayBuffer;

      if (width && height) {
        const params: any = {
          width: parseFloat(width),
          height: parseFloat(height),
          unit: unit.toLowerCase() === 'centimeters' ? 'cm' : unit.toLowerCase() === 'millimeters' ? 'mm' : unit.toLowerCase(),
          format: format.toLowerCase(),
        };
        if (targetKb) params.target_kb = parseInt(targetKb);

        arrayBuffer = await uploadFile('/api/image/resize', imageUri, fileName, `image/${format.toLowerCase()}`, params);
      } else if (targetKb) {
        arrayBuffer = await uploadFile('/api/image/compress-to-kb', imageUri, fileName, 'image/jpeg', {
          target_kb: parseInt(targetKb),
        });
      } else {
        showAlert({ title: "Required", message: 'Please enter Width & Height, or at least a Target Size (KB).', type: 'error' });
        setLoading(false);
        return;
      }

      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const ext = format.toLowerCase() === 'webp' ? 'webp' : format.toLowerCase() === 'png' ? 'png' : 'jpg';
      const tempUri = `${FileSystem.cacheDirectory}result_${Date.now()}.${ext}`;
      await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      setResultUri(tempUri);
    } catch (error) {
      console.log("Backend offline, using local image compression fallback");
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [],
          { compress: 0.6, format: format === 'PNG' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG }
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
          message: "Aapki compressed image photo gallery me save ho gayi hai.", 
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

  const handleReset = () => {
    setResultUri(null);
    setImageUri(null);
    setWidth('');
    setHeight('');
    setTargetKb('');
    setUnit('Pixels');
    setFormat('JPG');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.headerTitle}>Resize Image Online</Text>

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

            {/* Image Preview */}
            {imageUri && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
              </View>
            )}

            {/* Width & Height */}
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.label}>Width</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={width}
                  onChangeText={setWidth}
                  placeholder="e.g. 300"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.label}>Height</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={height}
                  onChangeText={setHeight}
                  placeholder="e.g. 200"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Unit Selector */}
            <View style={styles.optionGroup}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.pillRow}>
                {(['Pixels', 'Centimeters', 'Millimeters', 'Inches'] as UnitType[]).map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.pillBtn, unit === u && styles.pillBtnActive]}
                    onPress={() => setUnit(u)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, unit === u && styles.pillBtnTextActive]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Format Selector */}
            <View style={styles.optionGroup}>
              <Text style={styles.label}>Format</Text>
              <View style={styles.pillRow}>
                {(['JPG', 'PNG', 'WEBP'] as FormatType[]).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.pillBtn, format === f && styles.pillBtnActive]}
                    onPress={() => setFormat(f)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, format === f && styles.pillBtnTextActive]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Target KB */}
            <View style={styles.optionGroup}>
              <Text style={styles.label}>
                Target Size (KB) <Text style={styles.optionalTag}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={targetKb}
                onChangeText={setTargetKb}
                placeholder="e.g. 100"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Process Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleProcess}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.primaryButtonText}>Resize Image</Text>
              }
            </TouchableOpacity>

            {/* Result Preview */}
            {resultUri && (
              <View style={styles.resultSection}>
                <Text style={styles.successText}>✅ Your image has been resized successfully!</Text>
                <View style={styles.resultPreviewBox}>
                  <Image source={{ uri: resultUri }} style={styles.resultImage} resizeMode="contain" />
                </View>
                <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                  <Text style={styles.resetText}>Process Another</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Download Button */}
            <TouchableOpacity
              style={[styles.downloadButton, resultUri ? styles.downloadButtonActive : null]}
              onPress={resultUri ? () => wrapWithAd(handleDownload) : undefined}
              disabled={!resultUri}
              activeOpacity={0.85}
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
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 20,
  },
  configCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#334155',
    marginBottom: 8,
  },
  optionalTag: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    color: '#94A3B8',
  },

  // File Selector
  fileSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
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

  // Preview
  previewContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
    padding: 8,
    alignItems: 'center',
    height: 160,
  },
  previewImage: { width: '100%', height: '100%' },

  // Inputs
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  gridCol: { flex: 1 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#1E293B',
    height: 46,
  },

  // Pills
  optionGroup: { marginBottom: 16 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pillBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  pillBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  pillBtnText: { fontSize: 12, fontFamily: 'Outfit-Medium', color: '#64748B' },
  pillBtnTextActive: { color: '#3B82F6', fontFamily: 'Outfit-Bold' },

  // Buttons
  primaryButton: {
    backgroundColor: '#4F46E5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  primaryButtonText: { color: '#FFF', fontSize: 15, fontFamily: 'Outfit-Bold' },

  downloadButton: {
    backgroundColor: '#CBD5E1',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButtonActive: { backgroundColor: '#4F46E5' },
  downloadButtonText: { color: '#FFF', fontSize: 15, fontFamily: 'Outfit-Bold' },

  // Result
  resultSection: {
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
  resultPreviewBox: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultImage: { width: '100%', height: '100%' },
  resetBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetText: { fontSize: 14, fontFamily: 'Outfit-Medium', color: '#475569' },
});
