import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ToolItem } from '../constants/tools';
import { ArrowRight, CornerDownRight, CornerRightDown, FileText, Grid, Heart, Image as LucideImage, Minimize2, MoveHorizontal, MoveVertical, PenTool, Sliders, User, Users, Wrench } from 'lucide-react-native';

interface ToolCardProps {
  item: ToolItem;
  onPress: () => void;
}

// Local previews mapping for generated high-fidelity illustration assets
const PREVIEW_IMAGES: { [key: string]: any } = {
  'add-name-date': require('../../assets/previews/add_name_date.jpg'),
  'join-photo-sig': require('../../assets/previews/join_photo_sig.jpg'),
  'image-to-pdf': require('../../assets/previews/image_to_pdf.jpg'),
  'pdf-to-jpg': require('../../assets/previews/pdf_to_jpg.jpg'),
  'age-calculator': require('../../assets/previews/age_calculator.jpg'),
  'passport-photo': require('../../assets/previews/passport_photo.jpg'),
  'image-to-20kb': require('../../assets/previews/image_to_20kb.jpg'),
  'typing-test': require('../../assets/previews/typing_test.jpg'),
  'remove-bg': require('../../assets/previews/remove_bg.jpg'),
  'college-card-maker': require('../../assets/previews/id_card_maker.jpg'),
  'poster-editor': require('../../assets/previews/poster_editor.jpg'),
  'signature-resizer': require('../../assets/previews/signature_resizer.jpg'),
  'resume-maker': require('../../assets/previews/resume_maker.jpg'),
  'biodata-maker': require('../../assets/previews/biodata_maker.jpg'),
  'pdf-editor': require('../../assets/previews/pdf_editor.jpg'),
  'compress-pdf': require('../../assets/previews/compress_pdf.jpg'),
  'resize': require('../../assets/previews/image_resizer.jpg'),
  'change-format': require('../../assets/previews/change_format.jpg'),
  'format-convert': require('../../assets/previews/jpg_converter.jpg'),
};

const ToolVisualPreview: React.FC<{ id: string }> = ({ id }) => {
  // If we have a generated PNG asset for the mockup, render it directly for maximum detail
  if (PREVIEW_IMAGES[id]) {
    return (
      <View style={styles.previewBoxImage}>
        <Image source={PREVIEW_IMAGES[id]} style={styles.previewImage} resizeMode="contain" />
      </View>
    );
  }

  // Otherwise, draw the card layout with high-fidelity vector elements matching user's screenshots
  switch (id) {
    case 'nsdl-pan-signature':
    case 'rrb-signature':
    case 'indiapost-signature':
    case 'ssc-signature': {
      const isPan = id === 'nsdl-pan-signature';
      const borderCol = isPan ? '#D97706' : '#DC2626';
      const bgCol = isPan ? '#FFFBEB' : '#FEF2F2';
      return (
        <View style={styles.previewBox}>
          <View style={[styles.dashedUploadBox, { borderColor: borderCol, backgroundColor: bgCol }]}>
            <PenTool color={borderCol} width={14} height={14} style={{ marginBottom: 4 }} />
            <Text style={[styles.uploadBoxText, { color: borderCol }]}>
              {isPan ? 'Upload Signature Scan' : 'Click to Upload Signature'}
            </Text>
          </View>
          <View style={styles.arrowContainer}>
            <CornerRightDown color="#94A3B8" width={14} height={14} />
            <View style={styles.sigStrokeLine} />
          </View>
        </View>
      );
    }

    case 'nsdl-pan-photo':
    case 'rrb-photo':
    case 'indiapost-photo':
    case 'upsc-photo': {
      const isPan = id === 'nsdl-pan-photo';
      const borderCol = isPan ? '#2563EB' : '#0284C7';
      const bgCol = isPan ? '#EFF6FF' : '#F0F9FF';
      return (
        <View style={styles.previewBox}>
          <View style={[styles.dashedUploadBox, { borderColor: borderCol, backgroundColor: bgCol }]}>
            <User color={borderCol} width={14} height={14} style={{ marginBottom: 4 }} />
            <Text style={[styles.uploadBoxText, { color: borderCol }]}>
              {isPan ? 'Upload Passport Photo' : 'Click to Upload Photo'}
            </Text>
          </View>
          <View style={styles.arrowContainer}>
            <CornerRightDown color="#94A3B8" width={14} height={14} />
            <View style={styles.miniPhotoBox}>
              <View style={styles.miniAvatar} />
            </View>
          </View>
        </View>
      );
    }

    case 'resize':
      return (
        <View style={styles.previewBox}>
          <View style={styles.imageBox}>
            <LucideImage color="#4F46E5" width={26} height={26} />
            <View style={styles.dimRow}>
              <MoveHorizontal color="#10B981" width={12} height={12} />
              <Text style={styles.dimText}>W</Text>
              <MoveVertical color="#10B981" width={12} height={12} style={{ marginLeft: 6 }} />
              <Text style={styles.dimText}>H</Text>
            </View>
          </View>
        </View>
      );

    case 'compress-kb':
      return (
        <View style={styles.previewBox}>
          <View style={styles.compressBox}>
            <Text style={styles.sizeTextMB}>4.2 MB</Text>
            <CornerDownRight color="#EF4444" width={16} height={16} style={{ marginHorizontal: 4 }} />
            <Text style={styles.sizeTextKB}>150 KB</Text>
          </View>
        </View>
      );

    case 'format-convert':
    case 'change-format':
      return (
        <View style={styles.previewBox}>
          <View style={styles.convertFormatBox}>
            <View style={styles.formatBadge}>
              <Text style={styles.formatText}>PNG</Text>
            </View>
            <ArrowRight color="#6366F1" width={14} height={14} />
            <View style={[styles.formatBadge, { backgroundColor: '#4F46E5' }]}>
              <Text style={styles.formatText}>JPG</Text>
            </View>
          </View>
        </View>
      );

    case 'dpi':
      return (
        <View style={styles.previewBox}>
          <View style={styles.dpiBox}>
            <Grid color="#6366F1" width={24} height={24} />
            <Text style={styles.dpiText}>72 → 300 DPI</Text>
          </View>
        </View>
      );

    case 'filter':
      return (
        <View style={styles.previewBox}>
          <View style={styles.filterBox}>
            <View style={styles.filterLeft} />
            <View style={styles.filterRight} />
            <Sliders color="#374151" width={16} height={16} style={styles.centerIcon} />
          </View>
        </View>
      );

    case 'remove-bg':
      return (
        <View style={styles.previewBox}>
          <View style={styles.removeBgContainer}>
            <View style={styles.checkerboard} />
            <View style={[styles.avatarCircle, { backgroundColor: '#4F46E5', zIndex: 2 }]} />
          </View>
        </View>
      );

    case 'compress-pdf':
      return (
        <View style={styles.previewBox}>
          <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
            <FileText color="#EF4444" width={32} height={32} />
            <Minimize2 color="#10B981" width={16} height={16} style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: '#FFFFFF', borderRadius: 8, padding: 1 }} />
          </View>
        </View>
      );

    case 'biodata-maker':
      return (
        <View style={styles.previewBox}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Heart color="#EC4899" width={28} height={28} fill="#EC4899" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FDF2F8', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <User color="#EC4899" width={10} height={10} />
              <View style={{ width: 32, height: 3, backgroundColor: '#FBCFE8', borderRadius: 2 }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F8FAFC', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Users color="#94A3B8" width={10} height={10} />
              <View style={{ width: 28, height: 3, backgroundColor: '#E2E8F0', borderRadius: 2 }} />
            </View>
          </View>
        </View>
      );

    case 'edit-pdf':
      return (
        <View style={styles.previewBox}>
          <View style={styles.editPdfContainer}>
            <FileText color="#EF4444" width={28} height={28} />
            <PenTool color="#1E293B" width={14} height={14} style={styles.editIconOverlap} />
          </View>
        </View>
      );

    case 'resume-maker':
      return (
        <View style={styles.previewBox}>
          <View style={styles.resumeContainer}>
            <View style={styles.resumeHeaderLine} />
            <View style={styles.resumeBody}>
              <View style={styles.resumeLeftCol} />
              <View style={styles.resumeRightCol}>
                <View style={styles.resumeTextLine} />
                <View style={[styles.resumeTextLine, { width: '80%' }]} />
              </View>
            </View>
          </View>
        </View>
      );

    case 'insta-profile':
      return (
        <View style={styles.previewBox}>
          <View style={styles.instaBorderRing}>
            <View style={styles.instaInnerPfp}>
              <User color="#A8A29E" width={32} height={32} />
            </View>
          </View>
        </View>
      );

    default:
      return (
        <View style={styles.previewBox}>
          <Wrench color="#4F46E5" width={24} height={24} />
        </View>
      );
  }
};

export const ToolCard: React.FC<ToolCardProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
      
      {/* Visual mockup illustration box */}
      <View style={styles.illustrationWrapper}>
        <ToolVisualPreview id={item.id} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    width: '48%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 185,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    height: 34,
    verticalAlign: 'middle',
  },
  illustrationWrapper: {
    width: '100%',
    height: 125,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  clickHereButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    borderRadius: 6,
    paddingVertical: 7,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  buttonIcon: {
    transform: [{ rotate: '180deg' }],
    marginRight: 4,
  },
  clickHereText: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
  },
  // Vector Illustrative components matching screenshots
  previewBoxImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewBox: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
  },
  dashedUploadBox: {
    width: '95%',
    height: 60,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  uploadBoxText: {
    fontSize: 8,
    fontFamily: 'Outfit-SemiBold',
    textAlign: 'center',
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    width: '80%',
    justifyContent: 'center',
  },
  sigStrokeLine: {
    height: 1.5,
    backgroundColor: '#1E293B',
    borderRadius: 1,
    width: 32,
    marginLeft: 6,
  },
  miniPhotoBox: {
    width: 20,
    height: 25,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  miniAvatar: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
  },
  imageBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dimText: {
    fontSize: 8,
    fontFamily: 'Outfit-Bold',
    color: '#10B981',
    marginLeft: 2,
  },
  compressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeTextMB: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#EF4444',
  },
  sizeTextKB: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#10B981',
  },
  convertFormatBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  formatText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  dpiBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpiText: {
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
    color: '#4F46E5',
    marginTop: 4,
  },
  filterBox: {
    width: 60,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  filterLeft: {
    flex: 1,
    backgroundColor: '#94A3B8',
  },
  filterRight: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  centerIcon: {
    position: 'absolute',
    alignSelf: 'center',
    left: 20,
  },
  removeBgContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkerboard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
  },
  editPdfContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconOverlap: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFF',
    borderRadius: 6,
    padding: 1,
  },
  resumeContainer: {
    width: 45,
    height: 55,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 4,
  },
  resumeHeaderLine: {
    height: 3,
    backgroundColor: '#4F46E5',
    width: '50%',
    marginBottom: 4,
  },
  resumeBody: {
    flexDirection: 'row',
    flex: 1,
  },
  resumeLeftCol: {
    width: '20%',
    backgroundColor: '#F1F5F9',
    height: '100%',
    marginRight: 3,
  },
  resumeRightCol: {
    flex: 1,
    justifyContent: 'space-between',
    height: '80%',
  },
  resumeTextLine: {
    height: 1.5,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  instaBorderRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  instaInnerPfp: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F5F5F4',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
