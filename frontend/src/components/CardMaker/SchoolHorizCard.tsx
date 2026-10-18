import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User } from 'lucide-react-native';
import { MockQrCode } from './MockMedia';

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
    address: string;
  };
  photoUri: string | null;
  onPickPhoto: () => void;
}

export const SchoolHorizCard: React.FC<CardProps> = ({ data, photoUri, onPickPhoto }) => {
  return (
    <View style={styles.card}>
      {/* Top Gradient Header */}
      <LinearGradient
        colors={['#0057B8', '#00A9E0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.schoolHeader}
      >
        <Text style={styles.schoolNameText} numberOfLines={1}>
          {data.collegeName.toUpperCase()}
        </Text>
        <Text style={styles.schoolAddressText} numberOfLines={1}>
          ({data.collegeAddress})
        </Text>
      </LinearGradient>
      
      {/* Content Row */}
      <View style={styles.schoolContentRow}>
        {/* Left Photo */}
        <TouchableOpacity onPress={onPickPhoto} style={styles.schoolPhotoContainer} activeOpacity={0.8}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.studentPhoto} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <User color="#94A3B8" size={24} />
            </View>
          )}
        </TouchableOpacity>

        {/* Middle Details */}
        <View style={styles.schoolDetailsContainer}>
          <Text style={styles.schoolStudentName} numberOfLines={1}>
            {data.studentName.toUpperCase()}
          </Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Father</Text>
            <Text style={styles.detailColon}>:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{data.fatherName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Class</Text>
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

        {/* Right QR Code */}
        <View style={styles.schoolQrContainer}>
          <MockQrCode />
        </View>
      </View>

      {/* Footer Banner */}
      <View style={styles.schoolFooter}>
        <Text style={styles.schoolFooterText}>SESSION: {data.session}</Text>
        <Text style={styles.schoolFooterText}>ID No: {data.rollNo}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 320,
    height: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
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
  schoolHeader: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#FFC107',
    paddingHorizontal: 8,
  },
  schoolNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  schoolAddressText: {
    color: '#E0F2FE',
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
  schoolContentRow: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
  },
  schoolPhotoContainer: {
    width: 65,
    height: 65,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00A9E0',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
  schoolDetailsContainer: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  schoolStudentName: {
    color: '#0057B8',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailLabel: {
    width: 48,
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
  schoolQrContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: '#0057B8',
    borderTopWidth: 3,
    borderTopColor: '#FFC107',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  schoolFooterText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
});
