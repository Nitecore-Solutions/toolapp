import { useAlert } from '../../../context/AlertContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { binaryRequest } from '../../../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { FileText, Plus, Trash, Download, Share2 } from 'lucide-react-native';
import { Buffer } from 'buffer';
import { downloadFileToDevice } from '../../../utils/fileDownloader';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';

export default function ImageToPdfScreen() {
  const { showAlert } = useAlert();
  const wrapWithAd = useAdOnDownload();
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [pdfSize, setPdfSize] = useState<number | null>(null);

  // PDF Configuration States
  const [pageSize, setPageSize] = useState<'A4' | 'A5' | 'Letter'>('A4');
  const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>('Portrait');
  const [margin, setMargin] = useState<string>('10');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
    });

    if (!result.canceled) {
      const uris = result.assets.map(asset => asset.uri);
      setImageUris([...imageUris, ...uris]);
      setResultUri(null); // Reset result on new select
    }
  };

  const removeImage = (index: number) => {
    setImageUris(imageUris.filter((_, i) => i !== index));
    setResultUri(null); // Reset result when images change
  };

  const handleProcess = async () => {
    if (imageUris.length === 0) {
      showAlert({ title: "Required", message: "Please add at least one image.", type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      imageUris.forEach((uri, idx) => {
        const fileName = uri.split('/').pop() || `image_${idx}.jpg`;
        // @ts-ignore
        formData.append('files', {
          uri,
          name: fileName,
          type: 'image/jpeg',
        });
      });

      formData.append('page_size', pageSize);
      formData.append('orientation', orientation);
      formData.append('margin', margin || '0');

      const arrayBuffer = await binaryRequest('POST', '/api/pdf/image-to-pdf', formData);

      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const tempUri = `${FileSystem.cacheDirectory}converted_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(tempUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileInfo = await FileSystem.getInfoAsync(tempUri);
      if (fileInfo.exists) {
        setPdfSize(fileInfo.size);
      }

      setResultUri(tempUri);
    } catch (error: any) {
      console.log("Image to PDF failed:", error);
      showAlert({
        title: "Conversion Failed",
        message: "Failed to generate PDF from images. Please try again with fewer or smaller images.",
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (resultUri && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(resultUri, { mimeType: 'application/pdf', dialogTitle: 'Share PDF' });
    }
  };

  const handleDownload = async () => {
    if (!resultUri) return;
    const fileName = `converted_images_${Date.now()}.pdf`;
    await downloadFileToDevice(
      resultUri,
      fileName,
      'application/pdf',
      (msg) => {
        if (Platform.OS === 'android') {
          ToastAndroid.show('PDF saved to device!', ToastAndroid.SHORT);
        }
        showAlert({ title: "Download Complete! 🎉", message: msg, type: 'success' });
      },
      (errMsg) => showAlert({ title: "Notice", message: errMsg, type: 'info' })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 100} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.headerTitle}>Image to PDF Converter</Text>

          {/* Main Card */}
          <View style={styles.configCard}>
            {/* Header Row */}
            <View style={styles.headerRow}>
              <Text style={styles.subHeader}>Selected Images ({imageUris.length})</Text>
              <TouchableOpacity style={styles.addBtn} onPress={pickImage} activeOpacity={0.7}>
                <Plus color="#FFF" width={16} height={16} />
                <Text style={styles.addBtnText}>Add Image</Text>
              </TouchableOpacity>
            </View>

            {/* Selector Box */}
            {imageUris.length === 0 ? (
              <TouchableOpacity style={styles.emptyBox} onPress={pickImage} activeOpacity={0.7}>
                <FileText color="#94A3B8" width={48} height={48} />
                <Text style={styles.emptyText}>No images selected</Text>
                <Text style={styles.emptySubText}>Tap to add images from gallery</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.grid}>
                {imageUris.map((uri, idx) => (
                  <View key={idx} style={styles.gridItem}>
                    <Image source={{ uri }} style={styles.thumbnail} />
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{idx + 1}</Text>
                    </View>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(idx)} activeOpacity={0.7}>
                      <Trash color="#FFF" width={14} height={14} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* PDF Settings Block */}
            <View style={styles.divider} />
            <Text style={styles.optionsTitle}>Page & Layout Settings</Text>

            {/* Page Size */}
            <View style={styles.optionGroup}>
              <Text style={styles.label}>Page Size:</Text>
              <View style={styles.pillRow}>
                {['A4', 'A5', 'Letter'].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[styles.pillBtn, pageSize === size ? styles.pillBtnActive : null]}
                    onPress={() => setPageSize(size as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, pageSize === size ? styles.pillBtnTextActive : null]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Orientation */}
            <View style={styles.optionGroup}>
              <Text style={styles.label}>Orientation:</Text>
              <View style={styles.pillRow}>
                {['Portrait', 'Landscape'].map((orient) => (
                  <TouchableOpacity
                    key={orient}
                    style={[styles.pillBtn, orientation === orient ? styles.pillBtnActive : null]}
                    onPress={() => setOrientation(orient as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, orientation === orient ? styles.pillBtnTextActive : null]}>
                      {orient}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Margin */}
            <View style={styles.optionGroup}>
              <Text style={styles.label}>Margin (mm):</Text>
              <View style={styles.marginInputContainer}>
                <TextInput
                  style={styles.marginInput}
                  keyboardType="numeric"
                  value={margin}
                  onChangeText={setMargin}
                  placeholder="10"
                  placeholderTextColor="#94A3B8"
                />
                <Text style={styles.marginUnit}>mm</Text>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity 
              style={[styles.primaryButton, imageUris.length === 0 ? styles.primaryButtonDisabled : null]}
              onPress={handleProcess}
              disabled={loading || imageUris.length === 0}
              activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Convert to PDF</Text>}
            </TouchableOpacity>

            {/* PDF Preview Section */}
            {resultUri && (
              <View style={styles.previewContainer}>
                <View style={styles.previewHeader}>
                  <FileText color="#EF4444" width={20} height={20} />
                  <Text style={styles.previewTitle}>PDF Preview</Text>
                </View>

                {/* Simulated Viewer */}
                <View style={styles.simulatedViewer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 20 }}>
                    {imageUris.map((uri, idx) => {
                      // Calculate Aspect Ratio dynamically
                      let ratio = 1 / 1.414; // Default A4/A5 Portrait
                      if (pageSize === 'Letter') ratio = 8.5 / 11;
                      
                      if (orientation === 'Landscape') {
                        ratio = 1 / ratio;
                      }

                      // Convert margin (mm) to relative padding for the mock preview
                      const marginNum = parseInt(margin || '0', 10);
                      const simulatedPadding = Math.min(marginNum, 50) / 2; // scale it down a bit for the small preview

                      return (
                        <View key={idx} style={[styles.pdfPageMock, { aspectRatio: ratio, padding: simulatedPadding }]}>
                          <Image source={{ uri }} style={styles.pdfPageImage} resizeMode="contain" />
                          <Text style={styles.pdfPageNumber}>{idx + 1}</Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Details Table */}
                <View style={styles.detailsTable}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>File Name:</Text>
                    <Text style={styles.detailValue}>converted_images.pdf</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>File Size:</Text>
                    <Text style={styles.detailValue}>{pdfSize ? (pdfSize / 1024).toFixed(1) + ' KB' : '...'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>File Type:</Text>
                    <Text style={styles.detailValue}>PDF Document</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Number of Pages:</Text>
                    <Text style={styles.detailValue}>{imageUris.length}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Created:</Text>
                    <Text style={styles.detailValue}>Just now</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Download & Share Action Buttons */}
            {resultUri ? (
              <View style={styles.actionButtonGroup}>
                <TouchableOpacity 
                  style={[styles.downloadButton, styles.downloadButtonActive, { flex: 1, marginTop: 0 }]}
                  onPress={() => wrapWithAd(handleDownload)}
                  activeOpacity={0.8}
                >
                  <Download color="#FFF" width={18} height={18} style={{ marginRight: 6 }} />
                  <Text style={styles.downloadButtonText}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.downloadButton, styles.shareButtonActive, { flex: 1, marginTop: 0 }]}
                  onPress={handleShare}
                  activeOpacity={0.8}
                >
                  <Share2 color="#FFF" width={18} height={18} style={{ marginRight: 6 }} />
                  <Text style={styles.downloadButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.downloadButton}
                disabled={true}
                activeOpacity={0.8}
              >
                <Text style={styles.downloadButtonText}>Download Converted PDF</Text>
              </TouchableOpacity>
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
  headerTitle: { fontSize: 20, fontFamily: 'Outfit-Bold', color: '#0F172A', textAlign: 'center', marginBottom: 20 },
  configCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  subHeader: { fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#64748B' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  addBtnText: { color: '#FFF', fontSize: 13, fontFamily: 'Outfit-Bold', marginLeft: 4 },
  emptyBox: { borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 16, padding: 40, alignItems: 'center', backgroundColor: '#FFFFFF', marginTop: 10 },
  emptyText: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#475569', marginTop: 16, marginBottom: 4 },
  emptySubText: { fontSize: 12, fontFamily: 'Outfit-Regular', color: '#94A3B8' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10, marginBottom: 20 },
  gridItem: { width: '30%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' },
  thumbnail: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 6, left: 6, backgroundColor: '#4F46E5', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 11, fontFamily: 'Outfit-Bold' },
  removeBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(239, 68, 68, 0.85)', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  optionsTitle: { fontSize: 14, fontFamily: 'Outfit-Bold', color: '#334155', marginBottom: 16 },
  label: { fontSize: 13, fontFamily: 'Outfit-Medium', color: '#64748B', marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  pillBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', alignItems: 'center' },
  pillBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  pillBtnText: { fontSize: 13, fontFamily: 'Outfit-Medium', color: '#64748B' },
  pillBtnTextActive: { color: '#3B82F6', fontFamily: 'Outfit-Bold' },
  marginInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 12, height: 44, marginBottom: 14 },
  marginInput: { flex: 1, fontSize: 14, color: '#1E293B', fontFamily: 'Outfit-Regular', height: '100%' },
  marginUnit: { fontSize: 14, fontFamily: 'Outfit-Medium', color: '#64748B', marginLeft: 8 },
  primaryButton: { backgroundColor: '#4F46E5', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  primaryButtonDisabled: { backgroundColor: '#F3F4F6' },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  actionButtonGroup: { flexDirection: 'row', gap: 10, marginTop: 14 },
  downloadButton: { backgroundColor: '#E2E8F0', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 12, flexDirection: 'row', justifyContent: 'center' },
  downloadButtonActive: { backgroundColor: '#4F46E5' },
  shareButtonActive: { backgroundColor: '#475569' },
  downloadButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  optionGroup: { marginBottom: 16 },

  // Preview Styles
  previewContainer: { marginTop: 24, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#FAFAFA', overflow: 'hidden' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  previewTitle: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#1E293B', marginLeft: 8 },
  simulatedViewer: { backgroundColor: '#333333', paddingVertical: 20 },
  pdfPageMock: { backgroundColor: '#FFFFFF', borderRadius: 4, height: 150, padding: 8, position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  pdfPageImage: { width: '100%', height: '100%' },
  pdfPageNumber: { position: 'absolute', bottom: -20, alignSelf: 'center', color: '#9CA3AF', fontSize: 12, fontFamily: 'Outfit-Medium' },
  detailsTable: { backgroundColor: '#FFFFFF', padding: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  detailLabel: { fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#64748B' },
  detailValue: { fontSize: 13, fontFamily: 'Outfit-Medium', color: '#1E293B' },
});
