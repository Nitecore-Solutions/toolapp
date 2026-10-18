import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { User } from 'lucide-react-native';
import { MockBarcodeVertical } from './MockMedia';

const CARD_VERT_W = 280;

interface CardProps {
  data: {
    collegeName: string; // Used as Channel/Agency Name
    collegeAddress: string; // Used as Tagline
    studentName: string;
    valid: string; // Used as Designation (e.g. Press Reporter)
    rollNo: string; // Used as ID Number
    phone: string;
    dob: string; // Used as Email
    address: string; // Used as Issued By
    courseOrClass: string; // Used as Valid Upto
  };
  photoUri: string | null;
  signatureUri?: string | null;
  onPickPhoto: () => void;
}

export const PressCard: React.FC<CardProps> = ({ data, photoUri, signatureUri, onPickPhoto }) => {
  return (
    <View style={styles.card}>
      {/* Top Banner SVG Wave */}
      <View style={styles.headerBackground}>
        <Svg height="110" width={CARD_VERT_W} viewBox={`0 0 ${CARD_VERT_W} 110`}>
          <Path d={`M0,0 L${CARD_VERT_W},0 L${CARD_VERT_W},80 Q${CARD_VERT_W / 2},105 0,80 Z`} fill="#C62828" />
          <Path d={`M0,82 Q${CARD_VERT_W / 2},107 ${CARD_VERT_W},82 L${CARD_VERT_W},87 Q${CARD_VERT_W / 2},112 0,87 Z`} fill="#E2E8F0" />
        </Svg>
      </View>

      {/* Header Text Overlay */}
      <View style={styles.headerTextContainer}>
        <Text style={styles.collegeNameText} numberOfLines={2}>
          {data.collegeName.toUpperCase()}
        </Text>
        <Text style={styles.collegeAddressText} numberOfLines={1}>
          {data.collegeAddress}
        </Text>
      </View>

      {/* Right-aligned Vertical Barcode */}
      <View style={styles.verticalBarcodeSection}>
        <MockBarcodeVertical />
      </View>

      {/* Photo Frame */}
      <TouchableOpacity onPress={onPickPhoto} style={styles.interPhotoFrame} activeOpacity={0.8}>
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

      {/* Press Reporter Badge */}
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>
          {data.valid.toUpperCase() || 'PRESS REPORTER'}
        </Text>
      </View>

      {/* Details List */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>ID No</Text>
          <Text style={styles.detailColon}>:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{data.rollNo}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone</Text>
          <Text style={styles.detailColon}>:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{data.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailColon}>:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{data.dob}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Issued By</Text>
          <Text style={styles.detailColon}>:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{data.address}</Text>
        </View>
      </View>

      {/* Bottom Sign and Validity Labels */}
      <View style={styles.signSection}>
        <Text style={styles.validText}>Valid Upto: {data.courseOrClass}</Text>
        <View style={{ alignItems: 'center' }}>
          {signatureUri ? (
            <Image source={{ uri: signatureUri }} style={styles.uploadedSignature} resizeMode="contain" />
          ) : null}
          <Text style={styles.signText}>Authorized Sign</Text>
        </View>
      </View>

      {/* Footer Banner */}
      <View style={styles.footer}>
        <View style={styles.footerYellowLine} />
        <Text style={styles.footerText}>PRESS ID CARD</Text>
        <View style={styles.footerYellowLine} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_VERT_W,
    height: 400,
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
    borderColor: '#C62828',
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
    top: 15,
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
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 3,
  },
  verticalBarcodeSection: {
    position: 'absolute',
    right: -24,
    top: 154,
    zIndex: 4,
  },
  interPhotoFrame: {
    width: 74,
    height: 74,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
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
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  badgeContainer: {
    backgroundColor: '#C62828',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 2,
    alignSelf: 'center',
    marginTop: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
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
    width: 60,
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
  },
  detailColon: {
    width: 8,
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
  },
  detailValue: {
    flex: 1,
    color: '#475569',
    fontSize: 9,
    fontWeight: '500',
  },
  signSection: {
    position: 'absolute',
    bottom: 38,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validText: {
    color: '#C62828',
    fontSize: 8,
    fontWeight: 'bold',
  },
  signText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: 'bold',
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
    backgroundColor: '#C62828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerYellowLine: {
    height: 2,
    backgroundColor: '#FFD700',
    width: '100%',
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginVertical: 2,
  },
});
