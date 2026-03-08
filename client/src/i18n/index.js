import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ko from './locales/ko/translation.json';
import ja from './locales/ja/translation.json';
import zhTW from './locales/zh-TW/translation.json';

const resources = {
  ko: { translation: ko },
  ja: { translation: ja },
  'zh-TW': { translation: zhTW },
};

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem('user-language');
  
  if (!savedLanguage) {
    const deviceLanguage = Localization.getLocales()[0].languageCode;
    savedLanguage = deviceLanguage === 'ja' || deviceLanguage === 'zh' ? (deviceLanguage === 'zh' ? 'zh-TW' : deviceLanguage) : 'ko';
  }

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage,
      fallbackLng: 'ko',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v3',
    });
};

initI18n();

export default i18n;
