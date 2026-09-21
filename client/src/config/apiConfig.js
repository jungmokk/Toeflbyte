import { Platform } from 'react-native';

const getBaseUrl = () => {
  // 1. Development environment check using global __DEV__
  // This is set automatically by React Native/Expo.
  // We prioritize this over any .env setting to ensure local testing works out of the box.
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const devUrl = Platform.OS === 'android' 
      ? 'http://10.0.2.2:5001/api' 
      : 'http://localhost:5001/api';
    console.log(`[API-Config] DEV Mode: Targeting ${devUrl}`);
    return devUrl;
  }

  // 2. If we have an environment variable specifically (e.g. from EAS build), use it.
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log(`[API-Config] PROD/EAS: Targeting ${process.env.EXPO_PUBLIC_API_URL}`);
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 3. Fallback for production
  return 'https://toeflbyte.onrender.com/api'; 
};

export const API_BASE_URL = getBaseUrl();

