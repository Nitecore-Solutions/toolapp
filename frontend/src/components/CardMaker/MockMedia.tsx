import React from 'react';
import { View, StyleSheet } from 'react-native';

export const MockQrCode = () => (
  <View style={styles.qrContainer}>
    <View style={styles.qrCornerTopLeft} />
    <View style={styles.qrCornerTopRight} />
    <View style={styles.qrCornerBottomLeft} />
    <View style={styles.qrCenterDot} />
    <View style={[styles.qrCenterDot, { top: 12, left: 16 }]} />
    <View style={[styles.qrCenterDot, { top: 22, left: 8 }]} />
    <View style={[styles.qrCenterDot, { top: 18, left: 24 }]} />
  </View>
);

export const MockBarcodeHorizontal = ({ height = 22 }: { height?: number }) => (
  <View style={styles.barcodeLines}>
    {[1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 2, 3, 1, 4, 1, 2, 1].map((w, i) => (
      <View
        key={i}
        style={{
          width: w,
          height: height,
          backgroundColor: i % 2 === 0 ? '#000' : 'transparent',
        }}
      />
    ))}
  </View>
);

export const MockBarcodeVertical = ({ height = 18 }: { height?: number }) => (
  <View style={[styles.barcodeLines, { transform: [{ rotate: '90deg' }] }]}>
    {[1, 2, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2].map((w, i) => (
      <View
        key={i}
        style={{
          width: w,
          height: height,
          backgroundColor: i % 2 === 0 ? '#000' : 'transparent',
        }}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  qrContainer: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    position: 'relative',
    padding: 3,
  },
  qrCornerTopLeft: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: '#000000',
  },
  qrCornerTopRight: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: '#000000',
  },
  qrCornerBottomLeft: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: '#000000',
  },
  qrCenterDot: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 4,
    height: 4,
    backgroundColor: '#000000',
  },
  barcodeLines: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
