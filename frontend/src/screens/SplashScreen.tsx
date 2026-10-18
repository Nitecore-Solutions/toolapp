import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Image, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, PenTool, FileText } from 'lucide-react-native';

interface SplashScreenProps {
  onAnimationComplete: () => void;
}


export default function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  // Entrance & Exit Animations
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;
  
  // Icon rotation
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous rotation for background icons
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Entrance and exit animation sequence
    Animated.sequence([
      // 1. Gently fade in and scale up the brand container
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        // Slide up text shortly after
        Animated.sequence([
          Animated.delay(400),
          Animated.parallel([
            Animated.timing(textTranslateY, {
              toValue: 0,
              duration: 600,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(textOpacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            })
          ])
        ])
      ]),
      
      // 2. Elegant delay/hold to let the user see the premium branding
      Animated.delay(1500),

      // 3. Smooth fade out splash screen to transition to HomeScreen
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onAnimationComplete();
    });
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const reverseSpin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg']
  });

  return (
    <Animated.View style={[styles.container, { opacity: splashOpacity }]}>
      <StatusBar style="light" />
      <LinearGradient 
        colors={['#0F172A', '#312E81', '#1E1B4B']} 
        style={styles.background}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      >
        {/* Floating Icons Background */}
        <Animated.View style={[styles.floatingIcon, { top: '20%', left: '15%', transform: [{ rotate: spin }] }]}>
          <Settings color="rgba(255,255,255,0.04)" size={80} />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, { bottom: '30%', right: '10%', transform: [{ rotate: reverseSpin }] }]}>
          <PenTool color="rgba(255,255,255,0.04)" size={70} />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, { top: '35%', right: '15%', transform: [{ rotate: spin }] }]}>
          <FileText color="rgba(255,255,255,0.04)" size={50} />
        </Animated.View>

        <Animated.View
          style={[
            styles.brandContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          {/* Logo Badge Shadow Wrapper */}
          <View style={styles.logoShadowWrapper}>
            <View style={styles.logoBadge}>
              <Image
                source={require('../../assets/logo2.jpeg')}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
          </View>
          
          {/* Brand Name */}
          <Text style={styles.title}>Bharat Job Result tool</Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.subtitleContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }]
            }
          ]}
        >
          <Text style={styles.subtitle}>All-in-one Document & Photo Tools</Text>
          <View style={styles.glowLine} />
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  floatingIcon: {
    position: 'absolute',
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoShadowWrapper: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
    marginBottom: 24,
  },
  logoBadge: {
    width: 110,
    height: 110,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 44,
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
    letterSpacing: -1.2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  subtitleContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    fontFamily: 'Outfit-SemiBold',
    letterSpacing: 0.5,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  glowLine: {
    width: 60,
    height: 4,
    backgroundColor: '#818CF8',
    borderRadius: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  }
});
