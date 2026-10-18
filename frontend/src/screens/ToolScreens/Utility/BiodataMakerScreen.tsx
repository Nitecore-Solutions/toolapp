import { useAlert } from '../../../context/AlertContext';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  ToastAndroid,
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { binaryRequest } from '../../../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Buffer } from 'buffer';
import {
  ChevronDown,
  ChevronUp,
  User,
  Users,
  Phone,
  Image as ImageIcon,
  Heart,
  CheckCircle,
  Share2,
  RefreshCw,
} from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Religious Banner Icons ─────────────────────────────────
interface BannerIcon {
  id: string;
  label: string;
  char: string;
  bg: string;
  color: string;
}

const BANNER_ICONS: BannerIcon[] = [
  { id: 'dharma', label: 'Dharma Wheel', char: '☸', bg: '#FEF9C3', color: '#92400E' },
  { id: 'islam', label: 'Islam', char: '☪', bg: '#DCFCE7', color: '#166534' },
  { id: 'cross', label: 'Cross', char: '✝', bg: '#FEE2E2', color: '#991B1B' },
  { id: 'ikonkar', label: 'Ik Onkar', char: 'ੴ', bg: '#FFF7ED', color: '#9A3412' },
  { id: 'khanda', label: 'Khanda', char: '☬', bg: '#F0F9FF', color: '#0C4A6E' },
  { id: 'om', label: 'Om (ॐ)', char: 'ॐ', bg: '#FFF7ED', color: '#C2410C' },
  { id: 'swastik', label: 'Swastika', char: '卍', bg: '#FFF1F2', color: '#9F1239' },
  { id: 'kalash', label: 'Kalash', char: '🪔', bg: '#FFFBEB', color: '#B45309' },
  { id: 'shri', label: '|| Shri ||', char: 'श्री', bg: '#FFF1F2', color: '#881337' },
  { id: 'ganesh1', label: 'Ganesha 1', char: '🐘', bg: '#FAF5FF', color: '#6B21A8' },
  { id: 'ganesh2', label: 'Ganesha 2', char: '🕉', bg: '#FFF7ED', color: '#C2410C' },
  { id: 'ganesh3', label: 'Ganesha 3', char: '🕉️', bg: '#FDF4FF', color: '#7E22CE' },
  { id: 'ganesh4', label: 'Ganesha 4', char: '🙏', bg: '#FFF1F2', color: '#9F1239' },
];


// ── Dropdown options ──────────────────────────────────────
const COMPLEXION_OPTIONS = ['Fair', 'Very Fair', 'Wheatish', 'Wheatish Brown', 'Dark'];
const HEIGHT_OPTIONS = [
  "4'5\"", "4'6\"", "4'7\"", "4'8\"", "4'9\"", "4'10\"", "4'11\"",
  "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"",
  "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"",
  "6'0\"", "6'1\"", "6'2\"", "6'3\"", "6'4\"", "6'5\"",
];

// ── Colors ────────────────────────────────────────────────
const C = {
  purple: '#7C3AED',
  orange: '#F59E0B',
  blue: '#3B82F6',
  pink: '#EC4899',
  dark: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  bg: '#FFFFFF',
  subtle: '#F8FAFC',
  error: '#EF4444',
};

// ── Types ─────────────────────────────────────────────────
interface PhotoAsset {
  uri: string;
  name: string;
  type: string;
}

interface FormData {
  // Header
  headerLeft: string;
  headerRight: string;
  // Personal
  name: string;
  dob: string;
  tob: string;
  pob: string;
  gotra: string;
  hobbies: string;
  complexion: string;
  height: string;
  religionCaste: string;
  education: string;
  occupation: string;
  // Family
  grandfatherName: string;
  grandfatherOccupation: string;
  grandmotherName: string;
  grandmotherOccupation: string;
  fatherName: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  // Contact
  contactNumber: string;
  address: string;
  email: string;
}

const INIT_FORM: FormData = {
  headerLeft: 'Shree Ganesh', headerRight: 'Bio Data',
  name: '', dob: '', tob: '', pob: '',
  gotra: '', hobbies: '', complexion: '', height: '',
  religionCaste: '', education: '', occupation: '',
  grandfatherName: '', grandfatherOccupation: '',
  grandmotherName: '', grandmotherOccupation: '',
  fatherName: '', fatherOccupation: '',
  motherName: '', motherOccupation: '',
  contactNumber: '', address: '', email: '',
};

// ── Sub-components ─────────────────────────────────────────
const SectionInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  multiline?: boolean;
}> = ({ label, value, onChange, placeholder, keyboardType = 'default', multiline = false }) => (
  <View style={sc.fieldWrap}>
    <Text style={sc.fieldLabel}>{label}</Text>
    <TextInput
      style={[sc.input, multiline && { height: 72, textAlignVertical: 'top' }]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder || ''}
      placeholderTextColor="#CBD5E1"
      keyboardType={keyboardType}
      multiline={multiline}
      autoCapitalize="words"
    />
  </View>
);

const DropdownPicker: React.FC<{
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}> = ({ label, options, selected, onSelect }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={sc.fieldWrap}>
      <Text style={sc.fieldLabel}>{label}</Text>
      <TouchableOpacity style={sc.dropdownBtn} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <Text style={selected ? sc.dropdownSelected : sc.dropdownPlaceholder}>
          {selected || `Select ${label}`}
        </Text>
        {open ? <ChevronUp color={C.muted} width={16} height={16} /> : <ChevronDown color={C.muted} width={16} height={16} />}
      </TouchableOpacity>
      {open && (
        <View style={sc.dropdownList}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
            {options.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[sc.dropdownItem, selected === opt && sc.dropdownItemActive]}
                onPress={() => { onSelect(opt); setOpen(false); }}
              >
                <Text style={[sc.dropdownItemText, selected === opt && { color: C.purple, fontFamily: 'Outfit-Bold' }]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const SectionHeader: React.FC<{
  color: string;
  icon: React.ReactNode;
  title: string;
  open: boolean;
  onToggle: () => void;
}> = ({ color, icon, title, open, onToggle }) => (
  <TouchableOpacity style={[sc.sectionHeader, { backgroundColor: color }]} onPress={onToggle} activeOpacity={0.85}>
    <View style={sc.sectionHeaderLeft}>
      {icon}
      <Text style={sc.sectionHeaderText}>{title}</Text>
    </View>
    {open
      ? <ChevronUp color="#FFFFFF" width={18} height={18} />
      : <ChevronDown color="#FFFFFF" width={18} height={18} />}
  </TouchableOpacity>
);

// ── 12 Biodata Templates ─────────────────────────────────
interface TemplateItem {
  id: number;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  style: 'modern' | 'traditional';
  svg: string;
}

const makeSvgModern = (hdr: string, sec1: string, sec2: string, sec3: string) => `
<svg viewBox="0 0 80 106" xmlns="http://www.w3.org/2000/svg">
  <rect width="80" height="106" fill="white"/>
  <!-- shadow -->
  <rect x="1" y="2" width="78" height="104" rx="1" fill="#E2E8F0"/>
  <rect width="78" height="104" fill="white"/>
  <!-- top header band -->
  <rect width="78" height="18" fill="${hdr}"/>
  <rect x="4" y="3" width="28" height="2.5" rx="1" fill="rgba(255,255,255,0.7)"/>
  <text x="39" y="13" text-anchor="middle" font-size="6" font-weight="bold" fill="white" font-family="sans-serif">BIO DATA</text>
  <!-- accent line -->
  <rect y="18" width="78" height="1.5" fill="${sec2}"/>
  <!-- personal details header -->
  <rect x="4" y="22" width="70" height="6" rx="1" fill="${sec1}"/>
  <text x="39" y="26.5" text-anchor="middle" font-size="4" fill="white" font-family="sans-serif" font-weight="bold">PERSONAL DETAILS</text>
  <!-- photo box right -->
  <rect x="54" y="30" width="18" height="22" rx="1" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="0.5"/>
  <text x="63" y="42" text-anchor="middle" font-size="3.5" fill="#94A3B8" font-family="sans-serif">Photo</text>
  <!-- personal data lines left -->
  <rect x="4" y="31" width="14" height="1.5" rx="0.5" fill="#94A3B8"/>
  <rect x="20" y="31" width="30" height="1.5" rx="0.5" fill="#E2E8F0"/>
  <rect x="4" y="35" width="14" height="1.5" rx="0.5" fill="#94A3B8"/>
  <rect x="20" y="35" width="28" height="1.5" rx="0.5" fill="#E2E8F0"/>
  <rect x="4" y="39" width="14" height="1.5" rx="0.5" fill="#94A3B8"/>
  <rect x="20" y="39" width="26" height="1.5" rx="0.5" fill="#E2E8F0"/>
  <rect x="4" y="43" width="14" height="1.5" rx="0.5" fill="#94A3B8"/>
  <rect x="20" y="43" width="24" height="1.5" rx="0.5" fill="#E2E8F0"/>
  <rect x="4" y="47" width="14" height="1.5" rx="0.5" fill="#94A3B8"/>
  <rect x="20" y="47" width="30" height="1.5" rx="0.5" fill="#E2E8F0"/>
  <!-- full width data lines -->
  <rect x="4" y="53" width="14" height="1.5" rx="0.5" fill="#94A3B8"/>
  <rect x="20" y="53" width="30" height="1.5" rx="0.5" fill="#E2E8F0"/>
  <rect x="4" y="57" width="14" height="1.5" rx="0.5" fill="#94A3B8"/>
  <rect x="20" y="57" width="28" height="1.5" rx="0.5" fill="#E2E8F0"/>
  <!-- family details header -->
  <rect x="4" y="62" width="70" height="6" rx="1" fill="${sec2}"/>
  <text x="39" y="66.5" text-anchor="middle" font-size="4" fill="white" font-family="sans-serif" font-weight="bold">FAMILY DETAILS</text>
  <rect x="4" y="70" width="14" height="1.5" rx="0.5" fill="#94A3B8"/>
  <rect x="20" y="70" width="26" height="1.5" rx="0.5" fill="#E2E8F0"/>
  <rect x="4" y="74" width="14" height="1.5" rx="0.5" fill="#94A3B8"/>
  <rect x="20" y="74" width="30" height="1.5" rx="0.5" fill="#E2E8F0"/>
  <rect x="4" y="78" width="14" height="1.5" rx="0.5" fill="#94A3B8"/>
  <rect x="20" y="78" width="24" height="1.5" rx="0.5" fill="#E2E8F0"/>
  <!-- contact header -->
  <rect x="4" y="83" width="70" height="6" rx="1" fill="${sec3}"/>
  <text x="39" y="87.5" text-anchor="middle" font-size="4" fill="white" font-family="sans-serif" font-weight="bold">CONTACT DETAILS</text>
  <rect x="4" y="91" width="14" height="1.5" rx="0.5" fill="#94A3B8"/>
  <rect x="20" y="91" width="30" height="1.5" rx="0.5" fill="#E2E8F0"/>
  <rect x="4" y="95" width="14" height="1.5" rx="0.5" fill="#94A3B8"/>
  <rect x="20" y="95" width="26" height="1.5" rx="0.5" fill="#E2E8F0"/>
  <!-- footer -->
  <rect y="100" width="78" height="4" fill="#F8FAFC"/>
  <line y1="100" x2="78" y2="100" stroke="#E2E8F0" stroke-width="0.5"/>
</svg>`;

const makeSvgTraditional = (border: string, sec1: string, sec2: string, dashed = false) => `
<svg viewBox="0 0 80 106" xmlns="http://www.w3.org/2000/svg">
  <rect width="80" height="106" fill="white"/>
  <rect x="1" y="2" width="78" height="104" rx="1" fill="#E2E8F0"/>
  <rect width="78" height="104" fill="white"/>
  <!-- outer border -->
  <rect x="3" y="3" width="72" height="98" fill="none" stroke="${border}" stroke-width="${dashed ? '1.5' : '2'}" ${dashed ? 'stroke-dasharray="4,3"' : ''} rx="1"/>
  <!-- inner border -->
  <rect x="5" y="5" width="68" height="94" fill="none" stroke="${border}" stroke-width="0.5" opacity="0.5" rx="1"/>
  <!-- Om symbol + Bio Data header -->
  <text x="39" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="${border}" font-family="serif">&#x950;</text>
  <text x="39" y="23" text-anchor="middle" font-size="5.5" font-weight="bold" fill="${border}" font-family="sans-serif">Bio Data</text>
  <line x1="14" y1="25" x2="64" y2="25" stroke="${border}" stroke-width="0.8"/>
  <!-- photo box right -->
  <rect x="54" y="28" width="17" height="21" rx="1" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="0.5"/>
  <text x="62.5" y="40" text-anchor="middle" font-size="3.5" fill="#94A3B8" font-family="sans-serif">Photo</text>
  <!-- personal data lines -->
  <rect x="8" y="29" width="10" height="1.3" rx="0.4" fill="#94A3B8"/>
  <rect x="20" y="29" width="30" height="1.3" rx="0.4" fill="#E2E8F0"/>
  <rect x="8" y="33" width="10" height="1.3" rx="0.4" fill="#94A3B8"/>
  <rect x="20" y="33" width="28" height="1.3" rx="0.4" fill="#E2E8F0"/>
  <rect x="8" y="37" width="10" height="1.3" rx="0.4" fill="#94A3B8"/>
  <rect x="20" y="37" width="26" height="1.3" rx="0.4" fill="#E2E8F0"/>
  <rect x="8" y="41" width="10" height="1.3" rx="0.4" fill="#94A3B8"/>
  <rect x="20" y="41" width="24" height="1.3" rx="0.4" fill="#E2E8F0"/>
  <rect x="8" y="45" width="10" height="1.3" rx="0.4" fill="#94A3B8"/>
  <rect x="20" y="45" width="30" height="1.3" rx="0.4" fill="#E2E8F0"/>
  <rect x="8" y="50" width="10" height="1.3" rx="0.4" fill="#94A3B8"/>
  <rect x="20" y="50" width="28" height="1.3" rx="0.4" fill="#E2E8F0"/>
  <!-- section divider -->
  <rect x="8" y="54" width="62" height="1" fill="${sec1}" opacity="0.6"/>
  <text x="39" y="59" text-anchor="middle" font-size="3.5" font-weight="bold" fill="${sec1}" font-family="sans-serif">FAMILY DETAILS</text>
  <rect x="8" y="61" width="10" height="1.3" rx="0.4" fill="#94A3B8"/>
  <rect x="20" y="61" width="26" height="1.3" rx="0.4" fill="#E2E8F0"/>
  <rect x="8" y="65" width="10" height="1.3" rx="0.4" fill="#94A3B8"/>
  <rect x="20" y="65" width="30" height="1.3" rx="0.4" fill="#E2E8F0"/>
  <rect x="8" y="69" width="10" height="1.3" rx="0.4" fill="#94A3B8"/>
  <rect x="20" y="69" width="24" height="1.3" rx="0.4" fill="#E2E8F0"/>
  <rect x="8" y="73" width="10" height="1.3" rx="0.4" fill="#94A3B8"/>
  <rect x="20" y="73" width="28" height="1.3" rx="0.4" fill="#E2E8F0"/>
  <!-- contact section -->
  <rect x="8" y="78" width="62" height="1" fill="${sec2}" opacity="0.6"/>
  <text x="39" y="83" text-anchor="middle" font-size="3.5" font-weight="bold" fill="${sec2}" font-family="sans-serif">CONTACT DETAILS</text>
  <rect x="8" y="85" width="10" height="1.3" rx="0.4" fill="#94A3B8"/>
  <rect x="20" y="85" width="30" height="1.3" rx="0.4" fill="#E2E8F0"/>
  <rect x="8" y="89" width="10" height="1.3" rx="0.4" fill="#94A3B8"/>
  <rect x="20" y="89" width="26" height="1.3" rx="0.4" fill="#E2E8F0"/>
  <rect x="8" y="93" width="10" height="1.3" rx="0.4" fill="#94A3B8"/>
  <rect x="20" y="93" width="24" height="1.3" rx="0.4" fill="#E2E8F0"/>
</svg>`;

const BIODATA_TEMPLATES: TemplateItem[] = [
  {
    id: 1, name: 'Bio Data 1', primary: '#7C3AED', secondary: '#F59E0B', accent: '#EDE9FE', style: 'modern',
    svg: makeSvgModern('#7C3AED', '#7C3AED', '#D97706', '#3B82F6')
  },
  {
    id: 2, name: 'Bio Data 2', primary: '#16A34A', secondary: '#15803D', accent: '#DCFCE7', style: 'modern',
    svg: makeSvgModern('#16A34A', '#16A34A', '#15803D', '#059669')
  },
  {
    id: 3, name: 'Bio Data 3', primary: '#0F766E', secondary: '#0D9488', accent: '#CCFBF1', style: 'modern',
    svg: makeSvgModern('#0F766E', '#0F766E', '#0D9488', '#14B8A6')
  },
  {
    id: 4, name: 'Bio Data 4', primary: '#1E293B', secondary: '#475569', accent: '#F1F5F9', style: 'modern',
    svg: makeSvgModern('#1E293B', '#334155', '#475569', '#64748B')
  },
  {
    id: 5, name: 'Bio Data 5', primary: '#EA580C', secondary: '#C2410C', accent: '#FFF7ED', style: 'modern',
    svg: makeSvgModern('#EA580C', '#EA580C', '#C2410C', '#F97316')
  },
  {
    id: 6, name: 'Bio Data 6', primary: '#BE123C', secondary: '#9F1239', accent: '#FFF1F2', style: 'modern',
    svg: makeSvgModern('#BE123C', '#BE123C', '#9F1239', '#E11D48')
  },
  {
    id: 7, name: 'Bio Data 7', primary: '#D97706', secondary: '#B45309', accent: '#FEF9C3', style: 'traditional',
    svg: makeSvgTraditional('#D97706', '#D97706', '#B45309')
  },
  {
    id: 8, name: 'Bio Data 8', primary: '#DB2777', secondary: '#BE185D', accent: '#FDF2F8', style: 'traditional',
    svg: makeSvgTraditional('#DB2777', '#DB2777', '#BE185D')
  },
  {
    id: 9, name: 'Bio Data 9', primary: '#92400E', secondary: '#78350F', accent: '#FEF3C7', style: 'traditional',
    svg: makeSvgTraditional('#92400E', '#92400E', '#78350F')
  },
  {
    id: 10, name: 'Bio Data 10', primary: '#EA580C', secondary: '#C2410C', accent: '#FFF7ED', style: 'traditional',
    svg: makeSvgTraditional('#EA580C', '#EA580C', '#C2410C')
  },
  {
    id: 11, name: 'Bio Data 11', primary: '#2563EB', secondary: '#1D4ED8', accent: '#EFF6FF', style: 'traditional',
    svg: makeSvgTraditional('#2563EB', '#2563EB', '#1D4ED8', true)
  },
  {
    id: 12, name: 'Bio Data 12', primary: '#111827', secondary: '#374151', accent: '#F9FAFB', style: 'traditional',
    svg: makeSvgTraditional('#111827', '#111827', '#374151')
  },
];


// ── Main Screen ───────────────────────────────────────────
export default function BiodataMakerScreen() {
  const { showAlert } = useAlert();
  const wrapWithAd = useAdOnDownload();
  const [form, setForm] = useState<FormData>(INIT_FORM);
  const [openSection, setOpenSection] = useState<string>('personal');
  const [profilePhoto, setProfilePhoto] = useState<PhotoAsset | null>(null);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<PhotoAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<BannerIcon>(BANNER_ICONS[0]); // default Shri
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem>(BIODATA_TEMPLATES[0]);

  const set = (key: keyof FormData) => (v: string) => setForm(f => ({ ...f, [key]: v }));
  const toggle = (section: string) => setOpenSection(s => s === section ? '' : section);

  const pickImage = async (setter: (a: PhotoAsset) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.uri.split('/').pop() || 'photo.jpg';
      setter({ uri: asset.uri, name, type: asset.mimeType || 'image/jpeg' });
    }
  };

  const handleGenerate = async () => {
    if (!form.name.trim()) {
      showAlert({ title: "Required", message: 'Please enter the candidate name before generating.', type: 'error' });
      return;
    }
    setLoading(true);
    setResultUri(null);
    try {
      const formData = new FormData();
      formData.append('template_id', String(selectedTemplate.id));
      // Append all text fields
      formData.append('header_left', form.headerLeft);
      formData.append('header_right', form.headerRight);
      formData.append('name', form.name);
      formData.append('dob', form.dob);
      formData.append('tob', form.tob);
      formData.append('pob', form.pob);
      formData.append('gotra', form.gotra);
      formData.append('hobbies', form.hobbies);
      formData.append('complexion', form.complexion);
      formData.append('height', form.height);
      formData.append('religion_caste', form.religionCaste);
      formData.append('education', form.education);
      formData.append('occupation', form.occupation);
      formData.append('grandfather_name', form.grandfatherName);
      formData.append('grandfather_occupation', form.grandfatherOccupation);
      formData.append('grandmother_name', form.grandmotherName);
      formData.append('grandmother_occupation', form.grandmotherOccupation);
      formData.append('father_name', form.fatherName);
      formData.append('father_occupation', form.fatherOccupation);
      formData.append('mother_name', form.motherName);
      formData.append('mother_occupation', form.motherOccupation);
      formData.append('contact_number', form.contactNumber);
      formData.append('address', form.address);
      formData.append('email', form.email);

      // Append photos if selected
      if (profilePhoto) {
        // @ts-ignore
        formData.append('profile_photo', { uri: profilePhoto.uri, name: profilePhoto.name, type: profilePhoto.type });
      }
      if (fullscreenPhoto) {
        // @ts-ignore
        formData.append('fullscreen_photo', { uri: fullscreenPhoto.uri, name: fullscreenPhoto.name, type: fullscreenPhoto.type });
      }

      const arrayBuffer = await binaryRequest('POST', '/api/pdf/biodata', formData);

      const base64 = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer)).toString('base64');
      const tempUri = `${FileSystem.cacheDirectory}biodata_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(tempUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      setResultUri(tempUri);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(tempUri, { mimeType: 'application/pdf', dialogTitle: 'Save / Share Bio Data' });
      }
      if (Platform.OS === 'android') {
        ToastAndroid.show('Biodata PDF ready!', ToastAndroid.SHORT);
      }
      showAlert({ title: "Download Complete! 🎉", message: "Aapki Biodata PDF download ho gayi hai.", type: 'success' });
    } catch (err: any) {
      console.log("Biodata generation failed");
      showAlert({ title: "Notice", message: 'Biodata generation is temporarily unavailable. Please try again later.', type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUri) return;
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(resultUri, { mimeType: 'application/pdf', dialogTitle: 'Save / Share Bio Data' });
      }
      if (Platform.OS === 'android') {
        ToastAndroid.show('Biodata PDF ready!', ToastAndroid.SHORT);
      }
      showAlert({ title: "Download Complete! 🎉", message: "Aapki Biodata PDF download ho gayi hai.", type: 'success' });
    } catch (err) {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(resultUri, { mimeType: 'application/pdf' });
      }
    }
  };

  const handleReset = () => {
    setForm(INIT_FORM);
    setProfilePhoto(null);
    setFullscreenPhoto(null);
    setResultUri(null);
    setOpenSection('personal');
    setSelectedIcon(BANNER_ICONS[0]);
  };

  if (resultUri) {
    return (
      <SafeAreaView style={sc.container}>
        <ScrollView contentContainerStyle={sc.resultContent}>
          <View style={sc.successIconWrap}>
            <CheckCircle color="#10B981" width={56} height={56} />
          </View>
          <Text style={sc.successTitle}>Bio Data Ready!</Text>
          <Text style={sc.successSub}>Your marriage bio data PDF has been generated successfully.</Text>
          <View style={sc.resultCard}>
            <Heart color="#EC4899" width={32} height={32} fill="#EC4899" />
            <Text style={sc.resultCardName}>{form.name || 'Bio Data'}</Text>
            <Text style={sc.resultCardSub}>biodata.pdf</Text>
          </View>
          <TouchableOpacity style={sc.primaryBtn} onPress={() => wrapWithAd(handleDownload)} activeOpacity={0.85}>
            <Share2 color="#FFFFFF" width={16} height={16} />
            <Text style={sc.primaryBtnText}>Share / Save PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sc.outlineBtn} onPress={handleReset} activeOpacity={0.85}>
            <RefreshCw color={C.dark} width={14} height={14} />
            <Text style={sc.outlineBtnText}>Make Another</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sc.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={sc.scroll} keyboardShouldPersistTaps="handled">

          {/* Page header */}
          <View style={sc.pageHeader}>
            <Heart color="#EC4899" width={22} height={22} fill="#EC4899" />
            <View style={{ marginLeft: 10 }}>
              <Text style={sc.pageTitle}>Marriage Bio Data</Text>
              <Text style={sc.pageSubtitle}>Fill the details below and generate PDF</Text>
            </View>
          </View>

          {/* ── Template Selector ── */}
          <View style={sc.templateSection}>
            <Text style={sc.templateSectionTitle}>Choose Template</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={sc.templateScroll}
            >
              {BIODATA_TEMPLATES.map(tmpl => (
                <TouchableOpacity
                  key={tmpl.id}
                  style={[
                    sc.templateCard,
                    selectedTemplate.id === tmpl.id && { borderColor: tmpl.primary, borderWidth: 2.5 },
                  ]}
                  onPress={() => setSelectedTemplate(tmpl)}
                  activeOpacity={0.85}
                >
                  {/* SVG document thumbnail */}
                  <SvgXml xml={tmpl.svg} width={74} height={98} />
                  <Text style={[sc.templateCardName, selectedTemplate.id === tmpl.id && { color: tmpl.primary, fontFamily: 'Outfit-Bold' }]}>
                    {tmpl.name}
                  </Text>
                  {selectedTemplate.id === tmpl.id && (
                    <View style={[sc.templateSelectedDot, { backgroundColor: tmpl.primary }]} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Icon Picker Area ── */}
          <View style={sc.iconPickerWrap}>
            <View style={[sc.iconDisplay, { backgroundColor: selectedIcon.bg }]}>
              <Text
                style={[sc.iconDisplayChar, { color: selectedIcon.color, width: '100%' }]}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.3}
              >
                {selectedIcon.char}
              </Text>
            </View>
            <Text style={sc.iconDisplayLabel}>{selectedIcon.label}</Text>
            <TouchableOpacity
              style={sc.changeIconBtn}
              onPress={() => setShowIconPicker(true)}
              activeOpacity={0.8}
            >
              <Text style={sc.changeIconBtnText}>Change Icon</Text>
            </TouchableOpacity>
          </View>

          {/* ── Icon Picker Modal ── */}
          <Modal
            visible={showIconPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowIconPicker(false)}
          >
            <View style={sc.modalOverlay}>
              <View style={sc.modalSheet}>
                <Text style={sc.modalTitle}>Select Banner Icon</Text>
                <Text style={sc.modalSubtitle}>Choose a religious symbol for your bio data header</Text>
                <FlatList
                  data={BANNER_ICONS}
                  numColumns={4}
                  keyExtractor={item => item.id}
                  contentContainerStyle={sc.iconGrid}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        sc.iconGridItem,
                        { backgroundColor: item.bg },
                        selectedIcon.id === item.id && sc.iconGridItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedIcon(item);
                        setShowIconPicker(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[sc.iconGridChar, { color: item.color, width: '100%' }]}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        minimumFontScale={0.3}
                      >{item.char}</Text>
                      <Text style={sc.iconGridLabel} numberOfLines={1}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity
                  style={sc.modalCloseBtn}
                  onPress={() => setShowIconPicker(false)}
                  activeOpacity={0.8}
                >
                  <Text style={sc.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Banner text customization */}
          <View style={sc.bannerRow}>
            <View style={[sc.bannerInput, { flex: 1, marginRight: 6 }]}>
              <Text style={sc.bannerLabel}>Left Header</Text>
              <TextInput
                style={sc.bannerTextInput}
                value={form.headerLeft}
                onChangeText={set('headerLeft')}
                placeholder="Shree Ganesh"
                placeholderTextColor="#CBD5E1"
              />
            </View>
            <View style={[sc.bannerInput, { flex: 1, marginLeft: 6 }]}>
              <Text style={sc.bannerLabel}>Right Header</Text>
              <TextInput
                style={sc.bannerTextInput}
                value={form.headerRight}
                onChangeText={set('headerRight')}
                placeholder="Bio Data"
                placeholderTextColor="#CBD5E1"
              />
            </View>
          </View>

          {/* ── SECTION 1: Personal Details ── */}
          <SectionHeader
            color={C.purple}
            icon={<User color="#FFFFFF" width={16} height={16} />}
            title="Personal Details"
            open={openSection === 'personal'}
            onToggle={() => toggle('personal')}
          />
          {openSection === 'personal' && (
            <View style={sc.sectionBody}>
              <SectionInput label="Full Name *" value={form.name} onChange={set('name')} placeholder="Enter candidate's full name" />
              <SectionInput label="Date of Birth" value={form.dob} onChange={set('dob')} placeholder="DD/MM/YYYY" />
              <SectionInput label="Time of Birth" value={form.tob} onChange={set('tob')} placeholder="HH:MM AM/PM" />
              <SectionInput label="Place of Birth" value={form.pob} onChange={set('pob')} placeholder="City, State" />
              <SectionInput label="Gotra" value={form.gotra} onChange={set('gotra')} placeholder="Enter gotra" />
              <SectionInput label="Hobbies" value={form.hobbies} onChange={set('hobbies')} placeholder="Reading, Cooking, Travel..." multiline />
              <DropdownPicker label="Complexion" options={COMPLEXION_OPTIONS} selected={form.complexion} onSelect={set('complexion')} />
              <DropdownPicker label="Height" options={HEIGHT_OPTIONS} selected={form.height} onSelect={set('height')} />
              <SectionInput label="Religion / Caste" value={form.religionCaste} onChange={set('religionCaste')} placeholder="e.g. Hindu / Brahmin" />
              <SectionInput label="Education" value={form.education} onChange={set('education')} placeholder="e.g. B.Tech, MBA..." />
              <SectionInput label="Job / Occupation" value={form.occupation} onChange={set('occupation')} placeholder="e.g. Software Engineer" />
            </View>
          )}

          {/* ── SECTION 2: Family Details ── */}
          <SectionHeader
            color={C.orange}
            icon={<Users color="#FFFFFF" width={16} height={16} />}
            title="Family Details"
            open={openSection === 'family'}
            onToggle={() => toggle('family')}
          />
          {openSection === 'family' && (
            <View style={sc.sectionBody}>
              <SectionInput label="Grandfather's Name" value={form.grandfatherName} onChange={set('grandfatherName')} placeholder="Enter name" />
              <SectionInput label="Grandfather's Occupation" value={form.grandfatherOccupation} onChange={set('grandfatherOccupation')} placeholder="Enter occupation" />
              <SectionInput label="Grandmother's Name" value={form.grandmotherName} onChange={set('grandmotherName')} placeholder="Enter name" />
              <SectionInput label="Grandmother's Occupation" value={form.grandmotherOccupation} onChange={set('grandmotherOccupation')} placeholder="Enter occupation" />
              <SectionInput label="Father's Name" value={form.fatherName} onChange={set('fatherName')} placeholder="Enter name" />
              <SectionInput label="Father's Occupation" value={form.fatherOccupation} onChange={set('fatherOccupation')} placeholder="Enter occupation" />
              <SectionInput label="Mother's Name" value={form.motherName} onChange={set('motherName')} placeholder="Enter name" />
              <SectionInput label="Mother's Occupation" value={form.motherOccupation} onChange={set('motherOccupation')} placeholder="Enter occupation" />
            </View>
          )}

          {/* ── SECTION 3: Contact Details ── */}
          <SectionHeader
            color={C.blue}
            icon={<Phone color="#FFFFFF" width={16} height={16} />}
            title="Contact Details"
            open={openSection === 'contact'}
            onToggle={() => toggle('contact')}
          />
          {openSection === 'contact' && (
            <View style={sc.sectionBody}>
              <SectionInput label="Contact Number" value={form.contactNumber} onChange={set('contactNumber')} placeholder="+91 XXXXX XXXXX" keyboardType="phone-pad" />
              <SectionInput label="Email ID" value={form.email} onChange={set('email')} placeholder="email@example.com" keyboardType="email-address" />
              <SectionInput label="Address" value={form.address} onChange={set('address')} placeholder="Full address..." multiline />
            </View>
          )}

          {/* ── SECTION 4: Photos ── */}
          <SectionHeader
            color={C.pink}
            icon={<ImageIcon color="#FFFFFF" width={16} height={16} />}
            title="Photos (Optional)"
            open={openSection === 'photos'}
            onToggle={() => toggle('photos')}
          />
          {openSection === 'photos' && (
            <View style={sc.sectionBody}>
              {/* Profile photo */}
              <Text style={sc.fieldLabel}>Profile Photo (Portrait)</Text>
              <TouchableOpacity style={sc.photoPicker} onPress={() => pickImage(setProfilePhoto)} activeOpacity={0.8}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto.uri }} style={sc.photoThumb} />
                ) : (
                  <View style={sc.photoPlaceholder}>
                    <User color="#CBD5E1" width={28} height={28} />
                    <Text style={sc.photoPlaceholderText}>Tap to select</Text>
                  </View>
                )}
              </TouchableOpacity>
              {profilePhoto && (
                <TouchableOpacity onPress={() => setProfilePhoto(null)} style={sc.clearPhotoBtn}>
                  <Text style={sc.clearPhotoText}>✕ Remove photo</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 14 }} />

              {/* Full-screen photo */}
              <Text style={sc.fieldLabel}>Full Screen Photo (Optional, Page 2)</Text>
              <TouchableOpacity style={sc.photoPicker} onPress={() => pickImage(setFullscreenPhoto)} activeOpacity={0.8}>
                {fullscreenPhoto ? (
                  <Image source={{ uri: fullscreenPhoto.uri }} style={sc.photoThumb} />
                ) : (
                  <View style={sc.photoPlaceholder}>
                    <ImageIcon color="#CBD5E1" width={28} height={28} />
                    <Text style={sc.photoPlaceholderText}>Tap to select</Text>
                  </View>
                )}
              </TouchableOpacity>
              {fullscreenPhoto && (
                <TouchableOpacity onPress={() => setFullscreenPhoto(null)} style={sc.clearPhotoBtn}>
                  <Text style={sc.clearPhotoText}>✕ Remove photo</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Generate button ── */}
          <TouchableOpacity
            style={[sc.generateBtn, loading && sc.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={sc.generateBtnText}>Generating PDF...</Text>
              </>
            ) : (
              <>
                <Heart color="#FFFFFF" width={16} height={16} fill="#FFFFFF" />
                <Text style={sc.generateBtnText}>Generate Bio Data PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────
const sc = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 32 },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  pageTitle: { fontSize: 18, fontFamily: 'Outfit-Bold', color: C.dark },
  pageSubtitle: { fontSize: 11, fontFamily: 'Outfit-Regular', color: C.muted, marginTop: 1 },

  bannerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  bannerInput: {
    backgroundColor: C.subtle,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 8,
  },
  bannerLabel: { fontSize: 9, fontFamily: 'Outfit-Bold', color: C.muted, textTransform: 'uppercase', marginBottom: 4 },
  bannerTextInput: { fontSize: 12, fontFamily: 'Outfit-SemiBold', color: C.dark },

  // Section accordion
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginTop: 8,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionHeaderText: { fontSize: 14, fontFamily: 'Outfit-Bold', color: '#FFFFFF' },
  sectionBody: {
    backgroundColor: C.subtle,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  // Input fields
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontFamily: 'Outfit-SemiBold', color: C.muted, marginBottom: 5 },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: C.dark,
  },

  // Dropdown
  dropdownBtn: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownSelected: { fontSize: 13, fontFamily: 'Outfit-Regular', color: C.dark },
  dropdownPlaceholder: { fontSize: 13, fontFamily: 'Outfit-Regular', color: '#CBD5E1' },
  dropdownList: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dropdownItemActive: { backgroundColor: '#FAF5FF' },
  dropdownItemText: { fontSize: 13, fontFamily: 'Outfit-Regular', color: C.dark },

  // Photo picker
  photoPicker: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
    borderRadius: 10,
    overflow: 'hidden',
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: { alignItems: 'center', gap: 6 },
  photoPlaceholderText: { fontSize: 11, fontFamily: 'Outfit-Regular', color: '#CBD5E1' },
  photoThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  clearPhotoBtn: { alignSelf: 'flex-start', marginTop: 6 },
  clearPhotoText: { fontSize: 11, fontFamily: 'Outfit-SemiBold', color: C.error },

  // Generate button
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.purple,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 10,
    gap: 8,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { fontSize: 14, fontFamily: 'Outfit-Bold', color: '#FFFFFF' },

  // Result screen
  resultContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 600,
  },
  successIconWrap: { marginBottom: 12 },
  successTitle: { fontSize: 22, fontFamily: 'Outfit-Bold', color: C.dark, marginBottom: 6 },
  successSub: { fontSize: 12, fontFamily: 'Outfit-Regular', color: C.muted, textAlign: 'center', marginBottom: 28 },
  resultCard: {
    backgroundColor: C.subtle,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    marginBottom: 28,
    gap: 8,
  },
  resultCardName: { fontSize: 18, fontFamily: 'Outfit-Bold', color: C.dark },
  resultCardSub: { fontSize: 11, fontFamily: 'Outfit-Regular', color: C.muted },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.purple,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { fontSize: 13, fontFamily: 'Outfit-Bold', color: '#FFFFFF' },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  outlineBtnText: { fontSize: 13, fontFamily: 'Outfit-Bold', color: C.dark },

  // ── Template Selector ──────────────────────────────────
  templateSection: {
    paddingTop: 14,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  templateSectionTitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  templateScroll: {
    paddingHorizontal: 12,
    gap: 8,
    paddingBottom: 8,
  },
  templateCard: {
    width: 82,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.bg,
    overflow: 'hidden',
    paddingBottom: 6,
    paddingTop: 2,
  },
  templatePreview: {
    width: '100%',
    height: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  tpHeader: {
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpOm: {
    fontSize: 13,
    color: 'white',
    fontFamily: 'Outfit-Bold',
  },
  tpModernLines: {
    alignItems: 'flex-start',
    paddingLeft: 5,
    gap: 2,
  },
  tpLine: {
    height: 2.5,
    borderRadius: 2,
  },
  tpBody: {
    flex: 1,
    paddingHorizontal: 5,
    paddingTop: 4,
    gap: 3,
  },
  tpSectionBand: {
    height: 5,
    borderRadius: 2,
    width: '100%',
    marginVertical: 1,
  },
  tpDataLine: {
    height: 2,
    backgroundColor: '#CBD5E1',
    borderRadius: 1,
  },
  tpBorder: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderWidth: 1.5,
    borderRadius: 2,
  },
  templateCardName: {
    fontSize: 9,
    fontFamily: 'Outfit-SemiBold',
    color: C.muted,
    marginTop: 5,
    textAlign: 'center',
  },
  templateSelectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 3,
  },

  // ── Icon Picker ────────────────────────────────────────
  iconPickerWrap: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.subtle,
  },
  iconDisplay: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    padding: 6,
  },
  iconDisplayChar: {
    fontSize: 34,
    lineHeight: 40,
    textAlign: 'center',
    includeFontPadding: false,
  },
  iconDisplayLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-SemiBold',
    color: C.muted,
    marginBottom: 10,
  },
  changeIconBtn: {
    backgroundColor: C.purple,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  changeIconBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#FFFFFF',
  },

  // ── Icon Picker Modal ──────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: C.dark,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    color: C.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  iconGrid: {
    paddingBottom: 8,
  },
  iconGridItem: {
    flex: 1,
    margin: 5,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 76,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  iconGridItemSelected: {
    borderColor: C.purple,
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  iconGridChar: {
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
  iconGridLabel: {
    fontSize: 8,
    fontFamily: 'Outfit-SemiBold',
    color: C.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  modalCloseBtn: {
    backgroundColor: C.dark,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#FFFFFF',
  },
});
