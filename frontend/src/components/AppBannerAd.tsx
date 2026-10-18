import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../utils/adManager';

const RETRY_INTERVAL_MS = 30000;
const MAX_RETRY_ATTEMPTS = 10;

/**
 * A resilient sticky footer banner ad component.
 * 
 * 1. Shows NO blank white space: When an ad is not loaded or fails to load,
 *    it collapses completely (returns null) so no empty white gap is visible.
 * 2. Never disappears permanently: If an ad fails, it automatically retries
 *    every 30 seconds and whenever the app returns to the foreground.
 * 3. Preserves loaded ads: If an ad is already loaded and an auto-refresh
 *    encounters a temporary issue, the loaded ad remains visible.
 */
export default function AppBannerAd() {
  const [adFailed, setAdFailed] = useState(false);
  const [loadKey, setLoadKey] = useState(0);

  const isLoadedRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // 1. Cancel pending retry when moving to background
      if (nextAppState !== 'active') {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      }

      // 2. Retry immediately when returning to foreground if not loaded
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        if (!isLoadedRef.current) {
          retryCountRef.current = 0;
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
          setAdFailed(false);
          setLoadKey((prev) => prev + 1);
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  const handleAdLoaded = () => {
    isLoadedRef.current = true;
    retryCountRef.current = 0;
    setAdFailed(false);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };

  const handleAdFailedToLoad = (error: any) => {
    console.log('[AdMob Banner] Ad failed to load:', error?.code, error?.message);

    // If an ad was already successfully displayed, don't collapse it on refresh errors
    if (isLoadedRef.current) {
      return;
    }

    // Collapse immediately so no white blank space is rendered
    setAdFailed(true);

    if (retryCountRef.current >= MAX_RETRY_ATTEMPTS) {
      console.log('[AdMob Banner] Max retry attempts reached. Will retry on next foreground.');
      return;
    }

    // Schedule retry after 30 seconds
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    retryTimeoutRef.current = setTimeout(() => {
      if (appStateRef.current === 'active' && !isLoadedRef.current) {
        retryCountRef.current += 1;
        setLoadKey((prev) => prev + 1);
        setAdFailed(false);
      }
    }, RETRY_INTERVAL_MS);
  };

  // When failed, unmount completely: 0 height, 0 white space
  if (adFailed) {
    return null;
  }

  return (
    <View style={styles.bannerContainer}>
      <BannerAd
        key={`banner-ad-${loadKey}`}
        unitId={AD_UNIT_IDS.BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'transparent',
  },
});
