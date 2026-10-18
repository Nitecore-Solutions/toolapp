import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, User } from 'lucide-react-native';
import { MockBarcodeVertical } from './MockMedia';

const CARD_VERT_W = 280;

interface CardProps {
  data: {
    collegeName: string;
    collegeAddress: string;
    session: string;
    studentName: string;
    fatherName: string;
    courseOrClass: string;
    phone: string;
    address: string;
  };
  photoUri: string | null;
  logoUri: string | null;
  onPickPhoto: () => void;
}

export const InterCollegeCard: React.FC<CardProps> = ({ data, photoUri, logoUri, onPickPhoto }) => {
  return (
    <View style={styles.card}>
      {/* Top Banner SVG Wave */}
      <View style={styles.headerBackground}>
        <Svg height="110" width={CARD_VERT_W} viewBox={`0 0 ${CARD_VERT_W} 110`}>
          <Path d={`M0,0 L${CARD_VERT_W},0 L${CARD_VERT_W},80 Q${CARD_VERT_W / 2},105 0,80 Z`} fill="#002D62" />
          <Path d={`M0,82 Q${CARD_VERT_W / 2},107 ${CARD_VERT_W},82 L${CARD_VERT_W},87 Q${CARD_VERT_W / 2},112 0,87 Z`} fill="#FFC107" />
        </Svg>
      </View>

      {/* Header Text Overlay */}
      <View style={styles.headerTextContainer}>
        <Text style={styles.collegeNameText} numberOfLines={2}>
          {data.collegeName}
        </Text>
        
        {/* Header Row with Logo and Address */}
        <View style={styles.logoAndAddressRow}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.headerLogo} />
          ) : (
            <View style={styles.headerLogoPlaceholder}>
              <Award color="#FFF" size={10} />
            </View>
          )}
          <Text style={styles.collegeAddressTextInter} numberOfLines={1}>
            {data.collegeAddress}
          </Text>
        </View>
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

      <Text style={styles.studentName} numberOfLines={1}>
        {data.studentName}
      </Text>

      <View style={[styles.detailsContainer, { marginTop: 14 }]}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Father Name</Text>
          <Text style={styles.detailColon}>:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{data.fatherName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Class</Text>
          <Text style={styles.detailColon}>:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{data.courseOrClass}</Text>
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

      {/* Footer Banner */}
      <LinearGradient
        colors={['#C62828', '#D32F2F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.interFooter}
      >
        <Text style={styles.interFooterText}>Session {data.session}</Text>
        <Text style={styles.interFooterText}>Principal Sign</Text>
      </LinearGradient>
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
    borderColor: '#FFC107',
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
  logoAndAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  headerLogo: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  headerLogoPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C62828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collegeAddressTextInter: {
    color: '#FFD700',
    fontSize: 8,
    fontWeight: '600',
    marginLeft: 4,
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
    width: 68,
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
  interFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderTopWidth: 2,
    borderTopColor: '#FFC107',
  },
  interFooterText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
