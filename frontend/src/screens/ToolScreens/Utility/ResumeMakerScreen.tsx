import { useAlert } from '../../../context/AlertContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch, Image, ToastAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Download, FileText, Share2 } from 'lucide-react-native';
import { binaryRequest } from '../../../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { Buffer } from 'buffer';
import { useAdOnDownload } from '../../../utils/useAdOnDownload';

// ─── Types ────────────────────────────────────────────────────────
interface EduItem { examName: string; board: string; year: string; cgpa: string; }
interface SkillItem { value: string; }
interface CertItem { name: string; issuer: string; year: string; }
interface ExpItem { title: string; company: string; duration: string; description: string; }
interface ProjItem { name: string; description: string; }

// ─── Design Themes ────────────────────────────────────────────────
const DESIGN_THEMES: Record<number, { bg: string; text: string; btnBg: string; name: string; subtitle: string }> = {
  1: { bg: '#FACC15', text: '#1E293B', btnBg: '#FACC15', name: 'Classic Yellow', subtitle: 'Professional' },
  2: { bg: '#1E3A5F', text: '#FFFFFF', btnBg: '#1E3A5F', name: 'Sidebar Blue',  subtitle: 'Two-Column'   },
  3: { bg: '#0D9488', text: '#FFFFFF', btnBg: '#0D9488', name: 'Elegant Serif', subtitle: 'Minimalist'   },
  4: { bg: '#111827', text: '#F59E0B', btnBg: '#111827', name: 'Bold Modern',   subtitle: 'Creative'     },
  5: { bg: '#6B7280', text: '#FFFFFF', btnBg: '#6B7280', name: 'CV Formal',     subtitle: 'Traditional'  },
  6: { bg: '#059669', text: '#FFFFFF', btnBg: '#059669', name: 'Executive',     subtitle: 'Emerald Pro'  },
};

// ─── Reusable section header — dynamically themed ─────────────────
const SectionHeader = ({ title, bg, color }: { title: string; bg: string; color: string }) => (
  <View style={[styles.sectionHeader, { backgroundColor: bg }]}>
    <Text style={[styles.sectionHeaderText, { color }]}>{title}</Text>
  </View>
);

// ─── Add More button ───────────────────────────────────────────────
const AddMoreBtn = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.addMoreBtn} onPress={onPress} activeOpacity={0.85}>
    <Plus color="#FFF" width={14} height={14} />
    <Text style={styles.addMoreText}>Add More</Text>
  </TouchableOpacity>
);

// ─── Field row with label and input ───────────────────────────────
const Field = ({ label, value, onChange, placeholder, keyboard, multiline }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboard?: any; multiline?: boolean;
}) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder ?? label}
      placeholderTextColor="#94A3B8"
      keyboardType={keyboard ?? 'default'}
      multiline={multiline}
    />
  </View>
);

export default function ResumeMakerScreen() {
  const { showAlert } = useAlert();
  const { handleActionWithAd } = useAdOnDownload();
  const [loading, setLoading] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [designId, setDesignId] = useState(1);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: "Error", message: "Failed to select photo.", type: 'error' });
    }
  };

  // Personal Info
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [address, setAddress] = useState('');

  // Career Objective
  const [objective, setObjective] = useState('');

  // Education
  const [education, setEducation] = useState<EduItem[]>([
    { examName: '', board: '', year: '', cgpa: '' }
  ]);
  const addEdu = () => setEducation(p => [...p, { examName: '', board: '', year: '', cgpa: '' }]);
  const removeEdu = (i: number) => setEducation(p => p.filter((_, idx) => idx !== i));
  const updateEdu = (i: number, f: keyof EduItem, v: string) =>
    setEducation(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

  // Skills
  const [hasSkills, setHasSkills] = useState(true);
  const [skills, setSkills] = useState<SkillItem[]>([{ value: '' }]);
  const addSkill = () => setSkills(p => [...p, { value: '' }]);
  const removeSkill = (i: number) => setSkills(p => p.filter((_, idx) => idx !== i));
  const updateSkill = (i: number, v: string) => setSkills(p => p.map((s, idx) => idx === i ? { value: v } : s));

  // Certifications
  const [hasCerts, setHasCerts] = useState(false);
  const [certs, setCerts] = useState<CertItem[]>([]);
  const addCert = () => setCerts(p => [...p, { name: '', issuer: '', year: '' }]);
  const removeCert = (i: number) => setCerts(p => p.filter((_, idx) => idx !== i));
  const updateCert = (i: number, f: keyof CertItem, v: string) =>
    setCerts(p => p.map((c, idx) => idx === i ? { ...c, [f]: v } : c));

  // Work Experience
  const [hasExp, setHasExp] = useState(false);
  const [experience, setExperience] = useState<ExpItem[]>([]);
  const addExp = () => setExperience(p => [...p, { title: '', company: '', duration: '', description: '' }]);
  const removeExp = (i: number) => setExperience(p => p.filter((_, idx) => idx !== i));
  const updateExp = (i: number, f: keyof ExpItem, v: string) =>
    setExperience(p => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));

  // Projects
  const [hasProjects, setHasProjects] = useState(false);
  const [projects, setProjects] = useState<ProjItem[]>([]);
  const addProj = () => setProjects(p => [...p, { name: '', description: '' }]);
  const removeProj = (i: number) => setProjects(p => p.filter((_, idx) => idx !== i));
  const updateProj = (i: number, f: keyof ProjItem, v: string) =>
    setProjects(p => p.map((pr, idx) => idx === i ? { ...pr, [f]: v } : pr));

  // Personal Details
  const [fatherName, setFatherName]   = useState('');
  const [dob, setDob]                 = useState('');
  const [gender, setGender]           = useState('Male');
  const [nationality, setNationality] = useState('Indian');
  const [languages, setLanguages]     = useState('Hindi, English');
  const [religion, setReligion]       = useState('Hindu');
  const [hobbies, setHobbies]         = useState('');

  // Declaration
  const [declaration, setDeclaration] = useState(
    'I hereby declare that the information provided above is true to the best of my knowledge and belief.'
  );

  // ─── Generate ─────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!name.trim()) {
      showAlert({ title: "Required", message: 'Please enter your Full Name.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      let base64Photo = null;
      if (photoUri) {
        try {
          const rawBase64 = await FileSystem.readAsStringAsync(photoUri, { encoding: FileSystem.EncodingType.Base64 });
          base64Photo = `data:image/jpeg;base64,${rawBase64}`;
        } catch (err) {
          console.error("Failed to read photo as base64:", err);
        }
      }

      const payload = {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        objective: objective || null,
        education: education.map(e => ({
          exam_name: e.examName,
          board: e.board,
          year: e.year,
          cgpa: e.cgpa,
        })),
        skills: hasSkills ? skills.map(s => s.value).filter(Boolean) : [],
        certifications: hasCerts ? certs.map(c => ({ name: c.name, issuer: c.issuer, year: c.year })).filter(c => c.name) : [],
        experience: hasExp ? experience.map(e => ({ title: e.title, company: e.company, duration: e.duration, description: e.description })).filter(e => e.title) : [],
        projects: hasProjects ? projects.map(p => ({ name: p.name, description: p.description })).filter(p => p.name) : [],
        personal_details: {
          father_name: fatherName || null,
          dob: dob || null,
          gender: gender || null,
          nationality: nationality || null,
          languages: languages || null,
          religion: religion || null,
          hobbies: hobbies || null,
        },
        declaration: declaration || null,
        design_id: designId,
        photo_base64: base64Photo,
      };

      const arrayBuffer = await binaryRequest('POST', '/api/utility/resume', payload);

      const base64 = Buffer.from(new Uint8Array(arrayBuffer)).toString('base64');
      const fileUri = `${FileSystem.cacheDirectory}Resume_Design${designId}_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      setResultUri(fileUri);
      showAlert({ title: "✅ Success", message: `Resume (Design ${designId}) generated!`, type: 'success' });
    } catch (error: any) {
      console.log("Resume generation failed, showing friendly message");
      showAlert({ title: "Notice", message: 'Resume generation is temporarily unavailable. Please try again later.', type: 'info' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUri) return;
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(resultUri, { mimeType: 'application/pdf', dialogTitle: 'Save / Share Resume' });
      }
      if (Platform.OS === 'android') {
        ToastAndroid.show('Resume PDF ready!', ToastAndroid.SHORT);
      }
      showAlert({ title: "Download Complete! 🎉", message: "Aapki Resume PDF download ho gayi hai.", type: 'success' });
    } catch (err) {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(resultUri, { mimeType: 'application/pdf' });
      }
    }
  };

  // ─── Render ───────────────────────────────────────────────────
  const theme = DESIGN_THEMES[designId];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.pageTitle}>Resume Maker Online</Text>

          <View style={styles.card}>

            {/* ── Personal Info ─────────────────── */}
            <View style={styles.personalRow}>
              <View style={{ flex: 1 }}>
                <Field label="Name" value={name} onChange={setName} placeholder="Full Name" />
                <Field label="Email" value={email} onChange={setEmail} placeholder="Email" keyboard="email-address" />
                <Field label="Phone" value={phone} onChange={setPhone} placeholder="Phone" keyboard="phone-pad" />
                <Field label="Address" value={address} onChange={setAddress} placeholder="Address" />
              </View>
              <TouchableOpacity style={styles.photoPlaceholder} onPress={pickPhoto} activeOpacity={0.75}>
                {photoUri ? (
                  <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%', borderRadius: 36 }} />
                    <TouchableOpacity 
                      style={{ 
                        position: 'absolute', 
                        right: -4, 
                        top: -4, 
                        backgroundColor: '#4F46E5', 
                        width: 18, 
                        height: 18, 
                        borderRadius: 9, 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderWidth: 1.5,
                        borderColor: '#FFF',
                        elevation: 3,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.2,
                        shadowRadius: 1.5,
                      }}
                      onPress={(e) => {
                        e.stopPropagation();
                        setPhotoUri(null);
                      }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold', lineHeight: 12 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Plus color="#94A3B8" width={20} height={20} />
                    <Text style={styles.photoText}>Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Career Objective ──────────────── */}
            <SectionHeader title="Career Objective" bg={theme.bg} color={theme.text} />
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMulti, { marginHorizontal: 0, marginBottom: 8 }]}
              value={objective}
              onChangeText={setObjective}
              placeholder="Your career objective..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            {/* ── Education ─────────────────────── */}
            <SectionHeader title="Education Qualification" bg={theme.bg} color={theme.text} />
            {/* Header row */}
            <View style={styles.tableHeader}>
              {['Exam Name', 'Board/University', 'Year', '%/CGPA'].map(h => (
                <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
              ))}
            </View>
            {education.map((edu, i) => (
              <View key={i} style={styles.tableRow}>
                <TextInput
                  style={styles.tableCell}
                  value={edu.examName}
                  onChangeText={v => updateEdu(i, 'examName', v)}
                  placeholder="Your Exam"
                  placeholderTextColor="#94A3B8"
                />
                <TextInput
                  style={styles.tableCell}
                  value={edu.board}
                  onChangeText={v => updateEdu(i, 'board', v)}
                  placeholder="Board/University"
                  placeholderTextColor="#94A3B8"
                />
                <TextInput
                  style={styles.tableCell}
                  value={edu.year}
                  onChangeText={v => updateEdu(i, 'year', v)}
                  placeholder="Year"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.tableCell, { flex: 0.8 }]}
                  value={edu.cgpa}
                  onChangeText={v => updateEdu(i, 'cgpa', v)}
                  placeholder="%/CGPA"
                  placeholderTextColor="#94A3B8"
                />
                {education.length > 1 && (
                  <TouchableOpacity onPress={() => removeEdu(i)} style={{ paddingLeft: 4 }}>
                    <Trash2 color="#EF4444" width={14} height={14} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <AddMoreBtn onPress={addEdu} />

            {/* ── Skills ────────────────────────── */}
            <SectionHeader title="Skills" bg={theme.bg} color={theme.text} />
            {skills.map((s, i) => (
              <View key={i} style={styles.listItemRow}>
                <Text style={styles.bullet}>›</Text>
                <TextInput
                  style={[styles.fieldInput, { flex: 1, marginBottom: 0 }]}
                  value={s.value}
                  onChangeText={v => updateSkill(i, v)}
                  placeholder="e.g. MS Word, MS Excel"
                  placeholderTextColor="#94A3B8"
                />
                {skills.length > 1 && (
                  <TouchableOpacity onPress={() => removeSkill(i)} style={{ paddingLeft: 8 }}>
                    <Trash2 color="#EF4444" width={14} height={14} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <AddMoreBtn onPress={addSkill} />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Do you have skills?</Text>
              <Switch
                value={hasSkills}
                onValueChange={setHasSkills}
                trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                thumbColor="#FFF"
              />
            </View>

            {/* ── Certifications ────────────────── */}
            <SectionHeader title="Course Certifications" bg={theme.bg} color={theme.text} />
            {certs.map((c, i) => (
              <View key={i} style={styles.certRow}>
                <TextInput style={[styles.fieldInput, { flex: 1 }]} value={c.name} onChangeText={v => updateCert(i, 'name', v)} placeholder="Certificate Name" placeholderTextColor="#94A3B8" />
                <TextInput style={[styles.fieldInput, { flex: 1, marginLeft: 6 }]} value={c.issuer} onChangeText={v => updateCert(i, 'issuer', v)} placeholder="Issued By" placeholderTextColor="#94A3B8" />
                <TouchableOpacity onPress={() => removeCert(i)} style={{ paddingLeft: 8, alignSelf: 'center' }}>
                  <Trash2 color="#EF4444" width={14} height={14} />
                </TouchableOpacity>
              </View>
            ))}
            <AddMoreBtn onPress={() => { addCert(); setHasCerts(true); }} />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Do you have certifications?</Text>
              <Switch value={hasCerts} onValueChange={setHasCerts} trackColor={{ false: '#CBD5E1', true: '#10B981' }} thumbColor="#FFF" />
            </View>

            {/* ── Work Experience ───────────────── */}
            <SectionHeader title="Work Experience" bg={theme.bg} color={theme.text} />
            {experience.map((exp, i) => (
              <View key={i} style={styles.nestedBlock}>
                <View style={styles.nestedBlockHeader}>
                  <Text style={styles.nestedBlockTitle}>Experience #{i + 1}</Text>
                  <TouchableOpacity onPress={() => removeExp(i)}>
                    <Trash2 color="#EF4444" width={14} height={14} />
                  </TouchableOpacity>
                </View>
                <Field label="Job Title" value={exp.title} onChange={v => updateExp(i, 'title', v)} placeholder="e.g. Finance Executive" />
                <Field label="Company" value={exp.company} onChange={v => updateExp(i, 'company', v)} placeholder="e.g. Bajaj FinServ" />
                <Field label="Duration" value={exp.duration} onChange={v => updateExp(i, 'duration', v)} placeholder="e.g. April 2024 – Jan 2025" />
                <Field label="Description" value={exp.description} onChange={v => updateExp(i, 'description', v)} multiline />
              </View>
            ))}
            <AddMoreBtn onPress={() => { addExp(); setHasExp(true); }} />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Do you have experience?</Text>
              <Switch value={hasExp} onValueChange={setHasExp} trackColor={{ false: '#CBD5E1', true: '#10B981' }} thumbColor="#FFF" />
            </View>

            {/* ── Projects ───────────────────────── */}
            <SectionHeader title="Projects" bg={theme.bg} color={theme.text} />
            {projects.map((p, i) => (
              <View key={i} style={styles.nestedBlock}>
                <View style={styles.nestedBlockHeader}>
                  <Text style={styles.nestedBlockTitle}>Project #{i + 1}</Text>
                  <TouchableOpacity onPress={() => removeProj(i)}>
                    <Trash2 color="#EF4444" width={14} height={14} />
                  </TouchableOpacity>
                </View>
                <Field label="Project Name" value={p.name} onChange={v => updateProj(i, 'name', v)} placeholder="e.g. Online Quiz App" />
                <Field label="Description" value={p.description} onChange={v => updateProj(i, 'description', v)} multiline />
              </View>
            ))}
            <AddMoreBtn onPress={() => { addProj(); setHasProjects(true); }} />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Do you have projects?</Text>
              <Switch value={hasProjects} onValueChange={setHasProjects} trackColor={{ false: '#CBD5E1', true: '#10B981' }} thumbColor="#FFF" />
            </View>

            {/* ── Personal Details ───────────────── */}
            <SectionHeader title="Personal Details" bg={theme.bg} color={theme.text} />
            <Field label="Father's Name" value={fatherName} onChange={setFatherName} placeholder="Father Name" />
            <Field label="Date of Birth" value={dob} onChange={setDob} placeholder="DD Month YYYY" />
            <Field label="Gender" value={gender} onChange={setGender} />
            <Field label="Nationality" value={nationality} onChange={setNationality} />
            <Field label="Language Known" value={languages} onChange={setLanguages} />
            <Field label="Religion" value={religion} onChange={setReligion} />
            <Field label="Hobbies" value={hobbies} onChange={setHobbies} placeholder="Cricket, Travelling" />

            {/* ── Declaration ────────────────────── */}
            <SectionHeader title="Declaration" bg={theme.bg} color={theme.text} />
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMulti]}
              value={declaration}
              onChangeText={setDeclaration}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* ── Design Selector ─────────────────── */}
          <Text style={styles.designLabel}>Select Resume Design:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={styles.designRow}>
              {Object.entries(DESIGN_THEMES).map(([idStr, d]) => {
                const id = parseInt(idStr, 10);
                return (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.designCard,
                      { borderColor: designId === id ? d.bg : '#E2E8F0', borderWidth: designId === id ? 2 : 1 }
                    ]}
                    onPress={() => setDesignId(id)}
                    activeOpacity={0.85}
                  >
                    {/* Color bar preview */}
                    <View style={[styles.designCardBar, { backgroundColor: d.bg }]}>
                      <Text style={[styles.designCardBarNum, { color: d.text }]}>{id}</Text>
                    </View>
                    <View style={styles.designCardBody}>
                      <Text style={[styles.designCardName, designId === id && { color: d.bg }]} numberOfLines={1}>
                        {d.name}
                      </Text>
                      <Text style={styles.designCardSub}>{d.subtitle}</Text>
                    </View>
                    {designId === id && (
                      <View style={[styles.designCardCheck, { backgroundColor: d.bg }]}>
                        <Text style={{ color: d.text, fontSize: 8, fontFamily: 'Outfit-Bold' }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* ── Download / Share Button ─────────── */}
          <TouchableOpacity
            style={[
              styles.downloadBtn,
              { backgroundColor: theme.btnBg, shadowColor: theme.btnBg },
              loading && styles.downloadBtnDisabled
            ]}
            onPress={handleGenerate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={theme.text} />
            ) : (
              <>
                <Download color={theme.text} width={18} height={18} />
                <Text style={[styles.downloadBtnText, { color: theme.text }]}>Generate PDF Resume</Text>
              </>
            )}
          </TouchableOpacity>

          {/* ── Action Buttons after generation ── */}
          {resultUri ? (
            <View style={{ gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.downloadBtn, { backgroundColor: '#10B981', shadowColor: '#10B981' }]}
                onPress={() => handleActionWithAd(handleDownload)}
                activeOpacity={0.85}
              >
                <Download color="#FFF" width={18} height={18} />
                <Text style={styles.downloadBtnText}>Download / Save Resume</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareBtn} onPress={() => handleActionWithAd(handleDownload)} activeOpacity={0.85}>
                <Share2 color="#10B981" width={18} height={18} />
                <Text style={styles.shareBtnText}>Share PDF</Text>
              </TouchableOpacity>
            </View>
          ) : null}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 16, paddingBottom: 80 },

  pageTitle: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
    marginBottom: 14,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },

  // Personal row
  personalRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  photoText: { fontSize: 11, color: '#94A3B8', fontFamily: 'Outfit-Regular' },

  // Section header (yellow bar)
  sectionHeader: {
    backgroundColor: '#FACC15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 16,
    marginBottom: 10,
    borderRadius: 2,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Field
  fieldRow: { marginBottom: 8 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#64748B',
    marginBottom: 3,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: '#1E293B',
    marginBottom: 2,
  },
  fieldInputMulti: { minHeight: 60, textAlignVertical: 'top' },

  // Edit button (small teal)
  editBtn: {
    backgroundColor: '#0891B2',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 4,
  },
  editBtnText: { color: '#FFF', fontSize: 12, fontFamily: 'Outfit-Bold' },

  // Education table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 2,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#475569',
    padding: 6,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    color: '#1E293B',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
  },

  // Add More
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 6,
    marginBottom: 6,
  },
  addMoreText: { color: '#FFF', fontSize: 12, fontFamily: 'Outfit-Bold' },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 4,
  },
  toggleLabel: { fontSize: 12, fontFamily: 'Outfit-Medium', color: '#475569' },

  // Skills list item
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bullet: { fontSize: 18, color: '#64748B', marginBottom: 2 },

  // Cert row
  certRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },

  // Nested block (experience / project)
  nestedBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  nestedBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nestedBlockTitle: { fontSize: 12, fontFamily: 'Outfit-Bold', color: '#475569' },

  // Design selector
  designLabel: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
    marginBottom: 10,
  },
  designRow: { flexDirection: 'row', gap: 10, paddingRight: 10 },
  designBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  designBtnActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  designBtnText: { fontSize: 12, fontFamily: 'Outfit-Medium', color: '#475569' },
  designBtnTextActive: { color: '#FFF', fontFamily: 'Outfit-Bold' },

  // Design card (rich preview card)
  designCard: {
    width: 100,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  designCardBar: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  designCardBarNum: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
  designCardBody: {
    padding: 8,
  },
  designCardName: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  designCardSub: {
    fontSize: 10,
    fontFamily: 'Outfit-Regular',
    color: '#64748B',
  },
  designCardCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Download
  downloadBtn: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  downloadBtnDisabled: { backgroundColor: '#FCA5A5' },
  downloadBtnText: { color: '#FFF', fontSize: 15, fontFamily: 'Outfit-Bold' },

  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    marginBottom: 20,
  },
  shareBtnText: { color: '#10B981', fontSize: 14, fontFamily: 'Outfit-Bold' },
});
