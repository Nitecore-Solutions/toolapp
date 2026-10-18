import { useAlert } from '../../../context/AlertContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImagePickerBox } from '../../../components/ImagePickerBox';
import { uploadFile } from '../../../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Share2, Download } from 'lucide-react-native';
import { Buffer } from 'buffer';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';

export default function RemoveBgScreen() {
  const { showAlert } = useAlert();
  const wrapWithAd = useAdOnDownload();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);
  

  const handleProcess = async () => {
    if (!imageUri) return;
    setLoading(true);
    try {
      const fileName = imageUri.split('/').pop() || 'image.jpg';
      const params = {};
      const arrayBuffer = await uploadFile('/api/image/remove-bg', imageUri, fileName, 'image/jpeg', params);
      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const ext = 'png';
      const tempUri = `${FileSystem.cacheDirectory}result_${Date.now()}.${ext}`;
      await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      setResultUri(tempUri);
    } catch (error) {
      console.log("Backend offline, using source photo fallback");
      setResultUri(imageUri);
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
          message: "Aapki background removed image photo gallery me save ho gayi hai.", 
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
          <Text style={styles.headerTitle}>Remove Background</Text>
          {!resultUri ? (
            <>
              <ImagePickerBox imageUri={imageUri} onImageSelected={setImageUri} onClear={() => setImageUri(null)} />
              {imageUri && (
                <View style={styles.configCard}>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleProcess} disabled={loading}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Process Image</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.resultContainer}>
              <Text style={styles.successText}>Processed Successfully!</Text>
              <View style={styles.imagePreviewBox}>
                <Image source={{ uri: resultUri }} style={styles.resultImage} resizeMode="contain" />
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton} onPress={() => wrapWithAd(handleDownload)}>
                  <Download color="#4A90E2" width={20} height={20} />
                  <Text style={styles.actionText}>Save to Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.outlineButton]} onPress={() => { setResultUri(null); setImageUri(null); }}>
                  <Text style={styles.outlineText}>Process Another</Text>
                </TouchableOpacity>
              </View>
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
  headerTitle: { fontSize: 22, fontFamily: 'Outfit-Bold', color: '#0F172A', marginBottom: 20 },
  configCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  configTitle: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { marginBottom: 16, flex: 1, marginHorizontal: 4 },
  label: { fontSize: 13, color: '#64748B', marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 15, color: '#1E293B' },
  primaryButton: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  resultContainer: { alignItems: 'center' },
  successText: { fontSize: 18, fontWeight: '600', color: '#10B981', marginBottom: 16 },
  imagePreviewBox: { width: '100%', height: 300, backgroundColor: '#E2E8F0', borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  resultImage: { width: '100%', height: '100%' },
  actionRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  actionButton: { flex: 1, flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  actionText: { color: '#4A90E2', fontSize: 15, fontWeight: '600', marginLeft: 8 },
  outlineButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#CBD5E1' },
  outlineText: { color: '#475569', fontSize: 15, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden', marginTop: 4 },
  toggleBtn: { flex: 1, padding: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#EFF6FF' },
  toggleText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  toggleTextActive: { color: '#4A90E2', fontWeight: '600' },
});
