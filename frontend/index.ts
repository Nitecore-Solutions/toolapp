import { registerRootComponent } from 'expo';
import mobileAds from 'react-native-google-mobile-ads';
import { loadInterstitialAd } from './src/utils/adManager';

import App from './App';

// Initialize Google Mobile Ads SDK, then preload the first interstitial
mobileAds()
  .initialize()
  .then(() => {
    loadInterstitialAd();
  });

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
