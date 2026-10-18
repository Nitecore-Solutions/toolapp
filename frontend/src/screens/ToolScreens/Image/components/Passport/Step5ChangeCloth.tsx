import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, ScrollView, LayoutChangeEvent, Text, TouchableOpacity, Image, ActivityIndicator, PanResponder, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { usePassport } from './PassportContext';
import { uploadFile } from '../../../../../api/client';
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system/legacy';
import { useAlert } from '../../../../../context/AlertContext';
import Svg, { Image as SvgImage, Mask, Rect, Path } from 'react-native-svg';
import { Share2, Eraser, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, User, Users, Baby, Heading1 } from 'lucide-react-native';

const CLOTH_TEMPLATES = {
  men: [
    require('../../../../../../assets/mens/1.png'),
    require('../../../../../../assets/mens/2.png'),
    require('../../../../../../assets/mens/3.png'),
    require('../../../../../../assets/mens/4.png'),
    require('../../../../../../assets/mens/5.png'),
    require('../../../../../../assets/mens/6.png'),
    require('../../../../../../assets/mens/7.png'),
    require('../../../../../../assets/mens/8.png'),
    require('../../../../../../assets/mens/9.png'),
    require('../../../../../../assets/mens/10.png'),
    require('../../../../../../assets/mens/11.png'),
    require('../../../../../../assets/mens/12.png'),
    require('../../../../../../assets/mens/13.png'),
    require('../../../../../../assets/mens/14.png'),
    require('../../../../../../assets/mens/15.png'),
    require('../../../../../../assets/mens/16.png'),
  ],
  women: [
    require('../../../../../../assets/womens_cot/1.png'),
    require('../../../../../../assets/womens_cot/2.png'),
    require('../../../../../../assets/womens_cot/3.png'),
    require('../../../../../../assets/womens_cot/4.png'),
    require('../../../../../../assets/womens_cot/5.png'),
    require('../../../../../../assets/womens_cot/6.png'),
    require('../../../../../../assets/womens_cot/7.png'),
    require('../../../../../../assets/womens_cot/8.png'),
    require('../../../../../../assets/womens_cot/9.png'),
    require('../../../../../../assets/womens_cot/10.png'),
    require('../../../../../../assets/womens_cot/11.png'),
    require('../../../../../../assets/womens_cot/12.png'),
    require('../../../../../../assets/womens_cot/13.png'),
    require('../../../../../../assets/womens_cot/14.png'),
    require('../../../../../../assets/womens_cot/15.png'),
    require('../../../../../../assets/womens_cot/16.png'),
    require('../../../../../../assets/womens_cot/17.png'),
  ],
  kids: [
    require('../../../../../../assets/kids/1.png'),
    require('../../../../../../assets/kids/2.png'),
    require('../../../../../../assets/kids/3.png'),
    require('../../../../../../assets/kids/4.png'),
    require('../../../../../../assets/kids/5.png'),
    require('../../../../../../assets/kids/6.png'),
    require('../../../../../../assets/kids/7.png'),
    require('../../../../../../assets/kids/8.png'),
  ],
  hijab: [
    require('../../../../../../assets/hijab/1.png'),
    require('../../../../../../assets/hijab/2.png'),
    require('../../../../../../assets/hijab/3.png'),
    require('../../../../../../assets/hijab/4.png'),
    require('../../../../../../assets/hijab/5.png'),
    require('../../../../../../assets/hijab/6.png'),
    require('../../../../../../assets/hijab/7.png'),
    require('../../../../../../assets/hijab/8.png'),
    require('../../../../../../assets/hijab/9.png'),
    require('../../../../../../assets/hijab/10.png'),
  ]
};

const ManIcon = ({ color, width = 24, height = 24 }: any) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Path fill={color} d="M62.242,47.758l0.014-0.014c-5.847-4.753-12.84-8.137-20.491-9.722C44.374,35.479,46,31.932,46,28 c1.657,0,3-1.343,3-3v-2c0-0.886-0.391-1.673-1-2.222V12c0-6.627-5.373-12-12-12h-8c-6.627,0-12,5.373-12,12v8.778 c-0.609,0.549-1,1.336-1,2.222v2c0,1.657,1.343,3,3,3c0,3.932,1.626,7.479,4.236,10.022c-7.652,1.586-14.646,4.969-20.492,9.722 l0.014,0.014C0.672,48.844,0,50.344,0,52v8c0,2.211,1.789,4,4,4h56c2.211,0,4-1.789,4-4v-8C64,50.344,63.328,48.844,62.242,47.758z M20,28v-1c0-0.553-0.447-1-1-1h-1c-0.553,0-1-0.447-1-1v-2c0-0.553,0.447-1,1-1h1c0.553,0,1-0.447,1-1v-1v-1c0-2.209,1.791-4,4-4 c2.088,0,3.926-1.068,5-2.687C30.074,13.932,31.912,15,34,15h6c2.209,0,4,1.791,4,4v1v1c0,0.553,0.447,1,1,1h1c0.553,0,1,0.447,1,1 v2c0,0.553-0.447,1-1,1h-1c-0.553,0-1,0.447-1,1v1c0,6.627-5.373,12-12,12S20,34.627,20,28z M24.285,39.678 C26.498,41.143,29.147,42,32,42s5.502-0.857,7.715-2.322c1.66,0.281,3.297,0.63,4.892,1.084C41.355,43.983,36.911,46,31.973,46 c-4.932,0-9.371-2.011-12.621-5.226C20.96,40.315,22.61,39.961,24.285,39.678z"/>
    <Path fill={color} d="M24.537,21.862c0.475,0.255,1.073,0.068,1.345-0.396C25.91,21.419,26.18,21,26.998,21 c0.808,0,1.096,0.436,1.111,0.458C28.287,21.803,28.637,22,28.999,22c0.154,0,0.311-0.035,0.457-0.111 c0.491-0.253,0.684-0.856,0.431-1.347C29.592,19.969,28.651,19,26.998,19c-1.691,0-2.618,0.983-2.9,1.564 C23.864,21.047,24.063,21.609,24.537,21.862z"/>
    <Path fill={color} d="M34.539,21.862c0.475,0.255,1.073,0.068,1.345-0.396C35.912,21.419,36.182,21,37,21 c0.808,0,1.096,0.436,1.111,0.458C38.289,21.803,38.639,22,39.001,22c0.154,0,0.311-0.035,0.457-0.111 c0.491-0.253,0.684-0.856,0.431-1.347C39.594,19.969,38.653,19,37,19c-1.691,0-2.618,0.983-2.9,1.564 C33.866,21.047,34.065,21.609,34.539,21.862z"/>
  </Svg>
);

const WomanIcon = ({ color, width = 24, height = 24 }: any) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Path fill={color} d="M62.242,47.758l0.014-0.014c-3.239-2.634-6.865-4.874-10.839-6.644C50.502,38.229,50,35.175,50,32V16 c0-8.837-7.163-16-16-16h-4c-8.837,0-16,7.163-16,16v16c0,3.173-0.501,6.226-1.415,9.096c-3.979,1.745-7.526,3.953-10.841,6.648 l0.014,0.014C0.672,48.844,0,50.344,0,52v8c0,2.211,1.789,4,4,4h56c2.211,0,4-1.789,4-4v-8C64,50.344,63.328,48.844,62.242,47.758z M20,19c0-2.209,1.791-4,4-4c2.088,0,3.926-1.068,5-2.687C30.074,13.932,31.912,15,34,15h4c3.313,0,6,2.687,6,6c0,0.188,0,0.5,0,1 c0,12-7.469,18-12,18s-12-6-12-18C20,21.5,20,19,20,19z M25.677,39.439C27.76,41.084,29.99,42,32,42s4.24-0.916,6.323-2.561 c2.743,0.378,5.399,1.018,7.966,1.857c-2.468,2.468-13.311,13.311-13.691,13.691c-0.43,0.43-0.748,0.447-1.183,0.013 C31.03,54.616,20.18,43.766,17.711,41.297C20.277,40.457,22.934,39.817,25.677,39.439z"/>
    <Path fill={color} d="M25.882,22.467C25.91,22.419,26.18,22,26.998,22c0.808,0,1.096,0.436,1.111,0.458 C28.287,22.803,28.637,23,28.999,23c0.154,0,0.311-0.035,0.457-0.111c0.491-0.253,0.684-0.856,0.431-1.347 C29.592,20.969,28.651,20,26.998,20c-1.691,0-2.618,0.983-2.9,1.564c-0.233,0.482-0.034,1.045,0.439,1.298 C25.012,23.117,25.61,22.931,25.882,22.467z"/>
    <Path fill={color} d="M34.539,22.862c0.475,0.255,1.073,0.068,1.345-0.396C35.912,22.419,36.182,22,37,22 c0.808,0,1.096,0.436,1.111,0.458C38.289,22.803,38.639,23,39.001,23c0.154,0,0.311-0.035,0.457-0.111 c0.491-0.253,0.684-0.856,0.431-1.347C39.594,20.969,38.653,20,37,20c-1.691,0-2.618,0.983-2.9,1.564 C33.866,22.047,34.065,22.609,34.539,22.862z"/>
  </Svg>
);

const KidIcon = ({ color, width = 24, height = 24 }: any) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path fill={color} d="M10.9391 5.49826C11.0902 5.1126 10.9001 4.67744 10.5144 4.5263C10.1288 4.37516 9.69362 4.56528 9.54248 4.95093L10.9391 5.49826ZM11.8058 9.56459L12.1694 8.90867L12.1687 8.90826L11.8058 9.56459ZM13.502 10.7516C13.9162 10.7509 14.2514 10.4146 14.2508 10.0004C14.2501 9.58617 13.9138 9.25093 13.4996 9.25159L13.502 10.7516ZM10.2408 5.22459L10.0531 4.49845L10.0517 4.49883L10.2408 5.22459ZM18.7648 10.1936L18.0404 10.3881C18.1005 10.6118 18.2606 10.7952 18.4742 10.885C18.6877 10.9748 18.9308 10.9608 19.1327 10.8472L18.7648 10.1936ZM20.6096 10.4908L20.0551 10.9958V10.9958L20.6096 10.4908ZM20.7332 12.3554L21.3496 12.7827V12.7827L20.7332 12.3554ZM18.9438 12.8936L19.2222 12.1972C19.0067 12.111 18.7635 12.1295 18.5635 12.2471C18.3635 12.3648 18.2292 12.5683 18.1998 12.7985L18.9438 12.8936ZM5.05677 12.8936L5.80072 12.7985C5.7713 12.5683 5.63701 12.3648 5.43702 12.2471C5.23702 12.1295 4.99384 12.111 4.77839 12.1972L5.05677 12.8936ZM3.2673 12.3554L2.65095 12.7827L2.65095 12.7827L3.2673 12.3554ZM3.39092 10.4908L3.94546 10.9958L3.94546 10.9958L3.39092 10.4908ZM5.23577 10.1936L4.86789 10.8472C5.06979 10.9608 5.31288 10.9748 5.52645 10.885C5.74003 10.7952 5.90011 10.6117 5.96015 10.388L5.23577 10.1936ZM9.54248 4.95093C8.76469 6.93559 9.57741 9.18941 11.4428 10.2209L12.1687 8.90826C10.9617 8.2408 10.4358 6.78245 10.9391 5.49826L9.54248 4.95093ZM11.4421 10.2205C12.0723 10.57 12.7813 10.7528 13.502 10.7516L13.4996 9.25159C13.0342 9.25234 12.5764 9.13431 12.1694 8.90867L11.4421 10.2205ZM10.4284 5.95074C13.7534 5.09153 17.1498 7.07144 18.0404 10.3881L19.4891 9.99908C18.385 5.88768 14.1748 3.43336 10.0531 4.49845L10.4284 5.95074ZM19.1327 10.8472C19.4372 10.6757 19.8198 10.7374 20.0551 10.9958L21.1642 9.98589C20.4583 9.21068 19.3105 9.02575 18.3969 9.54002L19.1327 10.8472ZM20.0551 10.9958C20.2904 11.2542 20.316 11.6409 20.1169 11.9281L21.3496 12.7827C21.947 11.9211 21.8701 10.7611 21.1642 9.98589L20.0551 10.9958ZM20.1169 11.9281C19.9178 12.2153 19.5467 12.3269 19.2222 12.1972L18.6654 13.59C19.6389 13.9792 20.7522 13.6443 21.3496 12.7827L20.1169 11.9281ZM18.1998 12.7985C17.801 15.9185 15.1457 18.256 12.0003 18.256V19.756C15.9006 19.756 19.1932 16.8575 19.6877 12.9887L18.1998 12.7985ZM12.0003 18.256C8.85488 18.256 6.19955 15.9185 5.80072 12.7985L4.31283 12.9887C4.80737 16.8575 8.09999 19.756 12.0003 19.756V18.256ZM4.77839 12.1972C4.45388 12.3269 4.08278 12.2153 3.88366 11.9281L2.65095 12.7827C3.24832 13.6443 4.36161 13.9792 5.33515 13.59L4.77839 12.1972ZM3.88366 11.9281C3.68453 11.6409 3.71017 11.2542 3.94546 10.9958L2.83637 9.98589C2.13048 10.7611 2.05358 11.9211 2.65095 12.7827L3.88366 11.9281ZM3.94546 10.9958C4.18076 10.7374 4.56334 10.6757 4.86789 10.8472L5.60365 9.54002C4.69 9.02575 3.54225 9.21068 2.83637 9.98589L3.94546 10.9958ZM5.96015 10.388C6.5438 8.21268 8.25047 6.51828 10.4299 5.95036L10.0517 4.49883C7.35024 5.20278 5.23482 7.30298 4.51139 9.99924L5.96015 10.388Z"/>
    <Path fill={color} d="M9.00073 12.5016C8.72503 12.5016 8.50073 12.2773 8.50073 12.0016C8.50073 11.7259 8.72503 11.5016 9.00073 11.5016C9.27643 11.5016 9.50073 11.7259 9.50073 12.0016C9.50073 12.2773 9.27643 12.5016 9.00073 12.5016Z"/>
    <Path fill={color} d="M9.00073 13.0016C8.44845 13.0016 8.00073 12.5539 8.00073 12.0016C8.00073 11.4493 8.44845 11.0016 9.00073 11.0016C9.55301 11.0016 10.0007 11.4493 10.0007 12.0016C10.0007 12.5539 9.55301 13.0016 9.00073 13.0016Z"/>
    <Path fill={color} d="M15.0007 12.5016C14.725 12.5016 14.5007 12.2773 14.5007 12.0016C14.5007 11.7259 14.725 11.5016 15.0007 11.5016C15.2764 11.5016 15.5007 11.7259 15.5007 12.0016C15.5007 12.2773 15.2764 12.5016 15.0007 12.5016Z"/>
    <Path fill={color} d="M15.0007 13.0016C14.4485 13.0016 14.0007 12.5539 14.0007 12.0016C14.0007 11.4493 14.4485 11.0016 15.0007 11.0016C15.553 11.0016 16.0007 11.4493 16.0007 12.0016C16.0007 12.5539 15.553 13.0016 15.0007 13.0016Z"/>
  </Svg>
);

const HijabIcon = ({ color, width = 24, height = 24 }: any) => (
  <Svg width={width} height={height} viewBox="0 0 36 36" fill="none">
    <Path fill={color} d="M31 36v-3.5c0-3.314-3.685-5.5-7-5.5H12c-3.313 0-7 2.186-7 5.5V36h26z"/>
    <Path fill={color} d="M27.235 16.761c0-8.494-5.309-11.026-9.229-11.026s-9.8 2.559-9.8 11.026c0 3.489 1.255 6.182.644 8.238C7.65 29.037 11.778 32.506 15 34c4.94 2.29 10-3 10-3c3.975 0 2.235-4.248 2.235-14.239z"/>
    <Path fill={color} d="M27.807 16.761C27.807 8.267 21.926 5 18.006 5s-9.8 3.294-9.8 11.761c0 8.494 7.187 11.761 11.107 11.761C22.252 28.521 23.065 30 25 30c5.281 0 2.807-4.419 2.807-13.239z"/>
    <Path fill={color} d="M16.904 11.166c-2.167.265-6.558 3.877-6.719 5.799c.2 5.341 3.62 9.596 7.821 9.596c4.178 0 7.583-4.208 7.818-9.507c-.23-2.372-6.919-6.133-8.92-5.888z"/>
    <Path fill={color} d="M17.944 23.543c-1.605 0-2.446-.794-2.536-.885a.684.684 0 0 1 .96-.974c.035.032.553.491 1.576.491c1.039 0 1.557-.473 1.577-.492a.688.688 0 0 1 .963.02c.26.269.26.691-.004.955c-.089.091-.929.885-2.536.885"/>
    <Path fill={color} d="M14.608 17.886a.849.849 0 0 1-.846-.846v-.845c0-.465.381-.846.846-.846s.847.381.847.846v.845a.85.85 0 0 1-.847.846m6.765 0a.849.849 0 0 1-.846-.846v-.845c0-.465.381-.846.846-.846c.465 0 .846.381.846.846v.845a.849.849 0 0 1-.846.846"/>
    <Path fill={color} d="M18.837 20.5h-1.691a.424.424 0 0 1-.423-.423v-.153c0-.233.189-.424.423-.424h1.691c.232 0 .423.19.423.424v.153a.424.424 0 0 1-.423.423"/>
    <Path fill={color} d="M10 17s3-5 8-5s8 5 8 5s-1-8-8-8s-8 8-8 8z"/>
  </Svg>
);

export default function Step5ChangeCloth() {
  const { bgRemovedUri, setStep, setClothedUri, loading, setLoading } = usePassport();
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<'men' | 'women' | 'kids' | 'hijab'>('men');
  const [selectedCloth, setSelectedCloth] = useState<any | null>(null);
  const [layoutDims, setLayoutDims] = useState({ width: 0, height: 0 });
  
  // Interactive element state: 'person' or 'cloth'
    const [isErasing, setIsErasing] = useState(false);
  const [eraserPaths, setEraserPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [activeElement, setActiveElement] = useState<'person' | 'cloth' | null>('person');

  // Boxes
  const [personBox, setPersonBox] = useState({ x: 0, y: 0, width: 250, height: 350 });
  const [clothBox, setClothBox] = useState({ x: 50, y: 150, width: 150, height: 150 });
  
  const personRef = useRef({ x: 0, y: 0, width: 250, height: 350 });
  const clothRef = useRef({ x: 50, y: 150, width: 150, height: 150 });
  
  const personStartRef = useRef({ x: 0, y: 0, width: 250, height: 350 });
  const clothStartRef = useRef({ x: 50, y: 150, width: 150, height: 150 });

  useEffect(() => { personRef.current = { ...personBox }; }, [personBox]);
  useEffect(() => { clothRef.current = { ...clothBox }; }, [clothBox]);

  const onImageLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout;
    setLayoutDims({ width, height });
    
    // Initial setup
    setPersonBox({ x: 0, y: 0, width: width, height: height });
    
    const cw = width * 0.7;
    setClothBox({ x: (width - cw) / 2, y: height - cw, width: cw, height: cw });
  };

  // Pan Responders for Person
  const personPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !isErasing,
    onMoveShouldSetPanResponder: () => !isErasing,
    onPanResponderGrant: () => { 
      personStartRef.current = { ...personRef.current }; 
      setActiveElement('person'); 
    },
    onPanResponderMove: (evt, gestureState) => {
      setPersonBox({ 
        ...personStartRef.current,
        x: personStartRef.current.x + gestureState.dx, 
        y: personStartRef.current.y + gestureState.dy 
      });
    },
  }), [isErasing]);

const createPersonResize = (cornerX: number, cornerY: number) => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { 
      personStartRef.current = { ...personRef.current }; 
      setActiveElement('person'); 
    },
    onPanResponderMove: (evt, gestureState) => {
      let delta = 0;
      if (cornerX > 0) delta += gestureState.dx; else delta -= gestureState.dx;
      if (cornerY > 0) delta += gestureState.dy; else delta -= gestureState.dy;
      delta = delta / 2;
      const start = personStartRef.current;
      const scale = Math.max(0.2, 1 + (delta / start.width));
      
      const newW = start.width * scale;
      const newH = start.height * scale;
      
      let newX = start.x;
      let newY = start.y;
      
      if (cornerX < 0) newX = start.x + (start.width - newW);
      if (cornerY < 0) newY = start.y + (start.height - newH);
      
      setPersonBox({ ...start, width: newW, height: newH, x: newX, y: newY });
    },
  });

  const pResTL = useMemo(() => createPersonResize(-1, -1), []);
  const pResTR = useMemo(() => createPersonResize(1, -1), []);
  const pResBL = useMemo(() => createPersonResize(-1, 1), []);
  const pResBR = useMemo(() => createPersonResize(1, 1), []);

  // Pan Responders for Cloth
  const clothPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !isErasing,
    onMoveShouldSetPanResponder: () => !isErasing,
    onPanResponderGrant: () => { 
      clothStartRef.current = { ...clothRef.current }; 
      setActiveElement('cloth'); 
    },
    onPanResponderMove: (evt, gestureState) => {
      setClothBox({
        ...clothStartRef.current,
        x: clothStartRef.current.x + gestureState.dx, 
        y: clothStartRef.current.y + gestureState.dy
      });
    },
  }), [isErasing]);

const createClothResize = (cornerX: number, cornerY: number) => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { 
      clothStartRef.current = { ...clothRef.current }; 
      setActiveElement('cloth'); 
    },
    onPanResponderMove: (evt, gestureState) => {
      let delta = 0;
      if (cornerX > 0) delta += gestureState.dx; else delta -= gestureState.dx;
      if (cornerY > 0) delta += gestureState.dy; else delta -= gestureState.dy;
      delta = delta / 2;
      const start = clothStartRef.current;
      const scale = Math.max(0.2, 1 + (delta / start.width));
      const newW = start.width * scale;
      const newH = start.height * scale;
      let newX = start.x;
      let newY = start.y;
      if (cornerX < 0) newX = start.x + (start.width - newW);
      if (cornerY < 0) newY = start.y + (start.height - newH);
      setClothBox({ ...start, width: newW, height: newH, x: newX, y: newY });
    },
  });

  const cResTL = useMemo(() => createClothResize(-1, -1), []);
  const cResTR = useMemo(() => createClothResize(1, -1), []);
  const cResBL = useMemo(() => createClothResize(-1, 1), []);
  const cResBR = useMemo(() => createClothResize(1, 1), []);

  
  // Pan Responder for Eraser
  const eraseResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => isErasing,
    onMoveShouldSetPanResponder: () => isErasing,
    onPanResponderGrant: (evt) => {
      if (!isErasing) return;
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentPath(`M${locationX},${locationY}`);
    },
    onPanResponderMove: (evt) => {
      if (!isErasing) return;
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentPath(prev => `${prev} L${locationX},${locationY}`);
    },
    onPanResponderRelease: () => {
      if (!isErasing) return;
      // We use a functional state update to get current path from state
      setCurrentPath(current => {
        if (current) {
          setEraserPaths(prev => [...prev, current]);
        }
        return '';
      });
    }
  }), [isErasing]); // Removed currentPath

  const handleNext = async () => {
    if (!selectedCloth) {
      setStep(4);
      return;
    }
    if (!bgRemovedUri || layoutDims.width === 0) return;

    setLoading(true);
    try {
      const fileName = bgRemovedUri.split('/').pop() || 'base.png';
      
      let clothId = '';
      let clothLocalUri = '';
      
      if (typeof selectedCloth === 'number') {
        const catMap: Record<string, string> = { men: 'mens', women: 'womens_cot', kids: 'kids', hijab: 'hijab' };
        for (const [cat, dir] of Object.entries(catMap)) {
          // @ts-ignore
          const items = CLOTH_TEMPLATES[cat] || [];
          const idx = items.indexOf(selectedCloth);
          if (idx !== -1) {
            clothId = `${dir}/${idx + 1}.png`;
            break;
          }
        }
      } else {
        clothLocalUri = selectedCloth;
      }

      const params = {
        cloth_url: clothLocalUri.startsWith('http') ? clothLocalUri : 'dummy_url',
        cloth_id: clothId,
        person_scale_w: (personBox.width / layoutDims.width).toString(),
        person_scale_h: (personBox.height / layoutDims.height).toString(),
        person_x: (personBox.x / layoutDims.width).toString(),
        person_y: (personBox.y / layoutDims.height).toString(),
        cloth_scale_w: (clothBox.width / layoutDims.width).toString(),
        cloth_scale_h: (clothBox.height / layoutDims.height).toString(),
        cloth_x: (clothBox.x / layoutDims.width).toString(),
        cloth_y: (clothBox.y / layoutDims.height).toString()
      };

      const additionalFiles = [];
      if (clothLocalUri) {
        additionalFiles.push({
          fieldName: 'cloth_file',
          uri: clothLocalUri,
          name: 'cloth.png',
          type: 'image/png'
        });
      }

      const arrayBuffer = await uploadFile('/api/image/overlay-cloth-advanced', bgRemovedUri, fileName, 'image/png', params, additionalFiles);
      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const ext = 'png';
      const tempUri = `${FileSystem.cacheDirectory}clothed_${Date.now()}.${ext}`;
      await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      
      setClothedUri(tempUri);
      setStep(6);
    } catch (error: any) {
      console.log("Cloth overlay failed, proceeding with original image");
      setClothedUri(bgRemovedUri);
      setStep(6);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    // If there are eraser strokes, undo the last stroke
    if (eraserPaths.length > 0) {
      setEraserPaths(prev => prev.slice(0, -1));
      return;
    }
    
    // Optional: If no eraser strokes, maybe reset the positions, but usually users just want to undo eraser.
    // For now, if they press Undo without any eraser strokes, we do nothing to prevent frustrating resets.
    // Or we could reset just the cloth position if they want to start over.
    // But since Undo is next to Eraser, it's primarily for Eraser.
  };

  const handleToolbar = (action: string) => {
    if (!activeElement) return;
    const isPerson = activeElement === 'person';
    const setFunc = isPerson ? setPersonBox : setClothBox;
    
    setFunc(b => {
      let nb = { ...b };
      if (action === 'zoomIn') { const ratio = nb.height / nb.width; nb.width += 10; nb.height += 10 * ratio; nb.x -= 5; nb.y -= 5 * ratio; }
      if (action === 'zoomOut') { const ratio = nb.height / nb.width; nb.width = Math.max(20, nb.width - 10); nb.height = Math.max(20 * ratio, nb.height - 10 * ratio); nb.x += 5; nb.y += 5 * ratio; }
      if (action === 'left') nb.x -= 10;
      if (action === 'right') nb.x += 10;
      if (action === 'up') nb.y -= 10;
      if (action === 'down') nb.y += 10;
      return nb;
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 20 }}>
      <Text style={{ fontSize: 18, fontFamily: 'Outfit-Bold', color: '#4B429F', textAlign: 'center', marginBottom: 16 }}>Change Person's Clothes</Text>

      {/* Canvas Area */}
      <TouchableWithoutFeedback onPress={() => setActiveElement(null)}>
        <View 
          style={{ width: '100%', aspectRatio: 3/4, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, overflow: 'hidden', position: 'relative', alignSelf: 'center', maxWidth: 300 }}
          onLayout={onImageLayout}
        >
          {bgRemovedUri && layoutDims.width > 0 && (
            <View style={[{ position: 'absolute', left: personBox.x, top: personBox.y, width: personBox.width, height: personBox.height }, activeElement === 'person' && localStyles.interactiveBox]} {...(isErasing ? eraseResponder.panHandlers : {})}>
              
              {eraserPaths.length > 0 || isErasing ? (
                <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
                  <Mask id="eraserMask">
                    <Rect width="100%" height="100%" fill="white" />
                    {eraserPaths.map((p, i) => (
                      <Path key={i} d={p} stroke="black" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    ))}
                    {currentPath ? (
                      <Path d={currentPath} stroke="black" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    ) : null}
                  </Mask>
                  <SvgImage href={{ uri: bgRemovedUri }} width="100%" height="100%" mask="url(#eraserMask)" preserveAspectRatio="xMidYMid meet" />
                </Svg>
              ) : (
                <Image source={{ uri: bgRemovedUri }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="contain" />
              )}

              <View style={localStyles.dragOverlay} {...personPanResponder.panHandlers} />
              {activeElement === 'person' && (
                <>
                  <View style={[localStyles.resizeHandle, { top: -12, left: -12 }]} {...pResTL.panHandlers}>
                      <View style={localStyles.resizeHandleInner} />
                  </View>
                  <View style={[localStyles.resizeHandle, { top: -12, right: -12 }]} {...pResTR.panHandlers}>
                      <View style={localStyles.resizeHandleInner} />
                  </View>
                  <View style={[localStyles.resizeHandle, { bottom: -12, left: -12 }]} {...pResBL.panHandlers}>
                      <View style={localStyles.resizeHandleInner} />
                  </View>
                  <View style={[localStyles.resizeHandle, { bottom: -12, right: -12 }]} {...pResBR.panHandlers}>
                      <View style={localStyles.resizeHandleInner} />
                  </View>
                </>
              )}
            </View>
          )}
          
          {selectedCloth && layoutDims.width > 0 && (
            <View style={[{ position: 'absolute', left: clothBox.x, top: clothBox.y, width: clothBox.width, height: clothBox.height }, activeElement === 'cloth' && localStyles.interactiveBox]}>
              <Image source={typeof selectedCloth === 'string' ? { uri: selectedCloth } : selectedCloth} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="contain" />
              <View style={localStyles.dragOverlay} {...clothPanResponder.panHandlers} />
              {activeElement === 'cloth' && (
                <>
                  <View style={[localStyles.resizeHandle, { top: -12, left: -12 }]} {...cResTL.panHandlers}>
                      <View style={localStyles.resizeHandleInner} />
                  </View>
                  <View style={[localStyles.resizeHandle, { top: -12, right: -12 }]} {...cResTR.panHandlers}>
                      <View style={localStyles.resizeHandleInner} />
                  </View>
                  <View style={[localStyles.resizeHandle, { bottom: -12, left: -12 }]} {...cResBL.panHandlers}>
                      <View style={localStyles.resizeHandleInner} />
                  </View>
                  <View style={[localStyles.resizeHandle, { bottom: -12, right: -12 }]} {...cResBR.panHandlers}>
                      <View style={localStyles.resizeHandleInner} />
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      <Text style={{ textAlign: 'center', fontFamily: 'Outfit-Medium', color: '#64748B', marginTop: 12, fontSize: 13 }}>
        Tap the Person or the Cloth to select and move it.
      </Text>

      {/* Toolbar - Aligned in one line properly */}
      <View style={{ marginVertical: 12, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, flexGrow: 1, justifyContent: 'center' }}>
          <TouchableOpacity style={[toolbarBtn, isErasing && { backgroundColor: '#EEF2FF', borderColor: '#4B429F' }]} onPress={() => setIsErasing(!isErasing)}>
            <Eraser color={isErasing ? '#4B429F' : '#1E293B'} width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity style={[toolbarBtn, { paddingHorizontal: 8, width: 'auto' }]} onPress={handleUndo}>
            <Text style={{ color: '#1E293B', fontFamily: 'Outfit-Medium', fontSize: 13 }}>Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={toolbarBtn} onPress={() => handleToolbar('zoomIn')}><ZoomIn color="#1E293B" width={20} height={20} /></TouchableOpacity>
          <TouchableOpacity style={toolbarBtn} onPress={() => handleToolbar('zoomOut')}><ZoomOut color="#1E293B" width={20} height={20} /></TouchableOpacity>
          <TouchableOpacity style={toolbarBtn} onPress={() => handleToolbar('left')}><ChevronLeft color="#1E293B" width={20} height={20} /></TouchableOpacity>
          <TouchableOpacity style={toolbarBtn} onPress={() => handleToolbar('right')}><ChevronRight color="#1E293B" width={20} height={20} /></TouchableOpacity>
          <TouchableOpacity style={toolbarBtn} onPress={() => handleToolbar('up')}><ChevronUp color="#1E293B" width={20} height={20} /></TouchableOpacity>
          <TouchableOpacity style={toolbarBtn} onPress={() => handleToolbar('down')}><ChevronDown color="#1E293B" width={20} height={20} /></TouchableOpacity>
        </ScrollView>
      </View>

      {/* Tab Bar and Categories */}
      <View style={{ backgroundColor: '#EEF2FF', borderRadius: 8, padding: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {['men', 'women', 'kids', 'hijab'].map(tab => (
            <TouchableOpacity 
              key={tab}
              style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: activeTab === tab ? '#FFF' : 'transparent', borderRadius: 6, borderWidth: activeTab === tab ? 1.5 : 0, borderColor: '#1E293B' }}
              onPress={() => setActiveTab(tab as any)}
            >
              {tab === 'men' && <ManIcon color={activeTab === tab ? '#4B429F' : '#1E293B'} width={24} height={24} />}
              {tab === 'women' && <WomanIcon color={activeTab === tab ? '#4B429F' : '#1E293B'} width={24} height={24} />}
              {tab === 'kids' && <KidIcon color={activeTab === tab ? '#4B429F' : '#1E293B'} width={24} height={24} />}
              {tab === 'hijab' && <HijabIcon color={activeTab === tab ? '#4B429F' : '#1E293B'} width={24} height={24} />}
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
          {CLOTH_TEMPLATES[activeTab].map((url, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={{ width: 90, height: 90, backgroundColor: '#FFF', marginRight: 10, borderRadius: 4, borderWidth: selectedCloth === url ? 2 : 1, borderColor: selectedCloth === url ? '#4F46E5' : '#E2E8F0', padding: 4 }}
              onPress={() => { setSelectedCloth(url); setActiveElement('cloth'); }}
            >
              <Image source={typeof url === 'string' ? { uri: url } : url} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Navigation */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 24 }}>
        <TouchableOpacity style={navBtn} onPress={() => setStep(4)} disabled={loading}>
          <Share2 color="#4B429F" width={18} height={18} style={{ transform: [{ rotate: '180deg' }] }} />
          <Text style={navBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={navBtn} onPress={handleNext} disabled={loading}>
          {loading ? <ActivityIndicator color="#4B429F" /> : <Share2 color="#4B429F" width={18} height={18} />}
          <Text style={navBtnText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const toolbarBtn = {
  width: 32,
  height: 38,
  backgroundColor: '#FFF',
  borderWidth: 1,
  borderColor: '#CBD5E1',
  borderRadius: 6,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

const navBtn = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  borderColor: '#4B429F',
  borderWidth: 1.5,
  borderRadius: 6,
  paddingVertical: 10,
  paddingHorizontal: 24,
  gap: 8,
  backgroundColor: '#FFFFFF',
};
const navBtnText = { fontSize: 16, fontFamily: 'Outfit-Bold', color: '#4B429F' };

const localStyles = StyleSheet.create({
  interactiveBox: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(59, 130, 246, 0.4)', borderStyle: 'dashed', zIndex: 10 },
  dragOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent' },
  handle: { position: 'absolute', width: 12, height: 12, backgroundColor: 'rgba(59, 130, 246, 0.7)', borderRadius: 6 },
  resizeHandle: { position: 'absolute', width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  resizeHandleInner: { width: 12, height: 12, backgroundColor: '#EF4444', borderRadius: 6 }
});
