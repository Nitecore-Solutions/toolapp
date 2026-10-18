import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { User } from 'lucide-react-native';
import { MockBarcodeHorizontal } from './MockMedia';

const CARD_VERT_W = 280;

interface CardProps {
  data: {
    collegeName: string;
    collegeAddress: string;
    rollNo: string;
    session: string;
    studentName: string;
    fatherName: string;
    courseOrClass: string;
    dob: string;
    phone: string;
    valid: string;
    address: string;
  };
  photoUri: string | null;
  signatureUri?: string | null;
  onPickPhoto: () => void;
}

export const CollegeCard: React.FC<CardProps> = ({ data, photoUri, signatureUri, onPickPhoto }) => {
  return (
    <View style={styles.card}>
      {/* Top Banner SVG Wave */}
      <View style={styles.headerBackground}>
        <Svg height="110" width={CARD_VERT_W} viewBox={`0 0 ${CARD_VERT_W} 110`}>
          <Path d={`M0,0 L${CARD_VERT_W},0 L${CARD_VERT_W},80 Q${CARD_VERT_W / 2},105 0,80 Z`} fill="#D32F2F" />
          <Path d={`M0,82 Q${CARD_VERT_W / 2},107 ${CARD_VERT_W},82 L${CARD_VERT_W},87 Q${CARD_VERT_W / 2},112 0,87 Z`} fill="#FFC107" />
        </Svg>
      </View>

      {/* Header Text Overlay */}
      <View style={styles.headerTextContainer}>
        <Text style={styles.collegeNameText} numberOfLines={2}>
          {data.collegeName}
        </Text>
        <Text style={styles.collegeAddressText} numberOfLines={1}>
          ({data.collegeAddress})
        </Text>
      </View>

      {/* Left Rotate Badge: ID NO */}
      <View style={styles.leftBadge}>
        <Text style={styles.leftBadgeText}>ID NO: {data.rollNo}</Text>
      </View>

      {/* Right Rotate Badge: SESSION */}
      <View style={styles.rightBadge}>
        <Text style={styles.rightBadgeText}>SESSION {data.session}</Text>
      </View>

      {/* Student Photo */}
      <TouchableOpacity onPress={onPickPhoto} style={styles.photoContainer} activeOpacity={0.8}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.studentPhoto} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <User color="#94A3B8" size={32} />
          </View>
        )}
      </TouchableOpacity>

      {/* Student Name */}
      <Text style={styles.studentName} numberOfLines={1}>
        {data.studentName.toUpperCase()}
      </Text>

      {/* Information Table */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Father Name</Text>
          <Text style={styles.detailColon}>:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{data.fatherName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Course</Text>
          <Text style={styles.detailColon}>:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{data.courseOrClass}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>DOB</Text>
          <Text style={styles.detailColon}>:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{data.dob}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone</Text>
          <Text style={styles.detailColon}>:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{data.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Address</Text>
          <Text style={styles.detailColon}>:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{data.address}</Text>
        </View>
      </View>

      {/* Procedural Barcode */}
      <View style={styles.barcodeSection}>
        <MockBarcodeHorizontal />
      </View>

      {/* Director Signature */}
      <View style={styles.directorSection}>
        {signatureUri ? (
          <Image source={{ uri: signatureUri }} style={styles.uploadedSignature} resizeMode="contain" />
        ) : (
          <Text style={styles.signatureGraphic}>Director</Text>
        )}
        <View style={styles.signatureLine} />
        <Text style={styles.directorLabel}>Director</Text>
      </View>

      {/* Footer Banner */}
      <View style={styles.footer}>
        <Text style={styles.footerIdCard}>ID CARD</Text>
        <Text style={styles.footerValid}>VALID: {data.valid.toUpperCase()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_VERT_W,
    height: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
  },
  headerTextContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    alignItems: 'center',
    zIndex: 2,
  },
  collegeNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 16,
  },
  collegeAddressText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  leftBadge: {
    position: 'absolute',
    left: -40,
    top: 220,
    backgroundColor: '#C62828',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    transform: [{ rotate: '-90deg' }],
    width: 120,
    alignItems: 'center',
  },
  leftBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  rightBadge: {
    position: 'absolute',
    right: -40,
    top: 220,
    backgroundColor: '#FFC107',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    transform: [{ rotate: '90deg' }],
    width: 120,
    alignItems: 'center',
  },
  rightBadgeText: {
    color: '#1E293B',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  photoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#FFC107',
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
    marginTop: 82,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 3,
    elevation: 3,
  },
  studentPhoto: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentName: {
    alignSelf: 'center',
    color: '#C62828',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  detailsContainer: {
    marginTop: 10,
    paddingHorizontal: 36,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    width: 70,
    color: '#1E293B',
    fontSize: 9,
    fontWeight: '700',
  },
  detailColon: {
    width: 8,
    color: '#1E293B',
    fontSize: 9,
    fontWeight: '700',
  },
  detailValue: {
    flex: 1,
    color: '#334155',
    fontSize: 9,
    fontWeight: '500',
  },
  barcodeSection: {
    position: 'absolute',
    bottom: 45,
    left: 36,
    height: 24,
    justifyContent: 'center',
  },
  directorSection: {
    position: 'absolute',
    bottom: 45,
    right: 36,
    alignItems: 'center',
  },
  signatureGraphic: {
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive',
    fontSize: 11,
    color: '#334155',
    marginBottom: -4,
  },
  signatureLine: {
    width: 50,
    height: 1,
    backgroundColor: '#94A3B8',
  },
  directorLabel: {
    fontSize: 7,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  uploadedSignature: {
    width: 60,
    height: 18,
    marginBottom: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: '#D32F2F',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footerIdCard: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerValid: {
    color: '#FFC107',
    fontSize: 9,
    fontWeight: '800',
  },
});
