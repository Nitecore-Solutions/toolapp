import { useAlert } from '../../../context/AlertContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { binaryRequest } from '../../../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Share2, FileText, Trash, FileArchive, Download } from 'lucide-react-native';
import { Buffer } from 'buffer';
import { downloadFileToDevice } from '../../../utils/fileDownloader';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';

interface SelectionItem {
  uri: string;
  name: string;
  size?: number;
}

export default function CompressPdfScreen() {
  const { showAlert } = useAlert();
  const wrapWithAd = useAdOnDownload();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SelectionItem | null>(null);
  const [targetKb, setTargetKb] = useState<number>(200); // Default 200KB
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<string>('');
  const [compressedSize, setCompressedSize] = useState<string>('');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const item = result.assets[0];
        setSelectedFile({
          uri: item.uri,
          name: item.name,
          size: item.size,
        });
        
        // Calculate original size in KB/MB
        if (item.size) {
          const sz = item.size / 1024;
          setOriginalSize(sz >= 1024 ? `${(sz / 1024).toFixed(2)} MB` : `${sz.toFixed(0)} KB`);
        } else {
          setOriginalSize('Unknown');
        }
        setResultUri(null);
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: "Error", message: "Failed to select PDF file.", type: 'error' });
    }
  };

  const handleCompress = async () => {
    if (!selectedFile) {
      showAlert({ title: "Required", message: "Please select a PDF file first.", type: 'error' });
      return;
    }

    setLoading(true);
    setResultUri(null);
    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: 'application/pdf',
      });
      formData.append('target_kb', String(targetKb));

      const arrayBuffer = await binaryRequest('POST', '/api/pdf/compress', formData);

      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const tempUri = `${FileSystem.cacheDirectory}compressed_${targetKb}kb_${Date.now()}.pdf`;

      await FileSystem.writeAsStringAsync(tempUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Query compressed file info to display size reduction
      const fileInfo = await FileSystem.getInfoAsync(tempUri);
      if (fileInfo.exists) {
        const sz = fileInfo.size / 1024;
        setCompressedSize(sz >= 1024 ? `${(sz / 1024).toFixed(2)} MB` : `${sz.toFixed(0)} KB`);
      }

      setResultUri(tempUri);
    } catch (error) {
      console.log("PDF compression failed");
      showAlert({ title: "Notice", message: "PDF compression is temporarily unavailable. Please try again later.", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (resultUri && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(resultUri, { mimeType: 'application/pdf', dialogTitle: 'Share Compressed PDF' });
    }
  };

  const handleDownload = async () => {
    if (!resultUri) return;
    const fileName = `compressed_${targetKb}kb_${Date.now()}.pdf`;
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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.headerTitle}>Compress PDF</Text>
        <Text style={styles.headerSubtitle}>Reduce your PDF file size to target limits exactly under 100KB, 200KB, or 500KB.</Text>

        {!resultUri ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select PDF Document</Text>
            
            {selectedFile ? (
              <View style={styles.fileItem}>
                <FileText color="#0F172A" width={22} height={22} />
                <View style={styles.fileMeta}>
                  <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                  <Text style={styles.fileSizeText}>Original Size: {originalSize}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedFile(null)} style={styles.deleteBtn}>
                  <Trash color="#EF4444" width={16} height={16} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.pickerBox} onPress={pickDocument} activeOpacity={0.7}>
                <FileArchive color="#94A3B8" width={32} height={32} />
                <Text style={styles.pickerText}>Choose PDF Document</Text>
                <Text style={styles.pickerSub}>Select document from device storage</Text>
              </TouchableOpacity>
            )}

            {/* Target Size Select Options */}
            <Text style={styles.sectionTitle}>Select Target Limit</Text>
            <View style={styles.kbOptions}>
              {([100, 200, 300, 400, 500] as const).map((kb) => (
                <TouchableOpacity
                  key={kb}
                  style={[styles.kbBtn, targetKb === kb && styles.kbBtnActive]}
                  onPress={() => setTargetKb(kb)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.kbBtnText, targetKb === kb && styles.kbBtnTextActive]}>
                    {kb} KB
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleCompress}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Compress PDF</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            <Text style={styles.successText}>PDF Compressed Successfully!</Text>
            
            <View style={styles.pdfIconContainer}>
              <FileText color="#0F172A" width={56} height={56} />
              <Text style={styles.resultName} numberOfLines={1}>compressed_{targetKb}kb.pdf</Text>
              
              {/* Size reduction HUD */}
              <View style={styles.sizeMetaRow}>
                <View style={styles.sizeNode}>
                  <Text style={styles.sizeNodeVal}>{originalSize}</Text>
                  <Text style={styles.sizeNodeLbl}>BEFORE</Text>
                </View>
                <View style={styles.sizeDivider} />
                <View style={styles.sizeNode}>
                  <Text style={[styles.sizeNodeVal, { color: '#10B981' }]}>{compressedSize}</Text>
                  <Text style={styles.sizeNodeLbl}>AFTER</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={() => wrapWithAd(handleDownload)} activeOpacity={0.8}>
                <Download color="#FFFFFF" width={16} height={16} />
                <Text style={styles.actionText}>Save to Device</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#475569' }]} onPress={handleShare} activeOpacity={0.8}>
                <Share2 color="#FFFFFF" width={16} height={16} />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.outlineButton]} 
                onPress={() => {
                  setSelectedFile(null);
                  setResultUri(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.outlineText}>Another</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean minimalist light background
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 80,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Outfit-Regular',
    lineHeight: 18,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 1,
    elevation: 0.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 6,
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 22,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginBottom: 20,
  },
  pickerText: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: 'Outfit-Bold',
    marginTop: 8,
  },
  pickerSub: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Outfit-Regular',
    marginTop: 2,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  fileMeta: {
    flex: 1,
    marginLeft: 10,
  },
  fileName: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: 'Outfit-Bold',
  },
  fileSizeText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Outfit-Regular',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
  kbOptions: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    marginBottom: 24,
  },
  kbBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  kbBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  kbBtnText: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    color: '#64748B',
  },
  kbBtnTextActive: {
    color: '#0F172A',
    fontFamily: 'Outfit-Bold',
  },
  primaryButton: {
    backgroundColor: '#4F46E5', // Apple-style black button
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: 14,
  },
  successText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#10B981',
    marginBottom: 20,
  },
  pdfIconContainer: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 22,
    borderRadius: 14,
    marginBottom: 32,
    width: '100%',
  },
  resultName: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: 'Outfit-Bold',
    marginTop: 10,
    textAlign: 'center',
    width: '100%',
  },
  sizeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 14,
    width: '100%',
  },
  sizeNode: {
    flex: 1,
    alignItems: 'center',
  },
  sizeNodeVal: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#475569',
  },
  sizeNodeLbl: {
    fontSize: 9,
    color: '#94A3B8',
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sizeDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    marginLeft: 6,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  outlineText: {
    color: '#0F172A',
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
  },
});
