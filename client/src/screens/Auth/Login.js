import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING } from '../../constants/theme';
import { LogIn, Mail, Lock } from 'lucide-react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';

WebBrowser.maybeCompleteAuthSession();

const Login = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // google-services.json(L33)에서 확인된 진짜 Web Client ID 사용
    // 로컬(SHA1: 5E:8F...)과 프로덕션(SHA1: F7:7F...) 모두 이 하나의 Web ID로 인증됩니다.
    GoogleSignin.configure({
      webClientId: '743882997184-g2tbbb59vfkr4mle6ulsjj76g8dkj9dj.apps.googleusercontent.com',
      offlineAccess: true,
      scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    });
  }, []);

  async function signInWithGoogle() {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      const idToken = response.data?.idToken || response.idToken;

      if (idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        
        if (error) throw error;
      } else {
        throw new Error(t('login.no_google_token'));
      }
    } catch (error) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert(
          t('login.error_title'), 
          error.code === '10' ? t('login.developer_error_alert') : error.message
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  }


  async function handleOpenPolicy() {
    try {
      const url = 'https://jungmokk.github.io/toeflbyte-privacy.html';
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to open policy page.');
    }
  }

  async function handleOpenDataDeletion() {
    try {
      const url = 'https://jungmokk.github.io/data-deletion.html';
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to open data deletion page.');
    }
  }

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert(t('login.fail_title'), error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { data: { session }, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: Linking.createURL('login-callback'),
      }
    });
    if (error) Alert.alert(t('login.signup_fail_title'), error.message);
    if (!session && !error) Alert.alert(t('common.confirm'), t('login.verify_email_sent'));
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Image 
            source={require('../../../assets/icon.png')} 
            style={styles.logoImage} 
            resizeMode="contain"
          />
          <Text style={styles.title}>TOEFL <Text style={{ color: COLORS.primary }}>Byte</Text></Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Mail size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder={t('login.email_placeholder')} placeholderTextColor={COLORS.textSecondary} value={email} onChangeText={setEmail} autoCapitalize="none" />
          </View>
          <View style={styles.inputContainer}>
            <Lock size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder={t('login.password_placeholder')} placeholderTextColor={COLORS.textSecondary} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
          </View>

          <TouchableOpacity style={styles.mainButton} onPress={isSignUp ? signUpWithEmail : signInWithEmail} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.mainButtonText}>{isSignUp ? t('login.start_signup') : t('login.title')}</Text>}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} /><Text style={styles.dividerText}>{t('login.or')}</Text><View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle} disabled={googleLoading}>
            {googleLoading ? <ActivityIndicator color={COLORS.text} /> : (
              <>
                <Image source={require('../../../assets/g-logo.png')} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>{t('login.google_continue')}</Text>
              </>
            )}
          </TouchableOpacity>

        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.footerText}>
              {isSignUp ? t('login.already_have_account') : t('login.not_member_yet')}
              <Text style={styles.footerLink}>{isSignUp ? t('login.title') : t('login.start_signup')}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.legalFooter}>
          <TouchableOpacity onPress={handleOpenPolicy}>
            <Text style={styles.legalLink}>{t('settings.privacy_policy')}</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>|</Text>
          <TouchableOpacity onPress={handleOpenDataDeletion}>
            <Text style={styles.legalLink}>데이터 삭제 정책</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoImage: { width: 100, height: 100, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 8 },
  form: { width: '100%', maxWidth: 400 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, marginBottom: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: 56, color: COLORS.text, fontSize: 15 },
  mainButton: { backgroundColor: COLORS.primary, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  mainButtonText: { color: COLORS.white, fontSize: 17, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  dividerText: { color: COLORS.textSecondary, marginHorizontal: 16, fontSize: 13 },
  googleButton: { backgroundColor: COLORS.white, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  googleIcon: { width: 20, height: 20, marginRight: 12 },
  googleButtonText: { color: '#1F2937', fontSize: 16, fontWeight: '600' },
  footer: { marginTop: 32, marginBottom: 16 },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontWeight: 'bold', textDecorationLine: 'underline' },
  legalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    opacity: 0.6,
  },
  legalLink: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginHorizontal: 10,
  }
});

export default Login;
