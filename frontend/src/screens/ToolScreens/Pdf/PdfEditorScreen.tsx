import { useAlert } from '../../../context/AlertContext';
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Modal, Dimensions,
  Image, KeyboardAvoidingView, Platform, PanResponder, TouchableWithoutFeedback, ToastAndroid,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { BASE_URL, binaryRequest } from '../../../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { downloadFileToDevice } from '../../../utils/fileDownloader';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';
import {
  Share2, FileText, Type, Square, PenTool, Image as ImageIcon,
  Highlighter, Trash2, Undo2, Redo2, X, Check, Circle, Minus,
  ChevronLeft, ChevronRight, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Download, ZoomIn, ZoomOut,
} from 'lucide-react-native';
import { Buffer } from 'buffer';
import Svg, { Path, Line as SvgLine } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------- Types ----------
type EditorTool = 'text' | 'image' | 'sign' | 'shape' | 'highlight' | 'whiteout' | 'draw' | null;
type ShapeSubType = 'rectangle' | 'ellipse' | 'line';

interface CanvasElement {
  id: string;
  type: 'text' | 'whiteout' | 'signature' | 'image' | 'shape' | 'highlight' | 'freehand';
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  is_existing?: boolean;
  original_text?: string;
  orig_x?: number;
  orig_y?: number;
  orig_width?: number;
  orig_height?: number;
  // Text
  text?: string;
  font_size?: number;
  font_family?: string;
  color?: string;
  is_bold?: boolean;
  is_italic?: boolean;
  is_underline?: boolean;
  text_align?: string;
  // Image/Signature
  image_data?: string;
  // Shape
  shape_type?: ShapeSubType;
  border_color?: string;
  fill_color?: string;
  border_width?: number;
  // Highlight
  highlight_color?: string;
  // Freehand
  path_data?: string;
  stroke_color?: string;
  stroke_width?: number;
}

interface SelectionItem {
  uri: string;
  name: string;
}

// ---------- Constants ----------
const COLORS = ['#000000', '#EF4444', '#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#FFFFFF'];
const HIGHLIGHT_COLORS = ['#FFEB3B', '#4CAF50', '#03A9F4', '#FF9800', '#E91E63', '#9C27B0'];
const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32];
const FONT_FAMILIES = ['Helvetica', 'Courier', 'Times'];

export default function PdfEditorScreen() {
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const wrapWithAd = useAdOnDownload();
  // PDF state
  const [pdfFile, setPdfFile] = useState<SelectionItem | null>(null);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [pdfThumbnails, setPdfThumbnails] = useState<string[]>([]);
  const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number }[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);

  // Editor state
  const [activeTool, setActiveTool] = useState<EditorTool>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [canvasLayout, setCanvasLayout] = useState({ width: 1, height: 1 });
  const [zoomScale, setZoomScale] = useState(1.0);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<CanvasElement[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasElement[][]>([]);

  // Tool-specific state
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedFontSize, setSelectedFontSize] = useState(16);
  const [selectedFontFamily, setSelectedFontFamily] = useState('Helvetica');
  const [selectedShapeType, setSelectedShapeType] = useState<ShapeSubType>('rectangle');
  const [selectedHighlightColor, setSelectedHighlightColor] = useState('#FFEB3B');
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState(3);
  const [selectedEraserType, setSelectedEraserType] = useState<'brush' | 'block'>('brush');

  // Signature pad
  const [sigModalVisible, setSigModalVisible] = useState(false);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1.0);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });

  // Freehand drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPath, setDrawPath] = useState('');
  const [drawPaths, setDrawPaths] = useState<{ path: string; color: string; width: number }[]>([]);

  // ---------- Undo/Redo Helpers ----------
  const pushUndo = useCallback((currentElements: CanvasElement[]) => {
    setUndoStack(prev => [...prev.slice(-30), currentElements]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, elements]);
    setElements(prev);
    setUndoStack(u => u.slice(0, -1));
    setSelectedElementId(null);
  }, [undoStack, elements]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, elements]);
    setElements(next);
    setRedoStack(r => r.slice(0, -1));
    setSelectedElementId(null);
  }, [redoStack, elements]);

  const parsePathPoints = (pathStr: string): { x: number; y: number }[] => {
    const tokens = pathStr.trim().split(/\s+/);
    const points: { x: number; y: number }[] = [];
    let i = 0;
    while (i < tokens.length) {
      const cmd = tokens[i];
      if ((cmd === 'M' || cmd === 'L') && i + 2 < tokens.length) {
        const x = parseFloat(tokens[i + 1]);
        const y = parseFloat(tokens[i + 2]);
        points.push({ x, y });
        i += 3;
      } else {
        i++;
      }
    }
    return points;
  };

  const distToSegment = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const doesTouchIntersectPath = (tx: number, ty: number, pathStr: string): boolean => {
    const points = parsePathPoints(pathStr);
    if (points.length === 0) return false;
    for (let i = 0; i < points.length; i++) {
      const dx = tx - points[i].x;
      const dy = ty - points[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.04) return true;
    }
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dist = distToSegment(tx, ty, p1.x, p1.y, p2.x, p2.y);
      if (dist < 0.04) return true;
    }
    return false;
  };

  const canvasDrawPanRef = useRef('');

  const canvasDrawPan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onStart((e) => {
      if (activeTool === 'whiteout' && selectedEraserType === 'brush') {
        const tx = e.x / canvasLayout.width;
        const ty = e.y / canvasLayout.height;
        pushUndo(elements);
        setElements(prev => prev.filter(el => {
          if (el.type === 'freehand' && el.page === currentPage && el.path_data) {
            const hit = doesTouchIntersectPath(tx, ty, el.path_data);
            return !hit;
          }
          return true;
        }));
        setIsDrawing(true);
        return;
      }

      if (activeTool !== 'draw') return;
      const nx = e.x / canvasLayout.width;
      const ny = e.y / canvasLayout.height;
      canvasDrawPanRef.current = `M ${nx} ${ny}`;
      setDrawPath(`M ${nx} ${ny}`);
      setIsDrawing(true);
    })
    .onChange((e) => {
      if (activeTool === 'whiteout' && selectedEraserType === 'brush') {
        const tx = e.x / canvasLayout.width;
        const ty = e.y / canvasLayout.height;
        setElements(prev => prev.filter(el => {
          if (el.type === 'freehand' && el.page === currentPage && el.path_data) {
            const hit = doesTouchIntersectPath(tx, ty, el.path_data);
            return !hit;
          }
          return true;
        }));
        return;
      }

      if (activeTool !== 'draw' || !canvasDrawPanRef.current) return;
      const nx = e.x / canvasLayout.width;
      const ny = e.y / canvasLayout.height;
      const next = `${canvasDrawPanRef.current} L ${nx} ${ny}`;
      canvasDrawPanRef.current = next;
      setDrawPath(next);
    })
    .onFinalize(() => {
      if (activeTool === 'whiteout' && selectedEraserType === 'brush') {
        setIsDrawing(false);
        return;
      }

      if (activeTool !== 'draw' || !canvasDrawPanRef.current) return;
      const finishedPath = canvasDrawPanRef.current;
      if (finishedPath) {
        setDrawPaths(prev => [...prev, {
          path: finishedPath,
          color: selectedColor,
          width: selectedStrokeWidth,
        }]);
        
        pushUndo(elements);
        const newEl: CanvasElement = {
          id: `draw_${Date.now()}`,
          type: 'freehand',
          page: currentPage,
          x: 0, y: 0, width: 1, height: 1,
          path_data: finishedPath,
          stroke_color: selectedColor,
          stroke_width: selectedStrokeWidth,
        };
        setElements(prev => [...prev, newEl]);
      }
      canvasDrawPanRef.current = '';
      setDrawPath('');
      setIsDrawing(false);
    });

  const activeGesture = (activeTool === 'draw' || (activeTool === 'whiteout' && selectedEraserType === 'brush')) ? canvasDrawPan : Gesture.Tap();

  // ---------- PDF Loading ----------
  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        const item = { uri: result.assets[0].uri, name: result.assets[0].name };
        setPdfFile(item);
        setElements([]);
        setUndoStack([]);
        setRedoStack([]);
        setSelectedElementId(null);
        setCurrentPage(0);
        setResultUri(null);
        setDrawPaths([]);
        await loadPdfPages(item.uri, item.name);
      }
    } catch {
      showAlert({ title: "Error", message: 'Failed to select PDF file.', type: 'error' });
    }
  };

  const loadPdfPages = async (uri: string, name: string) => {
    setLoading(true);
    setPdfPages([]);
    setPdfThumbnails([]);
    try {
      const formDataPages = new FormData();
      // @ts-ignore
      formDataPages.append('file', { uri, name, type: 'application/pdf' });

      const formDataThumbs = new FormData();
      // @ts-ignore
      formDataThumbs.append('file', { uri, name, type: 'application/pdf' });

      const [pagesRes, thumbsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/pdf/render-pages`, {
          method: 'POST',
          body: formDataPages,
        }).then(async r => {
          if (!r.ok) {
            const err = await r.text().catch(() => '');
            throw new Error(`Pages API error ${r.status}: ${err}`);
          }
          return r.json();
        }),
        fetch(`${BASE_URL}/api/pdf/page-thumbnails`, {
          method: 'POST',
          body: formDataThumbs,
        }).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (pagesRes?.pages) {
        setPdfPages(pagesRes.pages);
        setPdfDimensions(pagesRes.dimensions || []);
        if (pagesRes.existing_elements) {
          setElements(pagesRes.existing_elements);
        }
      }
      if (thumbsRes?.thumbnails) {
        setPdfThumbnails(thumbsRes.thumbnails);
      }
    } catch (err: any) {
      console.log("PDF pages loading failed:", err);
      showAlert({ title: "Notice", message: "Could not load PDF pages. Please verify the PDF is not password-protected and try again.", type: 'info' });
      setPdfFile(null);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Element Manipulation ----------
  const addElement = (newEl: CanvasElement) => {
    pushUndo(elements);
    setElements(prev => [...prev, newEl]);
    setSelectedElementId(newEl.id);
    setActiveTool(null);
  };

  const addTextElement = () => {
    addElement({
      id: `text_${Date.now()}`,
      type: 'text',
      page: currentPage,
      x: 0.1, y: 0.15,
      width: 0.5, height: 0.06,
      text: 'Type here...',
      font_size: selectedFontSize,
      font_family: selectedFontFamily,
      color: selectedColor,
      is_bold: false,
      is_italic: false,
      is_underline: false,
      text_align: 'left',
      is_existing: false,
    });
  };

  const addImageElement = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0].base64) {
        addElement({
          id: `img_${Date.now()}`,
          type: 'image',
          page: currentPage,
          x: 0.15, y: 0.2,
          width: 0.35, height: 0.2,
          image_data: `data:image/jpeg;base64,${result.assets[0].base64}`,
          is_existing: false,
        });
      }
    } catch {
      showAlert({ title: "Error", message: 'Failed to pick image.', type: 'error' });
    }
  };

  const openSignaturePad = () => {
    setSigModalVisible(true);
  };

  const saveSignature = (base64: string) => {
    setSigModalVisible(false);
    setActiveTool(null);
    addElement({
      id: `sig_${Date.now()}`,
      type: 'signature',
      page: currentPage,
      x: 0.25, y: 0.4,
      width: 0.4, height: 0.12,
      image_data: `data:image/png;base64,${base64}`,
      is_existing: false,
    });
  };

  const addShapeElement = () => {
    addElement({
      id: `shape_${Date.now()}`,
      type: 'shape',
      page: currentPage,
      x: 0.2, y: 0.25,
      width: 0.3, height: 0.15,
      shape_type: selectedShapeType,
      border_color: selectedColor,
      fill_color: 'transparent',
      border_width: 2,
      is_existing: false,
    });
  };

  const addHighlightElement = () => {
    addElement({
      id: `hl_${Date.now()}`,
      type: 'highlight',
      page: currentPage,
      x: 0.1, y: 0.3,
      width: 0.5, height: 0.03,
      highlight_color: selectedHighlightColor,
      is_existing: false,
    });
  };

  const addWhiteoutElement = () => {
    addElement({
      id: `wo_${Date.now()}`,
      type: 'whiteout',
      page: currentPage,
      x: 0.15, y: 0.25,
      width: 0.35, height: 0.05,
      is_existing: false,
    });
  };

  const deleteElement = (id: string) => {
    pushUndo(elements);
    setElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const updateElementProp = (id: string, prop: keyof CanvasElement, val: any) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, [prop]: val } : el));
  };

  const updateElementText = (id: string, text: string) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, text } : el));
  };

  // ---------- Touch & Gesture Handlers (Pinch to Zoom) ----------
  const handleTouchStart = (e: any) => {
    if (e.nativeEvent.touches.length === 2) {
      const t1 = e.nativeEvent.touches[0];
      const t2 = e.nativeEvent.touches[1];
      const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
      pinchStartDistanceRef.current = dist;
      pinchStartScaleRef.current = zoomScale;
    }
  };

  const handleTouchMove = (e: any) => {
    if (e.nativeEvent.touches.length === 2 && pinchStartDistanceRef.current !== null) {
      const t1 = e.nativeEvent.touches[0];
      const t2 = e.nativeEvent.touches[1];
      const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
      const factor = dist / pinchStartDistanceRef.current;
      const newScale = Math.max(1.0, Math.min(3.0, pinchStartScaleRef.current * factor));
      setZoomScale(Math.round(newScale * 100) / 100);
    }
  };

  const handleTouchEnd = (e: any) => {
    if (e.nativeEvent.touches.length < 2) {
      pinchStartDistanceRef.current = null;
    }
  };

  // ---------- Apply Edits ----------
  const handleApplyEdits = async () => {
    if (!pdfFile) return;
    setSaving(true);
    setResultUri(null);
    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', { uri: pdfFile.uri, name: pdfFile.name, type: 'application/pdf' });
      formData.append('edits_json', JSON.stringify(elements));

      const arrayBuffer = await binaryRequest('POST', '/api/pdf/apply-edits', formData);

      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const tempUri = `${FileSystem.cacheDirectory}edited_pdf_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(tempUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setResultUri(tempUri);
    } catch (err: any) {
      console.log("Apply edits failed:", err);
      showAlert({ title: "Notice", message: 'Could not apply edits right now. Please try again later.', type: 'info' });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (resultUri && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(resultUri, { mimeType: 'application/pdf' });
    }
  };

  const handleDownload = async () => {
    if (!resultUri) return;
    const filename = `edited_${Date.now()}.pdf`;

    await downloadFileToDevice(
      resultUri,
      filename,
      'application/pdf',
      (msg) => {
        if (Platform.OS === 'android') {
          ToastAndroid.show('PDF downloaded successfully!', ToastAndroid.SHORT);
        }
        showAlert({ title: "Download Complete! 🎉", message: msg, type: 'success' });
      },
      (errMsg) => showAlert({ title: "Notice", message: errMsg, type: 'info' })
    );
  };

  // ---------- Tool action handler ----------
  const handleToolPress = (tool: EditorTool) => {
    if (tool === activeTool) {
      setActiveTool(null);
      return;
    }
    setActiveTool(tool);
    setSelectedElementId(null);

    // Immediate-action tools
    if (tool === 'text') addTextElement();
    else if (tool === 'image') addImageElement();
    else if (tool === 'sign') openSignaturePad();
    else if (tool === 'highlight') addHighlightElement();
    else if (tool === 'whiteout') {
      if (selectedEraserType === 'block') {
        addWhiteoutElement();
      }
    }
    // 'draw' just enables freehand mode
  };

  const toPixelPath = (pathStr: string) => {
    if (!pathStr) return '';
    const tokens = pathStr.trim().split(/\s+/);
    let result = '';
    let i = 0;
    while (i < tokens.length) {
      const cmd = tokens[i];
      if ((cmd === 'M' || cmd === 'L') && i + 2 < tokens.length) {
        const px = parseFloat(tokens[i + 1]) * canvasLayout.width;
        const py = parseFloat(tokens[i + 2]) * canvasLayout.height;
        result += `${cmd} ${px} ${py} `;
        i += 3;
      } else {
        i++;
      }
    }
    return result.trim();
  };

  // ---------- Render Draggable Element ----------
  const renderDraggableElement = (el: CanvasElement) => {
    if (el.page !== currentPage) return null;
    if (el.type === 'freehand') {
      return (
        <Svg key={el.id} style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
          {el.path_data ? (
            <Path
              d={toPixelPath(el.path_data)}
              stroke={el.stroke_color || '#000'}
              strokeWidth={(el.stroke_width || 2) * zoomScale}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>
      );
    }
    const isSelected = selectedElementId === el.id;

    const isEdited = el.is_existing && el.text !== el.original_text;
    const isMoved = el.is_existing && (el.orig_x !== undefined && el.orig_y !== undefined) && (
      Math.abs(el.x - el.orig_x) > 1e-4 || Math.abs(el.y - el.orig_y) > 1e-4
    );
    const isChanged = !el.is_existing || isEdited || isMoved;

    const currentDim = pdfDimensions[currentPage] || { width: 595.27, height: 841.89 };
    const baseWidth = SCREEN_WIDTH - 16;
    const scaleFactor = canvasLayout.width > 1 
      ? canvasLayout.width / currentDim.width 
      : (baseWidth * zoomScale) / currentDim.width;

    const left = el.x * canvasLayout.width;
    const top = el.y * canvasLayout.height;
    const elWidth = el.width * canvasLayout.width;
    const elHeight = el.height * canvasLayout.height;

    // Compose Tap and Pan Gestures
    const tap = Gesture.Tap()
      .runOnJS(true)
      .onEnd(() => {
        setSelectedElementId(el.id);
      });

    const pan = Gesture.Pan()
      .runOnJS(true)
      .onStart(() => {
        pushUndo(elements);
        dragStartPos.current = { x: el.x, y: el.y };
      })
      .onChange((e) => {
        if (activeTool === 'draw') return;
        const cx = (dragStartPos.current.x * canvasLayout.width) + e.translationX;
        const cy = (dragStartPos.current.y * canvasLayout.height) + e.translationY;
        const nx = Math.max(0, Math.min(canvasLayout.width - elWidth, cx)) / canvasLayout.width;
        const ny = Math.max(0, Math.min(canvasLayout.height - elHeight, cy)) / canvasLayout.height;
        setElements(prev => prev.map(item => item.id === el.id ? { ...item, x: nx, y: ny } : item));
      });

    const resizePan = Gesture.Pan()
      .runOnJS(true)
      .onStart(() => {
        pushUndo(elements);
        resizeStartSize.current = { width: el.width, height: el.height };
      })
      .onChange((e) => {
        const newWidth = Math.max(0.05, resizeStartSize.current.width + (e.translationX / canvasLayout.width));
        const newHeight = Math.max(0.02, resizeStartSize.current.height + (e.translationY / canvasLayout.height));
        setElements(prev => prev.map(item => item.id === el.id ? { ...item, width: newWidth, height: newHeight } : item));
      });

    const composed = Gesture.Race(tap, pan);

    const getElementStyle = () => {
      const borderW = isSelected ? 1.5 : 0;
      const base: any = {
        width: '100%',
        height: '100%',
        borderWidth: borderW,
        borderColor: isSelected ? '#3B82F6' : 'transparent',
        borderStyle: 'dashed' as const,
        // Compensate for border so content doesn't shift when selected/deselected
        padding: isSelected ? 0 : 1.5,
      };

      if (el.type === 'text') {
        base.justifyContent = 'center';
      }

      if (el.is_existing) {
        base.borderColor = isSelected ? '#3B82F6' : 'transparent';
        base.borderWidth = isSelected ? 1.5 : 0;
        base.borderStyle = 'dashed';
        base.padding = isSelected ? 0 : 1.5;
      }

      if (el.type === 'whiteout') {
        base.backgroundColor = '#FFFFFF';
        base.borderColor = isSelected ? '#3B82F6' : '#CBD5E1';
      }
      if (el.type === 'highlight') {
        base.backgroundColor = el.highlight_color || '#FFEB3B';
        base.opacity = 0.35;
        base.borderColor = isSelected ? '#3B82F6' : 'transparent';
      }
      if (el.type === 'shape') {
        if (el.shape_type === 'ellipse') {
          base.borderRadius = Math.max(elWidth, elHeight) / 2;
        }
        base.borderColor = el.border_color || '#000000';
        base.borderWidth = (el.border_width || 2) * zoomScale;
        base.borderStyle = 'solid';
        if (el.fill_color && el.fill_color !== 'transparent') {
          base.backgroundColor = el.fill_color;
        }
        if (isSelected) {
          base.borderColor = '#3B82F6';
        }
      }
      return base;
    };

    return (
      <View
        key={el.id}
        style={{
          position: 'absolute',
          left,
          top,
          width: el.type === 'text' ? undefined : elWidth,
          height: el.type === 'text' ? undefined : elHeight,
          minWidth: el.type === 'text' ? elWidth : undefined,
          minHeight: el.type === 'text' ? elHeight : undefined,
          zIndex: isSelected ? 100 : 1,
        }}
      >
        <GestureDetector gesture={composed}>
          <View style={getElementStyle()}>
            {el.type === 'text' && (
              <Text
                style={[
                  styles.elementText,
                  {
                    color: el.color || '#000',
                    fontSize: (el.font_size || 16) * scaleFactor,
                    lineHeight: (el.font_size || 16) * scaleFactor,
                    fontWeight: el.is_bold ? 'bold' : 'normal',
                    fontStyle: el.is_italic ? 'italic' : 'normal',
                    textDecorationLine: el.is_underline ? 'underline' : 'none',
                    textAlign: (el.text_align as any) || 'left',
                    fontFamily: el.font_family === 'Courier' ? 'monospace' : (el.font_family === 'Times' ? 'serif' : undefined),
                    includeFontPadding: false,
                  },
                ]}
              >
                {isChanged ? el.text : ''}
              </Text>
            )}
            {(el.type === 'image' || el.type === 'signature') && el.image_data && (
              <Image source={{ uri: el.image_data }} style={styles.overlayImage} resizeMode="contain" />
            )}
            {el.type === 'shape' && el.shape_type === 'line' && (
              <Svg style={StyleSheet.absoluteFill}>
                <SvgLine
                  x1="0" y1={elHeight.toString()}
                  x2={elWidth.toString()} y2="0"
                  stroke={el.border_color || '#000'}
                  strokeWidth={((el.border_width || 2) * zoomScale).toString()}
                />
              </Svg>
            )}
          </View>
        </GestureDetector>

        {isSelected && (
          <GestureDetector gesture={resizePan}>
            <View style={styles.resizeHandle} />
          </GestureDetector>
        )}
      </View>
    );
  };

  // ---------- Render Freehand SVG Overlay ----------
  const renderFreehandOverlay = () => {
    if (!drawPath) return null;
    const strokeColor = activeTool === 'whiteout' ? '#FFFFFF' : selectedColor;
    const strokeWidth = activeTool === 'whiteout' ? 16 : selectedStrokeWidth;
    return (
      <Svg style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
        <Path
          d={toPixelPath(drawPath)}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  };

  // ---------- Context Panel for Selected Element ----------
  const renderContextPanel = () => {
    if (!selectedElementId) return null;
    const el = elements.find(e => e.id === selectedElementId);
    if (!el) return null;

    return (
      <View style={styles.contextPanel}>
        {/* Delete button always visible */}
        <View style={styles.contextRow}>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteElement(el.id)}>
            <Trash2 color="#FFF" width={16} height={16} />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Text Input for Editing */}
        {el.type === 'text' && (
          <View style={styles.editTextInputContainer}>
            <Text style={styles.contextLabel}>Edit Text:</Text>
            <TextInput
              style={styles.contextTextInput}
              value={el.text}
              onChangeText={(t) => updateElementText(el.id, t)}
              onFocus={() => pushUndo(elements)}
              multiline
              placeholder="Type text here..."
            />
          </View>
        )}

        {/* Text formatting */}
        {el.type === 'text' && (
          <>
            {/* Bold / Italic / Underline */}
            <View style={styles.contextRow}>
              <TouchableOpacity
                style={[styles.formatToggle, el.is_bold && styles.formatToggleActive]}
                onPress={() => { pushUndo(elements); updateElementProp(el.id, 'is_bold', !el.is_bold); }}
              >
                <Bold color={el.is_bold ? '#FFF' : '#334155'} width={18} height={18} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formatToggle, el.is_italic && styles.formatToggleActive]}
                onPress={() => { pushUndo(elements); updateElementProp(el.id, 'is_italic', !el.is_italic); }}
              >
                <Italic color={el.is_italic ? '#FFF' : '#334155'} width={18} height={18} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formatToggle, el.is_underline && styles.formatToggleActive]}
                onPress={() => { pushUndo(elements); updateElementProp(el.id, 'is_underline', !el.is_underline); }}
              >
                <Underline color={el.is_underline ? '#FFF' : '#334155'} width={18} height={18} />
              </TouchableOpacity>

              <View style={styles.contextDivider} />

              {/* Alignment */}
              <TouchableOpacity
                style={[styles.formatToggle, el.text_align === 'left' && styles.formatToggleActive]}
                onPress={() => { pushUndo(elements); updateElementProp(el.id, 'text_align', 'left'); }}
              >
                <AlignLeft color={el.text_align === 'left' ? '#FFF' : '#334155'} width={16} height={16} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formatToggle, el.text_align === 'center' && styles.formatToggleActive]}
                onPress={() => { pushUndo(elements); updateElementProp(el.id, 'text_align', 'center'); }}
              >
                <AlignCenter color={el.text_align === 'center' ? '#FFF' : '#334155'} width={16} height={16} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formatToggle, el.text_align === 'right' && styles.formatToggleActive]}
                onPress={() => { pushUndo(elements); updateElementProp(el.id, 'text_align', 'right'); }}
              >
                <AlignRight color={el.text_align === 'right' ? '#FFF' : '#334155'} width={16} height={16} />
              </TouchableOpacity>
            </View>

            {/* Font size */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contextScrollRow}>
              <Text style={styles.contextLabel}>Size:</Text>
              {FONT_SIZES.map(sz => (
                <TouchableOpacity
                  key={sz}
                  style={[styles.sizePill, el.font_size === sz && styles.sizePillActive]}
                  onPress={() => {
                    pushUndo(elements);
                    setSelectedFontSize(sz);
                    updateElementProp(el.id, 'font_size', sz);
                  }}
                >
                  <Text style={[styles.sizePillText, el.font_size === sz && styles.sizePillTextActive]}>{sz}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Font family */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contextScrollRow}>
              <Text style={styles.contextLabel}>Font:</Text>
              {FONT_FAMILIES.map(ff => (
                <TouchableOpacity
                  key={ff}
                  style={[styles.sizePill, el.font_family === ff && styles.sizePillActive]}
                  onPress={() => {
                    pushUndo(elements);
                    setSelectedFontFamily(ff);
                    updateElementProp(el.id, 'font_family', ff);
                  }}
                >
                  <Text style={[styles.sizePillText, el.font_family === ff && styles.sizePillTextActive]}>{ff}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Color */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contextScrollRow}>
              <Text style={styles.contextLabel}>Color:</Text>
              {COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, el.color === c && styles.colorDotActive]}
                  onPress={() => {
                    pushUndo(elements);
                    setSelectedColor(c);
                    updateElementProp(el.id, 'color', c);
                  }}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Shape controls */}
        {el.type === 'shape' && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contextScrollRow}>
              <Text style={styles.contextLabel}>Shape:</Text>
              {(['rectangle', 'ellipse', 'line'] as ShapeSubType[]).map(st => (
                <TouchableOpacity
                  key={st}
                  style={[styles.sizePill, el.shape_type === st && styles.sizePillActive]}
                  onPress={() => { pushUndo(elements); updateElementProp(el.id, 'shape_type', st); }}
                >
                  <Text style={[styles.sizePillText, el.shape_type === st && styles.sizePillTextActive]}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contextScrollRow}>
              <Text style={styles.contextLabel}>Border:</Text>
              {COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, el.border_color === c && styles.colorDotActive]}
                  onPress={() => { pushUndo(elements); updateElementProp(el.id, 'border_color', c); }}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Highlight color */}
        {el.type === 'highlight' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contextScrollRow}>
            <Text style={styles.contextLabel}>Color:</Text>
            {HIGHLIGHT_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, el.highlight_color === c && styles.colorDotActive]}
                onPress={() => { pushUndo(elements); updateElementProp(el.id, 'highlight_color', c); }}
              />
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  // Dynamic Canvas Dimensions
  const currentDim = pdfDimensions[currentPage] || { width: 595.27, height: 841.89 };
  const pageAspectRatio = currentDim.width / currentDim.height;
  const canvasWidth = (SCREEN_WIDTH - 16) * zoomScale;
  const canvasHeight = canvasWidth / pageAspectRatio;

  // ---------- MAIN RENDER ----------
  // Upload screen
  if (!pdfFile || pdfPages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.uploadContainer}>
          <View style={styles.uploadCard}>
            <View style={styles.uploadIconCircle}>
              <FileText color="#4F46E5" width={48} height={48} />
            </View>
            <Text style={styles.uploadTitle}>PDF Editor</Text>
            <Text style={styles.uploadSubtitle}>
              Add text, images, shapes, signatures, highlights and annotations to your PDF
            </Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickPdf} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.uploadButtonText}>Select PDF File</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Result screen
  if (resultUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultContainer}>
          <View style={styles.successCircle}>
            <Check color="#10B981" width={48} height={48} />
          </View>
          <Text style={styles.successTitle}>PDF Saved Successfully!</Text>
          <Text style={styles.successSubtitle}>Your edited PDF is ready to share or download.</Text>
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.shareBtn} onPress={() => wrapWithAd(handleDownload)}>
              <Download color="#FFF" width={18} height={18} />
              <Text style={styles.shareBtnText}>Download File</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#4F46E5' }]} onPress={handleShare}>
              <Share2 color="#FFF" width={18} height={18} />
              <Text style={styles.shareBtnText}>Share File</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editAnotherBtn}
              onPress={() => {
                setResultUri(null);
                setPdfFile(null);
                setPdfPages([]);
                setElements([]);
                setDrawPaths([]);
              }}
            >
              <Text style={styles.editAnotherBtnText}>Edit Another PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Editor screen
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
        {/* Top Toolbar */}
        <View style={styles.toolbar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarContent}>
            {([
              { tool: 'text' as EditorTool, icon: Type, label: 'Text' },
              { tool: 'image' as EditorTool, icon: ImageIcon, label: 'Image' },
              { tool: 'sign' as EditorTool, icon: PenTool, label: 'Sign' },
              { tool: 'highlight' as EditorTool, icon: Highlighter, label: 'Highlight' },
              { tool: 'whiteout' as EditorTool, icon: Square, label: 'Erase' },
              { tool: 'draw' as EditorTool, icon: PenTool, label: 'Draw' },
            ]).map(({ tool, icon: Icon, label }) => (
              <TouchableOpacity
                key={tool}
                style={[styles.toolButton, activeTool === tool && styles.toolButtonActive]}
                onPress={() => handleToolPress(tool)}
              >
                <Icon
                  color={activeTool === tool ? '#FFF' : '#475569'}
                  width={18} height={18}
                />
                <Text style={[styles.toolLabel, activeTool === tool && styles.toolLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.toolDivider} />

            <TouchableOpacity
              style={[styles.toolButton, undoStack.length === 0 && styles.toolButtonDisabled]}
              onPress={handleUndo}
              disabled={undoStack.length === 0}
            >
              <Undo2 color={undoStack.length > 0 ? '#475569' : '#CBD5E1'} width={18} height={18} />
              <Text style={[styles.toolLabel, undoStack.length === 0 && { color: '#CBD5E1' }]}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolButton, redoStack.length === 0 && styles.toolButtonDisabled]}
              onPress={handleRedo}
              disabled={redoStack.length === 0}
            >
              <Redo2 color={redoStack.length > 0 ? '#475569' : '#CBD5E1'} width={18} height={18} />
              <Text style={[styles.toolLabel, redoStack.length === 0 && { color: '#CBD5E1' }]}>Redo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Draw mode color strip */}
        {activeTool === 'draw' && (
          <View style={styles.drawOptions}>
            <Text style={styles.drawOptionsLabel}>Pen:</Text>
            {COLORS.filter(c => c !== '#FFFFFF').map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotActive]}
                onPress={() => setSelectedColor(c)}
              />
            ))}
            <View style={styles.contextDivider} />
            {[2, 3, 5, 8].map(w => (
              <TouchableOpacity
                key={w}
                style={[styles.sizePill, selectedStrokeWidth === w && styles.sizePillActive]}
                onPress={() => setSelectedStrokeWidth(w)}
              >
                <Text style={[styles.sizePillText, selectedStrokeWidth === w && styles.sizePillTextActive]}>{w}px</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Eraser options */}
        {activeTool === 'whiteout' && (
          <View style={styles.drawOptions}>
            <Text style={styles.drawOptionsLabel}>Erase Mode:</Text>
            {(['brush', 'block'] as ('brush' | 'block')[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.sizePill, selectedEraserType === t && styles.sizePillActive]}
                onPress={() => {
                  setSelectedEraserType(t);
                  if (t === 'block') {
                    addWhiteoutElement();
                  }
                }}
              >
                <Text style={[styles.sizePillText, selectedEraserType === t && styles.sizePillTextActive]}>
                  {t === 'brush' ? 'Pen Eraser' : 'Add Block'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}



        {/* Page Navigation */}
        <View style={styles.pageNav}>
          <TouchableOpacity
            disabled={currentPage === 0}
            onPress={() => { setCurrentPage(p => p - 1); setSelectedElementId(null); }}
          >
            <ChevronLeft color={currentPage === 0 ? '#CBD5E1' : '#334155'} width={22} height={22} />
          </TouchableOpacity>
          <Text style={styles.pageNavText}>Page {currentPage + 1} / {pdfPages.length}</Text>
          <TouchableOpacity
            disabled={currentPage === pdfPages.length - 1}
            onPress={() => { setCurrentPage(p => p + 1); setSelectedElementId(null); }}
          >
            <ChevronRight color={currentPage === pdfPages.length - 1 ? '#CBD5E1' : '#334155'} width={22} height={22} />
          </TouchableOpacity>

          <View style={styles.contextDivider} />

          {/* Zoom Controls */}
          <TouchableOpacity
            disabled={zoomScale <= 1.0}
            onPress={() => setZoomScale(z => Math.max(1.0, z - 0.25))}
            style={styles.zoomBtn}
          >
            <ZoomOut color={zoomScale <= 1.0 ? '#CBD5E1' : '#334155'} width={18} height={18} />
          </TouchableOpacity>
          <Text style={styles.zoomText}>{Math.round(zoomScale * 100)}%</Text>
          <TouchableOpacity
            disabled={zoomScale >= 3.0}
            onPress={() => setZoomScale(z => Math.min(3.0, z + 0.25))}
            style={styles.zoomBtn}
          >
            <ZoomIn color={zoomScale >= 3.0 ? '#CBD5E1' : '#334155'} width={18} height={18} />
          </TouchableOpacity>
        </View>

        {/* Canvas Area */}
        <ScrollView
          style={styles.canvasScroll}
          contentContainerStyle={styles.canvasScrollContent}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={activeTool !== 'draw'}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={zoomScale > 1 && activeTool !== 'draw'}
            contentContainerStyle={{ paddingHorizontal: zoomScale > 1 ? 8 : 0 }}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={activeTool !== 'draw'}
          >
            <GestureDetector gesture={activeGesture}>
              <View
                style={[
                  styles.canvasContainer,
                  {
                    width: canvasWidth,
                    height: canvasHeight,
                    aspectRatio: undefined,
                    marginHorizontal: zoomScale > 1 ? 0 : 8,
                  }
                ]}
                onLayout={(e) => {
                  const { width, height } = e.nativeEvent.layout;
                  setCanvasLayout({ width, height });
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
              {pdfPages[currentPage] && (
                <TouchableWithoutFeedback onPress={() => setSelectedElementId(null)}>
                  <Image
                    source={{ uri: pdfPages[currentPage] }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="contain"
                  />
                </TouchableWithoutFeedback>
              )}

              {/* Render visual redaction blockers on the frontend for moved/edited existing text */}
              {elements.map(el => {
                if (el.page === currentPage && el.is_existing) {
                  const is_moved = (el.orig_x !== undefined && el.orig_y !== undefined) && (
                    Math.abs(el.x - el.orig_x) > 1e-4 || Math.abs(el.y - el.orig_y) > 1e-4
                  );
                  const is_edited = el.text !== el.original_text;
                  if (is_moved || is_edited) {
                    const blockLeft = (el.orig_x ?? el.x) * canvasLayout.width;
                    const blockTop = (el.orig_y ?? el.y) * canvasLayout.height;
                    const blockWidth = (el.orig_width ?? el.width) * canvasLayout.width;
                    const blockHeight = (el.orig_height ?? el.height) * canvasLayout.height;
                    return (
                      <View
                        key={`block_${el.id}`}
                        style={{
                          position: 'absolute',
                          left: blockLeft,
                          top: blockTop,
                          width: blockWidth,
                          height: blockHeight,
                          backgroundColor: '#FFFFFF',
                        }}
                      />
                    );
                  }
                }
                return null;
              })}

              {/* Non-freehand elements */}
              {elements.map(renderDraggableElement)}

              {/* Freehand SVG overlay */}
              {renderFreehandOverlay()}
            </View>
          </GestureDetector>
        </ScrollView>
      </ScrollView>

        {/* Context panel below canvas (rendered outside ScrollView for immediate visibility) */}
        {renderContextPanel()}

        {/* Page Thumbnails Strip */}
        {pdfThumbnails.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbStrip}
            contentContainerStyle={styles.thumbStripContent}
          >
            {pdfThumbnails.map((thumb, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.thumbItem, currentPage === idx && styles.thumbItemActive]}
                onPress={() => { setCurrentPage(idx); setSelectedElementId(null); }}
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.thumbImage} resizeMode="contain" />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Text style={styles.thumbPlaceholderText}>{idx + 1}</Text>
                  </View>
                )}
                <Text style={[styles.thumbLabel, currentPage === idx && styles.thumbLabelActive]}>
                  {idx + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Apply Changes Footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApplyEdits} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Download color="#FFF" width={18} height={18} />
                <Text style={styles.applyButtonText}>Apply Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <SignatureModal
          visible={sigModalVisible}
          onClose={() => { setSigModalVisible(false); setActiveTool(null); }}
          onSave={saveSignature}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  </GestureHandlerRootView>
  );
}

interface SignatureModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (base64: string) => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ visible, onClose, onSave }) => {
  const { showAlert } = useAlert();
  const [sigPaths, setSigPaths] = useState<string[]>([]);
  const [currentSigPath, setCurrentSigPath] = useState('');
  const sigViewRef = useRef<View>(null);
  const currentSigPathRef = useRef('');

  if (!visible) return null;

  const sigPan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onStart((e) => {
      currentSigPathRef.current = `M ${e.x} ${e.y}`;
      setCurrentSigPath(`M ${e.x} ${e.y}`);
    })
    .onChange((e) => {
      const next = `${currentSigPathRef.current} L ${e.x} ${e.y}`;
      currentSigPathRef.current = next;
      setCurrentSigPath(next);
    })
    .onFinalize(() => {
      const finishedPath = currentSigPathRef.current;
      if (finishedPath) {
        setSigPaths(prev => [...prev, finishedPath]);
        currentSigPathRef.current = '';
        setCurrentSigPath('');
      }
    });

  const handleSave = async () => {
    if (sigPaths.length === 0) {
      showAlert({ title: "Required", message: 'Please draw a signature first.', type: 'error' });
      return;
    }
    try {
      const base64 = await captureRef(sigViewRef, {
        format: 'png', quality: 1.0, result: 'base64',
      });
      onSave(base64);
    } catch {
      showAlert({ title: "Error", message: 'Failed to capture signature.', type: 'error' });
    }
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }]}>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Draw Signature</Text>
          <TouchableOpacity onPress={onClose}>
            <X color="#334155" width={24} height={24} />
          </TouchableOpacity>
        </View>
        <GestureDetector gesture={sigPan}>
          <View
            ref={sigViewRef}
            style={styles.sigCanvas}
            collapsable={false}
          >
            <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
              {sigPaths.map((p, i) => (
                <Path key={i} d={p} stroke="#1E293B" strokeWidth="3" fill="none" strokeLinecap="round" />
              ))}
              {currentSigPath ? (
                <Path d={currentSigPath} stroke="#1E293B" strokeWidth="3" fill="none" strokeLinecap="round" />
              ) : null}
            </Svg>
          </View>
        </GestureDetector>
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.modalClearBtn}
            onPress={() => { setSigPaths([]); setCurrentSigPath(''); }}
          >
            <Text style={styles.modalClearText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave}>
            <Check color="#FFF" width={18} height={18} />
            <Text style={styles.modalSaveText}>Add Signature</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  // Upload screen
  uploadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  uploadCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  uploadIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadTitle: {
    fontSize: 26,
    fontFamily: 'Outfit-Bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  uploadButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
    minWidth: 200,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
  },

  // Toolbar
  toolbar: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6,
  },
  toolbarContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  toolButton: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    minWidth: 48,
  },
  toolButtonActive: {
    backgroundColor: '#4F46E5',
  },
  toolButtonDisabled: {
    opacity: 0.5,
  },
  toolLabel: {
    fontSize: 10,
    color: '#475569',
    marginTop: 2,
    fontFamily: 'Outfit-Regular',
  },
  toolLabelActive: {
    color: '#FFF',
  },
  toolDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 6,
  },

  // Draw options bar
  drawOptions: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 6,
  },
  drawOptionsLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
    color: '#334155',
    marginRight: 4,
  },

  // Page nav
  pageNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 16,
  },
  pageNavText: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    color: '#334155',
  },

  // Canvas
  canvasScroll: {
    flex: 1,
  },
  canvasScrollContent: {
    paddingBottom: 20,
  },
  canvasContainer: {
    width: SCREEN_WIDTH - 16,
    aspectRatio: 0.707, // A4 portrait
    marginHorizontal: 8,
    marginTop: 8,
    backgroundColor: '#FFF',
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Element styles
  elementText: {
    width: '100%',
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
  },
  overlayImage: {
    width: '100%',
    height: '100%',
  },
  resizeHandle: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    zIndex: 9999,
  },

  // Context panel
  contextPanel: {
    backgroundColor: '#FFF',
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  contextScrollRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  contextLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
    color: '#64748B',
    marginRight: 8,
    alignSelf: 'center',
  },
  contextDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 6,
  },

  // Format toggles
  formatToggle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  formatToggleActive: {
    backgroundColor: '#4F46E5',
  },

  // Color dot
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: '#4F46E5',
    borderWidth: 2.5,
  },

  // Size pills
  sizePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  sizePillActive: {
    backgroundColor: '#4F46E5',
  },
  sizePillText: {
    fontSize: 12,
    color: '#334155',
    fontFamily: 'Outfit-Regular',
  },
  sizePillTextActive: {
    color: '#FFF',
  },

  // Delete button
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  deleteBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
  },

  // Thumbnails
  thumbStrip: {
    maxHeight: 80,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  thumbStripContent: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
  },
  thumbItem: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  },
  thumbItemActive: {
    borderColor: '#4F46E5',
  },
  thumbImage: {
    width: 45,
    height: 56,
    borderRadius: 4,
  },
  thumbPlaceholder: {
    width: 45,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbPlaceholderText: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: 'Outfit-SemiBold',
  },
  thumbLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  thumbLabelActive: {
    color: '#4F46E5',
    fontFamily: 'Outfit-SemiBold',
  },

  // Footer
  footer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  applyButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
  },

  // Result screen
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
  },
  resultActions: {
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  shareBtn: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
  },
  editAnotherBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
  },
  editAnotherBtnText: {
    color: '#4F46E5',
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#1E293B',
  },
  sigCanvas: {
    height: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalClearBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  modalClearText: {
    color: '#64748B',
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
  modalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    gap: 6,
  },
  modalSaveText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
  zoomBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  zoomText: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
    color: '#334155',
    minWidth: 40,
    textAlign: 'center',
  },
  editTextInputContainer: {
    marginBottom: 12,
  },
  contextTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontSize: 15,
    color: '#1E293B',
    minHeight: 60,
    textAlignVertical: 'top',
    marginTop: 4,
  },
});
