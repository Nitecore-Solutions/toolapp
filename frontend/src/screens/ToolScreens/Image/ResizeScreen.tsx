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

export default function ResizeScreen() {
  const { showAlert } = useAlert();
  const wrapWithAd = useAdOnDownload();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);

  // Form Configuration States
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [unit, setUnit] = useState<'Pixels' | 'Inches' | 'Cm' | 'Mm'>('Pixels');
  const [format, setFormat] = useState<'JPG' | 'PNG' | 'WEBP'>('JPG');
  const [targetKb, setTargetKb] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
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
      showAlert({ title: "Upload Required", message: "Please select an image first.", type: 'error' });
      return;
    }
    if (!width || !height) {
      showAlert({ title: "Required Fields", message: "Please enter both Width and Height.", type: 'error' });
      return;
    }

    if (unit.toLowerCase() === 'pixels' && (parseFloat(width) < 15 || parseFloat(height) < 15)) {
      showAlert({ 
        title: "Dimensions Too Small", 
        message: `You entered ${width}x${height} Pixels, which is extremely small and will blur the image.\n\nIf you meant Centimeters, please change the Unit to "Cm".`, 
        type: 'error' 
      });
      return;
    }

    setLoading(true);
    try {
      const fileName = imageUri.split('/').pop() || 'image.jpg';
      const params: any = {
        width: parseFloat(width),
        height: parseFloat(height),
        unit: unit.toLowerCase(),
        format: format.toLowerCase(),
      };
      
      if (targetKb) {
        params.target_kb = parseInt(targetKb);
      }

      const arrayBuffer = await uploadFile('/api/image/resize', imageUri, fileName, `image/${format.toLowerCase()}`, params);
      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const tempUri = `${FileSystem.cacheDirectory}resized_${Date.now()}.${format.toLowerCase()}`;
      await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      setResultUri(tempUri);
    } catch (error) {
      console.log("Backend offline, using local image resizer fallback");
      try {
        const w = parseFloat(width) || 300;
        const h = parseFloat(height) || 300;
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: w, height: h } }],
          { compress: 0.9, format: format === 'PNG' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG }
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
          message: "Aapki resized image photo gallery me save ho gayi hai.", 
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
          <Text style={styles.headerTitle}>Resize Image Online</Text>

          <View style={styles.configCard}>
            {/* File Selector */}
            <Text style={styles.label}>Upload Image:</Text>
            <TouchableOpacity style={styles.fileSelectorRow} onPress={pickImage} activeOpacity={0.7}>
              <View style={styles.chooseFileBtn}>
                <Text style={styles.chooseFileBtnText}>Choose file</Text>
              </View>
              <Text style={styles.fileNameText} numberOfLines={1}>
                {imageUri ? imageUri.split('/').pop() : 'No file chosen'}
              </Text>
            </TouchableOpacity>

            {/* Selected Image Preview */}
            {imageUri && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
              </View>
            )}

            {/* Width & Height inputs */}
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
              {unit === 'Pixels' && (width && parseInt(width) < 200 || height && parseInt(height) < 200) && (
                <Text style={{color: '#EF4444', fontSize: 12, marginTop: 8, fontFamily: 'Outfit-Medium'}}>
                  ⚠️ Warning: {width || '0'}x{height || '0'} pixels is very small. The image quality will be low. Use 'Cm' or a larger pixel value.
                </Text>
              )}
            </View>

            {/* Format Selector */}
            <View style={styles.optionGroup}>
              <Text style={styles.label}>Format</Text>
              <View style={styles.pillRow}>
                {['JPG', 'PNG', 'WEBP'].map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.pillBtn, format === f ? styles.pillBtnActive : null]}
                    onPress={() => setFormat(f as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, format === f ? styles.pillBtnTextActive : null]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Target Size (KB) (Optional) */}
            <View style={styles.optionGroup}>
              <Text style={styles.label}>Target Size (KB) (optional)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={targetKb}
                onChangeText={setTargetKb}
                placeholder="e.g. 100"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Action Button */}
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleProcess} 
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Resize Image</Text>}
            </TouchableOpacity>

            {/* Success Message & Preview */}
            {resultUri && (
              <View style={styles.resultContainer}>
                <Text style={styles.successText}>✅ Your image has been resized successfully!</Text>
                <View style={styles.previewContainer}>
                  <Image source={{ uri: resultUri }} style={styles.previewImage} resizeMode="contain" />
                </View>
              </View>
            )}

            {/* Download Button (shows dynamically when result is ready) */}
            <TouchableOpacity 
              style={[styles.downloadButton, resultUri ? styles.downloadButtonActive : null]}
              onPress={() => wrapWithAd(handleDownload)}
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
  headerTitle: { fontSize: 20, fontFamily: 'Outfit-Bold', color: '#1E293B', textAlign: 'center', marginBottom: 20 },
  configCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  label: { fontSize: 13, fontFamily: 'Outfit-Medium', color: '#334155', marginBottom: 8 },
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
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  gridCol: { flex: 1 },
  input: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#CBD5E1', 
    borderRadius: 6, 
    padding: 12, 
    fontSize: 14, 
    color: '#1E293B', 
    fontFamily: 'Outfit-Regular',
    height: 46
  },
  optionGroup: { marginBottom: 16 },
  pillRow: { flexDirection: 'row', gap: 6 },
  pillBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', alignItems: 'center' },
  pillBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  pillBtnText: { fontSize: 13, fontFamily: 'Outfit-Medium', color: '#64748B' },
  pillBtnTextActive: { color: '#3B82F6', fontFamily: 'Outfit-Bold' },
  primaryButton: { backgroundColor: '#4F46E5', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  downloadButton: { backgroundColor: '#E2E8F0', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 12 },
  downloadButtonActive: { backgroundColor: '#4F46E5' },
  downloadButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
});
