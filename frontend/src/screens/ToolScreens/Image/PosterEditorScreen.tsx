import { useAlert } from '../../../context/AlertContext';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';
import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, TextInput, Dimensions, Modal,
  Platform, ActivityIndicator, Image as RNImage, PanResponder,
  LayoutChangeEvent, ToastAndroid,
} from 'react-native';
import {
  Canvas, useCanvasRef, Rect, RoundedRect, Circle, Group,
  Image as SkiaImage, Text as SkText, Paint, Shadow,
  LinearGradient, vec, Skia, SkTypeface, SkImage, FontStyle,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import {
  Plus, Type, Trash2, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Copy, Lock, Unlock,
  RotateCcw, Download, Image as ImageIcon, X, Square,
  Circle as CircleIcon, ArrowUp, ArrowDown, Crosshair,
  Palette, Share2, Crop, RotateCw, Eye, Sparkles, Check,
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CANVAS_W = SCREEN_W - 32;
const CANVAS_H = CANVAS_W * 1.3; // Elegant 10:13 ratio poster

// ---------- Types ----------
type LayerType = 'text' | 'image' | 'shape';
type ShapeSubType = 'rect' | 'round' | 'circle';

interface GradientStops {
  colors: string[];
  positions: number[];
}

interface Layer {
  id: string;
  type: LayerType;
  x: number; y: number;          // Position (center for shapes/images, baseline for text)
  scale: number;
  rotation: number;               // in degrees
  opacity: number;
  zIndex: number;
  locked: boolean;

  // Text specific
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  strokeWidth?: number;
  strokeColor?: string;
  shadow?: { x: number; y: number; blur: number; color: string };
  bgColor?: string;
  bgPadding?: number;

  // Shape specific
  shapeType?: ShapeSubType;
  fillColor?: string;
  borderEnabled?: boolean;
  borderColor?: string;
  borderWidth?: number;
  shapeWidth?: number;
  shapeHeight?: number;

  // Image specific
  uri?: string;
  imgWidth?: number;
  imgHeight?: number;
}

interface BackgroundState {
  type: 'color' | 'gradient' | 'image';
  value: string;
  gradient?: GradientStops;
}

// ---------- Constants ----------
const COLORS = [
  '#FFFFFF', '#000000', '#F8FAFC', '#F1F5F9', '#CBD5E1', '#64748B', '#1E293B',
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#3D0A91', '#052E16', '#7F1D1D',
];

const GRADIENT_PRESETS: { name: string; colors: string[] }[] = [
  { name: 'Sunset Glow', colors: ['#FF7E5F', '#FEB47B'] },
  { name: 'Deep Ocean', colors: ['#2B5876', '#4E4376'] },
  { name: 'Fresh Emerald', colors: ['#11998E', '#38EF7D'] },
  { name: 'Neon Purple', colors: ['#833AB4', '#FD1D1D', '#FCAF45'] },
  { name: 'Gold Luxe', colors: ['#BF953F', '#FCF6BA', '#B38728', '#FBF5B7'] },
  { name: 'Mystic Night', colors: ['#0F2027', '#203A43', '#2C5364'] },
  { name: 'Candy Floss', colors: ['#FF9A9E', '#FECFEF'] },
  { name: 'Hyper Blue', colors: ['#00C6FF', '#0072FF'] },
];

const FONT_REGISTRY = [
  { label: 'System Sans', value: 'sans-serif', url: '' },
  { label: 'System Serif', value: 'serif', url: '' },
  { label: 'System Monospace', value: 'monospace', url: '' },
  { label: 'Outfit (Modern)', value: 'Outfit', url: 'https://github.com/google/fonts/raw/main/ofl/outfit/static/Outfit-Regular.ttf' },
  { label: 'Lobster (Fancy)', value: 'Lobster', url: 'https://github.com/google/fonts/raw/main/ofl/lobster/Lobster-Regular.ttf' },
  { label: 'Pacifico (Brush)', value: 'Pacifico', url: 'https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf' },
  { label: 'Bebas Neue (Bold)', value: 'BebasNeue', url: 'https://github.com/google/fonts/raw/main/ofl/bebasneue/BebasNeue-Regular.ttf' },
  { label: 'Montserrat', value: 'Montserrat', url: 'https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-Regular.ttf' },
  { label: 'Playfair Display', value: 'Playfair', url: 'https://github.com/google/fonts/raw/main/ofl/playfairdisplay/static/PlayfairDisplay-Regular.ttf' },
];

type ToolTab = 'add' | 'edit' | 'background' | 'layers';

// ---------- Component ----------
export default function PosterEditorScreen() {
  const { showAlert } = useAlert();
  const { handleActionWithAd } = useAdOnDownload();
  const insets = useSafeAreaInsets();
  const canvasRef = useCanvasRef();

  // State
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [background, setBackground] = useState<BackgroundState>({ type: 'color', value: '#1E293B' });
  const [showTextModal, setShowTextModal] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ToolTab>('add');

  // Skia Resources cache states
  const [skiaImages, setSkiaImages] = useState<Record<string, SkImage>>({});
  const [typefaces, setTypefaces] = useState<Record<string, SkTypeface>>({});
  const [downloadingFont, setDownloadingFont] = useState<string | null>(null);

  // Crop modal state
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [cropSourceUri, setCropSourceUri] = useState<string | null>(null);
  const [cropRatio, setCropRatio] = useState<'free' | '1:1' | '4:3' | '16:9'>('free');
  const [cropRotation, setCropRotation] = useState<0 | 90 | 180 | 270>(0);
  const [cropBox, setCropBox] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 }); // relative units
  const [cropImageLayout, setCropImageLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });

  // Undo/Redo Stacks
  const [undoStack, setUndoStack] = useState<{ layers: Layer[]; background: BackgroundState }[]>([]);
  const [redoStack, setRedoStack] = useState<{ layers: Layer[]; background: BackgroundState }[]>([]);

  // Gesture refs
  const dragStartPos = useRef({ x: 0, y: 0 });
  const pinchStartScale = useRef(1);

  const selected = useMemo(() => layers.find(l => l.id === selectedLayerId) ?? null, [layers, selectedLayerId]);
  const sortedLayers = useMemo(() => [...layers].sort((a, b) => a.zIndex - b.zIndex), [layers]);

  // ---------- Push Undo state ----------
  const saveStateToUndo = useCallback((currentLayers: Layer[], currentBg: BackgroundState) => {
    setUndoStack(prev => [...prev.slice(-25), {
      layers: currentLayers.map(l => ({ ...l, shadow: l.shadow ? { ...l.shadow } : undefined })),
      background: { ...currentBg },
    }]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, { layers: layers.map(l => ({ ...l })), background: { ...background } }]);
    setLayers(previous.layers);
    setBackground(previous.background);
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack, layers, background]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, { layers: layers.map(l => ({ ...l })), background: { ...background } }]);
    setLayers(next.layers);
    setBackground(next.background);
    setRedoStack(prev => prev.slice(0, -1));
  }, [redoStack, layers, background]);

  // ---------- Resource Loaders ----------
  const loadSkiaImageFromUri = async (uri: string): Promise<SkImage | null> => {
    try {
      let localUri = uri;
      if (uri.startsWith('content://')) {
        const cachedPath = `${FileSystem.cacheDirectory}${Date.now()}_img.jpg`;
        await FileSystem.copyAsync({ from: uri, to: cachedPath });
        localUri = cachedPath;
      }
      const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
      const data = Skia.Data.fromBase64(base64);
      return Skia.Image.MakeImageFromEncoded(data);
    } catch (e) {
      console.error('Failed to parse Skia Image:', e);
      return null;
    }
  };

  // Load missing images cache
  useEffect(() => {
    const loadImages = async () => {
      let changed = false;
      const copy = { ...skiaImages };

      if (background.type === 'image' && background.value && !copy['background']) {
        const img = await loadSkiaImageFromUri(background.value);
        if (img) {
          copy['background'] = img;
          changed = true;
        }
      }

      for (const layer of layers) {
        if (layer.type === 'image' && layer.uri && !copy[layer.id]) {
          const img = await loadSkiaImageFromUri(layer.uri);
          if (img) {
            copy[layer.id] = img;
            changed = true;
          }
        }
      }

      if (changed) setSkiaImages(copy);
    };
    loadImages();
  }, [layers, background]);

  // Load custom TTF fonts asynchronously
  const loadCustomFont = async (fontFamily: string) => {
    if (typefaces[fontFamily]) return;
    const match = FONT_REGISTRY.find(f => f.value === fontFamily);
    if (!match || !match.url) return;

    setDownloadingFont(fontFamily);
    try {
      const localPath = `${FileSystem.cacheDirectory}${fontFamily}.ttf`;
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (!fileInfo.exists) {
        await FileSystem.downloadAsync(match.url, localPath);
      }
      const base64 = await FileSystem.readAsStringAsync(localPath, { encoding: FileSystem.EncodingType.Base64 });
      const data = Skia.Data.fromBase64(base64);
      const typeface = Skia.Typeface.MakeFreeTypeFaceFromData(data);
      if (typeface) {
        setTypefaces(prev => ({ ...prev, [fontFamily]: typeface }));
      } else {
        throw new Error('Typeface parsing returned null');
      }
    } catch (e) {
      console.error(`Font load error for ${fontFamily}:`, e);
      showAlert({ title: "Font Error", message: `Could not download "${match.label}". Using default font.`, type: 'error' });
    } finally {
      setDownloadingFont(null);
    }
  };

  // Default system fonts loaded using Skia FontMgr
  const defaultTypeface = useMemo(() => Skia.FontMgr.System().matchFamilyStyle('sans-serif', FontStyle.Normal), []);
  const boldTypeface = useMemo(() => Skia.FontMgr.System().matchFamilyStyle('sans-serif', FontStyle.Bold), []);
  const italicTypeface = useMemo(() => Skia.FontMgr.System().matchFamilyStyle('sans-serif', FontStyle.Italic), []);
  const boldItalicTypeface = useMemo(() => Skia.FontMgr.System().matchFamilyStyle('sans-serif', FontStyle.BoldItalic), []);
  const serifTypeface = useMemo(() => Skia.FontMgr.System().matchFamilyStyle('serif', FontStyle.Normal), []);
  const monospaceTypeface = useMemo(() => Skia.FontMgr.System().matchFamilyStyle('monospace', FontStyle.Normal), []);

  const getLayerFont = useCallback((layer: Layer) => {
    let tf = defaultTypeface;
    if (layer.fontFamily && layer.fontFamily !== 'default') {
      if (typefaces[layer.fontFamily]) {
        tf = typefaces[layer.fontFamily];
      } else if (layer.fontFamily === 'serif') {
        tf = serifTypeface;
      } else if (layer.fontFamily === 'monospace') {
        tf = monospaceTypeface;
      } else {
        // Trigger background load if not currently loading
        loadCustomFont(layer.fontFamily);
      }
    } else {
      if (layer.bold && layer.italic) tf = boldItalicTypeface;
      else if (layer.bold) tf = boldTypeface;
      else if (layer.italic) tf = italicTypeface;
    }
    const size = (layer.fontSize || 28) * layer.scale;
    return Skia.Font(tf, size);
  }, [typefaces, defaultTypeface, boldTypeface, italicTypeface, boldItalicTypeface, serifTypeface, monospaceTypeface]);

  // ---------- Layer Actions ----------
  const updateLayer = useCallback((id: string, patch: Partial<Layer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  }, []);

  const deleteLayer = useCallback((id: string) => {
    saveStateToUndo(layers, background);
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  }, [layers, background, selectedLayerId, saveStateToUndo]);

  const duplicateLayer = useCallback(() => {
    if (!selected) return;
    saveStateToUndo(layers, background);
    const copy: Layer = {
      ...selected,
      id: `${selected.type}_${Date.now()}`,
      x: selected.x + 24,
      y: selected.y + 24,
      zIndex: layers.length,
    };
    setLayers(prev => [...prev, copy]);
    setSelectedLayerId(copy.id);
  }, [selected, layers, background, saveStateToUndo]);

  const bringToFront = useCallback(() => {
    if (!selectedLayerId) return;
    saveStateToUndo(layers, background);
    const maxZ = layers.reduce((max, l) => l.zIndex > max ? l.zIndex : max, 0);
    updateLayer(selectedLayerId, { zIndex: maxZ + 1 });
  }, [selectedLayerId, layers, background, saveStateToUndo, updateLayer]);

  const sendToBack = useCallback(() => {
    if (!selectedLayerId) return;
    saveStateToUndo(layers, background);
    const minZ = layers.reduce((min, l) => l.zIndex < min ? l.zIndex : min, 0);
    updateLayer(selectedLayerId, { zIndex: minZ - 1 });
  }, [selectedLayerId, layers, background, saveStateToUndo, updateLayer]);

  const centerLayer = useCallback(() => {
    if (!selectedLayerId) return;
    saveStateToUndo(layers, background);
    updateLayer(selectedLayerId, { x: CANVAS_W / 2, y: CANVAS_H / 2 });
  }, [selectedLayerId, layers, background, saveStateToUndo, updateLayer]);

  const toggleLock = useCallback(() => {
    if (!selected) return;
    saveStateToUndo(layers, background);
    updateLayer(selected.id, { locked: !selected.locked });
  }, [selected, layers, background, saveStateToUndo, updateLayer]);

  // ---------- Crop & Photo Pipeline ----------
  const triggerAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setCropSourceUri(result.assets[0].uri);
      setCropRotation(0);
      setCropRatio('free');
      setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
      setCropModalVisible(true);
    }
  };

  const confirmCrop = async () => {
    if (!cropSourceUri) return;
    setSaving(true);
    try {
      // Step 1: Apply rotation first (if any) to get correct post-rotation dimensions
      let sourceUri = cropSourceUri;
      if (cropRotation !== 0) {
        const rotated = await ImageManipulator.manipulateAsync(
          cropSourceUri,
          [{ rotate: cropRotation }],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );
        sourceUri = rotated.uri;
      }

      // Step 2: Get dimensions of the (possibly rotated) image
      const info = await ImageManipulator.manipulateAsync(sourceUri, []);
      const imgW = info.width;
      const imgH = info.height;

      // Step 3: Calculate crop pixels with strict clamping
      let originX = Math.max(0, Math.floor(cropBox.x * imgW));
      let originY = Math.max(0, Math.floor(cropBox.y * imgH));
      let width = Math.max(1, Math.floor(cropBox.w * imgW));
      let height = Math.max(1, Math.floor(cropBox.h * imgH));

      // Ensure the crop rectangle stays within image bounds
      if (originX + width > imgW) width = imgW - originX;
      if (originY + height > imgH) height = imgH - originY;
      if (originX >= imgW) originX = 0;
      if (originY >= imgH) originY = 0;
      if (width <= 0) width = Math.min(imgW, 100);
      if (height <= 0) height = Math.min(imgH, 100);

      // Step 4: Apply the crop
      const processed = await ImageManipulator.manipulateAsync(
        sourceUri,
        [{ crop: { originX, originY, width, height } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      saveStateToUndo(layers, background);
      const aspect = processed.height / processed.width;
      const targetW = Math.min(processed.width, CANVAS_W * 0.7);
      const targetH = targetW * aspect;

      const newLayer: Layer = {
        id: `img_${Date.now()}`,
        type: 'image',
        x: CANVAS_W / 2,
        y: CANVAS_H / 2,
        scale: 1,
        rotation: 0,
        opacity: 1,
        zIndex: layers.length,
        locked: false,
        uri: processed.uri,
        imgWidth: targetW,
        imgHeight: targetH,
      };

      setLayers(prev => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
      setActiveTab('edit');
      setCropModalVisible(false);
    } catch (e) {
      console.error(e);
      showAlert({ title: "Crop Error", message: 'Could not crop the selected image.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ---------- Text Editor Modes ----------
  const openAddText = () => {
    setDraftText('');
    setEditingTextId(null);
    setShowTextModal(true);
  };

  const openEditText = () => {
    if (!selected || selected.type !== 'text') return;
    setDraftText(selected.text || '');
    setEditingTextId(selected.id);
    setShowTextModal(true);
  };

  const confirmText = () => {
    if (!draftText.trim()) return;
    saveStateToUndo(layers, background);
    if (editingTextId) {
      updateLayer(editingTextId, { text: draftText });
    } else {
      const newLayer: Layer = {
        id: `text_${Date.now()}`,
        type: 'text',
        x: CANVAS_W / 2,
        y: CANVAS_H / 2,
        scale: 1,
        rotation: 0,
        opacity: 1,
        zIndex: layers.length,
        locked: false,
        text: draftText,
        fontFamily: 'default',
        fontSize: 28,
        color: '#FFFFFF',
        bold: false,
        italic: false,
        underline: false,
        align: 'center',
        strokeWidth: 0,
        strokeColor: '#000000',
        shadow: { x: 2, y: 2, blur: 4, color: 'rgba(0,0,0,0.5)' },
      };
      setLayers(prev => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
    }
    setShowTextModal(false);
    setActiveTab('edit');
  };

  // ---------- Shape Adders ----------
  const addShape = (shapeType: ShapeSubType) => {
    saveStateToUndo(layers, background);
    const newLayer: Layer = {
      id: `shape_${Date.now()}`,
      type: 'shape',
      x: CANVAS_W / 2,
      y: CANVAS_H / 2,
      scale: 1,
      rotation: 0,
      opacity: 1,
      zIndex: layers.length,
      locked: false,
      shapeType,
      fillColor: '#3B82F6',
      borderEnabled: false,
      borderColor: '#1E40AF',
      borderWidth: 2,
      shapeWidth: 120,
      shapeHeight: shapeType === 'circle' ? 120 : 80,
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setActiveTab('edit');
  };

  // ---------- Background Operations ----------
  const triggerBgImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      saveStateToUndo(layers, background);
      setBackground({ type: 'image', value: result.assets[0].uri });
    }
  };

  // ---------- Export Engine ----------
  const saveToGallery = async () => {
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      const snapshot = canvasRef.current.makeImageSnapshot();
      if (!snapshot) throw new Error('Failed to generate snapshot');

      const b64 = snapshot.encodeToBase64();
      const fileUri = `${FileSystem.cacheDirectory}poster_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(fileUri, b64, { encoding: FileSystem.EncodingType.Base64 });

      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(fileUri);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Image downloaded to gallery!', ToastAndroid.SHORT);
        }
        showAlert({ title: "Download Complete! 🎉", message: 'Poster successfully saved to your photo gallery.', type: 'success' });
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
      }
    } catch (e) {
      console.error(e);
      showAlert({ title: "Save Error", message: 'Could not render and export poster design.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const sharePoster = async () => {
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      const snapshot = canvasRef.current.makeImageSnapshot();
      if (!snapshot) throw new Error('Failed to generate snapshot');

      const b64 = snapshot.encodeToBase64();
      const fileUri = `${FileSystem.cacheDirectory}poster_share_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(fileUri, b64, { encoding: FileSystem.EncodingType.Base64 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'image/png' });
      }
    } catch (e) {
      console.error(e);
      showAlert({ title: "Share Error", message: 'Could not share poster design.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ---------- Gestures Selection & Dragging ----------
  const handleCanvasTap = (x: number, y: number) => {
    let clicked: Layer | null = null;
    // Walk list back-to-front (top layers first)
    for (let i = sortedLayers.length - 1; i >= 0; i--) {
      const layer = sortedLayers[i];
      let lw = 120;
      let lh = 80;

      if (layer.type === 'text') {
        const font = getLayerFont(layer);
        lw = font.measureText(layer.text || '').width;
        lh = font.measureText(layer.text || '').height;
        if (lw < 40) lw = 40;
        if (lh < 20) lh = 20;

        // Offset center logic
        const startX = layer.align === 'center' ? layer.x - lw / 2
          : layer.align === 'right' ? layer.x - lw : layer.x;
        const startY = layer.y - lh;

        if (x >= startX && x <= startX + lw && y >= startY && y <= startY + lh) {
          clicked = layer;
          break;
        }
      } else {
        const w = layer.type === 'shape' ? (layer.shapeWidth || 100) * layer.scale
          : (layer.imgWidth || 150) * layer.scale;
        const h = layer.type === 'shape' ? (layer.shapeHeight || 80) * layer.scale
          : (layer.imgHeight || 150) * layer.scale;

        const startX = layer.x - w / 2;
        const startY = layer.y - h / 2;

        if (x >= startX && x <= startX + w && y >= startY && y <= startY + h) {
          clicked = layer;
          break;
        }
      }
    }

    if (clicked) {
      setSelectedLayerId(clicked.id);
      setActiveTab('edit');
    } else {
      setSelectedLayerId(null);
    }
  };

  const canvasTap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      handleCanvasTap(e.x, e.y);
    });

  const canvasPan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(5)
    .onStart((e) => {
      handleCanvasTap(e.x, e.y);
      const current = layers.find(l => l.id === selectedLayerId);
      if (current && !current.locked) {
        saveStateToUndo(layers, background);
        dragStartPos.current = { x: current.x, y: current.y };
      }
    })
    .onChange((e) => {
      if (!selectedLayerId) return;
      const target = layers.find(l => l.id === selectedLayerId);
      if (!target || target.locked) return;
      const nextX = dragStartPos.current.x + e.translationX;
      const nextY = dragStartPos.current.y + e.translationY;
      setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, x: nextX, y: nextY } : l));
    });

  const canvasPinch = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => {
      if (!selectedLayerId) return;
      const target = layers.find(l => l.id === selectedLayerId);
      if (target && !target.locked) {
        pinchStartScale.current = target.scale;
      }
    })
    .onChange((e) => {
      if (!selectedLayerId) return;
      const target = layers.find(l => l.id === selectedLayerId);
      if (!target || target.locked) return;
      const newScale = Math.max(0.2, Math.min(5.0, pinchStartScale.current * e.scale));
      setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, scale: Math.round(newScale * 10) / 10 } : l));
    });

  const canvasGesture = Gesture.Race(canvasTap, Gesture.Simultaneous(canvasPan, canvasPinch));

  // ---------- Skia Layer Renderer ----------
  const renderSkiaLayer = (layer: Layer) => {
    const isSelected = layer.id === selectedLayerId;

    if (layer.type === 'shape') {
      const sw = (layer.shapeWidth || 100) * layer.scale;
      const sh = (layer.shapeHeight || 80) * layer.scale;
      const left = layer.x - sw / 2;
      const top = layer.y - sh / 2;

      return (
        <Group key={layer.id} opacity={layer.opacity}
          transform={[{ rotate: (layer.rotation * Math.PI) / 180 }]}
          origin={vec(layer.x, layer.y)}>
          {layer.shapeType === 'circle' ? (
            <Circle cx={layer.x} cy={layer.y} r={sw / 2}
              color={layer.fillColor || '#3B82F6'}>
              {layer.borderEnabled && (
                <Paint style="stroke" strokeWidth={layer.borderWidth || 2} color={layer.borderColor || '#000'} />
              )}
            </Circle>
          ) : layer.shapeType === 'round' ? (
            <RoundedRect x={left} y={top} width={sw} height={sh} r={16}
              color={layer.fillColor || '#3B82F6'}>
              {layer.borderEnabled && (
                <Paint style="stroke" strokeWidth={layer.borderWidth || 2} color={layer.borderColor || '#000'} />
              )}
            </RoundedRect>
          ) : (
            <Rect x={left} y={top} width={sw} height={sh}
              color={layer.fillColor || '#3B82F6'}>
              {layer.borderEnabled && (
                <Paint style="stroke" strokeWidth={layer.borderWidth || 2} color={layer.borderColor || '#000'} />
              )}
            </Rect>
          )}
          {isSelected && (
            <Rect x={left - 2} y={top - 2} width={sw + 4} height={sh + 4} color="transparent">
              <Paint style="stroke" strokeWidth={1.5} color="#3B82F6" />
            </Rect>
          )}
        </Group>
      );
    }

    if (layer.type === 'text') {
      const font = getLayerFont(layer);
      const textWidth = font.measureText(layer.text || '').width;
      const textHeight = font.measureText(layer.text || '').height;

      let startX = layer.x;
      if (layer.align === 'center') startX = layer.x - textWidth / 2;
      else if (layer.align === 'right') startX = layer.x - textWidth;

      const underlineY = layer.y + 4;
      const bgPadding = layer.bgPadding || 8;
      const bgX = startX - bgPadding;
      const bgY = layer.y - textHeight - bgPadding;
      const bgW = textWidth + bgPadding * 2;
      const bgH = textHeight + bgPadding * 2;

      return (
        <Group key={layer.id} opacity={layer.opacity}
          transform={[{ rotate: (layer.rotation * Math.PI) / 180 }]}
          origin={vec(layer.x, layer.y)}>

          {/* Text Background Pill */}
          {layer.bgColor && (
            <RoundedRect x={bgX} y={bgY} width={bgW} height={bgH} r={6} color={layer.bgColor} />
          )}

          {/* 3D drop shadow offset */}
          {(layer.shadow?.blur ?? 0) > 0 && (
            <SkText
              x={startX + (layer.shadow?.x || 0)}
              y={layer.y + (layer.shadow?.y || 0)}
              text={layer.text || ''}
              color={layer.shadow?.color || 'rgba(0,0,0,0.5)'}
              font={font}
            />
          )}

          {/* Stroke Outlining */}
          {(layer.strokeWidth ?? 0) > 0 && (
            <SkText
              x={startX}
              y={layer.y}
              text={layer.text || ''}
              font={font}
            >
              <Paint style="stroke" strokeWidth={layer.strokeWidth} color={layer.strokeColor || '#000'} />
            </SkText>
          )}

          {/* Core Text fill */}
          <SkText
            x={startX}
            y={layer.y}
            text={layer.text || ''}
            color={layer.color || '#FFF'}
            font={font}
          />

          {/* Text Underline */}
          {layer.underline && (
            <Rect x={startX} y={underlineY} width={textWidth} height={2} color={layer.color || '#FFF'} />
          )}

          {/* Selected border box */}
          {isSelected && (
            <Rect x={bgX} y={bgY} width={bgW} height={bgH} color="transparent">
              <Paint style="stroke" strokeWidth={1.5} color="#3B82F6" />
            </Rect>
          )}
        </Group>
      );
    }

    if (layer.type === 'image') {
      const iw = (layer.imgWidth || 150) * layer.scale;
      const ih = (layer.imgHeight || 150) * layer.scale;
      const left = layer.x - iw / 2;
      const top = layer.y - ih / 2;
      const img = skiaImages[layer.id];

      return (
        <Group key={layer.id} opacity={layer.opacity}
          transform={[{ rotate: (layer.rotation * Math.PI) / 180 }]}
          origin={vec(layer.x, layer.y)}>
          {img ? (
            <SkiaImage
              image={img}
              x={left} y={top}
              width={iw} height={ih}
              fit="cover"
            />
          ) : (
            <Rect x={left} y={top} width={iw} height={ih} color="#E2E8F0">
              <Paint style="stroke" strokeWidth={1} color="#94A3B8" />
            </Rect>
          )}
          {isSelected && (
            <Rect x={left - 2} y={top - 2} width={iw + 4} height={ih + 4} color="transparent">
              <Paint style="stroke" strokeWidth={1.5} color="#3B82F6" />
            </Rect>
          )}
        </Group>
      );
    }

    return null;
  };

  // ---------- Component Sub-panels ----------
  const renderBackgroundSubPanel = () => (
    <View style={styles.subPanel}>
      <Text style={styles.sectionTitle}>Solid Backgrounds</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
        <View style={styles.colorRow}>
          {COLORS.map(c => (
            <TouchableOpacity key={c}
              style={[styles.colorDot, { backgroundColor: c }, background.type === 'color' && background.value === c && styles.colorDotActive]}
              onPress={() => {
                saveStateToUndo(layers, background);
                setBackground({ type: 'color', value: c });
              }}
            />
          ))}
        </View>
      </ScrollView>

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Gradient Backgrounds</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.colorRow}>
          {GRADIENT_PRESETS.map((g, idx) => (
            <TouchableOpacity key={idx}
              style={[styles.gradientPill, background.type === 'gradient' && background.value === g.name && styles.gradientPillActive]}
              onPress={() => {
                saveStateToUndo(layers, background);
                setBackground({
                  type: 'gradient',
                  value: g.name,
                  gradient: { colors: g.colors, positions: g.colors.map((_, i) => i / (g.colors.length - 1)) },
                });
              }}
            >
              <View style={[styles.gradientPreview, { backgroundColor: g.colors[0] }]}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: g.colors[g.colors.length - 1], opacity: 0.6 }]} />
              </View>
              <Text style={styles.gradientName}>{g.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Background Image</Text>
      <TouchableOpacity style={styles.outlineActionBtn} onPress={triggerBgImage}>
        <ImageIcon color="#4F46E5" width={18} height={18} />
        <Text style={styles.outlineActionBtnText}>Choose Bg Photo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAddSubPanel = () => (
    <View style={styles.subPanel}>
      <Text style={styles.sectionTitle}>Add Layers</Text>
      <View style={styles.mainActionRow}>
        <ToolBtn label="Type Text" icon={<Type color="#4F46E5" width={22} height={22} />} onPress={openAddText} />
        <ToolBtn label="Add Photo" icon={<ImageIcon color="#4F46E5" width={22} height={22} />} onPress={triggerAddPhoto} />
        <ToolBtn label="Rectangle" icon={<Square color="#4F46E5" width={22} height={22} />} onPress={() => addShape('rect')} />
        <ToolBtn label="Rounded" icon={<Square color="#4F46E5" width={22} height={22} />} onPress={() => addShape('round')} />
        <ToolBtn label="Circle" icon={<CircleIcon color="#4F46E5" width={22} height={22} />} onPress={() => addShape('circle')} />
      </View>
    </View>
  );

  const renderLayersListPanel = () => (
    <View style={styles.subPanel}>
      <Text style={styles.sectionTitle}>Canvas Layers ({layers.length})</Text>
      <ScrollView style={{ maxHeight: 180 }}>
        {sortedLayers.length === 0 ? (
          <Text style={styles.emptyText}>No layers on canvas yet. Add some text or shapes!</Text>
        ) : (
          sortedLayers.map(l => (
            <View key={l.id} style={styles.layerListItem}>
              <Text style={styles.layerListLabel} numberOfLines={1}>
                {l.type.toUpperCase()}: {l.text || l.shapeType || 'Photo'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedLayerId(l.id)} style={[styles.layerListSelect, selectedLayerId === l.id && styles.layerListSelectActive]}>
                <Text style={{ fontSize: 11, color: selectedLayerId === l.id ? '#FFF' : '#4F46E5', fontFamily: 'Outfit-Bold' }}>
                  {selectedLayerId === l.id ? 'Selected' : 'Select'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteLayer(l.id)} style={{ padding: 4 }}>
                <Trash2 color="#EF4444" width={16} height={16} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  const renderEditSubPanel = () => {
    if (!selected) {
      return (
        <View style={styles.subPanel}>
          <Text style={styles.emptyText}>Select a layer on the canvas to configure styling options.</Text>
        </View>
      );
    }

    return (
      <View style={styles.subPanel}>
        {/* Universal controls */}
        <View style={styles.quickBar}>
          <MiniBtn icon={<Trash2 color="#EF4444" width={16} height={16} />} onPress={() => deleteLayer(selected.id)} />
          <MiniBtn icon={<Copy color="#4F46E5" width={16} height={16} />} onPress={duplicateLayer} />
          <MiniBtn icon={selected.locked ? <Lock color="#F97316" width={16} height={16} /> : <Unlock color="#64748B" width={16} height={16} />} onPress={toggleLock} />
          <MiniBtn icon={<ArrowUp color="#4F46E5" width={16} height={16} />} onPress={bringToFront} />
          <MiniBtn icon={<ArrowDown color="#4F46E5" width={16} height={16} />} onPress={sendToBack} />
          <MiniBtn icon={<Crosshair color="#4F46E5" width={16} height={16} />} onPress={centerLayer} />
        </View>

        {/* Sliders */}
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Scale: {selected.scale.toFixed(1)}x</Text>
          <Slider
            style={{ flex: 1 }}
            minimumValue={0.2} maximumValue={3.0}
            value={selected.scale}
            onValueChange={v => updateLayer(selected.id, { scale: Math.round(v * 10) / 10 })}
            minimumTrackTintColor="#4F46E5" thumbTintColor="#4F46E5"
            maximumTrackTintColor="#E2E8F0"
          />
        </View>

        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Rotate: {Math.round(selected.rotation)}°</Text>
          <Slider
            style={{ flex: 1 }}
            minimumValue={0} maximumValue={360}
            value={selected.rotation}
            onValueChange={v => updateLayer(selected.id, { rotation: Math.round(v) })}
            minimumTrackTintColor="#4F46E5" thumbTintColor="#4F46E5"
            maximumTrackTintColor="#E2E8F0"
          />
        </View>

        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Opacity: {Math.round(selected.opacity * 100)}%</Text>
          <Slider
            style={{ flex: 1 }}
            minimumValue={0.1} maximumValue={1}
            value={selected.opacity}
            onValueChange={v => updateLayer(selected.id, { opacity: v })}
            minimumTrackTintColor="#4F46E5" thumbTintColor="#4F46E5"
            maximumTrackTintColor="#E2E8F0"
          />
        </View>

        {/* Type Specific */}
        {selected.type === 'text' && renderTextCustomizers()}
        {selected.type === 'shape' && renderShapeCustomizers()}
        {selected.type === 'image' && renderImageCustomizers()}
      </View>
    );
  };

  const renderTextCustomizers = () => {
    if (!selected || selected.type !== 'text') return null;
    return (
      <View style={{ marginTop: 12 }}>
        <TouchableOpacity style={styles.editTextBtn} onPress={openEditText}>
          <Type color="#4F46E5" width={16} height={16} />
          <Text style={styles.editTextBtnText}>Change Text Content</Text>
        </TouchableOpacity>

        {/* Fonts registry dropdown */}
        <Text style={styles.labelTitle}>Font Family</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={styles.fontListRow}>
            {FONT_REGISTRY.map(f => (
              <TouchableOpacity key={f.value}
                style={[styles.fontChoiceBtn, selected.fontFamily === f.value && styles.fontChoiceBtnActive]}
                onPress={() => {
                  saveStateToUndo(layers, background);
                  updateLayer(selected.id, { fontFamily: f.value });
                }}
              >
                {downloadingFont === f.value ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                  <Text style={[styles.fontChoiceLabel, selected.fontFamily === f.value && styles.fontChoiceLabelActive]}>
                    {f.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Font Style Row */}
        <View style={styles.toggleRow}>
          <StyleToggle icon={<Bold color={selected.bold ? '#FFF' : '#64748B'} width={18} height={18} />} active={selected.bold ?? false} onPress={() => updateLayer(selected.id, { bold: !selected.bold })} />
          <StyleToggle icon={<Italic color={selected.italic ? '#FFF' : '#64748B'} width={18} height={18} />} active={selected.italic ?? false} onPress={() => updateLayer(selected.id, { italic: !selected.italic })} />
          <StyleToggle icon={<Underline color={selected.underline ? '#FFF' : '#64748B'} width={18} height={18} />} active={selected.underline ?? false} onPress={() => updateLayer(selected.id, { underline: !selected.underline })} />
          <View style={styles.vDivider} />
          <StyleToggle icon={<AlignLeft color={selected.align === 'left' ? '#FFF' : '#64748B'} width={18} height={18} />} active={selected.align === 'left'} onPress={() => updateLayer(selected.id, { align: 'left' })} />
          <StyleToggle icon={<AlignCenter color={selected.align === 'center' ? '#FFF' : '#64748B'} width={18} height={18} />} active={selected.align === 'center'} onPress={() => updateLayer(selected.id, { align: 'center' })} />
          <StyleToggle icon={<AlignRight color={selected.align === 'right' ? '#FFF' : '#64748B'} width={18} height={18} />} active={selected.align === 'right'} onPress={() => updateLayer(selected.id, { align: 'right' })} />
        </View>

        {/* Text color */}
        <Text style={styles.labelTitle}>Text Color</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
          <View style={styles.colorRow}>
            {COLORS.map(c => (
              <TouchableOpacity key={c}
                style={[styles.colorDot, { backgroundColor: c }, selected.color === c && styles.colorDotActive]}
                onPress={() => updateLayer(selected.id, { color: c })}
              />
            ))}
          </View>
        </ScrollView>

        {/* Background highlight */}
        <Text style={styles.labelTitle}>Pill Highlight Color</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
          <View style={styles.colorRow}>
            <TouchableOpacity
              style={[styles.colorDot, { backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }, !selected.bgColor && styles.colorDotActive]}
              onPress={() => updateLayer(selected.id, { bgColor: undefined })}
            >
              <X color="#EF4444" width={16} height={16} />
            </TouchableOpacity>
            {COLORS.map(c => (
              <TouchableOpacity key={c}
                style={[styles.colorDot, { backgroundColor: c }, selected.bgColor === c && styles.colorDotActive]}
                onPress={() => updateLayer(selected.id, { bgColor: c })}
              />
            ))}
          </View>
        </ScrollView>

        {/* Shadow & Outline sliders */}
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Border Outline: {selected.strokeWidth ?? 0}px</Text>
          <Slider
            style={{ flex: 1 }}
            minimumValue={0} maximumValue={8}
            value={selected.strokeWidth ?? 0}
            onValueChange={v => updateLayer(selected.id, { strokeWidth: Math.round(v) })}
            minimumTrackTintColor="#4F46E5" thumbTintColor="#4F46E5"
            maximumTrackTintColor="#E2E8F0"
          />
        </View>
        {Number(selected.strokeWidth) > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
            <View style={styles.colorRow}>
              {COLORS.map(c => (
                <TouchableOpacity key={c}
                  style={[styles.colorDot, { backgroundColor: c }, selected.strokeColor === c && styles.colorDotActive]}
                  onPress={() => updateLayer(selected.id, { strokeColor: c })}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    );
  };

  const renderShapeCustomizers = () => {
    if (!selected || selected.type !== 'shape') return null;
    return (
      <View style={{ marginTop: 12 }}>
        {/* Shape Type Switcher */}
        <Text style={styles.labelTitle}>Shape Type</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.fontChoiceBtn, selected.shapeType === 'rect' && styles.fontChoiceBtnActive]}
            onPress={() => updateLayer(selected.id, { shapeType: 'rect' })}
          >
            <Square color={selected.shapeType === 'rect' ? '#FFF' : '#475569'} width={16} height={16} />
            <Text style={[styles.fontChoiceLabel, { marginLeft: 4 }, selected.shapeType === 'rect' && styles.fontChoiceLabelActive]}>Rectangle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fontChoiceBtn, selected.shapeType === 'round' && styles.fontChoiceBtnActive]}
            onPress={() => updateLayer(selected.id, { shapeType: 'round' })}
          >
            <Square color={selected.shapeType === 'round' ? '#FFF' : '#475569'} width={16} height={16} />
            <Text style={[styles.fontChoiceLabel, { marginLeft: 4 }, selected.shapeType === 'round' && styles.fontChoiceLabelActive]}>Rounded</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fontChoiceBtn, selected.shapeType === 'circle' && styles.fontChoiceBtnActive]}
            onPress={() => updateLayer(selected.id, { shapeType: 'circle' })}
          >
            <CircleIcon color={selected.shapeType === 'circle' ? '#FFF' : '#475569'} width={16} height={16} />
            <Text style={[styles.fontChoiceLabel, { marginLeft: 4 }, selected.shapeType === 'circle' && styles.fontChoiceLabelActive]}>Circle</Text>
          </TouchableOpacity>
        </View>

        {/* Shape Dimensions */}
        <Text style={styles.labelTitle}>Dimensions</Text>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Width: {Math.round(selected.shapeWidth || 100)}px</Text>
          <Slider
            style={{ flex: 1 }}
            minimumValue={20} maximumValue={CANVAS_W}
            value={selected.shapeWidth || 100}
            onValueChange={v => {
              const newW = Math.round(v);
              if (selected.shapeType === 'circle') {
                updateLayer(selected.id, { shapeWidth: newW, shapeHeight: newW });
              } else {
                updateLayer(selected.id, { shapeWidth: newW });
              }
            }}
            minimumTrackTintColor="#4F46E5" thumbTintColor="#4F46E5"
            maximumTrackTintColor="#E2E8F0"
          />
        </View>
        {selected.shapeType !== 'circle' && (
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Height: {Math.round(selected.shapeHeight || 80)}px</Text>
            <Slider
              style={{ flex: 1 }}
              minimumValue={20} maximumValue={CANVAS_H}
              value={selected.shapeHeight || 80}
              onValueChange={v => updateLayer(selected.id, { shapeHeight: Math.round(v) })}
              minimumTrackTintColor="#4F46E5" thumbTintColor="#4F46E5"
              maximumTrackTintColor="#E2E8F0"
            />
          </View>
        )}

        {/* Fill Color */}
        <Text style={styles.labelTitle}>Fill Color</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
          <View style={styles.colorRow}>
            <TouchableOpacity
              style={[styles.colorDot, { backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }, selected.fillColor === 'transparent' && styles.colorDotActive]}
              onPress={() => updateLayer(selected.id, { fillColor: 'transparent' })}
            >
              <X color="#EF4444" width={14} height={14} />
            </TouchableOpacity>
            {COLORS.map(c => (
              <TouchableOpacity key={c}
                style={[styles.colorDot, { backgroundColor: c }, selected.fillColor === c && styles.colorDotActive]}
                onPress={() => updateLayer(selected.id, { fillColor: c })}
              />
            ))}
          </View>
        </ScrollView>

        {/* Border Controls */}
        <View style={[styles.toggleRow, { alignItems: 'center', marginVertical: 8, flexDirection: 'row' }]}>
          <Text style={[styles.labelTitle, { flex: 1 }]}>Border Outline</Text>
          <TouchableOpacity
            style={[styles.layerListSelect, selected.borderEnabled && styles.layerListSelectActive]}
            onPress={() => updateLayer(selected.id, { borderEnabled: !selected.borderEnabled })}
          >
            <Text style={{ fontSize: 11, color: selected.borderEnabled ? '#FFF' : '#4F46E5', fontFamily: 'Outfit-Bold' }}>
              {selected.borderEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {selected.borderEnabled && (
          <>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Border Width: {selected.borderWidth ?? 2}px</Text>
              <Slider
                style={{ flex: 1 }}
                minimumValue={1} maximumValue={12}
                value={selected.borderWidth ?? 2}
                onValueChange={v => updateLayer(selected.id, { borderWidth: Math.round(v) })}
                minimumTrackTintColor="#4F46E5" thumbTintColor="#4F46E5"
                maximumTrackTintColor="#E2E8F0"
              />
            </View>
            <Text style={styles.labelTitle}>Border Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
              <View style={styles.colorRow}>
                {COLORS.map(c => (
                  <TouchableOpacity key={c}
                    style={[styles.colorDot, { backgroundColor: c }, selected.borderColor === c && styles.colorDotActive]}
                    onPress={() => updateLayer(selected.id, { borderColor: c })}
                  />
                ))}
              </View>
            </ScrollView>
          </>
        )}
      </View>
    );
  };

  const renderImageCustomizers = () => {
    if (!selected || selected.type !== 'image') return null;
    return (
      <View style={{ marginTop: 12 }}>
        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={() => {
            if (selected.uri) {
              setCropSourceUri(selected.uri);
              setCropRotation(0);
              setCropRatio('free');
              setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
              setCropModalVisible(true);
            }
          }}
        >
          <Crop color="#4F46E5" width={18} height={18} />
          <Text style={styles.outlineActionBtnText}>Crop / Edit Photo</Text>
        </TouchableOpacity>

        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Width: {Math.round(selected.imgWidth || 150)}px</Text>
          <Slider
            style={{ flex: 1 }}
            minimumValue={50} maximumValue={CANVAS_W}
            value={selected.imgWidth || 150}
            onValueChange={v => {
              const newW = Math.round(v);
              updateLayer(selected.id, { imgWidth: newW });
            }}
            minimumTrackTintColor="#4F46E5" thumbTintColor="#4F46E5"
            maximumTrackTintColor="#E2E8F0"
          />
        </View>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Height: {Math.round(selected.imgHeight || 150)}px</Text>
          <Slider
            style={{ flex: 1 }}
            minimumValue={50} maximumValue={CANVAS_H}
            value={selected.imgHeight || 150}
            onValueChange={v => {
              const newH = Math.round(v);
              updateLayer(selected.id, { imgHeight: newH });
            }}
            minimumTrackTintColor="#4F46E5" thumbTintColor="#4F46E5"
            maximumTrackTintColor="#E2E8F0"
          />
        </View>
      </View>
    );
  };

  // ---------- Render ----------
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Top Header Controls */}
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={handleUndo} disabled={undoStack.length === 0} style={[styles.iconToolBtn, undoStack.length === 0 && styles.disabledBtn]}>
            <RotateCcw color={undoStack.length > 0 ? '#1E293B' : '#94A3B8'} width={18} height={18} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRedo} disabled={redoStack.length === 0} style={[styles.iconToolBtn, redoStack.length === 0 && styles.disabledBtn]}>
            <RotateCw color={redoStack.length > 0 ? '#1E293B' : '#94A3B8'} width={18} height={18} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          {selectedLayerId && (
            <TouchableOpacity onPress={() => setSelectedLayerId(null)} style={styles.deselectBtn}>
              <Text style={styles.deselectBtnText}>Deselect</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Canvas Display */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <View style={styles.canvasContainer}>
            <GestureDetector gesture={canvasGesture}>
              <View style={styles.canvasBorder}>
                <Canvas ref={canvasRef} style={{ width: CANVAS_W, height: CANVAS_H }}>
                  {/* Color Background */}
                  {background.type === 'color' && (
                    <Rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} color={background.value} />
                  )}

                  {/* Gradient Background */}
                  {background.type === 'gradient' && background.gradient && (
                    <Rect x={0} y={0} width={CANVAS_W} height={CANVAS_H}>
                      <LinearGradient
                        start={vec(0, 0)} end={vec(CANVAS_W, CANVAS_H)}
                        colors={background.gradient.colors}
                        positions={background.gradient.positions}
                      />
                    </Rect>
                  )}

                  {/* Image Background */}
                  {background.type === 'image' && skiaImages['background'] && (
                    <SkiaImage
                      image={skiaImages['background']}
                      x={0} y={0}
                      width={CANVAS_W} height={CANVAS_H}
                      fit="cover"
                    />
                  )}

                  {/* Layers drawing loop */}
                  {sortedLayers.map(renderSkiaLayer)}
                </Canvas>
              </View>
            </GestureDetector>
            <Text style={styles.canvasHint}>Tap layer to select • Drag to position on canvas</Text>
          </View>

          {/* Controls Hub Tab Bar */}
          <View style={styles.panelTabs}>
            <TouchableOpacity style={[styles.panelTab, activeTab === 'add' && styles.panelTabActive]} onPress={() => setActiveTab('add')}>
              <Plus color={activeTab === 'add' ? '#4F46E5' : '#64748B'} width={18} height={18} />
              <Text style={[styles.panelTabText, activeTab === 'add' && styles.panelTabTextActive]}>Add Layer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.panelTab, activeTab === 'edit' && styles.panelTabActive]} onPress={() => setActiveTab('edit')}>
              <Sparkles color={activeTab === 'edit' ? '#4F46E5' : '#64748B'} width={18} height={18} />
              <Text style={[styles.panelTabText, activeTab === 'edit' && styles.panelTabTextActive]}>Edit Layer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.panelTab, activeTab === 'background' && styles.panelTabActive]} onPress={() => setActiveTab('background')}>
              <Palette color={activeTab === 'background' ? '#4F46E5' : '#64748B'} width={18} height={18} />
              <Text style={[styles.panelTabText, activeTab === 'background' && styles.panelTabTextActive]}>Background</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.panelTab, activeTab === 'layers' && styles.panelTabActive]} onPress={() => setActiveTab('layers')}>
              <AlignLeft color={activeTab === 'layers' ? '#4F46E5' : '#64748B'} width={18} height={18} />
              <Text style={[styles.panelTabText, activeTab === 'layers' && styles.panelTabTextActive]}>Layers</Text>
            </TouchableOpacity>
          </View>

          {/* Settings Panels */}
          <View style={styles.tabContentBlock}>
            {activeTab === 'add' && renderAddSubPanel()}
            {activeTab === 'edit' && renderEditSubPanel()}
            {activeTab === 'background' && renderBackgroundSubPanel()}
            {activeTab === 'layers' && renderLayersListPanel()}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footerBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <TouchableOpacity style={styles.saveBtn} onPress={() => handleActionWithAd(saveToGallery)} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#FFF" /> : (
              <>
                <Download color="#FFF" width={18} height={18} />
                <Text style={styles.saveBtnLabel}>Save Poster</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={() => handleActionWithAd(sharePoster)} disabled={saving}>
            <Share2 color="#4F46E5" width={18} height={18} />
            <Text style={styles.shareBtnLabel}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Add/Edit Text Modal */}
        <Modal visible={showTextModal} animationType="slide" transparent>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>{editingTextId ? 'Edit Layer Text' : 'New Text Layer'}</Text>
                <TouchableOpacity onPress={() => setShowTextModal(false)}>
                  <X color="#475569" width={22} height={22} />
                </TouchableOpacity>
              </View>
              <TextInput
                value={draftText}
                onChangeText={setDraftText}
                placeholder="Enter custom text..."
                style={styles.modalInput}
                multiline
                autoFocus
              />
              <View style={styles.modalBtnsRow}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowTextModal(false)}>
                  <Text style={styles.modalCancelBtnLabel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmText}>
                  <Text style={styles.modalConfirmBtnLabel}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Advanced Crop Modal */}
        <Modal visible={cropModalVisible} animationType="slide" transparent>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { height: '85%' }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Crop Image</Text>
                <TouchableOpacity onPress={() => setCropModalVisible(false)}>
                  <X color="#475569" width={22} height={22} />
                </TouchableOpacity>
              </View>

              {cropSourceUri ? (
                <CropOverlay
                  imageUri={cropSourceUri}
                  cropBox={cropBox}
                  onCropChange={setCropBox}
                  cropRatio={cropRatio}
                />
              ) : null}

              {/* Aspect Presets & Rotations */}
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 12, marginBottom: 16 }}>
                <TouchableOpacity
                  style={[styles.layerListSelect, cropRatio === 'free' && styles.layerListSelectActive]}
                  onPress={() => {
                    setCropRatio('free');
                  }}
                >
                  <Text style={{ fontSize: 11, color: cropRatio === 'free' ? '#FFF' : '#4F46E5' }}>Free</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.layerListSelect, cropRatio === '1:1' && styles.layerListSelectActive]}
                  onPress={() => {
                    setCropRatio('1:1');
                    setCropBox(prev => {
                      const size = Math.min(prev.w, prev.h, 1 - prev.x, 1 - prev.y);
                      return { ...prev, w: size, h: size };
                    });
                  }}
                >
                  <Text style={{ fontSize: 11, color: cropRatio === '1:1' ? '#FFF' : '#4F46E5' }}>1:1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.layerListSelect, cropRatio === '4:3' && styles.layerListSelectActive]}
                  onPress={() => {
                    setCropRatio('4:3');
                    setCropBox(prev => {
                      const w = Math.min(prev.w, 1 - prev.x);
                      const h = Math.min(w * 0.75, 1 - prev.y);
                      return { ...prev, w, h };
                    });
                  }}
                >
                  <Text style={{ fontSize: 11, color: cropRatio === '4:3' ? '#FFF' : '#4F46E5' }}>4:3</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.layerListSelect, cropRatio === '16:9' && styles.layerListSelectActive]}
                  onPress={() => {
                    setCropRatio('16:9');
                    setCropBox(prev => {
                      const w = Math.min(prev.w, 1 - prev.x);
                      const h = Math.min(w * (9 / 16), 1 - prev.y);
                      return { ...prev, w, h };
                    });
                  }}
                >
                  <Text style={{ fontSize: 11, color: cropRatio === '16:9' ? '#FFF' : '#4F46E5' }}>16:9</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.layerListSelect}
                  onPress={() => setCropRotation(r => ((r + 90) % 360) as any)}
                >
                  <RotateCw color="#4F46E5" width={12} height={12} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, color: '#4F46E5' }}>Rotate {cropRotation}°</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBtnsRow}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCropModalVisible(false)}>
                  <Text style={styles.modalCancelBtnLabel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmCrop}>
                  <Text style={styles.modalConfirmBtnLabel}>Apply Crop</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ---------- Interactive Crop Overlay Component ----------
const HANDLE_SIZE = 24;
const HANDLE_HIT = 36; // larger hit area
const MIN_CROP = 0.15; // minimum 15% in any dimension

interface CropOverlayProps {
  imageUri: string;
  cropBox: { x: number; y: number; w: number; h: number };
  onCropChange: React.Dispatch<React.SetStateAction<{ x: number; y: number; w: number; h: number }>>;
  cropRatio: 'free' | '1:1' | '4:3' | '16:9';
}

const CropOverlay = ({ imageUri, cropBox, onCropChange, cropRatio }: CropOverlayProps) => {
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });
  const dragRef = React.useRef({ startBox: cropBox, type: '' as string });
  const cropBoxRef = React.useRef(cropBox);

  React.useEffect(() => {
    cropBoxRef.current = cropBox;
  }, [cropBox]);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });
  };

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const enforceRatio = (box: typeof cropBox, anchor: 'w' | 'h') => {
    if (cropRatio === 'free') return box;
    const ratioMap = { '1:1': 1, '4:3': 4 / 3, '16:9': 16 / 9 };
    const r = ratioMap[cropRatio];
    if (anchor === 'w') {
      const newH = box.w / r;
      return { ...box, h: clamp(newH, MIN_CROP, 1 - box.y) };
    } else {
      const newW = box.h * r;
      return { ...box, w: clamp(newW, MIN_CROP, 1 - box.x) };
    }
  };

  // Create PanResponder for the entire crop area
  const createHandleResponder = (handleType: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragRef.current = { startBox: { ...cropBoxRef.current }, type: handleType };
      },
      onPanResponderMove: (_, gesture) => {
        if (containerSize.width === 0 || containerSize.height === 0) return;
        const dx = gesture.dx / containerSize.width;
        const dy = gesture.dy / containerSize.height;
        const s = dragRef.current.startBox;
        let newBox = { ...s };

        switch (handleType) {
          case 'move': {
            newBox.x = clamp(s.x + dx, 0, 1 - s.w);
            newBox.y = clamp(s.y + dy, 0, 1 - s.h);
            break;
          }
          case 'tl': {
            const nx = clamp(s.x + dx, 0, s.x + s.w - MIN_CROP);
            const ny = clamp(s.y + dy, 0, s.y + s.h - MIN_CROP);
            newBox = { x: nx, y: ny, w: s.x + s.w - nx, h: s.y + s.h - ny };
            newBox = enforceRatio(newBox, 'w');
            break;
          }
          case 'tr': {
            const nw = clamp(s.w + dx, MIN_CROP, 1 - s.x);
            const ny = clamp(s.y + dy, 0, s.y + s.h - MIN_CROP);
            newBox = { x: s.x, y: ny, w: nw, h: s.y + s.h - ny };
            newBox = enforceRatio(newBox, 'w');
            break;
          }
          case 'bl': {
            const nx = clamp(s.x + dx, 0, s.x + s.w - MIN_CROP);
            const nh = clamp(s.h + dy, MIN_CROP, 1 - s.y);
            newBox = { x: nx, y: s.y, w: s.x + s.w - nx, h: nh };
            newBox = enforceRatio(newBox, 'w');
            break;
          }
          case 'br': {
            newBox.w = clamp(s.w + dx, MIN_CROP, 1 - s.x);
            newBox.h = clamp(s.h + dy, MIN_CROP, 1 - s.y);
            newBox = enforceRatio(newBox, 'w');
            break;
          }
          case 'top': {
            const ny = clamp(s.y + dy, 0, s.y + s.h - MIN_CROP);
            newBox = { ...s, y: ny, h: s.y + s.h - ny };
            if (cropRatio !== 'free') newBox = enforceRatio(newBox, 'h');
            break;
          }
          case 'bottom': {
            newBox.h = clamp(s.h + dy, MIN_CROP, 1 - s.y);
            if (cropRatio !== 'free') newBox = enforceRatio(newBox, 'h');
            break;
          }
          case 'left': {
            const nx = clamp(s.x + dx, 0, s.x + s.w - MIN_CROP);
            newBox = { ...s, x: nx, w: s.x + s.w - nx };
            if (cropRatio !== 'free') newBox = enforceRatio(newBox, 'w');
            break;
          }
          case 'right': {
            newBox.w = clamp(s.w + dx, MIN_CROP, 1 - s.x);
            if (cropRatio !== 'free') newBox = enforceRatio(newBox, 'w');
            break;
          }
        }
        onCropChange(newBox);
      },
    });
  };

  const moveResponder = React.useMemo(() => createHandleResponder('move'), [containerSize.width, containerSize.height, cropRatio]);
  const tlResponder = React.useMemo(() => createHandleResponder('tl'), [containerSize.width, containerSize.height, cropRatio]);
  const trResponder = React.useMemo(() => createHandleResponder('tr'), [containerSize.width, containerSize.height, cropRatio]);
  const blResponder = React.useMemo(() => createHandleResponder('bl'), [containerSize.width, containerSize.height, cropRatio]);
  const brResponder = React.useMemo(() => createHandleResponder('br'), [containerSize.width, containerSize.height, cropRatio]);
  const topResponder = React.useMemo(() => createHandleResponder('top'), [containerSize.width, containerSize.height, cropRatio]);
  const bottomResponder = React.useMemo(() => createHandleResponder('bottom'), [containerSize.width, containerSize.height, cropRatio]);
  const leftResponder = React.useMemo(() => createHandleResponder('left'), [containerSize.width, containerSize.height, cropRatio]);
  const rightResponder = React.useMemo(() => createHandleResponder('right'), [containerSize.width, containerSize.height, cropRatio]);

  const cw = containerSize.width;
  const ch = containerSize.height;
  const bx = cropBox.x * cw;
  const by = cropBox.y * ch;
  const bw = cropBox.w * cw;
  const bh = cropBox.h * ch;

  return (
    <View style={cropStyles.container} onLayout={onLayout}>
      <RNImage source={{ uri: imageUri }} style={cropStyles.image} />

      {cw > 0 && (
        <>
          {/* Dark overlay masks — 4 rectangles around the crop area */}
          <View style={[cropStyles.mask, { left: 0, top: 0, width: bx, height: ch }]} />
          <View style={[cropStyles.mask, { left: bx + bw, top: 0, right: 0, height: ch }]} />
          <View style={[cropStyles.mask, { left: bx, top: 0, width: bw, height: by }]} />
          <View style={[cropStyles.mask, { left: bx, top: by + bh, width: bw, bottom: 0 }]} />

          {/* Crop border */}
          <View style={[cropStyles.cropBorder, { left: bx, top: by, width: bw, height: bh }]}>
            {/* Rule of thirds grid */}
            <View style={[cropStyles.gridLineH, { top: '33.33%' }]} />
            <View style={[cropStyles.gridLineH, { top: '66.66%' }]} />
            <View style={[cropStyles.gridLineV, { left: '33.33%' }]} />
            <View style={[cropStyles.gridLineV, { left: '66.66%' }]} />
          </View>

          {/* Move area (center of crop box) */}
          <View
            style={{ position: 'absolute', left: bx + HANDLE_SIZE / 2, top: by + HANDLE_SIZE / 2, width: Math.max(0, bw - HANDLE_SIZE), height: Math.max(0, bh - HANDLE_SIZE) }}
            {...moveResponder.panHandlers}
          />

          {/* Corner handles */}
          <View style={[cropStyles.cornerHandle, { left: bx - HANDLE_HIT / 2, top: by - HANDLE_HIT / 2 }]} {...tlResponder.panHandlers}>
            <View style={[cropStyles.cornerVisual, cropStyles.cornerTL]} />
          </View>
          <View style={[cropStyles.cornerHandle, { left: bx + bw - HANDLE_HIT / 2, top: by - HANDLE_HIT / 2 }]} {...trResponder.panHandlers}>
            <View style={[cropStyles.cornerVisual, cropStyles.cornerTR]} />
          </View>
          <View style={[cropStyles.cornerHandle, { left: bx - HANDLE_HIT / 2, top: by + bh - HANDLE_HIT / 2 }]} {...blResponder.panHandlers}>
            <View style={[cropStyles.cornerVisual, cropStyles.cornerBL]} />
          </View>
          <View style={[cropStyles.cornerHandle, { left: bx + bw - HANDLE_HIT / 2, top: by + bh - HANDLE_HIT / 2 }]} {...brResponder.panHandlers}>
            <View style={[cropStyles.cornerVisual, cropStyles.cornerBR]} />
          </View>

          {/* Edge handles (midpoints) */}
          <View style={[cropStyles.edgeHandle, { left: bx + bw / 2 - 16, top: by - 8, width: 32, height: 16 }]} {...topResponder.panHandlers}>
            <View style={cropStyles.edgeLine} />
          </View>
          <View style={[cropStyles.edgeHandle, { left: bx + bw / 2 - 16, top: by + bh - 8, width: 32, height: 16 }]} {...bottomResponder.panHandlers}>
            <View style={cropStyles.edgeLine} />
          </View>
          <View style={[cropStyles.edgeHandle, { left: bx - 8, top: by + bh / 2 - 16, width: 16, height: 32 }]} {...leftResponder.panHandlers}>
            <View style={[cropStyles.edgeLine, { width: 4, height: 20 }]} />
          </View>
          <View style={[cropStyles.edgeHandle, { left: bx + bw - 8, top: by + bh / 2 - 16, width: 16, height: 32 }]} {...rightResponder.panHandlers}>
            <View style={[cropStyles.edgeLine, { width: 4, height: 20 }]} />
          </View>
        </>
      )}
    </View>
  );
};

const cropStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mask: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  cropBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  cornerHandle: {
    position: 'absolute',
    width: HANDLE_HIT,
    height: HANDLE_HIT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cornerVisual: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFFFFF',
  },
  cornerTL: { borderTopWidth: 3, borderLeftWidth: 3, top: HANDLE_HIT / 2 - 2, left: HANDLE_HIT / 2 - 2 },
  cornerTR: { borderTopWidth: 3, borderRightWidth: 3, top: HANDLE_HIT / 2 - 2, right: HANDLE_HIT / 2 - 2 },
  cornerBL: { borderBottomWidth: 3, borderLeftWidth: 3, bottom: HANDLE_HIT / 2 - 2, left: HANDLE_HIT / 2 - 2 },
  cornerBR: { borderBottomWidth: 3, borderRightWidth: 3, bottom: HANDLE_HIT / 2 - 2, right: HANDLE_HIT / 2 - 2 },
  edgeHandle: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  edgeLine: {
    width: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});

// ---------- Inner Subcomponents ----------
const ToolBtn = ({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) => (
  <TouchableOpacity style={styles.toolBtn} onPress={onPress} activeOpacity={0.8}>
    {icon}
    <Text style={styles.toolBtnLabel}>{label}</Text>
  </TouchableOpacity>
);

const MiniBtn = ({ icon, onPress }: { icon: React.ReactNode; onPress: () => void }) => (
  <TouchableOpacity style={styles.miniBtn} onPress={onPress} activeOpacity={0.8}>
    {icon}
  </TouchableOpacity>
);

const StyleToggle = ({ icon, active, onPress }: { icon: React.ReactNode; active: boolean; onPress: () => void }) => (
  <TouchableOpacity style={[styles.styleToggle, active && styles.styleToggleActive]} onPress={onPress} activeOpacity={0.8}>
    {icon}
  </TouchableOpacity>
);

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Top header action bar
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  iconToolBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  deselectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  deselectBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#4F46E5',
  },
  disabledBtn: {
    opacity: 0.5,
  },

  // Canvas
  canvasContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  canvasBorder: {
    width: CANVAS_W,
    height: CANVAS_H,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: '#1E293B',
  },
  canvasHint: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    color: '#94A3B8',
    marginTop: 10,
  },

  // Panel layout
  panelTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  panelTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  panelTabActive: {
    backgroundColor: '#EEF2FF',
  },
  panelTabText: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    color: '#64748B',
  },
  panelTabTextActive: {
    color: '#4F46E5',
  },

  tabContentBlock: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  subPanel: {},
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#334155',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  mainActionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  toolBtn: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    width: (SCREEN_W - 80) / 4,
  },
  toolBtnLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-SemiBold',
    color: '#475569',
  },

  quickBar: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  miniBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },

  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  sliderLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
    color: '#64748B',
    width: 100,
  },

  labelTitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#64748B',
    marginTop: 8,
    marginBottom: 6,
  },

  toggleRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 8,
  },
  styleToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 38,
    alignItems: 'center',
  },
  styleToggleActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  vDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
    alignSelf: 'center',
  },

  colorScroll: { marginBottom: 6 },
  colorRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  colorDotActive: {
    borderWidth: 2.5,
    borderColor: '#4F46E5',
  },

  gradientPill: {
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 3,
  },
  gradientPillActive: { borderColor: '#4F46E5' },
  gradientPreview: { width: 44, height: 44, borderRadius: 8, overflow: 'hidden' },
  gradientName: {
    fontSize: 9,
    fontFamily: 'Outfit-SemiBold',
    color: '#64748B',
    marginTop: 4,
  },

  fontListRow: { flexDirection: 'row', gap: 6 },
  fontChoiceBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fontChoiceBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  fontChoiceLabel: { fontSize: 11, fontFamily: 'Outfit-Medium', color: '#475569' },
  fontChoiceLabelActive: { color: '#FFF' },

  editTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  editTextBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#4F46E5',
  },

  outlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
    backgroundColor: '#F8FAFC',
  },
  outlineActionBtnText: { fontSize: 13, fontFamily: 'Outfit-Bold', color: '#4F46E5' },

  layerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    gap: 8,
  },
  layerListLabel: { flex: 1, fontSize: 12, fontFamily: 'Outfit-SemiBold', color: '#475569' },
  layerListSelect: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
  },
  layerListSelectActive: { backgroundColor: '#4F46E5' },
  emptyText: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: 12,
  },

  // Footer Actions
  footerBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnLabel: { color: '#FFF', fontSize: 15, fontFamily: 'Outfit-Bold' },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
  },
  shareBtnLabel: { color: '#4F46E5', fontSize: 15, fontFamily: 'Outfit-Bold' },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Outfit-Bold', color: '#0F172A' },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: '#0F172A',
    minHeight: 100,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalBtnsRow: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  modalCancelBtnLabel: { fontSize: 14, fontFamily: 'Outfit-Bold', color: '#64748B' },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  modalConfirmBtnLabel: { fontSize: 14, fontFamily: 'Outfit-Bold', color: '#FFF' },
});
