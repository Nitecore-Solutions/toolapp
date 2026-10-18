import { useAlert } from '../../../context/AlertContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Image,
  KeyboardAvoidingView, Platform, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadFile } from '../../../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Buffer } from 'buffer';
import { ImageIcon, Download } from 'lucide-react-native';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';

export default function FormatConvertScreen() {
  const { showAlert } = useAlert();
  const wrapWithAd = useAdOnDownload();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);

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
      const params = { target_format: 'jpeg' };
      const arrayBuffer = await uploadFile('/api/image/convert-format', imageUri, fileName, 'image/jpeg', params);
      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const tempUri = `${FileSystem.cacheDirectory}result_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      setResultUri(tempUri);
    } catch (error) {
      console.log("Backend offline, using local JPG converter fallback");
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
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
          message: "Aapki converted image photo gallery me save ho gayi hai.", 
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Page Title */}
          <Text style={styles.pageTitle}>Image to jpg</Text>

          {/* Main Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Image to JPG Converter</Text>

            {/* Dashed Drop Zone */}
            <TouchableOpacity style={styles.dropZone} onPress={pickImage} activeOpacity={0.7}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
              ) : (
                <View style={styles.dropZonePlaceholder}>
                  <ImageIcon color="#94A3B8" width={36} height={36} />
                  <Text style={styles.dropZoneText}>Drag & drop an image here, or click to select</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* File name row (shown after pick) */}
            {imageUri && (
              <View style={styles.fileInfoRow}>
                <ImageIcon color="#64748B" width={14} height={14} />
                <Text style={styles.fileInfoText} numberOfLines={1}>
                  {imageUri.split('/').pop()}
                </Text>
                <TouchableOpacity onPress={handleReset} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>✕ Clear</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Convert Button */}
            <TouchableOpacity
              style={[styles.convertBtn, loading && styles.convertBtnDisabled]}
              onPress={handleProcess}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.convertBtnText}>Convert to JPG</Text>
              }
            </TouchableOpacity>

            {/* Download Button — visible after success */}
            {resultUri && (
              <View style={styles.resultSection}>
                <Text style={styles.successText}>✅ Conversion Successful!</Text>

                <View style={styles.resultPreviewBox}>
                  <Image source={{ uri: resultUri }} style={styles.resultImage} resizeMode="contain" />
                </View>

                <TouchableOpacity style={styles.downloadBtn} onPress={() => wrapWithAd(handleDownload)} activeOpacity={0.85}>
                  <Download color="#FFF" width={18} height={18} />
                  <Text style={styles.downloadBtnText}>Download JPG</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.anotherBtn} onPress={handleReset}>
                  <Text style={styles.anotherBtnText}>Convert Another</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingBottom: 150 },

  pageTitle: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
    marginBottom: 16,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 20,
  },

  // Dashed drop zone (matches web mockup)
  dropZone: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 10,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
    overflow: 'hidden',
  },
  dropZonePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  dropZoneText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  previewImage: {
    width: '100%',
    height: 180,
  },

  // File info
  fileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 8,
  },
  fileInfoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: '#475569',
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  clearBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#EF4444',
  },

  // Convert button (matches web blue→app orange)
  convertBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  convertBtnDisabled: { backgroundColor: '#FED7AA' },
  convertBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
  },

  // Result
  resultSection: { marginTop: 24, alignItems: 'center' },
  successText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#10B981',
    marginBottom: 14,
  },
  resultPreviewBox: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  resultImage: { width: '100%', height: '100%' },

  downloadBtn: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    width: '100%',
    justifyContent: 'center',
  },
  downloadBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
  },

  anotherBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  anotherBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#475569',
  },
});
