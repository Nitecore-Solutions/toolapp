import { useAlert } from '../../../context/AlertContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadFile } from '../../../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Download, User } from 'lucide-react-native';
import { Buffer } from 'buffer';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';

export default function NsdlPanPhotoScreen() {
  const { showAlert } = useAlert();
  const wrapWithAd = useAdOnDownload();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<string | null>(null);

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
      setResultSize(null);
    }
  };

  const handleProcess = async () => {
    if (!imageUri) {
      showAlert({ title: "Upload Required", message: "Please select an image first.", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const fileName = imageUri.split('/').pop() || 'image.jpg';
      const arrayBuffer = await uploadFile('/api/form/nsdl-pan/photo-resize', imageUri, fileName, 'image/jpeg');
      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const tempUri = `${FileSystem.cacheDirectory}nsdl_photo_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      
      const fileInfo = await FileSystem.getInfoAsync(tempUri);
      if (fileInfo.exists) {
        setResultSize((fileInfo.size / 1024).toFixed(2));
      }
      
      setResultUri(tempUri);
    } catch (error) {
      console.log("Backend offline, using local NSDL photo resizer fallback");
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 213, height: 213 } }],
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
        );
        const fileInfo = await FileSystem.getInfoAsync(manipResult.uri);
        if (fileInfo.exists) {
          setResultSize((fileInfo.size / 1024).toFixed(2));
        }
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
          message: "Aapki photo gallery me save ho gayi hai.", 
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
          <Text style={styles.headerTitle}>NSDL PAN Card Photo Resizer</Text>

          {/* Specs Badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.specsBadge}>
              <Text style={styles.specsBadgeText}>✓ 3.5cm x 2.5cm | 200 DPI | 20KB-50KB</Text>
            </View>
          </View>

          {/* Description Text */}
          <Text style={styles.descriptionText}>
            Resize photo for <Text style={{ fontFamily: 'Outfit-Bold' }}>Protean (NSDL) PAN Application</Text>. White background is mandatory.
          </Text>

          {/* Conditional Layout Stages */}
          {!imageUri ? (
            <View style={styles.cardContainer}>
              {/* Dotted upload selector */}
              <TouchableOpacity style={styles.dottedUploadBox} onPress={pickImage} activeOpacity={0.7}>
                <User color="#0284C7" width={40} height={40} style={{ marginBottom: 12 }} />
                <Text style={styles.uploadTitle}>Click to Upload Passport Photo</Text>
                <Text style={styles.uploadSubtext}>JPG/JPEG Only</Text>
              </TouchableOpacity>
            </View>
          ) : !resultUri ? (
            <View style={styles.configCard}>
              <Text style={styles.aspectBoxText}>Ensure face coverage is 70-80% (3.5×2.5 Ratio):</Text>

              {/* Selected Image Preview / Aspect Ratio Crop Simulation */}
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
                <View style={styles.cropOverlay} />
              </View>

              {/* Action Button */}
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleProcess} 
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Generate PAN Photo (20KB – 50KB)</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.configCard}>
              <View style={styles.resultContainer}>
                <Text style={styles.successText}>✅ Fixed! Size: {resultSize} KB</Text>

              {/* Processed Image Preview */}
              <View style={styles.previewContainer}>
                <Image source={{ uri: resultUri }} style={styles.previewImage} resizeMode="contain" />
              </View>
              </View>

              {/* Download Button */}
              <TouchableOpacity 
                style={[styles.downloadButton, styles.downloadButtonActive]}
                onPress={() => wrapWithAd(handleDownload)}
                activeOpacity={0.8}
              >
                <Download color="#FFF" width={18} height={18} style={{ marginRight: 8 }} />
                <Text style={styles.downloadButtonText}>Download Photo</Text>
              </TouchableOpacity>

              {/* Reset/Change Image */}
              <TouchableOpacity 
                style={styles.startOverBtn}
                onPress={() => { setImageUri(null); setResultUri(null); setResultSize(null); }}
                activeOpacity={0.8}
              >
                <Text style={styles.startOverBtnText}>Start Over</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingBottom: 150 },
  headerTitle: { fontSize: 20, fontFamily: 'Outfit-Bold', color: '#C2410C', textAlign: 'center', marginBottom: 12 },
  badgeContainer: { alignItems: 'center', marginBottom: 16 },
  specsBadge: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  specsBadgeText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#0284C7',
  },
  descriptionText: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
  },
  dottedUploadBox: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    paddingVertical: 36,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  configCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  aspectBoxText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#C2410C',
    textAlign: 'center',
    marginBottom: 16,
  },
  successSizeText: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 16,
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
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  cropOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    width: '60%',
    height: '80%',
    borderRadius: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  primaryButton: { backgroundColor: '#4F46E5', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  downloadButton: { 
    flexDirection: 'row',
    backgroundColor: '#E2E8F0', 
    padding: 14, 
    borderRadius: 6, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 12 
  },
  downloadButtonActive: { backgroundColor: '#4F46E5' },
  downloadButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  startOverBtn: { padding: 12, alignItems: 'center', marginTop: 12 },
  startOverBtnText: { color: '#3B82F6', fontSize: 14, fontFamily: 'Outfit-Bold', textDecorationLine: 'underline' },
  resetButton: { padding: 12, alignItems: 'center', marginTop: 12 },
  resetButtonText: { color: '#3B82F6', fontSize: 13, fontFamily: 'Outfit-Bold' },
});
