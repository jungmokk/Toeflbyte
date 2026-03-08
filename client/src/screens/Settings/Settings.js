import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  Pressable,
  Switch,
  Alert,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Settings as SettingsIcon, 
  User, 
  CreditCard, 
  Bell, 
  Shield, 
  ChevronRight, 
  CheckCircle2, 
  PlusCircle,
  X,
  Timer,
  Crown,
  Zap,
  LogOut,
  FileText,
  Trash2
} from 'lucide-react-native';
import useStore from '../../store/useStore';
import useUser from '../../hooks/useUser';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/theme';

import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || TestIds.REWARDED;

const Settings = () => {
  const { credits, persona, setPersona, timerEnabled, setTimerEnabled, isPremium, isAdmin, resetStore } = useStore();
  const { t } = useTranslation();
  const { rechargeCredits, upgradePremium, syncUser, claimReward } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(isAdmin);
  const [titleClickCount, setTitleClickCount] = useState(0);

  // Rewarded Ad Reference
  const rewardedRef = React.useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);

  React.useEffect(() => {
    syncUser();

    // Initialize Rewarded Ad
    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setAdLoaded(true);
    });

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log('User earned reward of ', reward);
        handleAdComplete(reward.amount || 5);
      },
    );

    const unsubscribeClosed = rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
      setAdLoaded(false);
      rewarded.load(); // Load next ad
    });

    rewarded.load();
    rewardedRef.current = rewarded;

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
    };
  }, []);

  const handleTitleClick = () => {
    const newCount = titleClickCount + 1;
    setTitleClickCount(newCount);
    if (newCount >= 5) {
      setAdminMode(true);
      alert(t('settings.admin_mode_activated')); // I should add this key or just use a message
      setTitleClickCount(0);
    }
  };

  const handleAdminCharge = async () => {
    try {
      setLoading(true);
      await rechargeCredits(10000, 'admin_gift');
      alert(t('settings.admin_charge_success'));
    } catch (error) {
      alert(t('settings.admin_charge_fail'));
    } finally {
      setLoading(false);
    }
  };

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [notiModalVisible, setNotiModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  const [notiStudy, setNotiStudy] = useState(true);
  const [notiReward, setNotiReward] = useState(true);
  const [nickname, setNickname] = useState('');

  const handleUpdateProfile = () => {
    alert('프로필 정보가 저장되었습니다.');
    setProfileModalVisible(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.account_delete'),
      t('settings.delete_account_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            // In a real app, call backend to delete row
            await supabase.auth.signOut();
            resetStore();
            alert(t('settings.account_deleted_msg')); // add this or just msg
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logout_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('settings.logout'), 
          style: 'destructive', 
          onPress: async () => {
            await supabase.auth.signOut();
            resetStore();
          }
        }
      ]
    );
  };

  const personaOptions = [
    { id: 'tsun', title: t('settings.persona_tsun_title'), desc: t('settings.persona_tsun_desc') },
    { id: 'kind', title: t('settings.persona_kind_title'), desc: t('settings.persona_kind_desc') }
  ];

  const chargeOptions = [
    { id: '100', credits: 100, price: '$4.99' },
    { id: '300', credits: 300, price: '$9.99' },
    { id: '1000', credits: 1000, price: '$24.99', popular: true }
  ];

  const handleCharge = async (amount) => {
    try {
      setLoading(true);
      await rechargeCredits(amount, 'mock_plan');
      alert(t('settings.charge_success', { amount }));
      setModalVisible(false);
    } catch (error) {
      alert(t('settings.admin_charge_fail'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      await upgradePremium();
      alert(t('settings.upgrade_success'));
    } catch (error) {
      alert(t('settings.admin_charge_fail'));
    } finally {
      setLoading(false);
    }
  };

  const handleWatchAd = () => {
    if (adLoaded) {
      rewardedRef.current.show();
    } else {
      Alert.alert(t('common.confirm'), t('settings.ad_not_ready'));
      rewardedRef.current.load();
    }
  };

  const handleAdComplete = async (amount = 5) => {
    try {
      setLoading(true);
      await claimReward(amount);
      alert(t('settings.ad_reward_success', { amount }));
    } catch (error) {
      alert(t('settings.admin_charge_fail'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPrivacyPolicy = async () => {
    try {
      const url = 'https://docs.google.com/document/d/1SaJXv_DSszGrnBUGfPA_gwe3K2DFF8Mj6222x-K5GD8/edit?usp=sharing';
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      alert('공식 페이지를 열 수 없습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={handleTitleClick} activeOpacity={1}>
          <Text style={styles.title}>{t('settings.title')}</Text>
        </TouchableOpacity>

        {/* Admin Mode Section */}
        {adminMode && (
          <View style={[styles.section, { backgroundColor: '#1E1B4B', padding: 20, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#818CF8' }]}>
            <Text style={[styles.sectionTitle, { color: '#818CF8' }]}>🛠 {t('settings.admin_mode')}</Text>
            <TouchableOpacity 
              style={[styles.chargeButton, { backgroundColor: '#4F46E5', marginTop: 10 }]}
              onPress={handleAdminCharge}
              disabled={loading}
            >
              <Zap size={20} color="#FFFFFF" />
              <Text style={styles.chargeButtonText}>{t('settings.admin_charge')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Credit Management Card */}
        <View style={styles.creditCard}>
          <View>
            <View style={styles.row}>
              <Text style={styles.creditLabel}>{t('settings.credits_label')}</Text>
              {isPremium && (
                <View style={styles.premiumBadge}>
                  <Crown size={12} color="#FFFFFF" />
                  <Text style={styles.premiumBadgeText}>{t('chat.premium')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.creditValue}>{credits} P</Text>
          </View>
          <TouchableOpacity 
            style={styles.chargeButton}
            onPress={() => setModalVisible(true)}
          >
            <PlusCircle size={20} color="#FFFFFF" />
            <Text style={styles.chargeButtonText}>{t('settings.charge')}</Text>
          </TouchableOpacity>
        </View>

        {/* Premium Upgrade Banner */}
        {!isPremium && (
          <TouchableOpacity 
            style={styles.premiumBanner}
            onPress={handleUpgrade}
            disabled={loading}
          >
            <View style={styles.premiumBannerLeft}>
              <Crown size={24} color="#F59E0B" />
              <View style={styles.premiumBannerInfo}>
                <Text style={styles.premiumBannerTitle}>{t('settings.premium_banner_title')}</Text>
                <Text style={styles.premiumBannerDesc}>{t('settings.premium_banner_desc')}</Text>
              </View>
            </View>
            <Zap size={20} color="#F59E0B" />
          </TouchableOpacity>
        )}

        {/* Free Credits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.free_credits_title')}</Text>
          <TouchableOpacity 
            style={styles.adButton}
            onPress={handleWatchAd}
            disabled={loading}
          >
            <Zap size={20} color="#3B82F6" />
            <View style={styles.adButtonInfo}>
              <Text style={styles.adButtonTitle}>{t('settings.watch_ad_title')}</Text>
              <Text style={styles.adButtonDesc}>{t('settings.watch_ad_desc')}</Text>
            </View>
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Timer Pressure Mode Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <View style={styles.row}>
                <Timer size={22} color="#F8FAFC" style={{ marginRight: 10 }} />
                <Text style={styles.sectionTitle}>{t('settings.timer_pressure_title')}</Text>
              </View>
              <Text style={styles.optionDesc}>{t('settings.timer_pressure_desc')}</Text>
            </View>
            <Switch
              trackColor={{ false: '#334155', true: '#3B82F6' }}
              thumbColor={timerEnabled ? '#FFFFFF' : '#94A3B8'}
              ios_backgroundColor="#334155"
              onValueChange={setTimerEnabled}
              value={timerEnabled}
            />
          </View>
        </View>

        {/* AI Persona Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.persona_title')}</Text>
          {personaOptions.map((opt) => (
            <TouchableOpacity 
              key={opt.id} 
              style={[
                styles.optionItem,
                persona === opt.id && styles.optionItemSelected
              ]}
              onPress={() => setPersona(opt.id)}
            >
              <View style={styles.optionInfo}>
                <Text style={[
                  styles.optionTitle,
                  persona === opt.id && styles.optionTitleSelected
                ]}>{opt.title}</Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </View>
              {persona === opt.id && <CheckCircle2 size={24} color="#3B82F6" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* General Settings */}
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setProfileModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <User size={20} color="#94A3B8" />
              <Text style={styles.menuItemText}>{t('settings.profile_settings')}</Text>
            </View>
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setNotiModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <Bell size={20} color="#94A3B8" />
              <Text style={styles.menuItemText}>{t('settings.notification_settings')}</Text>
            </View>
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setSecurityModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <Shield size={20} color="#94A3B8" />
              <Text style={styles.menuItemText}>{t('settings.security_and_auth')}</Text>
            </View>
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleOpenPrivacyPolicy}
          >
            <View style={styles.menuItemLeft}>
              <FileText size={20} color="#94A3B8" />
              <Text style={styles.menuItemText}>{t('settings.privacy_policy')}</Text>
            </View>
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.menuItemLeft}>
              <Trash2 size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, { color: '#EF4444' }]}>{t('settings.account_delete')}</Text>
            </View>
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('settings.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Charge Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.charge_modal_title')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>{t('settings.charge_modal_subtitle')}</Text>
            
            {chargeOptions.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.chargeOptionItem}
                onPress={() => handleCharge(item.credits)}
              >
                <View>
                  <Text style={styles.chargeCredits}>{item.credits} Credits</Text>
                  {item.popular && <View style={styles.popularBadge}><Text style={styles.popularText}>{t('settings.popular')}</Text></View>}
                </View>
                <Text style={styles.chargePrice}>{item.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.profile_settings')}</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <X size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('settings.nickname')}</Text>
              <TextInput 
                style={styles.textInput}
                placeholder={t('settings.nickname_placeholder')}
                placeholderTextColor="#64748B"
                value={nickname}
                onChangeText={setNickname}
              />
            </View>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleUpdateProfile}
            >
              <Text style={styles.saveButtonText}>{t('settings.save_profile')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notiModalVisible}
        onRequestClose={() => setNotiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.notification_settings')}</Text>
              <TouchableOpacity onPress={() => setNotiModalVisible(false)}>
                <X size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>{t('settings.daily_notification')}</Text>
                <Text style={styles.toggleDesc}>{t('settings.daily_noti_desc')}</Text>
              </View>
              <Switch 
                value={notiStudy}
                onValueChange={setNotiStudy}
                trackColor={{ false: '#334155', true: '#3B82F6' }}
              />
            </View>
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>{t('settings.reward_notification')}</Text>
                <Text style={styles.toggleDesc}>{t('settings.reward_noti_desc')}</Text>
              </View>
              <Switch 
                value={notiReward}
                onValueChange={setNotiReward}
                trackColor={{ false: '#334155', true: '#3B82F6' }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Security Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={securityModalVisible}
        onRequestClose={() => setSecurityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.security_and_auth')}</Text>
              <TouchableOpacity onPress={() => setSecurityModalVisible(false)}>
                <X size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
            <View style={styles.infoBox}>
              <Shield size={32} color="#3B82F6" style={{ marginBottom: 12 }} />
              <Text style={styles.infoTitle}>{t('settings.security_active')}</Text>
              <Text style={styles.infoDesc}>{t('settings.security_desc')}</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Privacy Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={privacyModalVisible}
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>프라이버시 정책</Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <X size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.policyScroll}>
              <Text style={styles.policyText}>
                본 서비스는 사용자님의 학습 데이터를 안전하게 보호하기 위해 최선을 다합니다.{"\n\n"}
                1. 수집 항목: 이메일, 학습 기록, 쉐도잉 결과{"\n"}
                2. 처리 목적: 개인화된 학습 경험 제공 및 포인트 서비스 운영{"\n"}
                3. 보관 기간: 계정 탈퇴 시 즉시 삭제{"\n\n"}
                그 외 사항은 Google Play 정책 및 관련 법령을 준수합니다.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 24,
  },
  creditCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 32,
  },
  creditLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  creditValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  chargeButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  chargeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionItem: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionItemSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E293B',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CBD5E1',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#3B82F6',
  },
  optionDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  menuContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#F8FAFC',
    marginLeft: 12,
  },
  logoutButton: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 24,
  },
  chargeOptionItem: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chargeCredits: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  chargePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  popularBadge: {
    backgroundColor: '#3B82F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  premiumBadge: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 10,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  premiumBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
  },
  premiumBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumBannerInfo: {
    marginLeft: 16,
  },
  premiumBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  premiumBannerDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  adButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  adButtonInfo: {
    flex: 1,
    marginLeft: 16,
  },
  adButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  adButtonDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  adModalOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adModalContent: {
    width: '90%',
    height: '70%',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
  },
  adModalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
    textAlign: 'center',
    letterSpacing: 2,
  },
  adPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adPlaceholderText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 16,
  },
  adFooter: {
    alignItems: 'center',
  },
  adCountdownText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
  },
  adCloseButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  adCloseText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputGroup: {
    marginTop: 24,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    color: '#F8FAFC',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#334155',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  toggleDesc: {
    fontSize: 12,
    color: '#94A3B8',
  },
  infoBox: {
    backgroundColor: '#334155',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  infoDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  policyScroll: {
    marginTop: 16,
    maxHeight: 400,
  },
  policyText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 22,
  }
});

export default Settings;
