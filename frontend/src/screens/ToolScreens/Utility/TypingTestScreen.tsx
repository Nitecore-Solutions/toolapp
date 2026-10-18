import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions, Animated, Easing, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, RotateCcw, Award, CheckCircle, Clock, Zap, Target } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface TypingLesson {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  text: string;
}

const LESSONS: TypingLesson[] = [
  {
    id: 1,
    title: "Home Row Practice",
    difficulty: "Easy",
    description: "Focus on keys a, s, d, f, g, h, j, k, l, and semicolon.",
    text: "asdfg hjkl; asdfg hjkl; asdf hjkl asdf hjkl asdfg hjkl; asdfg hjkl; asdf hjkl asdf hjkl"
  },
  {
    id: 2,
    title: "Top Row Keys",
    difficulty: "Easy",
    description: "Focus on keys q, w, e, r, t, y, u, i, o, and p.",
    text: "qwert yuiop qwert yuiop qwer uiop qwer uiop qwert yuiop qwert yuiop qwer uiop qwer"
  },
  {
    id: 3,
    title: "Bottom Row Keys",
    difficulty: "Easy",
    description: "Focus on keys z, x, c, v, b, n, and m.",
    text: "zxcvb nm,./ zxcvb nm,./ zxcv nm,. zxcv nm,. zxcvb nm,./ zxcvb nm,./ zxcv nm,. zxcv"
  },
  {
    id: 4,
    title: "All Rows Combined",
    difficulty: "Easy",
    description: "Practice combining all three letter rows together.",
    text: "the quick brown fox jumps over the lazy dog the quick brown fox jumps over the lazy dog"
  },
  {
    id: 5,
    title: "Shift Keys & Capitals",
    difficulty: "Easy",
    description: "Practice using capital letters with Shift key combinations.",
    text: "A S D F G H J K L Q W E R T Y U I O P Z X C V B N M ASD FGH JKL QWE RTY UIO ZXC VBN"
  },
  {
    id: 6,
    title: "Short Simple Words",
    difficulty: "Medium",
    description: "Practice common short words to improve flow.",
    text: "dog cat bat rat run map cap sun fun gun sad mad glad bad pad jam ham dam ram slam cram"
  },
  {
    id: 7,
    title: "Basic Sentence Building",
    difficulty: "Medium",
    description: "Simple punctuation and complete sentences.",
    text: "She has a small dog. The dog can run fast. We play together. Do you like playing?"
  },
  {
    id: 8,
    title: "School & Study Life",
    difficulty: "Medium",
    description: "Multi-sentence paragraph about learning.",
    text: "I go to school every day. Learning English is very fun and useful. I study hard here."
  },
  {
    id: 9,
    title: "Computer Terminology",
    difficulty: "Medium",
    description: "Practice common technical and technology terms.",
    text: "keyboard mouse screen printer computer internet software coding data network backup server"
  },
  {
    id: 10,
    title: "Daily Office Memos",
    difficulty: "Medium",
    description: "Formal corporate vocabulary and typing context.",
    text: "Please attend the team meeting tomorrow at ten. Bring your notes and update reports."
  },
  {
    id: 11,
    title: "The Beauty of Nature",
    difficulty: "Hard",
    description: "Longer lines, rich grammar, and complex layout.",
    text: "Nature is beautiful. Forests provide oxygen, and rivers give clean water to fields."
  },
  {
    id: 12,
    title: "Science & Modern Tech",
    difficulty: "Hard",
    description: "Practice mixed technical words and capital abbreviations.",
    text: "Artificial intelligence is changing the world. Coding software is a crucial modern skill."
  },
  {
    id: 13,
    title: "Quotes of Wisdom",
    difficulty: "Hard",
    description: "Punctuation heavy quotes from history.",
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts."
  },
  {
    id: 14,
    title: "Numeric Billing & Symbols",
    difficulty: "Hard",
    description: "Punctuation, shift symbols, and numbers combined.",
    text: "Order #1049 received. Total cost is $158.45 for 12 items. Return rate was exactly 2.5%."
  },
  {
    id: 15,
    title: "Ultimate Typing Marathon",
    difficulty: "Hard",
    description: "Full paragraphs testing speed, numbers, capitals, and punctuation.",
    text: "Technology has advanced rapidly. Today, people use smartphones and cloud computing for daily tasks. Practicing typing regularly builds excellent speed and muscle memory!"
  }
];

export default function TypingTestScreen() {
  const [gameState, setGameState] = useState<'selection' | 'running' | 'scorecard'>('selection');
  const [selectedLesson, setSelectedLesson] = useState<TypingLesson>(LESSONS[0]);
  const [timeLimit, setTimeLimit] = useState<number>(60); // seconds
  
  // Running state variables
  const [inputText, setInputText] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [totalKeysPressed, setTotalKeysPressed] = useState(0);
  const [typoCount, setTypoCount] = useState(0);
  
  const textInputRef = useRef<TextInput>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cursorBlink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [gameState]);

  // Cursor blinking loop
  useEffect(() => {
    if (gameState === 'running') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorBlink, { toValue: 0.1, duration: 450, useNativeDriver: true }),
          Animated.timing(cursorBlink, { toValue: 1, duration: 450, useNativeDriver: true })
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [gameState]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer Tick handler
  useEffect(() => {
    if (gameState === 'running' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft]);

  const startTest = (lesson: TypingLesson) => {
    setSelectedLesson(lesson);
    setInputText('');
    setTimeLeft(timeLimit);
    setTotalKeysPressed(0);
    setTypoCount(0);
    startTimeRef.current = Date.now();
    setGameState('running');
    
    // Focus TextInput
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 150);
  };

  const endTest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setGameState('scorecard');
  };

  const handleInputChange = (text: string) => {
    if (text.length > selectedLesson.text.length) {
      endTest();
      return;
    }

    const currentLen = text.length;
    const targetChar = selectedLesson.text[currentLen - 1];
    const inputChar = text[currentLen - 1];

    if (text.length > inputText.length) {
      setTotalKeysPressed((prev) => prev + 1);
      if (inputChar !== targetChar) {
        setTypoCount((prev) => prev + 1);
      }
    }

    setInputText(text);

    if (text === selectedLesson.text) {
      endTest();
    }
  };

  const getElapsedMinutes = () => {
    const elapsedSeconds = timeLimit - timeLeft;
    return elapsedSeconds > 0 ? elapsedSeconds / 60 : 0.01;
  };

  const getGrossWPM = () => {
    const minutes = getElapsedMinutes();
    return Math.round((totalKeysPressed / 5) / minutes) || 0;
  };

  const getNetWPM = () => {
    const minutes = getElapsedMinutes();
    const netChars = Math.max(0, totalKeysPressed - typoCount);
    return Math.round((netChars / 5) / minutes) || 0;
  };

  const getAccuracy = () => {
    if (totalKeysPressed === 0) return 100;
    const correctKeys = Math.max(0, totalKeysPressed - typoCount);
    return Math.round((correctKeys / totalKeysPressed) * 100);
  };

  const getRankBadge = (wpm: number) => {
    if (wpm < 20) return { title: "Beginner 🐢", color: "#64748B", desc: "Keep practicing row keys regularly!" };
    if (wpm < 40) return { title: "Intermediate 🐇", color: "#10B981", desc: "Good typing pace, keep it up." };
    if (wpm < 60) return { title: "Professional ⚡", color: "#3B82F6", desc: "Great speed with clean accuracy." };
    return { title: "Typing Master 👑", color: "#F59E0B", desc: "Exceptional keystrokes, flawless speed!" };
  };

  const renderTargetText = () => {
    const chars = selectedLesson.text.split('');
    const codeFont = Platform.select({ ios: 'CourierNewPSMT', android: 'monospace' });
    return (
      <View style={styles.charContainer}>
        {chars.map((char, index) => {
          let charStyle = styles.charDefault;
          let isCurrent = index === inputText.length;

          if (index < inputText.length) {
            const isCorrect = inputText[index] === char;
            charStyle = isCorrect ? styles.charCorrect : styles.charIncorrect;
          }

          return (
            <View key={index} style={styles.charWrapper}>
              <Text style={[styles.charText, charStyle, { fontFamily: codeFont }]}>
                {char}
              </Text>
              {isCurrent && (
                <Animated.View style={[styles.caretCursor, { opacity: cursorBlink }]} />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {gameState === 'selection' && (
        <Animated.View style={[styles.mainView, { opacity: fadeAnim }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Minimalist Premium Header */}
            <View style={styles.headerDashboard}>
              <Text style={styles.dashboardTitle}>Typing Practice</Text>
              <Text style={styles.dashboardSub}>Practice typing on Home, Top, and Bottom rows to build high accuracy and muscle memory.</Text>
            </View>

            {/* Time Settings Selector (Apple style pills) */}
            <Text style={styles.sectionHeader}>Practice Duration</Text>
            <View style={styles.timeSettings}>
              {([30, 60, 120, 300] as const).map((secs) => (
                <TouchableOpacity
                  key={secs}
                  style={[styles.timeBtn, timeLimit === secs && styles.timeBtnActive]}
                  onPress={() => setTimeLimit(secs)}
                >
                  <Text style={[styles.timeBtnText, timeLimit === secs && styles.timeBtnTextActive]}>
                    {secs >= 60 ? `${secs / 60} min` : `${secs} sec`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Minimalist White Card List */}
            <Text style={styles.sectionHeader}>Select Level (15 Lessons)</Text>
            {LESSONS.map((lesson) => (
              <TouchableOpacity
                key={lesson.id}
                style={styles.lessonCard}
                onPress={() => startTest(lesson)}
                activeOpacity={0.7}
              >
                <View style={styles.lessonRow}>
                  <View style={styles.badgeIndex}>
                    <Text style={styles.badgeIndexText}>{lesson.id}</Text>
                  </View>
                  <View style={styles.lessonMeta}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <Text style={styles.lessonDesc} numberOfLines={1}>{lesson.description}</Text>
                  </View>
                  <View style={styles.difficultyCol}>
                    <View
                      style={[
                        styles.diffTag,
                        lesson.difficulty === 'Easy' && styles.diffEasy,
                        lesson.difficulty === 'Medium' && styles.diffMedium,
                        lesson.difficulty === 'Hard' && styles.diffHard,
                      ]}
                    >
                      <Text style={styles.diffText}>{lesson.difficulty}</Text>
                    </View>
                    <Play color="#0F172A" width={14} height={14} style={{ marginTop: 6 }} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}

          </ScrollView>
        </Animated.View>
      )}

      {gameState === 'running' && (
        <Animated.View style={[styles.runningView, { opacity: fadeAnim }]}>
          
          {/* Apple/Notion style Clean Stats Head */}
          <View style={styles.statsBar}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{timeLeft}s</Text>
              <Text style={styles.statLbl}>TIME</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: '#0F172A' }]}>{getNetWPM()}</Text>
              <Text style={styles.statLbl}>WPM</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: '#0F172A' }]}>{getAccuracy()}%</Text>
              <Text style={styles.statLbl}>ACCURACY</Text>
            </View>
          </View>

          {/* Clean target text card */}
          <View style={styles.textArenaContainer}>
            <Text style={styles.runningLessonTitle}>Lesson {selectedLesson.id}: {selectedLesson.title}</Text>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.textArena}
              onPress={() => textInputRef.current?.focus()}
            >
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.textArenaScroll}>
                {renderTargetText()}
              </ScrollView>
            </TouchableOpacity>
          </View>

          <TextInput
            ref={textInputRef}
            style={styles.hiddenInput}
            value={inputText}
            onChangeText={handleInputChange}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            disableFullscreenUI
          />

          <View style={styles.runningActions}>
            <TouchableOpacity style={styles.abortBtn} onPress={endTest}>
              <RotateCcw color="#64748B" width={14} height={14} />
              <Text style={styles.abortBtnText}>Abort Lesson</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {gameState === 'scorecard' && (
        <Animated.View style={[styles.scorecardView, { opacity: fadeAnim }]}>
          <ScrollView contentContainerStyle={styles.scorecardScroll} showsVerticalScrollIndicator={false}>
            
            <View style={styles.scoreHeader}>
              <CheckCircle color="#10B981" width={44} height={44} style={{ marginBottom: 10 }} />
              <Text style={styles.scoreTitle}>Practice Completed</Text>
              <Text style={styles.scoreSubTitle}>{selectedLesson.title}</Text>
            </View>

            {/* Apple style Stats Grid */}
            <View style={styles.scoreGrid}>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreVal}>{getNetWPM()}</Text>
                <Text style={styles.scoreLbl}>NET WPM</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={[styles.scoreVal, { color: '#10B981' }]}>{getAccuracy()}%</Text>
                <Text style={styles.scoreLbl}>ACCURACY</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={[styles.scoreVal, { color: '#64748B' }]}>{getGrossWPM()}</Text>
                <Text style={styles.scoreLbl}>RAW WPM</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={[styles.scoreVal, { color: '#EF4444' }]}>{typoCount}</Text>
                <Text style={styles.scoreLbl}>ERRORS</Text>
              </View>
            </View>

            {/* Rank badge card */}
            <View style={styles.rankBox}>
              <Text style={styles.rankTitle}>TYPING SPEED GRADE</Text>
              <Text style={[styles.rankBadgeText, { color: getRankBadge(getNetWPM()).color }]}>
                {getRankBadge(getNetWPM()).title}
              </Text>
              <Text style={styles.rankDesc}>{getRankBadge(getNetWPM()).desc}</Text>
            </View>

            <View style={styles.scoreActions}>
              <TouchableOpacity style={styles.scoreActionBtn} onPress={() => startTest(selectedLesson)}>
                <RotateCcw color="#FFFFFF" width={16} height={16} />
                <Text style={styles.scoreActionText}>Practice Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.scoreActionBtn, styles.scoreActionOutline]}
                onPress={() => setGameState('selection')}
              >
                <Text style={styles.scoreActionOutlineText}>All Levels</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean pure white background
  },
  mainView: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 80,
  },
  headerDashboard: {
    marginBottom: 20,
  },
  dashboardTitle: {
    fontSize: 22,
    color: '#0F172A',
    fontFamily: 'Outfit-Bold',
    marginBottom: 6,
  },
  dashboardSub: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Outfit-Regular',
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#94A3B8',
    marginBottom: 10,
    marginTop: 8,
    letterSpacing: 1,
  },
  timeSettings: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9', // Clean gray capsule container
    borderRadius: 8,
    padding: 3,
    marginBottom: 20,
  },
  timeBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  timeBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
    color: '#64748B',
  },
  timeBtnTextActive: {
    color: '#0F172A',
    fontFamily: 'Outfit-Bold',
  },
  lessonCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0', // Clean thin borders
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 1,
    elevation: 0.5,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeIndexText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#475569',
  },
  lessonMeta: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  lessonDesc: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Outfit-Regular',
  },
  difficultyCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  diffTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  diffEasy: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  diffMedium: {
    borderColor: '#FDE047',
    backgroundColor: '#FEFCE8',
  },
  diffHard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  diffText: {
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
    color: '#334155',
  },

  // Active Typing View
  runningView: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 0.5,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  statVal: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
  },
  statLbl: {
    fontSize: 9,
    color: '#94A3B8',
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  textArenaContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  runningLessonTitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  textArena: {
    flex: 1,
  },
  textArenaScroll: {
    flexGrow: 1,
  },
  charContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    lineHeight: 28,
  },
  charWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 28,
  },
  charText: {
    fontSize: 19, // Bigger font size for easier reading
    letterSpacing: 0.5,
  },
  charDefault: {
    color: '#94A3B8', // Apple/Notion style light grey for untyped text
  },
  charCorrect: {
    color: '#0F172A', // Pure black for correctly typed text
  },
  charIncorrect: {
    color: '#EF4444', // Red for errors
    textDecorationLine: 'underline',
  },
  caretCursor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 2,
    height: 2,
    backgroundColor: '#F59E0B', // Monkeytype style yellow caret cursor
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  runningActions: {
    marginTop: 16,
    alignItems: 'center',
  },
  abortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  abortBtnText: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#64748B',
    marginLeft: 6,
  },

  // Scorecard View
  scorecardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scorecardScroll: {
    alignItems: 'center',
    padding: 18,
    paddingBottom: 60,
  },
  scoreHeader: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 24,
  },
  scoreTitle: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  scoreSubTitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Outfit-Medium',
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreItem: {
    width: width * 0.43,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreVal: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  scoreLbl: {
    fontSize: 9,
    color: '#94A3B8',
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.5,
  },
  rankBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 28,
  },
  rankTitle: {
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  rankBadgeText: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    marginBottom: 4,
  },
  rankDesc: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Outfit-Regular',
    textAlign: 'center',
  },
  scoreActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  scoreActionBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4F46E5', // Sleek black solid button
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  scoreActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    marginLeft: 6,
  },
  scoreActionOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scoreActionOutlineText: {
    color: '#0F172A',
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
  },
});
