import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';

const AD_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-5136549253813943/5108946007';

let interstitialAd = null;
let interstitialLoaded = false;
let screenTransitionCount = 0;
let targetTransitionCount = 3 + Math.floor(Math.random() * 2);
const INTERSTITIAL_COOLDOWN_MS = 120_000;
let lastInterstitialShownAt = 0;

export function preloadInterstitial() {
  try {
    interstitialAd = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
      keywords: ['education', 'toefl', 'study', 'english'],
    });

    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoaded = true;
    });

    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialLoaded = false;
      interstitialAd.load();
    });

    interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('[Ads] Transition Interstitial Error:', error);
      interstitialLoaded = false;
    });

    interstitialAd.load();
  } catch (error) {
    console.error('[Ads] Transition Interstitial Setup Failed:', error);
  }
}

export function showInterstitial() {
  const now = Date.now();
  const elapsed = now - lastInterstitialShownAt;

  if (elapsed < INTERSTITIAL_COOLDOWN_MS) {
    const remaining = Math.ceil((INTERSTITIAL_COOLDOWN_MS - elapsed) / 1000);
    console.log(`[Ads] Interstitial cooldown active — ${remaining}s remaining`);
    return false;
  }

  if (interstitialLoaded && interstitialAd) {
    lastInterstitialShownAt = now;
    interstitialAd.show();
    return true;
  }
  return false;
}

export function recordScreenTransition() {
  screenTransitionCount++;
  console.log(`[Ads] Screen transition: ${screenTransitionCount}/${targetTransitionCount}`);
  
  if (screenTransitionCount >= targetTransitionCount) {
    const shown = showInterstitial();
    if (shown) {
      screenTransitionCount = 0;
      targetTransitionCount = 3 + Math.floor(Math.random() * 2);
    }
  }
}
