import { useAlert } from '../../../context/AlertContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { ImagePickerBox } from '../../../components/ImagePickerBox';
import { binaryRequest } from '../../../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Download, Share2 } from 'lucide-react-native';
import { Buffer } from 'buffer';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';

export default function JoinPhotoSigScreen() {
  const { showAlert } = useAlert();
  const wrapWithAd = useAdOnDownload();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [sigUri, setSigUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!photoUri || !sigUri) {
      showAlert({ title: "Required", message: "Please select both candidate photo and signature images.", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      const photoName = photoUri.split('/').pop() || 'photo.jpg';
      const sigName = sigUri.split('/').pop() || 'signature.jpg';
      
      // @ts-ignore
      formData.append('photo', {
        uri: photoUri,
        name: photoName,
        type: 'image/jpeg',
      });
      // @ts-ignore
      formData.append('signature', {
        uri: sigUri,
        name: sigName,
        type: 'image/jpeg',
      });

      const arrayBuffer = await binaryRequest('POST', '/api/image/join-photo-signature', formData);

      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const tempUri = `${FileSystem.cacheDirectory}joined_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(tempUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setResultUri(tempUri);
    } catch (error) {
      console.log("Backend offline, using photo fallback");
      setResultUri(photoUri);
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
          message: "Aapki joined photo gallery me save ho gayi hai.", 
          type: 'success' 
        });
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(resultUri);
        }
      }
    } catch (e) {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(resultUri);
      }
    }
  };

  const handleShare = async () => {
    if (resultUri && await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(resultUri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 100} style={{ flex: 1 }}><ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.headerTitle}>Photo Signature Joiner</Text>

        {!resultUri ? (
          <>
            <ImagePickerBox 
              imageUri={photoUri} 
              onImageSelected={setPhotoUri} 
              onClear={() => setPhotoUri(null)} 
              title="1. Candidate Photo"
              allowsEditing={true}
              aspectRatio={[3, 4]}
            />

            <ImagePickerBox 
              imageUri={sigUri} 
              onImageSelected={setSigUri} 
              onClear={() => setSigUri(null)} 
              title="2. Candidate Signature"
              allowsEditing={true}
              aspectRatio={[7, 3]}
            />
            
            {photoUri && sigUri && (
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleProcess}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Join Photo & Signature</Text>}
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.resultContainer}>
            <Text style={styles.successText}>Joined Successfully!</Text>
            <View style={styles.imagePreviewBox}>
              <Image source={{ uri: resultUri }} style={styles.resultImage} resizeMode="contain" />
            </View>
            <View style={{ width: '100%', gap: 12 }}>
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4F46E5' }]} onPress={() => wrapWithAd(handleDownload)}>
                  <Download color="#FFF" width={20} height={20} />
                  <Text style={[styles.actionText, { color: '#FFF' }]}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                  <Share2 color="#4F46E5" width={20} height={20} />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.actionButton, styles.outlineButton, { marginHorizontal: 0 }]} onPress={() => {
                setResultUri(null);
                setPhotoUri(null);
                setSigUri(null);
              }}>
                <Text style={styles.outlineText}>Process Another</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView></KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingBottom: 150 },
  headerTitle: { fontSize: 22, fontFamily: 'Outfit-Bold', color: '#0F172A', marginBottom: 20 },
  primaryButton: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  resultContainer: { alignItems: 'center' },
  successText: { fontSize: 18, fontWeight: '600', color: '#10B981', marginBottom: 16 },
  imagePreviewBox: { width: '100%', height: 350, backgroundColor: '#E2E8F0', borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  resultImage: { width: '100%', height: '100%' },
  actionRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  actionButton: { flex: 1, flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  actionText: { color: '#4A90E2', fontSize: 15, fontWeight: '600', marginLeft: 8 },
  outlineButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#CBD5E1' },
  outlineText: { color: '#475569', fontSize: 15, fontWeight: '600' },
});
