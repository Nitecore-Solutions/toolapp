import { useAlert } from '../../../context/AlertContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import { BASE_URL } from '../../../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Download, Share2, Image as ImageIcon } from 'lucide-react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { downloadFileToDevice } from '../../../utils/fileDownloader';
import { Buffer } from 'buffer';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';

export default function PdfToJpgScreen() {
  const { showAlert } = useAlert();
  const wrapWithAd = useAdOnDownload();
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingToGallery, setSavingToGallery] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  
  // Format state (PNG, JPG, WEBP, GIF)
  const [format, setFormat] = useState<'PNG' | 'JPG' | 'WEBP' | 'GIF'>('PNG');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        const isPdf = (file.name && file.name.toLowerCase().endsWith('.pdf')) || file.mimeType === 'application/pdf';
        if (!isPdf && file.name && file.name.includes('.')) {
          showAlert({ title: "Invalid File", message: "Please select a valid PDF document (.pdf file).", type: 'error' });
          return;
        }
        setPdfUri(file.uri);
        setPdfName(file.name || 'document.pdf');
        setResultUri(null);
        setPageImages([]);
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: "Error", message: "Failed to pick PDF file.", type: 'error' });
    }
  };

  const handleProcess = async () => {
    if (!pdfUri) {
      showAlert({ title: "Upload Required", message: "Please select a PDF file first.", type: 'error' });
      return;
    }

    setLoading(true);
    setResultUri(null);
    setPageImages([]);
    try {
      const formData = new FormData();
      const fileName = pdfName || 'document.pdf';
      
      // @ts-ignore
      formData.append('file', {
        uri: pdfUri,
        name: fileName,
        type: 'application/pdf',
      });
      formData.append('dpi', '150');

      const res = await fetch(`${BASE_URL}/api/pdf/render-pages`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Server returned ${res.status}: ${errText}`);
      }

      const data = await res.json();
      if (data && data.pages && data.pages.length > 0) {
        const savedUris: string[] = [];
        const targetFormat = format === 'PNG' ? ImageManipulator.SaveFormat.PNG :
                             format === 'WEBP' ? ImageManipulator.SaveFormat.WEBP :
                             ImageManipulator.SaveFormat.JPEG;

        for (let i = 0; i < data.pages.length; i++) {
          const rawBase64 = data.pages[i].includes(',') ? data.pages[i].split(',')[1] : data.pages[i];
          const tempPng = `${FileSystem.cacheDirectory}pdf_page_raw_${i + 1}_${Date.now()}.png`;
          await FileSystem.writeAsStringAsync(tempPng, rawBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          if (format !== 'PNG') {
            const manipResult = await ImageManipulator.manipulateAsync(
              tempPng,
              [],
              { format: targetFormat, compress: 0.95 }
            );
            savedUris.push(manipResult.uri);
          } else {
            savedUris.push(tempPng);
          }
        }
        setPageImages(savedUris);
        setResultUri(savedUris[0]);
      } else {
        throw new Error('No images returned from conversion.');
      }
    } catch (error: any) {
      console.log("PDF conversion failed:", error);
      showAlert({
        title: "Conversion Failed",
        message: "Failed to convert PDF pages. Please verify the document is not password-protected and try again.",
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (pageImages.length === 0 && !resultUri) return;
    setSavingToGallery(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status === 'granted') {
        const urisToSave = pageImages.length > 0 ? pageImages : [resultUri!];
        for (const imgUri of urisToSave) {
          await MediaLibrary.saveToLibraryAsync(imgUri);
        }
        if (Platform.OS === 'android') {
          ToastAndroid.show('Image downloaded to gallery!', ToastAndroid.SHORT);
        }
        showAlert({ 
          title: "Download Complete! 🎉", 
          message: `${urisToSave.length} ${urisToSave.length === 1 ? 'image' : 'images'} photo gallery me save ho gayi hai.`, 
          type: 'success' 
        });
        return;
      }
      if (resultUri && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(resultUri);
      }
    } catch (err: any) {
      console.error("Save error:", err);
      if (resultUri && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(resultUri);
      }
    } finally {
      setSavingToGallery(false);
    }
  };

  const handleShare = async () => {
    if (pageImages.length > 0 && await Sharing.isAvailableAsync()) {
      let mimeType = 'image/png';
      if (format === 'JPG') mimeType = 'image/jpeg';
      else if (format === 'WEBP') mimeType = 'image/webp';
      else if (format === 'GIF') mimeType = 'image/gif';

      await Sharing.shareAsync(pageImages[0], { mimeType, dialogTitle: 'Share Converted Image' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 100} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.headerTitle}>PDF to Image Converter</Text>

          <View style={styles.configCard}>
            <Text style={styles.cardSubtitle}>
              Upload your PDF file, choose the output format, and view or save the converted images!
            </Text>

            {/* PDF Document Selector */}
            <Text style={styles.label}>Select PDF File</Text>
            <TouchableOpacity style={styles.fileSelectorRow} onPress={pickDocument} activeOpacity={0.7}>
              <View style={styles.chooseFileBtn}>
                <Text style={styles.chooseFileBtnText}>Choose file</Text>
              </View>
              <Text style={styles.fileNameText} numberOfLines={1}>
                {pdfName || 'No file chosen'}
              </Text>
            </TouchableOpacity>

            {/* Format selection */}
            <View style={styles.optionGroup}>
              <Text style={styles.label}>Output Format</Text>
              <View style={styles.pillRow}>
                {['PNG', 'JPG', 'WEBP', 'GIF'].map((fmt) => (
                  <TouchableOpacity
                    key={fmt}
                    style={[styles.pillBtn, format === fmt ? styles.pillBtnActive : null]}
                    onPress={() => setFormat(fmt as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, format === fmt ? styles.pillBtnTextActive : null]}>
                      {fmt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Convert Action Button */}
            <TouchableOpacity 
              style={[styles.primaryButton, !pdfUri ? styles.primaryButtonDisabled : null]}
              onPress={handleProcess}
              disabled={loading || !pdfUri}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Converting Pages...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Convert to Image</Text>
              )}
            </TouchableOpacity>

            {/* Image Preview Section */}
            {pageImages.length > 0 && (
              <View style={styles.previewContainer}>
                <View style={styles.previewHeader}>
                  <ImageIcon color="#4F46E5" width={18} height={18} />
                  <Text style={styles.previewTitle}>
                    Converted Images ({pageImages.length} {pageImages.length === 1 ? 'Page' : 'Pages'})
                  </Text>
                </View>

                {/* Simulated Viewer / Carousel */}
                <View style={styles.simulatedViewer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
                    {pageImages.map((uri, idx) => (
                      <View key={idx} style={styles.pageCard}>
                        <Image source={{ uri }} style={styles.pageImage} resizeMode="contain" />
                        <View style={styles.pageBadge}>
                          <Text style={styles.pageBadgeText}>Page {idx + 1}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* Info Table */}
                <View style={styles.detailsTable}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Format:</Text>
                    <Text style={styles.detailValue}>{format}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pages Extracted:</Text>
                    <Text style={styles.detailValue}>{pageImages.length}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailValue, { color: '#10B981', fontFamily: 'Outfit-Bold' }]}>Ready to Save</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Download & Share Action Buttons (Shown once converted) */}
            {pageImages.length > 0 && (
              <View style={styles.actionButtonGroup}>
                <TouchableOpacity 
                  style={[styles.downloadButton, styles.downloadButtonActive, { flex: 1, marginTop: 0 }]}
                  onPress={() => wrapWithAd(handleDownload)}
                  disabled={savingToGallery}
                  activeOpacity={0.8}
                >
                  {savingToGallery ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Download color="#FFF" width={18} height={18} style={{ marginRight: 6 }} />
                      <Text style={styles.downloadButtonText}>Save to Gallery</Text>
                    </>
                  )}
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
  cardSubtitle: { fontSize: 13, fontFamily: 'Outfit-Regular', color: '#64748B', lineHeight: 20, textAlign: 'center', marginBottom: 20 },
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
  optionGroup: { marginBottom: 20 },
  pillRow: { flexDirection: 'row', gap: 6 },
  pillBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', alignItems: 'center' },
  pillBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  pillBtnText: { fontSize: 13, fontFamily: 'Outfit-Medium', color: '#64748B' },
  pillBtnTextActive: { color: '#3B82F6', fontFamily: 'Outfit-Bold' },
  primaryButton: { backgroundColor: '#4F46E5', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },

  // Preview Styles
  previewContainer: { marginTop: 20, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#FAFAFA', overflow: 'hidden' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  previewTitle: { fontSize: 14, fontFamily: 'Outfit-Bold', color: '#1E293B', marginLeft: 8 },
  simulatedViewer: { backgroundColor: '#1E293B', paddingVertical: 14 },
  pageCard: { width: 130, height: 175, backgroundColor: '#FFFFFF', borderRadius: 6, padding: 6, position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 3 },
  pageImage: { width: '100%', height: '100%' },
  pageBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(15, 23, 42, 0.75)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pageBadgeText: { color: '#FFF', fontSize: 10, fontFamily: 'Outfit-Bold' },
  detailsTable: { backgroundColor: '#FFFFFF', padding: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  detailLabel: { fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#64748B' },
  detailValue: { fontSize: 13, fontFamily: 'Outfit-Medium', color: '#1E293B' },

  // Action Button Group
  actionButtonGroup: { flexDirection: 'row', gap: 10, marginTop: 14 },
  downloadButton: { backgroundColor: '#E2E8F0', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 12, flexDirection: 'row', justifyContent: 'center' },
  downloadButtonActive: { backgroundColor: '#4F46E5' },
  shareButtonActive: { backgroundColor: '#475569' },
  downloadButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
});
