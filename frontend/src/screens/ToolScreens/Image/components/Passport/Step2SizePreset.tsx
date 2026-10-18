import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { usePassport, UnitType } from './PassportContext';
import { styles } from './styles';
import { Share2 } from 'lucide-react-native';

export default function Step2SizePreset() {
  const {
    sizePreset, setSizePreset,
    customWidth, setCustomWidth,
    customHeight, setCustomHeight,
    customUnit, setCustomUnit,
    dpi, setDpi,
    setStep
  } = usePassport();

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitlePurple}>Select Passport Photo Size</Text>
      
      <View style={styles.dpiRow}>
        <Text style={styles.dpiLabel}>Default DPI:</Text>
        <TextInput 
          style={styles.dpiInput} 
          value={dpi} 
          onChangeText={setDpi} 
          keyboardType="numeric" 
        />
        <View style={styles.dpiBadge}><Text style={styles.dpiBadgeText}>DPI</Text></View>
      </View>

      <View style={styles.presetsGrid}>
        <View style={styles.presetsRowFlex}>
          <TouchableOpacity 
            style={[styles.presetCard, sizePreset === 'india' && styles.presetCardActive]} 
            onPress={() => setSizePreset('india')}
            activeOpacity={0.9}
          >
            {sizePreset === 'india' && (
              <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>✓ Selected</Text></View>
            )}
            <Text style={styles.presetDim}>3.5 CM x 4.5 CM</Text>
            <Text style={styles.presetSubDim}>35 MM x 45 MM</Text>
            <View style={styles.presetDivider} />
            <Text style={styles.presetDesc}>India, Australia, Europe, UK, Pakistan</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.presetCard, sizePreset === 'usa' && styles.presetCardActive]} 
            onPress={() => setSizePreset('usa')}
            activeOpacity={0.9}
          >
            {sizePreset === 'usa' && (
              <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>✓ Selected</Text></View>
            )}
            <Text style={styles.presetDim}>2 Inch X 2 Inch</Text>
            <Text style={styles.presetSubDim}>51 MM X 51 MM</Text>
            <View style={styles.presetDivider} />
            <Text style={styles.presetDesc}>USA, Philippines</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.presetCard, styles.presetCardCenter, sizePreset === 'canada' && styles.presetCardActive]} 
          onPress={() => setSizePreset('canada')}
          activeOpacity={0.9}
        >
          {sizePreset === 'canada' && (
            <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>✓ Selected</Text></View>
          )}
          <Text style={styles.presetDim}>50 MM X 70MM</Text>
          <Text style={styles.presetSubDim}>5 CM x 7 CM</Text>
          <View style={styles.presetDivider} />
          <Text style={styles.presetDesc}>Canada</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.customForm, sizePreset === 'custom' && styles.presetCardActive]} 
        onPress={() => setSizePreset('custom')}
        activeOpacity={1}
      >
        {sizePreset === 'custom' && (
          <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>✓ Selected</Text></View>
        )}
        
        <View style={styles.radioRow}>
          {(['cm', 'mm', 'inch', 'px'] as UnitType[]).map((u) => (
            <TouchableOpacity 
              key={u} 
              style={styles.radioBtnContainer} 
              onPress={() => {
                setSizePreset('custom');
                setCustomUnit(u);
              }}
            >
              <View style={[styles.radioCircle, customUnit === u && styles.radioCircleActive]}>
                {customUnit === u && <View style={styles.radioInnerCircle} />}
              </View>
              <Text style={styles.radioText}>
                {u.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customInputsRow}>
          <TextInput 
            style={styles.customInputMini} 
            value={customWidth} 
            onChangeText={setCustomWidth} 
            keyboardType="numeric" 
            placeholder="W"
            onFocus={() => setSizePreset('custom')}
          />
          <Text style={styles.xIcon}>x</Text>
          <TextInput 
            style={styles.customInputMini} 
            value={customHeight} 
            onChangeText={setCustomHeight} 
            keyboardType="numeric" 
            placeholder="H"
            onFocus={() => setSizePreset('custom')}
          />
        </View>
        
        <View style={styles.presetDividerCustom} />
        <Text style={styles.presetDesc}>Custom</Text>
      </TouchableOpacity>

      <View style={styles.navRowCenter}>
        <TouchableOpacity style={styles.nextBtnOutline} onPress={() => setStep(3)}>
          <Share2 color="#3B82F6" width={16} height={16} style={{transform: [{ rotate: '180deg'}]}} />
          <Text style={styles.nextBtnOutlineText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
