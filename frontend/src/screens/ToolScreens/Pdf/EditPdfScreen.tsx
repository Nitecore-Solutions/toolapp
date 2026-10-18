import { useAlert } from '../../../context/AlertContext';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal, Dimensions, Image, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, PanResponder } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { BASE_URL, binaryRequest } from '../../../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Share2, FileText, Plus, Trash, X, Type, Square, PenTool, ChevronLeft, ChevronRight, Check, RotateCcw, Download } from 'lucide-react-native';
import { Buffer } from 'buffer';
import { downloadFileToDevice } from '../../../utils/fileDownloader';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PdfOp = 'merge' | 'split' | 'rotate' | 'edit';

interface SelectionItem {
  uri: string;
  name: string;
}

interface CanvasElement {
  id: string;
  type: 'text' | 'whiteout' | 'signature';
  page: number; // page index
  x: number; // normalized x (0 to 1)
  y: number; // normalized y (0 to 1)
  width: number; // normalized width (0 to 1)
  height: number; // normalized height (0 to 1)
  text?: string;
  font_size?: number;
  color?: string;
  image_data?: string; // base64 signature image
}

export default function EditPdfScreen() {
  const { showAlert } = useAlert();
  const navigation = useNavigation();
  const wrapWithAd = useAdOnDownload();
  const [activeOp, setActiveOp] = useState<PdfOp>('merge');
  const [loading, setLoading] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'pdf' | 'zip'>('pdf');

  // General state files
  const [mergeFiles, setMergeFiles] = useState<SelectionItem[]>([]);
  const [splitFile, setSplitFile] = useState<SelectionItem | null>(null);
  const [rotateFile, setRotateFile] = useState<SelectionItem | null>(null);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [pageRanges, setPageRanges] = useState('');

  // ------------------------------------
  // Visual Editor State
  // ------------------------------------
  const [editFile, setEditFile] = useState<SelectionItem | null>(null);
  const [pdfPages, setPdfPages] = useState<string[]>([]); // base64 page images
  const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number }[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [canvasLayout, setCanvasLayout] = useState({ width: 1, height: 1 });
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedFontSize, setSelectedFontSize] = useState(14);

  // Signature Pad state
  const [sigModalVisible, setSigModalVisible] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [paths, setPaths] = useState<string[]>([]);
  const sigViewRef = useRef<View>(null);

  const colors = ['#000000', '#EF4444', '#2563EB', '#10B981', '#F59E0B'];
  const fontSizes = [10, 12, 14, 16, 18, 20, 24];

  // Document selection
  const pickDocument = async (target: PdfOp) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const item = {
          uri: result.assets[0].uri,
          name: result.assets[0].name,
        };

        if (target === 'merge') {
          setMergeFiles([...mergeFiles, item]);
        } else if (target === 'split') {
          setSplitFile(item);
        } else if (target === 'rotate') {
          setRotateFile(item);
        } else if (target === 'edit') {
          setEditFile(item);
          loadPdfPages(item.uri, item.name);
        }
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: "Error", message: "Failed to select PDF file.", type: 'error' });
    }
  };

  // Convert PDF pages to base64 images on backend
  const loadPdfPages = async (uri: string, name: string) => {
    setLoading(true);
    setPdfPages([]);
    setElements([]);
    setSelectedElementId(null);
    setCurrentPage(0);
    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', {
        uri: uri,
        name: name,
        type: 'application/pdf',
      });

      const res = await fetch(`${BASE_URL}/api/pdf/render-pages`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Server returned ${res.status}: ${errorText}`);
      }

      const resData = await res.json();
      if (resData && resData.pages) {
        setPdfPages(resData.pages);
        setPdfDimensions(resData.dimensions || []);
      }
    } catch (err: any) {
      console.log("PDF loading failed:", err);
      showAlert({ title: "Notice", message: "Could not load PDF pages. Please verify the PDF is not password-protected and try again.", type: 'info' });
      setEditFile(null);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------
  // Elements Handlers
  // ------------------------------------
  const addTextElement = () => {
    const newId = `text_${Date.now()}`;
    const newElement: CanvasElement = {
      id: newId,
      type: 'text',
      page: currentPage,
      x: 0.1,
      y: 0.1,
      width: 0.4,
      height: 0.05,
      text: 'Double tap to edit text',
      font_size: selectedFontSize,
      color: selectedColor,
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newId);
  };

  const addWhiteoutElement = () => {
    const newId = `whiteout_${Date.now()}`;
    const newElement: CanvasElement = {
      id: newId,
      type: 'whiteout',
      page: currentPage,
      x: 0.2,
      y: 0.2,
      width: 0.3,
      height: 0.06,
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newId);
  };

  const openSignaturePad = () => {
    setPaths([]);
    setCurrentPath('');
    setSigModalVisible(true);
  };

  // Save drawing pad to base64
  const saveSignature = async () => {
    if (paths.length === 0) {
      showAlert({ title: "Required", message: "Please draw a signature first.", type: 'error' });
      return;
    }
    try {
      setSigModalVisible(false);
      // Capture signature drawing canvas as base64 png
      const base64 = await captureRef(sigViewRef, {
        format: 'png',
        quality: 1.0,
        result: 'base64',
      });

      const newId = `sig_${Date.now()}`;
      const newElement: CanvasElement = {
        id: newId,
        type: 'signature',
        page: currentPage,
        x: 0.3,
        y: 0.4,
        width: 0.35,
        height: 0.12,
        image_data: `data:image/png;base64,${base64}`,
      };
      setElements([...elements, newElement]);
      setSelectedElementId(newId);
    } catch (err) {
      console.error(err);
      showAlert({ title: "Error", message: "Failed to capture signature image.", type: 'error' });
    }
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const updateElementText = (id: string, text: string) => {
    setElements(elements.map(el => el.id === id ? { ...el, text } : el));
  };

  const updateElementProp = (id: string, prop: keyof CanvasElement, val: any) => {
    setElements(elements.map(el => el.id === id ? { ...el, [prop]: val } : el));
  };

  // Fine positioning move adjustment
  const moveElement = (direction: 'up' | 'down' | 'left' | 'right', amount: number = 0.01) => {
    if (!selectedElementId) return;
    setElements(elements.map(el => {
      if (el.id !== selectedElementId) return el;
      let newX = el.x;
      let newY = el.y;
      if (direction === 'up') newY = Math.max(0, el.y - amount);
      if (direction === 'down') newY = Math.min(1.0 - el.height, el.y + amount);
      if (direction === 'left') newX = Math.max(0, el.x - amount);
      if (direction === 'right') newX = Math.min(1.0 - el.width, el.x + amount);
      return { ...el, x: newX, y: newY };
    }));
  };

  const resizeElement = (action: 'grow' | 'shrink', amount: number = 0.01) => {
    if (!selectedElementId) return;
    setElements(elements.map(el => {
      if (el.id !== selectedElementId) return el;
      let newW = el.width;
      let newH = el.height;
      if (action === 'grow') {
        newW = Math.min(1.0 - el.x, el.width + amount);
        newH = Math.min(1.0 - el.y, el.height + amount);
      } else {
        newW = Math.max(0.02, el.width - amount);
        newH = Math.max(0.01, el.height - amount);
      }
      return { ...el, width: newW, height: newH };
    }));
  };

  // ------------------------------------
  // Backend Edit Execution
  // ------------------------------------
  const handleProcess = async () => {
    setLoading(true);
    setResultUri(null);
    try {
      const formData = new FormData();
      let endpoint = '';
      let resType: 'pdf' | 'zip' = 'pdf';

      if (activeOp === 'merge') {
        if (mergeFiles.length < 2) {
          showAlert({ title: "Required", message: "Please select at least 2 PDF files to merge.", type: 'error' });
          setLoading(false);
          return;
        }
        endpoint = '/api/pdf/merge';
        mergeFiles.forEach((file) => {
          // @ts-ignore
          formData.append('files', {
            uri: file.uri,
            name: file.name,
            type: 'application/pdf',
          });
        });
      } else if (activeOp === 'split') {
        if (!splitFile) {
          showAlert({ title: "Required", message: "Please select a PDF file.", type: 'error' });
          setLoading(false);
          return;
        }
        if (!pageRanges.trim()) {
          showAlert({ title: "Required", message: "Please enter target page ranges.", type: 'error' });
          setLoading(false);
          return;
        }
        endpoint = '/api/pdf/split';
        resType = 'zip';
        // @ts-ignore
        formData.append('file', {
          uri: splitFile.uri,
          name: splitFile.name,
          type: 'application/pdf',
        });
        formData.append('page_ranges', pageRanges);
      } else if (activeOp === 'rotate') {
        if (!rotateFile) {
          showAlert({ title: "Required", message: "Please select a PDF file.", type: 'error' });
          setLoading(false);
          return;
        }
        endpoint = '/api/pdf/rotate';
        // @ts-ignore
        formData.append('file', {
          uri: rotateFile.uri,
          name: rotateFile.name,
          type: 'application/pdf',
        });
        formData.append('angle', String(angle));
      } else if (activeOp === 'edit') {
        if (!editFile) {
          showAlert({ title: "Required", message: "Please select a PDF file.", type: 'error' });
          setLoading(false);
          return;
        }
        endpoint = '/api/pdf/apply-edits';
        // @ts-ignore
        formData.append('file', {
          uri: editFile.uri,
          name: editFile.name,
          type: 'application/pdf',
        });
        formData.append('edits_json', JSON.stringify(elements));
      }
      const arrayBuffer = await binaryRequest('POST', endpoint, formData);

      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const ext = resType === 'pdf' ? 'pdf' : 'zip';
      const tempUri = `${FileSystem.cacheDirectory}toolhelp_pdf_${Date.now()}.${ext}`;

      await FileSystem.writeAsStringAsync(tempUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setResultUri(tempUri);
      setResultType(resType);
    } catch (error) {
      console.log("PDF edit processing failed");
      showAlert({ title: "Notice", message: "Could not process PDF edits. Please try again later.", type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (resultUri && (await Sharing.isAvailableAsync())) {
      const mime = resultType === 'pdf' ? 'application/pdf' : 'application/zip';
      await Sharing.shareAsync(resultUri, { mimeType: mime });
    }
  };

  const handleDownload = async () => {
    if (!resultUri) return;
    const mime = resultType === 'pdf' ? 'application/pdf' : 'application/zip';
    const filename = resultType === 'pdf' ? `edited_${Date.now()}.pdf` : `split_parts_${Date.now()}.zip`;

    await downloadFileToDevice(
      resultUri,
      filename,
      mime,
      (msg) => {
        if (Platform.OS === 'android') {
          ToastAndroid.show('File downloaded successfully!', ToastAndroid.SHORT);
        }
        showAlert({ title: "Download Complete! 🎉", message: msg, type: 'success' });
      },
      (errMsg) => showAlert({ title: "Notice", message: errMsg, type: 'info' })
    );
  };

  // Signature path drawing handlers
  const handleTouchStart = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    setCurrentPath(`M ${locationX} ${locationY}`);
  };

  const handleTouchMove = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    setCurrentPath((prev) => `${prev} L ${locationX} ${locationY}`);
  };

  const handleTouchEnd = () => {
    if (currentPath) {
      setPaths([...paths, currentPath]);
      setCurrentPath('');
    }
  };

  // Render Draggable Element overlay
  const renderDraggableElement = (el: CanvasElement) => {
    if (el.page !== currentPage) return null;
    const isSelected = selectedElementId === el.id;

    // Absolute position coordinates in screen dimensions
    const left = el.x * canvasLayout.width;
    const top = el.y * canvasLayout.height;
    const width = el.width * canvasLayout.width;
    const height = el.height * canvasLayout.height;

    // Custom touch tracking drag for elements
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Calculate new coordinates relative to canvas
        const currentX = left + gestureState.dx;
        const currentY = top + gestureState.dy;
        const newX = Math.max(0, Math.min(canvasLayout.width - width, currentX)) / canvasLayout.width;
        const newY = Math.max(0, Math.min(canvasLayout.height - height, currentY)) / canvasLayout.height;
        updateElementProp(el.id, 'x', newX);
        updateElementProp(el.id, 'y', newY);
      },
      onPanResponderRelease: () => {},
    });

    return (
      <View
        key={el.id}
        {...panResponder.panHandlers}
        style={[
          styles.dragElement,
          {
            left,
            top,
            width,
            height,
            borderColor: isSelected ? '#3B82F6' : 'transparent',
            borderWidth: el.type === 'whiteout' ? 1 : 1.5,
          },
          el.type === 'whiteout' && {
            backgroundColor: '#FFFFFF',
            borderColor: isSelected ? '#3B82F6' : '#94A3B8',
            borderStyle: isSelected ? 'solid' : 'dashed',
          },
        ]}
        onTouchStart={(e) => {
          e.stopPropagation();
          setSelectedElementId(el.id);
        }}
      >
        {el.type === 'text' && (
          <TextInput
            style={[
              styles.elementTextInput,
              {
                color: el.color || '#000000',
                fontSize: el.font_size || 14,
              },
            ]}
            value={el.text}
            onChangeText={(t) => updateElementText(el.id, t)}
            multiline
            onTouchStart={(e: any) => e.stopPropagation()} // Stop bubbling so keyboard doesn't dismiss
          />
        )}

        {el.type === 'signature' && el.image_data && (
          <Image source={{ uri: el.image_data }} style={styles.signatureImage} resizeMode="contain" />
        )}
      </View>
    );
  };

  const renderOpForm = () => {
    switch (activeOp) {
      case 'merge':
        return (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Add PDFs to Merge</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => pickDocument('merge')}>
                <Plus color="#FFF" width={16} height={16} />
                <Text style={styles.addBtnText}>Add PDF</Text>
              </TouchableOpacity>
            </View>

            {mergeFiles.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No files added yet</Text>
                <Text style={styles.emptySubText}>Add 2 or more PDF documents to merge</Text>
              </View>
            ) : (
              <View style={styles.fileList}>
                {mergeFiles.map((file, idx) => (
                  <View key={idx} style={styles.fileItem}>
                    <FileText color="#3B82F6" width={20} height={20} />
                    <Text style={styles.fileItemName} numberOfLines={1}>{file.name}</Text>
                    <TouchableOpacity onPress={() => setMergeFiles(mergeFiles.filter((_, i) => i !== idx))}>
                      <Trash color="#EF4444" width={16} height={16} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      case 'split':
        return (
          <View>
            <Text style={styles.sectionTitle}>Select PDF to Split</Text>
            {splitFile ? (
              <View style={styles.fileItem}>
                <FileText color="#3B82F6" width={20} height={20} />
                <Text style={styles.fileItemName} numberOfLines={1}>{splitFile.name}</Text>
                <TouchableOpacity onPress={() => setSplitFile(null)}>
                  <Trash color="#EF4444" width={16} height={16} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.pickerBox} onPress={() => pickDocument('split')}>
                <FileText color="#64748B" width={28} height={28} />
                <Text style={styles.pickerText}>Select PDF File</Text>
              </TouchableOpacity>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Page Ranges (e.g. "1-3, 5")</Text>
              <TextInput
                style={styles.input}
                value={pageRanges}
                onChangeText={setPageRanges}
                placeholder="e.g. 1-3, 5"
                autoCapitalize="none"
              />
            </View>
          </View>
        );
      case 'rotate':
        return (
          <View>
            <Text style={styles.sectionTitle}>Select PDF to Rotate</Text>
            {rotateFile ? (
              <View style={styles.fileItem}>
                <FileText color="#3B82F6" width={20} height={20} />
                <Text style={styles.fileItemName} numberOfLines={1}>{rotateFile.name}</Text>
                <TouchableOpacity onPress={() => setRotateFile(null)}>
                  <Trash color="#EF4444" width={16} height={16} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.pickerBox} onPress={() => pickDocument('rotate')}>
                <FileText color="#64748B" width={28} height={28} />
                <Text style={styles.pickerText}>Select PDF File</Text>
              </TouchableOpacity>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rotation Angle</Text>
              <View style={styles.angleRow}>
                {([90, 180, 270] as const).map(a => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.angleBtn, angle === a && styles.angleBtnActive]}
                    onPress={() => setAngle(a)}
                  >
                    <Text style={[styles.angleText, angle === a && styles.angleTextActive]}>{a}°</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      case 'edit':
        return (
          <View>
            <Text style={styles.sectionTitle}>Select PDF to Fill & Sign</Text>
            {editFile ? (
              <View style={styles.fileItem}>
                <FileText color="#3B82F6" width={20} height={20} />
                <Text style={styles.fileItemName} numberOfLines={1}>{editFile.name}</Text>
                <TouchableOpacity onPress={() => { setEditFile(null); setPdfPages([]); }}>
                  <Trash color="#EF4444" width={16} height={16} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.pickerBox} onPress={() => pickDocument('edit')}>
                <FileText color="#64748B" width={28} height={28} />
                <Text style={styles.pickerText}>Select PDF File</Text>
              </TouchableOpacity>
            )}

            {/* Interactive PDF Page Editor Area */}
            {pdfPages.length > 0 && (
              <View style={styles.editorMainArea}>
                
                {/* Editor Tool Toolbar */}
                <View style={styles.editorToolbar}>
                  <TouchableOpacity style={styles.toolBtn} onPress={addTextElement}>
                    <Type color="#1E293B" width={18} height={18} />
                    <Text style={styles.toolBtnText}>Text</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolBtn} onPress={addWhiteoutElement}>
                    <Square color="#1E293B" width={18} height={18} />
                    <Text style={styles.toolBtnText}>Erase</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolBtn} onPress={openSignaturePad}>
                    <PenTool color="#1E293B" width={18} height={18} />
                    <Text style={styles.toolBtnText}>Sign</Text>
                  </TouchableOpacity>
                </View>

                {/* Page Selection Bar */}
                <View style={styles.pageBar}>
                  <TouchableOpacity
                    disabled={currentPage === 0}
                    style={styles.pageBarBtn}
                    onPress={() => { setCurrentPage(currentPage - 1); setSelectedElementId(null); }}
                  >
                    <ChevronLeft color={currentPage === 0 ? '#CBD5E1' : '#334155'} />
                  </TouchableOpacity>
                  <Text style={styles.pageBarText}>Page {currentPage + 1} of {pdfPages.length}</Text>
                  <TouchableOpacity
                    disabled={currentPage === pdfPages.length - 1}
                    style={styles.pageBarBtn}
                    onPress={() => { setCurrentPage(currentPage + 1); setSelectedElementId(null); }}
                  >
                    <ChevronRight color={currentPage === pdfPages.length - 1 ? '#CBD5E1' : '#334155'} />
                  </TouchableOpacity>
                </View>

                {/* Editor Workspace Canvas */}
                <View 
                  style={styles.canvasContainer}
                  onLayout={(e) => {
                    const { width, height } = e.nativeEvent.layout;
                    setCanvasLayout({ width, height });
                  }}
                  onTouchStart={() => setSelectedElementId(null)} // Click canvas to deselect active items
                >
                  {pdfPages[currentPage] && (
                    <Image
                      source={{ uri: pdfPages[currentPage] }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode="contain"
                    />
                  )}

                  {/* Absolute Elements Layer */}
                  {elements.map(renderDraggableElement)}
                </View>

                {/* Precision Alignment Panel (Appears if item selected) */}
                {selectedElementId && (
                  <View style={styles.precisionControls}>
                    <Text style={styles.precisionHeader}>Precise Positioning & Formatting</Text>
                    
                    {/* Direct Format Options (Only for text type) */}
                    {elements.find(el => el.id === selectedElementId)?.type === 'text' && (
                      <View style={styles.textFormatsRow}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {/* Color select */}
                          <View style={styles.formatGroup}>
                            <Text style={styles.formatLabel}>Color:</Text>
                            {colors.map(col => (
                              <TouchableOpacity
                                key={col}
                                style={[styles.colorBubble, { backgroundColor: col }, selectedColor === col && styles.colorBubbleActive]}
                                onPress={() => {
                                  setSelectedColor(col);
                                  updateElementProp(selectedElementId, 'color', col);
                                }}
                              />
                            ))}
                          </View>

                          {/* Font size select */}
                          <View style={[styles.formatGroup, { marginLeft: 16 }]}>
                            <Text style={styles.formatLabel}>Size:</Text>
                            {fontSizes.map(sz => (
                              <TouchableOpacity
                                key={sz}
                                style={[styles.szBubble, selectedFontSize === sz && styles.szBubbleActive]}
                                onPress={() => {
                                  setSelectedFontSize(sz);
                                  updateElementProp(selectedElementId, 'font_size', sz);
                                }}
                              >
                                <Text style={styles.szText}>{sz}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    )}

                    {/* D-Pad Arrows Move Controls */}
                    <View style={styles.controlsGrid}>
                      <View style={styles.arrowColumn}>
                        <TouchableOpacity style={styles.arrowBtn} onPress={() => moveElement('up')}>
                          <Text style={styles.arrowLabel}>🔼</Text>
                        </TouchableOpacity>
                        <View style={styles.arrowRow}>
                          <TouchableOpacity style={styles.arrowBtn} onPress={() => moveElement('left')}>
                            <Text style={styles.arrowLabel}>◀️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.arrowBtn, styles.deleteAction]} onPress={() => deleteElement(selectedElementId)}>
                            <Trash color="#FFF" width={16} height={16} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.arrowBtn} onPress={() => moveElement('right')}>
                            <Text style={styles.arrowLabel}>▶️</Text>
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.arrowBtn} onPress={() => moveElement('down')}>
                          <Text style={styles.arrowLabel}>🔽</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Resize controls */}
                      <View style={styles.resizeColumn}>
                        <Text style={styles.controlLabel}>Box Resize</Text>
                        <View style={styles.resizeRow}>
                          <TouchableOpacity style={styles.resizeBtn} onPress={() => resizeElement('shrink')}>
                            <Text style={styles.resizeLabel}>-</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.resizeBtn} onPress={() => resizeElement('grow')}>
                            <Text style={styles.resizeLabel}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

              </View>
            )}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 100} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.headerTitle}>Edit PDF</Text>

          {/* Clean minimal operations selector */}
          <View style={styles.tabRow}>
            {(['merge', 'split', 'rotate', 'edit'] as const).map(op => (
              <TouchableOpacity 
                key={op}
                style={[styles.tab, activeOp === op && styles.tabActive]} 
                onPress={() => {
                  if (op === 'edit') {
                    (navigation as any).navigate('PdfEditorScreen');
                  } else {
                    setActiveOp(op);
                    setResultUri(null);
                  }
                }}
              >
                <Text style={[styles.tabText, activeOp === op && styles.tabTextActive]}>
                  {op.charAt(0).toUpperCase() + op.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {!resultUri ? (
            <View style={styles.card}>
              {renderOpForm()}
              
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleProcess}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Apply Changes</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.resultContainer}>
              <Text style={styles.successText}>Changes applied successfully!</Text>
              
              <View style={styles.pdfIconContainer}>
                <FileText color={resultType === 'pdf' ? '#3B82F6' : '#10B981'} width={56} height={56} />
                <Text style={styles.pdfName} numberOfLines={1}>{resultType === 'pdf' ? 'edited_output.pdf' : 'split_parts.zip'}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton} onPress={() => wrapWithAd(handleDownload)}>
                  <Download color="#3B82F6" width={18} height={18} />
                  <Text style={styles.actionText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                  <Share2 color="#3B82F6" width={18} height={18} />
                  <Text style={styles.actionText}>Share File</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.actionButton, styles.outlineButton, { marginTop: 12, width: '100%' }]} onPress={() => {
                setResultUri(null);
                setMergeFiles([]);
                setSplitFile(null);
                setRotateFile(null);
                setEditFile(null);
                setPdfPages([]);
                setElements([]);
              }}>
                <Text style={styles.outlineText}>Edit Another</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Signature drawing modal pad */}
      <Modal visible={sigModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Draw Signature</Text>
              <TouchableOpacity onPress={() => setSigModalVisible(false)}>
                <X color="#334155" />
              </TouchableOpacity>
            </View>

            {/* Drawing Canvas Board */}
            <View 
              ref={sigViewRef}
              collapsable={false} // Required for snapshot view-shot compatibility
              style={styles.drawCanvas}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <Svg style={StyleSheet.absoluteFill}>
                {paths.map((p, idx) => (
                  <Path key={idx} d={p} fill="none" stroke="#000000" strokeWidth={3} strokeLinecap="round" />
                ))}
                {currentPath ? (
                  <Path d={currentPath} fill="none" stroke="#000000" strokeWidth={3} strokeLinecap="round" />
                ) : null}
              </Svg>

              {paths.length === 0 && (
                <Text style={styles.drawPlaceholder}>Draw with your finger inside this board</Text>
              )}
            </View>

            {/* Drawing Actions row */}
            <View style={styles.drawActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalOutlineBtn]} 
                onPress={() => { setPaths([]); setCurrentPath(''); }}
              >
                <RotateCcw color="#475569" width={16} height={16} />
                <Text style={styles.modalOutlineText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalBtn} onPress={saveSignature}>
                <Check color="#FFF" width={16} height={16} />
                <Text style={styles.modalBtnText}>Insert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, paddingBottom: 120 },
  headerTitle: { fontSize: 20, fontFamily: 'Outfit-Bold', color: '#0F172A', marginBottom: 16 },
  tabRow: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 10, padding: 3, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 7 },
  tabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 1.5, elevation: 1.5 },
  tabText: { fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#64748B' },
  tabTextActive: { color: '#0F172A' },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontFamily: 'Outfit-Bold', color: '#334155', marginBottom: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
  addBtnText: { color: '#FFF', fontSize: 12, fontFamily: 'Outfit-SemiBold', marginLeft: 4 },
  emptyBox: { borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 10, padding: 24, alignItems: 'center', backgroundColor: '#F8FAFC', marginVertical: 8 },
  emptyText: { fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#64748B', marginBottom: 3 },
  emptySubText: { fontSize: 10, color: '#94A3B8', fontFamily: 'Outfit-Regular' },
  fileList: { marginVertical: 8 },
  fileItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 10, borderRadius: 8, marginBottom: 6 },
  fileItemName: { flex: 1, marginLeft: 8, fontSize: 13, color: '#334155', fontFamily: 'Outfit-Medium' },
  pickerBox: { borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 10, padding: 20, alignItems: 'center', backgroundColor: '#F8FAFC', marginBottom: 12 },
  pickerText: { fontSize: 13, color: '#64748B', fontFamily: 'Outfit-Medium', marginTop: 6 },
  inputGroup: { marginTop: 12, marginBottom: 6 },
  label: { fontSize: 12, color: '#64748B', marginBottom: 5, fontFamily: 'Outfit-Medium' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 7, padding: 10, fontSize: 14, color: '#1E293B', fontFamily: 'Outfit-Regular' },
  angleRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 7, overflow: 'hidden' },
  angleBtn: { flex: 1, padding: 10, alignItems: 'center' },
  angleBtnActive: { backgroundColor: '#EFF6FF' },
  angleText: { fontSize: 13, color: '#64748B', fontFamily: 'Outfit-Medium' },
  angleTextActive: { color: '#3B82F6', fontFamily: 'Outfit-Bold' },
  primaryButton: { backgroundColor: '#4F46E5', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  resultContainer: { alignItems: 'center', marginTop: 24 },
  successText: { fontSize: 16, fontFamily: 'Outfit-Bold', color: '#10B981', marginBottom: 16 },
  pdfIconContainer: { alignItems: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', padding: 20, borderRadius: 16, marginBottom: 30, width: 150 },
  pdfName: { fontSize: 11, color: '#3B82F6', fontFamily: 'Outfit-SemiBold', marginTop: 10, textAlign: 'center', width: '100%' },
  actionRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  actionButton: { flex: 1, flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  actionText: { color: '#3B82F6', fontSize: 13, fontFamily: 'Outfit-Bold', marginLeft: 6 },
  outlineButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#CBD5E1' },
  outlineText: { color: '#475569', fontSize: 13, fontFamily: 'Outfit-Bold' },

  // Visual Editor Layout
  editorMainArea: { marginTop: 12 },
  editorToolbar: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 4, justifyContent: 'space-around', marginBottom: 12 },
  toolBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  toolBtnText: { fontSize: 12, fontFamily: 'Outfit-SemiBold', color: '#1E293B', marginLeft: 6 },
  pageBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 12 },
  pageBarBtn: { padding: 4 },
  pageBarText: { fontSize: 12, fontFamily: 'Outfit-Bold', color: '#334155' },
  canvasContainer: { width: '100%', height: SCREEN_WIDTH * 1.35, backgroundColor: '#E2E8F0', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, overflow: 'hidden', position: 'relative' },
  
  // Canvas Elements
  dragElement: { position: 'absolute', zIndex: 50, padding: 2, minWidth: 40, minHeight: 18 },
  elementTextInput: { padding: 0, margin: 0, width: '100%', height: '100%', fontFamily: 'Outfit-Regular', textAlignVertical: 'top' },
  signatureImage: { width: '100%', height: '100%' },
  elementDeleteBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: '#4F46E5', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', zIndex: 100 },

  // Precision Move / Format D-pad controls
  precisionControls: { marginTop: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12 },
  precisionHeader: { fontSize: 12, fontFamily: 'Outfit-Bold', color: '#475569', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 6 },
  textFormatsRow: { marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  formatGroup: { flexDirection: 'row', alignItems: 'center' },
  formatLabel: { fontSize: 11, fontFamily: 'Outfit-SemiBold', color: '#64748B', marginRight: 8 },
  colorBubble: { width: 18, height: 18, borderRadius: 9, marginRight: 6, borderWidth: 1.5, borderColor: '#E2E8F0' },
  colorBubbleActive: { borderColor: '#3B82F6', scaleX: 1.15, scaleY: 1.15 },
  szBubble: { paddingHorizontal: 6, paddingVertical: 3, backgroundColor: '#E2E8F0', borderRadius: 4, marginRight: 6 },
  szBubbleActive: { backgroundColor: '#4F46E5' },
  szText: { fontSize: 10, fontFamily: 'Outfit-Bold', color: '#1E293B' },
  controlsGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arrowColumn: { alignItems: 'center', flex: 1.2 },
  arrowRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  arrowBtn: { backgroundColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginHorizontal: 4, minWidth: 44, alignItems: 'center' },
  arrowLabel: { fontSize: 14 },
  deleteAction: { backgroundColor: '#4F46E5' },
  resizeColumn: { flex: 0.8, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#E2E8F0', paddingLeft: 12 },
  controlLabel: { fontSize: 11, fontFamily: 'Outfit-SemiBold', color: '#64748B', marginBottom: 6 },
  resizeRow: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 6, overflow: 'hidden' },
  resizeBtn: { paddingHorizontal: 14, paddingVertical: 8, minWidth: 40, alignItems: 'center' },
  resizeLabel: { fontSize: 16, fontFamily: 'Outfit-Bold', color: '#1E293B' },

  // Modal Drawings
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#1E293B' },
  drawCanvas: { width: '100%', height: 200, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  drawPlaceholder: { position: 'absolute', fontSize: 12, color: '#94A3B8', fontFamily: 'Outfit-Regular' },
  drawActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  modalBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#4F46E5', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  modalBtnText: { color: '#FFF', fontSize: 13, fontFamily: 'Outfit-Bold', marginLeft: 6 },
  modalOutlineBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#CBD5E1' },
  modalOutlineText: { color: '#475569', fontSize: 13, fontFamily: 'Outfit-Bold', marginLeft: 6 },
});
