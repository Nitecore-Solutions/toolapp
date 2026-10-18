import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

// ─────────────────────────────────────────────
// Ad Unit IDs
// In __DEV__ mode we use Google's official test IDs.
// Replace the production IDs below with the client's
// real Ad Unit IDs once they create them in AdMob.
// ─────────────────────────────────────────────

const AD_UNIT_IDS = {
  BANNER: __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : 'ca-app-pub-4693687860854196/9633184066',
  INTERSTITIAL: __DEV__
    ? TestIds.INTERSTITIAL
    : 'ca-app-pub-4693687860854196/2604741285',
};

export { AD_UNIT_IDS };

// ─────────────────────────────────────────────
// Global Cooldown Configuration
// 60-second cooldown between full-screen ads across
// ALL triggers (tool opens + download buttons).
// ─────────────────────────────────────────────
export const INTERSTITIAL_COOLDOWN_MS = 60_000;

let lastInterstitialShownTimestamp = 0;
let isAdShowing = false;
let interstitial: InterstitialAd | null = null;
let isAdLoaded = false;
let isAdLoading = false;

/**
 * Create and load a new interstitial ad.
 * Safe to call multiple times – it won't double-load.
 */
export function loadInterstitialAd(): void {
  if (isAdLoaded || isAdLoading) return;

  isAdLoading = true;

  interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL, {
    keywords: ['tools', 'photo', 'pdf', 'editor', 'utility'],
  });

  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    isAdLoaded = true;
    isAdLoading = false;
  });

  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    isAdLoaded = false;
    isAdLoading = false;
    // Retry loading after 30 seconds on failure
    setTimeout(() => loadInterstitialAd(), 30000);
  });

  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    isAdLoaded = false;
    isAdLoading = false;
    // Preload the next ad right after the user closes one
    loadInterstitialAd();
  });

  interstitial.load();
}

/**
 * Show the interstitial ad with:
 * 1. Mutual exclusion: If another ad is showing, proceed immediately.
 * 2. Global 60s cooldown: If cooldown active, proceed immediately.
 * 3. Instant fallback: If ad is not ready, proceed immediately + preload.
 * 4. Immediate timestamp recording: Records when ad is displayed.
 * 5. Single-execution safeguard: Ensures callback fires exactly once.
 */
export function showInterstitialAd(onComplete: () => void): void {
  // 1. Guard against re-entry if an ad is already currently displaying
  if (isAdShowing) {
    onComplete();
    return;
  }

  // 2. Global Cooldown check across all triggers (Tool Opens & Downloads)
  const now = Date.now();
  if (now - lastInterstitialShownTimestamp < INTERSTITIAL_COOLDOWN_MS) {
    onComplete();
    return;
  }

  // 3. If ad is not ready, do not block the user – proceed immediately & preload
  if (!isAdLoaded || !interstitial) {
    onComplete();
    loadInterstitialAd();
    return;
  }

  // 4. Single-execution safeguard for callback
  let actionExecuted = false;
  let cleanUpListeners: (() => void) | null = null;

  const executeAction = () => {
    if (actionExecuted) return;
    actionExecuted = true;
    isAdShowing = false;
    if (cleanUpListeners) {
      cleanUpListeners();
      cleanUpListeners = null;
    }
    onComplete();
  };

  isAdShowing = true;
  // Mark consumed so subsequent calls won't attempt to show the same instance
  isAdLoaded = false;

  // Record timestamp immediately when displayed so cooldown represents time between impressions
  lastInterstitialShownTimestamp = Date.now();

  const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    executeAction();
  });

  const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
    executeAction();
    loadInterstitialAd();
  });

  cleanUpListeners = () => {
    unsubClosed();
    unsubError();
  };

  try {
    interstitial.show();
  } catch (error) {
    console.log('[AdMob Interstitial] Failed to show ad:', error);
    executeAction();
    loadInterstitialAd();
  }
}

