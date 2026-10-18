import React, { useRef, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, PanResponder, ActivityIndicator, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { Image as SvgImage, Defs, Filter, FeColorMatrix } from 'react-native-svg';
import { Share2, ZoomIn, ZoomOut, Sun, Droplet, Contrast } from 'lucide-react-native';
import { usePassport } from './PassportContext';
import { styles } from './styles';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadFile } from '../../../../../api/client';
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system/legacy';
import { useAlert } from '../../../../../context/AlertContext';

export default function Step3CropAdjust() {
  const {
    imageUri, imageWidth, imageHeight,
    layoutDims, setLayoutDims,
    crop, setCrop,
    cropRef,
    sizePreset, customWidth, customHeight,
    activeAdjustment, setActiveAdjustment,
    zoom, setZoom,
    brightness, setBrightness,
    saturation, setSaturation,
    contrast, setContrast,
    setStep,
    setCroppedUri, setBgRemovedUri,
    isRemovingBg, setIsRemovingBg
  } = usePassport();

  const { showAlert } = useAlert();

  const stateRef = useRef({ crop, layoutDims, sizePreset, customWidth, customHeight });
  useEffect(() => {
    stateRef.current = { crop, layoutDims, sizePreset, customWidth, customHeight };
  }, [crop, layoutDims, sizePreset, customWidth, customHeight]);

  const onImageLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout;
    setLayoutDims({ width, height });
    
    let targetRatio = 3.5 / 4.5;
    if (sizePreset === 'usa') targetRatio = 1;
    else if (sizePreset === 'canada') targetRatio = 5 / 7;
    else if (sizePreset === 'custom') {
       const cw = parseFloat(customWidth) || 3.5;
       const ch = parseFloat(customHeight) || 4.5;
       targetRatio = cw / ch;
    }
    
    let boxWidth = width * 0.8;
    let boxHeight = boxWidth / targetRatio;
    
    if (boxHeight > height * 0.8) {
      boxHeight = height * 0.8;
      boxWidth = boxHeight * targetRatio;
    }
    
    const initialCrop = {
      x: (width - boxWidth) / 2,
      y: (height - boxHeight) / 2,
      width: boxWidth,
      height: boxHeight,
    };
    setCrop(initialCrop);
    cropRef.current = initialCrop;
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !isRemovingBg,
    onMoveShouldSetPanResponder: () => !isRemovingBg,
    onPanResponderGrant: () => {
      cropRef.current = { ...stateRef.current.crop };
    },
    onPanResponderMove: (evt, gestureState) => {
      const { layoutDims } = stateRef.current;
      let newX = cropRef.current.x + gestureState.dx;
      let newY = cropRef.current.y + gestureState.dy;
      
      newX = Math.max(0, Math.min(layoutDims.width - cropRef.current.width, newX));
      newY = Math.max(0, Math.min(layoutDims.height - cropRef.current.height, newY));
      
      setCrop((prev: any) => ({ ...prev, x: newX, y: newY }));
    },
  }), [isRemovingBg]);

  const resizeResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !isRemovingBg,
    onMoveShouldSetPanResponder: () => !isRemovingBg,
    onPanResponderGrant: () => {
      cropRef.current = { ...stateRef.current.crop };
    },
    onPanResponderMove: (evt, gestureState) => {
      const { layoutDims, sizePreset, customWidth, customHeight } = stateRef.current;
      
      let targetRatio = 3.5 / 4.5;
      if (sizePreset === 'usa') targetRatio = 1;
      else if (sizePreset === 'canada') targetRatio = 5 / 7;
      else if (sizePreset === 'custom') {
         const cw = parseFloat(customWidth) || 3.5;
         const ch = parseFloat(customHeight) || 4.5;
         targetRatio = cw / ch;
      }
      
      let requestedWidth = cropRef.current.width + gestureState.dx;
      let requestedHeight = cropRef.current.height + gestureState.dy;
      
      let newWidth;
      if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
          newWidth = requestedWidth;
      } else {
          newWidth = requestedHeight * targetRatio;
      }
      
      newWidth = Math.max(50, newWidth);
      newWidth = Math.min(layoutDims.width - cropRef.current.x, newWidth);
      
      let newHeight = newWidth / targetRatio;
      
      if (cropRef.current.y + newHeight > layoutDims.height) {
        newHeight = layoutDims.height - cropRef.current.y;
        newWidth = newHeight * targetRatio;
      }
      
      setCrop((prev: any) => ({ ...prev, width: newWidth, height: newHeight }));
    },
  }), [isRemovingBg]);

  const handleZoomIn = () => {
    if(isRemovingBg) return;
    setCrop((prev: any) => {
        const scale = 0.9;
        const newW = prev.width * scale;
        const newH = prev.height * scale;
        const newX = prev.x + (prev.width - newW) / 2;
        const newY = prev.y + (prev.height - newH) / 2;
        return { x: newX, y: newY, width: newW, height: newH };
    });
  };

  const handleZoomOut = () => {
    if(isRemovingBg) return;
    setCrop((prev: any) => {
        const scale = 1.1;
        let newW = prev.width * scale;
        let newH = prev.height * scale;
        
        if (newW > layoutDims.width) {
            newW = layoutDims.width;
            newH = newW / (prev.width/prev.height);
        }
        if (newH > layoutDims.height) {
            newH = layoutDims.height;
            newW = newH * (prev.width/prev.height);
        }
        
        let newX = prev.x - (newW - prev.width) / 2;
        let newY = prev.y - (newH - prev.height) / 2;
        
        newX = Math.max(0, Math.min(layoutDims.width - newW, newX));
        newY = Math.max(0, Math.min(layoutDims.height - newH, newY));
        
        return { x: newX, y: newY, width: newW, height: newH };
    });
  };

  const sliderConfig = {
    brightness: { min: 0, max: 2, default: 1 },
    saturation: { min: 0, max: 2, default: 1 },
    contrast: { min: 0, max: 2, default: 1 },
  };

  const getActiveVal = () => {
    if (activeAdjustment === 'brightness') return brightness;
    if (activeAdjustment === 'saturation') return saturation;
    if (activeAdjustment === 'contrast') return contrast;
    return 1;
  };

  const handleSliderChange = (val: number) => {
    if (activeAdjustment === 'brightness') setBrightness(val);
    if (activeAdjustment === 'saturation') setSaturation(val);
    if (activeAdjustment === 'contrast') setContrast(val);
  };

  const handleResetActive = () => {
    if (activeAdjustment === 'brightness') setBrightness(1);
    if (activeAdjustment === 'saturation') setSaturation(1);
    if (activeAdjustment === 'contrast') setContrast(1);
  };

  const getActiveLabel = () => {
    if (activeAdjustment === 'brightness') return 'Brightness';
    if (activeAdjustment === 'saturation') return 'Saturation';
    if (activeAdjustment === 'contrast') return 'Contrast';
    return '';
  };

  const getActiveIcon = (color: string) => {
    if (activeAdjustment === 'brightness') return <Sun color={color} width={20} height={20} />;
    if (activeAdjustment === 'saturation') return <Droplet color={color} width={20} height={20} />;
    if (activeAdjustment === 'contrast') return <Contrast color={color} width={20} height={20} />;
    return null;
  };

  const bounds = activeAdjustment !== 'zoom' ? sliderConfig[activeAdjustment as keyof typeof sliderConfig] : { min: 0, max: 1 };

  const handleSaveAndNext = async () => {
    if (!imageUri) return;
    setIsRemovingBg(true);
    let finalCroppedUri = imageUri;
    
    // 1. Perform Local Crop exactly like Step 4 used to do
    const containerAspect = layoutDims.width / layoutDims.height;
    const imageAspect = imageWidth / imageHeight;

    let renderedWidth = layoutDims.width;
    let renderedHeight = layoutDims.height;
    let offsetX = 0;
    let offsetY = 0;

    if (imageAspect > containerAspect) {
      renderedWidth = layoutDims.width;
      renderedHeight = renderedWidth / imageAspect;
      offsetY = (layoutDims.height - renderedHeight) / 2;
    } else {
      renderedHeight = layoutDims.height;
      renderedWidth = renderedHeight * imageAspect;
      offsetX = (layoutDims.width - renderedWidth) / 2;
    }

    const scale = imageWidth / renderedWidth;
    
    let cropX = (crop.x - offsetX) * scale;
    let cropY = (crop.y - offsetY) * scale;
    let cropW = crop.width * scale;
    let cropH = crop.height * scale;

    cropX = Math.max(0, cropX);
    cropY = Math.max(0, cropY);
    if (cropX + cropW > imageWidth) cropW = imageWidth - cropX;
    if (cropY + cropH > imageHeight) cropH = imageHeight - cropY;

    let croppedResultUri = imageUri;
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } }
        ],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      croppedResultUri = manipResult.uri;
      setCroppedUri(manipResult.uri);

      // 2. Upload to Background Removal API
      const fileName = manipResult.uri.split('/').pop() || 'image.jpg';
      const arrayBuffer = await uploadFile('/api/image/remove-bg', manipResult.uri, fileName, 'image/jpeg', { mode: 'auto' });
      
      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const ext = 'png'; // BG removed is usually PNG
      const tempUri = `${FileSystem.cacheDirectory}bg_removed_${Date.now()}.${ext}`;
      await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      
      setBgRemovedUri(tempUri);
      setStep(4);
    } catch (error) {
      console.log("Backend offline, using cropped photo fallback for background step");
      setBgRemovedUri(croppedResultUri);
      setStep(4);
    } finally {
      setIsRemovingBg(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitlePurple}>Crop Face</Text>
      
      <View style={styles.cropContainer} onLayout={onImageLayout}>
        <Svg width="100%" height="100%" style={{ opacity: isRemovingBg ? 0.4 : 1 }}>
          <Defs>
            <Filter id="adjustmentsFilter">
              <FeColorMatrix type="saturate" values={saturation.toString()} result="sat" />
              <FeColorMatrix 
                type="matrix" 
                values={`${contrast * brightness} 0 0 0 ${0.5 * (1.0 - contrast)}
                        0 ${contrast * brightness} 0 0 ${0.5 * (1.0 - contrast)}
                        0 0 ${contrast * brightness} 0 ${0.5 * (1.0 - contrast)}
                        0 0 0 1 0`}
                in="sat"
              />
            </Filter>
          </Defs>
          <SvgImage 
            href={imageUri ? { uri: imageUri } : undefined} 
            width="100%" 
            height="100%" 
            preserveAspectRatio="xMidYMid meet"
            filter="url(#adjustmentsFilter)"
          />
        </Svg>

        {layoutDims.width > 0 && (
          <View 
            style={[
              styles.interactiveCropBox, 
              { left: crop.x, top: crop.y, width: crop.width, height: crop.height, opacity: isRemovingBg ? 0.3 : 1 }
            ]}
          >
            <View style={styles.dragOverlay} {...panResponder.panHandlers} />
            <View style={[styles.handle, { top: -6, left: -6 }]} />
            <View style={[styles.handle, { top: -6, right: -6 }]} />
            <View style={[styles.handle, { bottom: -6, left: -6 }]} />
            <View style={[styles.resizeHandle, { bottom: -12, right: -12 }]} {...resizeResponder.panHandlers}>
                <View style={styles.resizeHandleInner} />
            </View>
          </View>
        )}

        {/* Loading Overlay exactly like screenshot */}
        {isRemovingBg && (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#4B429F" />
            <Text style={{ marginTop: 10, color: '#4B429F', fontSize: 16, fontFamily: 'Outfit-Medium' }}>
              Removing Background... Takes 10-15 Sec
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.editButtonsBarSquare, { opacity: isRemovingBg ? 0.5 : 1 }]}>
        <TouchableOpacity style={[styles.editBtnSquare, activeAdjustment === 'zoom' && styles.editBtnSquareActive]} onPress={handleZoomIn} activeOpacity={0.8} disabled={isRemovingBg}>
          <ZoomIn color={activeAdjustment === 'zoom' ? '#4B429F' : '#1E293B'} width={22} height={22} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.editBtnSquare, activeAdjustment === 'zoom' && styles.editBtnSquareActive]} onPress={handleZoomOut} activeOpacity={0.8} disabled={isRemovingBg}>
          <ZoomOut color={activeAdjustment === 'zoom' ? '#4B429F' : '#1E293B'} width={22} height={22} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.editBtnSquare, activeAdjustment === 'brightness' && styles.editBtnSquareActive]} onPress={() => setActiveAdjustment('brightness')} activeOpacity={0.8} disabled={isRemovingBg}>
          <Sun color={activeAdjustment === 'brightness' ? '#4B429F' : '#1E293B'} width={22} height={22} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.editBtnSquare, activeAdjustment === 'saturation' && styles.editBtnSquareActive]} onPress={() => setActiveAdjustment('saturation')} activeOpacity={0.8} disabled={isRemovingBg}>
          <Droplet color={activeAdjustment === 'saturation' ? '#4B429F' : '#1E293B'} width={22} height={22} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.editBtnSquare, activeAdjustment === 'contrast' && styles.editBtnSquareActive]} onPress={() => setActiveAdjustment('contrast')} activeOpacity={0.8} disabled={isRemovingBg}>
          <Contrast color={activeAdjustment === 'contrast' ? '#4B429F' : '#1E293B'} width={22} height={22} />
        </TouchableOpacity>
      </View>

      {activeAdjustment !== 'zoom' && (
        <View style={[styles.sliderPanel, { opacity: isRemovingBg ? 0.5 : 1 }]}>
          <View style={styles.sliderHeaderPi7}>
            {getActiveIcon('#1E293B')}
            <Text style={styles.sliderTitlePi7}>{getActiveLabel()}</Text>
          </View>
          <View style={styles.sliderRowPi7}>
            <Slider
              style={styles.realSliderPi7}
              minimumValue={bounds.min}
              maximumValue={bounds.max}
              minimumTrackTintColor="#3B82F6"
              maximumTrackTintColor="#CBD5E1"
              thumbTintColor="#3B82F6"
              value={getActiveVal()}
              onValueChange={handleSliderChange}
              disabled={isRemovingBg}
            />
            <TouchableOpacity style={styles.resetBtnCirclePi7} onPress={handleResetActive} disabled={isRemovingBg}>
              <View style={styles.redCancelCircle}>
                <View style={styles.redCancelLine} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.navRowCenterPi7, { opacity: isRemovingBg ? 0.5 : 1 }]}>
        <TouchableOpacity style={styles.actionBtnOutline} onPress={() => setStep(2)} disabled={isRemovingBg}>
          <Share2 color="#4B429F" width={18} height={18} style={{ transform: [{ rotate: '180deg' }] }} />
          <Text style={styles.actionBtnOutlineText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnOutline} onPress={handleSaveAndNext} disabled={isRemovingBg}>
          <Share2 color="#4B429F" width={18} height={18} />
          <Text style={styles.actionBtnOutlineText}>Save & Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
