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
    GoogleSignin.configure({
      webClientId: '744776080787-sjbgmavm4u2o9lclreoi2iegs1kcmss3.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  async function signInWithGoogle() {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      console.log('Google Sign-In full response:', JSON.stringify(response, null, 2));

      // v11+에서는 response.data에 정보가 들어있고, 하위 호환성을 위해 체크
      const idToken = response.data?.idToken || response.idToken;

      if (idToken) {
        console.log('Attempting Supabase signInWithIdToken...');
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        
        if (error) throw error;
        
        console.log('Supabase Google Sign-In success:', data.session ? 'Session exists' : 'No session');
        // 세션 정보가 있으면 AppNavigator에서 감지하겠지만, 강제로 트리거되도록 
        // 만약 세션이 있음에도 화면 전환이 안된다면 AppNavigator 이슈일 수 있음
      } else {
        throw new Error(t('login.no_google_token'));
      }
    } catch (error) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert(t('login.error_title'), error.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function signInWithKakao() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: Linking.createURL('login-callback'),
          skipBrowserRedirect: true,
          scopes: 'profile_nickname profile_image',
        },
      });
      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, Linking.createURL('login-callback'));

        if (result.type === 'success' && result.url) {
          // # 뒤의 fragment 파싱 (Kakao/OAuth2 standard)
          let params = {};
          const splitUrl = result.url.split('#');
          if (splitUrl.length > 1) {
            const hash = splitUrl[1];
            params = hash.split('&').reduce((acc, item) => {
              const [key, value] = item.split('=');
              acc[key] = value;
              return acc;
            }, {});
          }

          // query parameter 가 있는 경우도 고려
          const { queryParams } = Linking.parse(result.url);
          params = { ...params, ...queryParams };

          console.log('Parsed Kakao params:', params);

          if (params.access_token && params.refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
            if (error) throw error;
            console.log('Kakao session established');
          }
        }
      }
    } catch (error) {
      Alert.alert(t('login.kakao_error'), error.message);
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
    const { data: { session }, error } = await supabase.auth.signUp({ email, password });
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
                <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_\"G\"_logo.svg/1024px-Google_\"G\"_logo.svg.png' }} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>{t('login.google_continue')}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.kakaoButton} onPress={signInWithKakao}>
            <View style={styles.kakaoContent}>
              <View style={styles.kakaoSymbol}>
                <Text style={styles.kakaoSymbolText}>K</Text>
              </View>
              <Text style={styles.kakaoButtonText}>{t('login.kakao_continue')}</Text>
            </View>
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
  kakaoButton: {
    backgroundColor: '#FEE500',
    height: 56,
    borderRadius: 16,
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kakaoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kakaoSymbol: {
    width: 20,
    height: 20,
    backgroundColor: '#3C1E1E',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  kakaoSymbolText: {
    color: '#FEE500',
    fontSize: 12,
    fontWeight: '900',
  },
  kakaoButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.85,
  },
  footer: { marginTop: 32 },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontWeight: 'bold', textDecorationLine: 'underline' }
});

export default Login;
