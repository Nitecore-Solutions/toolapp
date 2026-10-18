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
import { Check, Download, Upload } from 'lucide-react-native';
import { Buffer } from 'buffer';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';

const SIZE_OPTIONS = [
  { label: 'Under 10KB',  sub: '(Strict Limit)', max: 10  },
  { label: 'Under 20KB',  sub: '(SSC / Bank)',   max: 20  },
  { label: 'Under 50KB',  sub: '(UPSC)',          max: 50  },
  { label: 'Under 100KB', sub: '(Docs)',           max: 100 },
  { label: 'Under 200KB', sub: '',                max: 200 },
  { label: 'Under 500KB', sub: '',                max: 500 },
];

export default function SscSignatureScreen() {
  const { showAlert } = useAlert();
  const wrapWithAd = useAdOnDownload();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState(0); // default: Under 10KB

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [7, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      setImageName(uri.split('/').pop() || 'image.png');
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
      const targetKb = SIZE_OPTIONS[selectedSize].max;
      const arrayBuffer = await uploadFile(
        '/api/form/ssc/signature-resize',
        imageUri,
        fileName,
        'image/jpeg',
        { max_kb: targetKb }
      );
      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const tempUri = `${FileSystem.cacheDirectory}ssc_sig_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      // Calculate output size
      const fileInfo = await FileSystem.getInfoAsync(tempUri);
      if (fileInfo.exists) {
        setResultSize((fileInfo.size / 1024).toFixed(2));
      }

      setResultUri(tempUri);
    } catch (error) {
      console.log("Backend offline, using local SSC signature resizer fallback");
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 140, height: 60 } }],
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
          <Text style={styles.headerTitle}>Resize Signature to 10KB, 20KB for SSC, UPSC and Govt Exams</Text>
          <Text style={styles.subTitle}>
            Free tool to resize <Text style={{ fontFamily: 'Outfit-Bold' }}>Scanned Signature</Text> for online application forms. Reduce file size to 10KB or 20KB instantly.
          </Text>

          {/* File Picker Box */}
          {!imageUri ? (
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage} activeOpacity={0.7}>
              <Upload color="#64748B" width={32} height={32} style={{ marginBottom: 10 }} />
              <Text style={styles.uploadBoxTitle}>Click to Upload Signature</Text>
              <Text style={styles.uploadBoxSub}>JPG, PNG, JPEG Only</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.selectedBox} onPress={pickImage} activeOpacity={0.8}>
              <Check color="#0F766E" width={22} height={22} style={{ marginBottom: 6 }} />
              <Text style={styles.selectedFileName} numberOfLines={1}>Selected: {imageName}</Text>
              <Text style={styles.changeFileText}>Click to change file</Text>
            </TouchableOpacity>
          )}

          {/* Size Options Grid */}
          {imageUri && !resultUri && (
            <>
              <View style={styles.sizeGrid}>
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
                    {opt.sub ? (
                      <Text style={[styles.sizePillSub, selectedSize === i && styles.sizePillSubActive]}>
                        {opt.sub}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleProcess}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Compress Signature</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* Result State */}
          {resultUri && (
            <View style={styles.resultCard}>
              <Text style={styles.successText}>
                Done! Final Size: {resultSize} KB (Target: &lt;{SIZE_OPTIONS[selectedSize].max} KB)
              </Text>

              <View style={styles.previewContainer}>
                <Image source={{ uri: resultUri }} style={styles.previewImage} resizeMode="contain" />
              </View>

              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => wrapWithAd(handleDownload)}
                activeOpacity={0.8}
              >
                <Download color="#FFF" width={18} height={18} style={{ marginRight: 8 }} />
                <Text style={styles.downloadButtonText}>Download Signature</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.startOverBtn}
                onPress={() => { setImageUri(null); setResultUri(null); setResultSize(null); setImageName(''); }}
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
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 26,
  },
  subTitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadBoxTitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#334155',
    marginBottom: 4,
  },
  uploadBoxSub: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    color: '#94A3B8',
  },
  selectedBox: {
    borderWidth: 2,
    borderColor: '#99F6E4',
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedFileName: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#0F766E',
    marginBottom: 4,
    textAlign: 'center',
  },
  changeFileText: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    color: '#0F766E',
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  sizePill: {
    width: '30%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  sizePillActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  sizePillLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#334155',
    textAlign: 'center',
  },
  sizePillLabelActive: { color: '#1D4ED8' },
  sizePillSub: {
    fontSize: 10,
    fontFamily: 'Outfit-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  sizePillSubActive: { color: '#2563EB' },
  primaryButton: { backgroundColor: '#4F46E5', padding: 14, borderRadius: 6, alignItems: 'center', marginBottom: 20 },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  resultCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  successText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#16A34A',
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
  previewContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  startOverBtn: { padding: 12, alignItems: 'center', marginTop: 10 },
  startOverBtnText: { color: '#4F46E5', fontSize: 13, fontFamily: 'Outfit-Bold', textDecorationLine: 'underline' },
});
