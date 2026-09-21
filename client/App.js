import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import mobileAds, { MaxAdContentRating, AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';
import { preloadInterstitial } from './src/lib/ads';
import AppNavigator from './src/navigation/AppNavigator';
import { useEffect } from 'react';
import { Settings } from 'react-native-fbsdk-next';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { Platform } from 'react-native';
import analytics from '@react-native-firebase/analytics';
import './src/i18n';



function App() {
  useEffect(() => {
    // Google Mobile Ads Initialization with Global Config & UMP Consent
    const initializeAdMob = async () => {
      try {
        // 1. Request Consent Information Update (UMP)
        const consentInfo = await AdsConsent.requestInfoUpdate();
        
        // 2. Show Consent Form if required (GDPR/CCPA etc.)
        if (consentInfo.isConsentFormAvailable && consentInfo.status === AdsConsentStatus.REQUIRED) {
          await AdsConsent.showForm();
        }

        // 3. Set Global Configuration
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.G,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
          testDeviceIdentifiers: ['EMULATOR'],
        });

        // 4. Initialize SDK
        await mobileAds().initialize();
        console.log('[AdMob] Initialization complete with UMP and config');
        
        // 5. Preload transition interstitial
        preloadInterstitial();
      } catch (error) {
        console.error('[AdMob] Initialization error:', error);
      }
    };

    initializeAdMob();

    // Meta SDK Initialization & Tracking Permission
    const initializeMetaSDK = async () => {
      try {
        const { status } = await requestTrackingPermissionsAsync();
        
        // Initialize the FaceBook SDK
        Settings.initializeSDK();
        
        if (status === 'granted') {
          await Settings.setAdvertiserTrackingEnabled(true);
          console.log('[Meta SDK] Advertiser Tracking Enabled');
        }
      } catch (error) {
        console.error('[Meta SDK] Initialization error:', error);
      }
    };

    initializeMetaSDK();
    // Firebase Analytics Initialization
    const initializeFirebase = async () => {
      try {
        await analytics().logAppOpen();
        console.log('[Firebase] Analytics: App Open event logged');
      } catch (error) {
        console.error('[Firebase] Analytics error:', error);
      }
    };

    initializeFirebase();
  }, []);

  return (

      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </GestureHandlerRootView>

  );
}

export default App;
