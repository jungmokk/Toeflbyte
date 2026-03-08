import { Platform } from 'react-native';

const getBaseUrl = () => {
  // If we have an environment variable specifically (e.g. from EAS build), use it.
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Development environment check using global __DEV__
  // This is set automatically by React Native/Expo
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return Platform.OS === 'android' 
      ? 'http://10.0.2.2:5001/api' 
      : 'http://localhost:5001/api';
  }

  // Fallback for production (Adjust this to your Render/Railway URL later)
  return 'https://toefl-byte-api.onrender.com/api'; 
};

export const API_BASE_URL = getBaseUrl();

