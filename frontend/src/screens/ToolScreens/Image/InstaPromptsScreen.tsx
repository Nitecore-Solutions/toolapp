import { useAlert } from '../../../context/AlertContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Linking, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { BookOpen, Check, CheckCircle, ChevronDown, ChevronUp, Copy, ExternalLink, Gift, MessageSquare, Sparkles, Zap } from 'lucide-react-native';

interface PromptCard {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  gradient: [string, string];
  accentColor: string;
  prompt: string;
}

const PROMPTS: PromptCard[] = [
  {
    id: '1m',
    title: '1 Million Followers',
    subtitle: 'Metallic 3D • Cinematic • Orange',
    badge: '1M',
    gradient: ['#FF6B35', '#F7931E'],
    accentColor: '#F97316',
    prompt: `Ultra realistic Instagram milestone celebration poster design. A stylish Indian teenage boy wearing black sunglasses, black-white khadi shirt, black baggy jeans and white sneakers. Two different poses of the same person - one upper-body stylish portrait looking sideways at the top right, and one full-body sitting pose on giant metallic 3D "1M" text at the bottom center. Bright orange cinematic gradient background on top with smoky dark grey background at bottom separated by torn paper effect. Include realistic Instagram profile UI on left side with username, followers count, reels creator details, bio text and social icons. Add floating 3D Instagram logos around the scene with depth blur. Add glowing orange sparks, cinematic lighting, dramatic shadows, high contrast, ultra HD 8K quality, realistic skin texture, DSLR depth of field, stylish influencer vibe. The giant "1M" text should look metallic steel with orange glowing edges and circular platform below it. Add "FOLLOWERS" text below. Add handwritten signature style text and "Thank You So Much Everyone". Modern social media celebration poster style, highly detailed, sharp focus, premium editing look, vibrant orange and black color grading. Don't change face`,
  },
  {
    id: '40k',
    title: '40K Followers',
    subtitle: 'Torn Paper • Gradient Split • Profile UI',
    badge: '40K',
    gradient: ['#7C3AED', '#A855F7'],
    accentColor: '#8B5CF6',
    prompt: `Instagram milestone poster celebrating 40k followers. The main subject is stylishly posing in two different positions – one full-body sitting pose on top of a big 3D metallic "40k" text with floating Instagram icons, and another half-body stylish photo above with torn paper effect transition between orange gradient and grey background. The top section shows an Instagram profile interface with username, follower count 40k, bio, and icons. Ultra realistic, cinematic lighting, high detail, modern social media design. Don't change face`,
  },
  {
    id: 'custom',
    title: 'Custom Milestone',
    subtitle: 'Any Count • Editable • Universal',
    badge: '✦',
    gradient: ['#059669', '#10B981'],
    accentColor: '#10B981',
    prompt: `Vibrant Instagram milestone poster celebrating [YOUR_FOLLOWER_COUNT] followers. The main subject is stylishly posing in two different positions - one full-body sitting pose on top of a big 3D metallic "[YOUR_FOLLOWER_COUNT]" text with floating Instagram icons, and another half-body stylish photo above with torn paper effect transition between orange gradient and grey background. The top section shows an Instagram profile interface with username, follower count, bio, and icons. Ultra realistic, cinematic lighting, high detail, modern social media celebration design. Don't change face`,
  },
  {
    id: 'birthday',
    title: 'Birthday Celebration',
    subtitle: 'Confetti • Balloons • Gold Glow',
    badge: '🎂',
    gradient: ['#DB2777', '#F43F5E'],
    accentColor: '#EC4899',
    prompt: `Ultra realistic Instagram birthday celebration poster. A stylish young Indian person in trendy outfit, two different poses - one upper-body portrait at top, one full-body pose sitting on giant glowing 3D birthday cake at the bottom. Pastel pink and golden gradient background with confetti, balloons, stars. Instagram profile UI on the side with birthday wishes. Floating birthday emojis and sparkles. Add text "Happy Birthday [NAME]" in stylish neon font. Cinematic lighting, 8K quality, premium Instagram aesthetic, vibrant color grading. Don't change face`,
  },
  {
    id: 'verified',
    title: 'Verified Badge',
    subtitle: 'Blue Tick • Luxury • 8K Quality',
    badge: '✓',
    gradient: ['#1D4ED8', '#3B82F6'],
    accentColor: '#2563EB',
    prompt: `Premium Instagram account verified celebration poster. Stylish influencer in fashionable outfit, two poses - half-body at top and full-body at bottom standing on giant 3D blue verification badge. Blue and white gradient background with metallic sparkles and light rays. Instagram profile UI shown with blue verified checkmark, followers count, highlights. Floating blue verified badges as 3D objects around the scene. Add "VERIFIED" and "Finally Verified 🎉" text in premium font. Ultra HD 8K, DSLR quality, cinematic depth of field, luxury aesthetic. Don't change face`,
  },
];

export default function InstaPromptsScreen() {
  const { showAlert } = useAlert();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCopy = async (prompt: PromptCard) => {
    try {
      await Clipboard.setStringAsync(prompt.prompt);
      setCopiedId(prompt.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showAlert({ title: "Error", message: "Could not copy to clipboard.", type: 'error' });
    }
  };

  const openChatGPT = () => {
    Linking.openURL('https://chat.openai.com').catch(() =>
      showAlert({ title: "Error", message: "Could not open ChatGPT. Please open it manually.", type: 'error' }));
  };

  const openGemini = () => {
    Linking.openURL('https://gemini.google.com').catch(() =>
      showAlert({ title: "Error", message: "Could not open Gemini. Please open it manually.", type: 'error' }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Premium Hero Header ── */}
        <LinearGradient
          colors={['#0F0F23', '#1A1035', '#0F0F23']}
          style={styles.heroGradient}
        >
          {/* Decorative orbs */}
          <View style={styles.orb1} />
          <View style={styles.orb2} />

          {/* AI Pill Badge */}
          <View style={styles.aiPill}>
            <Sparkles color="#F97316" width={12} height={12} />
            <Text style={styles.aiPillText}>AI-Powered Prompts</Text>
          </View>

          <Text style={styles.heroTitle}>Instagram{'\n'}Milestone Studio</Text>
          <Text style={styles.heroSub}>
            Copy → Upload Photo → Paste in ChatGPT or Gemini → Get stunning poster in seconds
          </Text>

          {/* Open AI Buttons */}
          <View style={styles.aiButtonsRow}>
            <TouchableOpacity style={styles.chatgptHeroBtn} onPress={openChatGPT} activeOpacity={0.85}>
              <LinearGradient colors={['#10A37F', '#0D8F6F']} style={styles.heroBtnGradient}>
                <MessageSquare color="#FFF" width={15} height={15} />
                <Text style={styles.heroBtnText}>ChatGPT</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.geminiHeroBtn} onPress={openGemini} activeOpacity={0.85}>
              <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.heroBtnGradient}>
                <Zap color="#FFF" width={15} height={15} />
                <Text style={styles.heroBtnText}>Gemini</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Works Best With */}
          <View style={styles.compatRow}>
            <CheckCircle color="#10B981" width={12} height={12} style={{ marginRight: 5 }} />
            <Text style={styles.compatText}>Best with <Text style={{ color: '#FFF', fontFamily: 'Outfit-Bold' }}>GPT-4o</Text> and <Text style={{ color: '#FFF', fontFamily: 'Outfit-Bold' }}>Gemini Advanced</Text></Text>
          </View>
        </LinearGradient>

        {/* ── Section Label ── */}
        <View style={styles.sectionLabelRow}>
          <View style={styles.sectionLabelLine} />
          <Text style={styles.sectionLabelText}>CHOOSE YOUR POSTER</Text>
          <View style={styles.sectionLabelLine} />
        </View>

        {/* ── Prompt Cards ── */}
        {PROMPTS.map((prompt) => {
          const isCopied = copiedId === prompt.id;
          const isExpanded = expandedId === prompt.id;

          return (
            <View key={prompt.id} style={styles.cardWrapper}>
              {/* Accent top border using gradient */}
              <LinearGradient
                colors={prompt.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardAccentBar}
              />

              <View style={styles.card}>
                {/* Card Header Row */}
                <View style={styles.cardHeader}>
                  <LinearGradient
                    colors={prompt.gradient}
                    style={styles.badgeCircle}
                  >
                    <Text style={styles.badgeCircleText}>{prompt.badge}</Text>
                  </LinearGradient>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.cardTitle}>{prompt.title}</Text>
                    <Text style={styles.cardSubtitle}>{prompt.subtitle}</Text>
                  </View>

                  {/* Expand / Collapse */}
                  <TouchableOpacity
                    style={styles.expandBtn}
                    onPress={() => setExpandedId(isExpanded ? null : prompt.id)}
                    activeOpacity={0.7}
                  >
                    {isExpanded
                      ? <ChevronUp color="#64748B" width={18} height={18} />
                      : <ChevronDown color="#64748B" width={18} height={18} />
                    }
                  </TouchableOpacity>
                </View>

                {/* Prompt Preview */}
                <View style={styles.promptBox}>
                  <Text
                    style={styles.promptText}
                    numberOfLines={isExpanded ? undefined : 3}
                  >
                    {prompt.prompt}
                  </Text>
                  {!isExpanded && (
                    <TouchableOpacity onPress={() => setExpandedId(prompt.id)} activeOpacity={0.7}>
                      <Text style={[styles.showMoreText, { color: prompt.accentColor }]}>Show full prompt ↓</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Action Row */}
                <View style={styles.cardActionRow}>
                  <TouchableOpacity
                    onPress={() => handleCopy(prompt)}
                    activeOpacity={0.85}
                    style={{ flex: 1 }}
                  >
                    <LinearGradient
                      colors={isCopied ? ['#10B981', '#059669'] : prompt.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.copyGradientBtn}
                    >
                      {isCopied
                        ? <Check color="#FFF" width={16} height={16} style={{ marginRight: 7 }} />
                        : <Copy color="#FFF" width={16} height={16} style={{ marginRight: 7 }} />
                      }
                      <Text style={styles.copyGradientBtnText}>
                        {isCopied ? 'Copied!' : 'Copy Prompt'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.quickOpenBtn} onPress={openChatGPT} activeOpacity={0.8}>
                    <ExternalLink color="#10A37F" width={16} height={16} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {/* ── How to Use Card ── */}
        <View style={styles.howToCard}>
          <View style={styles.howToHeader}>
            <BookOpen color="#4F46E5" width={18} height={18} style={{ marginRight: 8 }} />
            <Text style={styles.howToTitle}>How to Use</Text>
          </View>
          {[
            { step: '01', text: 'Tap "Copy Prompt" on any card above' },
            { step: '02', text: 'Open ChatGPT or Gemini using the buttons' },
            { step: '03', text: 'Upload your photo in the chat window' },
            { step: '04', text: 'Paste the copied prompt and hit Send' },
            { step: '05', text: 'Download your stunning poster! 🎉' },
          ].map(({ step, text }) => (
            <View key={step} style={styles.howToRow}>
              <View style={styles.stepBubble}>
                <Text style={styles.stepBubbleText}>{step}</Text>
              </View>
              <Text style={styles.howToStepText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* ── Free Badge ── */}
        <View style={styles.freeBadge}>
          <Gift color="#F97316" width={14} height={14} style={{ marginRight: 6 }} />
          <Text style={styles.freeBadgeText}>All prompts are <Text style={{ fontFamily: 'Outfit-Bold', color: '#F97316' }}>100% Free</Text> · Tested & Optimized</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { paddingBottom: 100 },

  // ── Hero ──
  heroGradient: {
    paddingTop: 28,
    paddingBottom: 30,
    paddingHorizontal: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  orb1: {
    position: 'absolute', top: -30, right: -30,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#4F46E5', opacity: 0.12,
  },
  orb2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#7C3AED', opacity: 0.15,
  },
  aiPill: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(249,115,22,0.15)',
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.35)',
    borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    marginBottom: 16,
    gap: 5,
  },
  aiPillText: {
    fontSize: 11, fontFamily: 'Outfit-Bold',
    color: '#FB923C', letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 30, fontFamily: 'Outfit-Bold',
    color: '#FFFFFF', lineHeight: 36,
    marginBottom: 10,
  },
  heroSub: {
    fontSize: 12, fontFamily: 'Outfit-Regular',
    color: '#94A3B8', lineHeight: 18,
    marginBottom: 22,
  },
  aiButtonsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  chatgptHeroBtn: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  geminiHeroBtn: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  heroBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, paddingHorizontal: 16,
    gap: 7,
  },
  heroBtnText: { fontSize: 13, fontFamily: 'Outfit-Bold', color: '#FFF' },
  compatRow: { flexDirection: 'row', alignItems: 'center' },
  compatText: { fontSize: 11, fontFamily: 'Outfit-Regular', color: '#64748B' },

  // ── Section Label ──
  sectionLabelRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginVertical: 20,
  },
  sectionLabelLine: { flex: 1, height: 1, backgroundColor: '#CBD5E1' },
  sectionLabelText: {
    fontSize: 10, fontFamily: 'Outfit-Bold', color: '#94A3B8',
    letterSpacing: 1.5, marginHorizontal: 12,
  },

  // ── Prompt Cards ──
  cardWrapper: {
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardAccentBar: { height: 4, width: '100%' },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  badgeCircle: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeCircleText: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#FFF' },
  cardTitle: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#0F172A' },
  cardSubtitle: { fontSize: 11, fontFamily: 'Outfit-Regular', color: '#94A3B8', marginTop: 1 },
  expandBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  promptBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 14,
  },
  promptText: {
    fontSize: 11.5, fontFamily: 'Outfit-Regular',
    color: '#475569', lineHeight: 18,
  },
  showMoreText: {
    fontSize: 11, fontFamily: 'Outfit-Bold',
    marginTop: 6,
  },
  cardActionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  copyGradientBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 10,
  },
  copyGradientBtnText: { fontSize: 13, fontFamily: 'Outfit-Bold', color: '#FFF' },
  quickOpenBtn: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1, borderColor: '#6EE7B7',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── How to Use ──
  howToCard: {
    marginHorizontal: 16, marginTop: 4, marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  howToHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  howToTitle: { fontSize: 15, fontFamily: 'Outfit-Bold', color: '#0F172A' },
  howToRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  stepBubble: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  stepBubbleText: { fontSize: 10, fontFamily: 'Outfit-Bold', color: '#4F46E5' },
  howToStepText: {
    fontSize: 12.5, fontFamily: 'Outfit-Regular',
    color: '#334155', lineHeight: 20, flex: 1,
  },

  // ── Free Badge ──
  freeBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  freeBadgeText: {
    fontSize: 12, fontFamily: 'Outfit-Regular', color: '#64748B',
  },
});
