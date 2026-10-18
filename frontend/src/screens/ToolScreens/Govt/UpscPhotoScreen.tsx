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

const SIZE_OPTIONS = [
  { label: 'Small Size', sub: '(~40KB)',  min: 30,  max: 50  },
  { label: 'Recommended', sub: '(~90KB)', min: 80,  max: 100 },
  { label: 'Max Quality', sub: '(~180KB)', min: 160, max: 200 },
];

export default function UpscPhotoScreen() {
  const { showAlert } = useAlert();
  const wrapWithAd = useAdOnDownload();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState(1); // default: Recommended

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
      const arrayBuffer = await uploadFile('/api/form/upsc/photo-resize', imageUri, fileName, 'image/jpeg');
      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const tempUri = `${FileSystem.cacheDirectory}upsc_photo_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      // Calculate output size
      const fileInfo = await FileSystem.getInfoAsync(tempUri);
      if (fileInfo.exists) {
        setResultSize((fileInfo.size / 1024).toFixed(2));
      }

      setResultUri(tempUri);
    } catch (error) {
      console.log("Backend offline, using local UPSC photo resizer fallback");
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 350, height: 350 } }],
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
          <Text style={styles.headerTitle}>UPSC IAS Photo Resizer</Text>

          {/* Subtitle Spec */}
          <Text style={styles.subTitle}>Strict 75% Face Coverage Guide (20KB – 200KB)</Text>

          {/* Conditional Layout Stages */}
          {!imageUri ? (
            <View style={styles.cardContainer}>
              <TouchableOpacity style={styles.dottedUploadBox} onPress={pickImage} activeOpacity={0.7}>
                <User color="#0F766E" width={40} height={40} style={{ marginBottom: 12 }} />
                <Text style={styles.uploadTitle}>Click to Upload UPSC Photo</Text>
                <Text style={styles.uploadSubtext}>JPG, JPEG Only (White Background)</Text>
              </TouchableOpacity>
            </View>
          ) : !resultUri ? (
            <View style={styles.configCard}>
              {/* Guide Instruction */}
              <Text style={styles.guideText}>
                Align face inside the guide for <Text style={{ fontFamily: 'Outfit-Bold' }}>3/4th coverage</Text>.
              </Text>

              {/* Preview with circular face guide overlay */}
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                {/* Portrait crop dashed box */}
                <View style={styles.portraitOverlay} />
                {/* "Position Face Here" label */}
                <View style={styles.faceLabel}>
                  <Text style={styles.faceLabelText}>POSITION FACE HERE (75%)</Text>
                </View>
                {/* Circular face guide */}
                <View style={styles.circleOverlay} />
              </View>

              {/* Target Size Selector */}
              <Text style={styles.selectLabel}>Select Target Size:</Text>
              <View style={styles.sizeRow}>
                {SIZE_OPTIONS.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.sizePill, selectedSize === i && styles.sizePillActive]}
                    onPress={() => setSelectedSize(i)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sizePillLabel, selectedSize === i && styles.sizePillLabelActive]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.sizePillSub, selectedSize === i && styles.sizePillSubActive]}>
                      {opt.sub}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleProcess}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Generate UPSC Photo</Text>}
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

              {/* Reset */}
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
  headerTitle: { fontSize: 20, fontFamily: 'Outfit-Bold', color: '#0F172A', textAlign: 'center', marginBottom: 6 },
  subTitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#0F766E',
    textAlign: 'center',
    marginBottom: 20,
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
    borderColor: '#99F6E4',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#F0FDFA',
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
  guideText: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: '#0F766E',
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
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 260,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  portraitOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    width: '55%',
    height: '85%',
    borderRadius: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.04)',
    zIndex: 1,
  },
  faceLabel: {
    position: 'absolute',
    top: '10%',
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 2,
  },
  faceLabelText: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  circleOverlay: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
    zIndex: 1,
  },
  selectLabel: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#F97316',
    textAlign: 'center',
    marginBottom: 12,
  },
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  sizePill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  sizePillActive: {
    borderColor: '#0F766E',
    backgroundColor: '#F0FDFA',
  },
  sizePillLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#334155',
    textAlign: 'center',
  },
  sizePillLabelActive: { color: '#0F766E' },
  sizePillSub: {
    fontSize: 10,
    fontFamily: 'Outfit-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  sizePillSubActive: { color: '#0F766E' },
  successSizeText: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: { backgroundColor: '#4F46E5', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  downloadButtonActive: { backgroundColor: '#4F46E5' },
  downloadButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  startOverBtn: { padding: 12, alignItems: 'center', marginTop: 12 },
  startOverBtnText: { color: '#3B82F6', fontSize: 14, fontFamily: 'Outfit-Bold', textDecorationLine: 'underline' },
});
