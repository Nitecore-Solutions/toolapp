import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

export type SizePreset = 'india' | 'usa' | 'canada' | 'custom';
export type UnitType = 'cm' | 'mm' | 'inch' | 'px';
export type AdjustmentType = 'zoom' | 'brightness' | 'saturation' | 'contrast';

export const PassportContext = createContext<any>(null);

export const usePassport = () => useContext(PassportContext);

export const PassportProvider = ({ children }: { children: React.ReactNode }) => {
  const [step, setStep] = useState(1);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [imageHeight, setImageHeight] = useState<number>(0);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [croppedUri, setCroppedUri] = useState<string | null>(null);
  const [bgRemovedUri, setBgRemovedUri] = useState<string | null>(null);
  const [selectedBg, setSelectedBg] = useState<'original' | 'removed'>('removed');
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  const [showChangeCloth, setShowChangeCloth] = useState(false);
  const [clothedUri, setClothedUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [sizePreset, setSizePreset] = useState<SizePreset>('india');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [customUnit, setCustomUnit] = useState<UnitType>('cm');
  const [dpi, setDpi] = useState('300');

  const [layoutDims, setLayoutDims] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState({ x: 50, y: 50, width: 200, height: 250 });
  const cropRef = useRef({ x: 50, y: 50, width: 200, height: 250 });

  const [activeAdjustment, setActiveAdjustment] = useState<AdjustmentType>('brightness');
  const [zoom, setZoom] = useState(1.0);
  const [brightness, setBrightness] = useState(1.0);
  const [saturation, setSaturation] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);

  const [minKb, setMinKb] = useState('20');
  const [maxKb, setMaxKb] = useState('50');
  const [addNameDate, setAddNameDate] = useState(false);
  const [nameText, setNameText] = useState('');
  const [dateText, setDateText] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });

  return (
    <PassportContext.Provider value={{
      step, setStep,
      imageUri, setImageUri,
      imageWidth, setImageWidth,
      imageHeight, setImageHeight,
      resultUri, setResultUri,
      croppedUri, setCroppedUri,
      bgRemovedUri, setBgRemovedUri,
      selectedBg, setSelectedBg,
      isRemovingBg, setIsRemovingBg,

      showChangeCloth, setShowChangeCloth,
      clothedUri, setClothedUri,

      loading, setLoading,
      sizePreset, setSizePreset,
      customWidth, setCustomWidth,
      customHeight, setCustomHeight,
      customUnit, setCustomUnit,
      dpi, setDpi,
      layoutDims, setLayoutDims,
      crop, setCrop,
      cropRef,
      activeAdjustment, setActiveAdjustment,
      zoom, setZoom,
      brightness, setBrightness,
      saturation, setSaturation,
      contrast, setContrast,
      minKb, setMinKb,
      maxKb, setMaxKb,
      addNameDate, setAddNameDate,
      nameText, setNameText,
      dateText, setDateText
    }}>
      {children}
    </PassportContext.Provider>
  );
};
