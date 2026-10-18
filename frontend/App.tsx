import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AlertProvider } from './src/context/AlertContext';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Outfit-Regular': Outfit_400Regular,
    'Outfit-SemiBold': Outfit_600SemiBold,
    'Outfit-Bold': Outfit_700Bold,
  });

  const [splashComplete, setSplashComplete] = useState(false);

  if (!fontsLoaded || !splashComplete) {
    return (
      <SplashScreen onAnimationComplete={() => setSplashComplete(true)} />
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AlertProvider>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </AlertProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
