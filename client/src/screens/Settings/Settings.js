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

const Settings = () => {
  const { credits, persona, setPersona, timerEnabled, setTimerEnabled, isPremium, isAdmin, resetStore } = useStore();
  const { rechargeCredits, upgradePremium, syncUser, claimReward } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [adModalVisible, setAdModalVisible] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(isAdmin);
  const [titleClickCount, setTitleClickCount] = useState(0);

  const handleTitleClick = () => {
    const newCount = titleClickCount + 1;
    setTitleClickCount(newCount);
    if (newCount >= 5) {
      setAdminMode(true);
      alert('관리자 모드가 활성화되었습니다. (크레딧 무제한 충전 가능)');
      setTitleClickCount(0);
    }
  };

  const handleAdminCharge = async () => {
    try {
      setLoading(true);
      await rechargeCredits(10000, 'admin_gift');
      alert('관리자 권한으로 10,000 크레딧이 충전되었습니다!');
    } catch (error) {
      alert('충전에 실패했습니다.');
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

  React.useEffect(() => {
    syncUser();
  }, []);

  const handleUpdateProfile = () => {
    alert('프로필 정보가 저장되었습니다.');
    setProfileModalVisible(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 탈퇴',
      '정말로 계정을 삭제하시겠습니까? 모든 학습 데이터와 크레딧이 영구히 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive', 
          onPress: async () => {
            // In a real app, call backend to delete row
            await supabase.auth.signOut();
            resetStore();
            alert('계정이 삭제되었습니다.');
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말로 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '로그아웃', 
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
    { id: 'tsun', title: '츤데레 팩폭 일타강사', desc: '강력한 팩폭으로 정신이 번쩍 들게 합니다.' },
    { id: 'kind', title: '친절하고 꼼꼼한 과외쌤', desc: '다정한 말투로 원리부터 차근차근 설명합니다.' }
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
      alert(`${amount} 크레딧이 충전되었습니다!`);
      setModalVisible(false);
    } catch (error) {
      alert('충전에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      await upgradePremium();
      alert('프리미엄 회원이 되신 것을 환영합니다!');
    } catch (error) {
      alert('업그레이드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchAd = () => {
    setAdModalVisible(true);
    setAdCountdown(5);
    const interval = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAdComplete = async () => {
    try {
      setLoading(true);
      await claimReward(5);
      alert('광고 시청 보상으로 5 크레딧이 지급되었습니다!');
      setAdModalVisible(false);
    } catch (error) {
      alert('보상 지급에 실패했습니다.');
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
          <Text style={styles.title}>설정</Text>
        </TouchableOpacity>

        {/* Admin Mode Section */}
        {adminMode && (
          <View style={[styles.section, { backgroundColor: '#1E1B4B', padding: 20, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#818CF8' }]}>
            <Text style={[styles.sectionTitle, { color: '#818CF8' }]}>🛠 관리자 모드</Text>
            <TouchableOpacity 
              style={[styles.chargeButton, { backgroundColor: '#4F46E5', marginTop: 10 }]}
              onPress={handleAdminCharge}
              disabled={loading}
            >
              <Zap size={20} color="#FFFFFF" />
              <Text style={styles.chargeButtonText}>10,000 크레딧 즉시 충전</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Credit Management Card */}
        <View style={styles.creditCard}>
          <View>
            <View style={styles.row}>
              <Text style={styles.creditLabel}>내 잔여 크레딧</Text>
              {isPremium && (
                <View style={styles.premiumBadge}>
                  <Crown size={12} color="#FFFFFF" />
                  <Text style={styles.premiumBadgeText}>PREMIUM</Text>
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
            <Text style={styles.chargeButtonText}>충전하기</Text>
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
                <Text style={styles.premiumBannerTitle}>프리미엄 멤버십 오픈!</Text>
                <Text style={styles.premiumBannerDesc}>무제한 쉐도잉 & 500P 즉시 지급</Text>
              </View>
            </View>
            <Zap size={20} color="#F59E0B" />
          </TouchableOpacity>
        )}

        {/* Free Credits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>무료 크레딧 받기</Text>
          <TouchableOpacity 
            style={styles.adButton}
            onPress={handleWatchAd}
            disabled={loading}
          >
            <Zap size={20} color="#3B82F6" />
            <View style={styles.adButtonInfo}>
              <Text style={styles.adButtonTitle}>광고 보고 5P 받기</Text>
              <Text style={styles.adButtonDesc}>동영상 광고를 시청하고 무료로 학습하세요.</Text>
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
                <Text style={styles.sectionTitle}>실전 타이머 압박 모드</Text>
              </View>
              <Text style={styles.optionDesc}>1문단 풀이 시 90초 타이머를 적용합니다.</Text>
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
          <Text style={styles.sectionTitle}>AI 강사 페르소나 설정</Text>
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
              <Text style={styles.menuItemText}>프로필 설정</Text>
            </View>
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setNotiModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <Bell size={20} color="#94A3B8" />
              <Text style={styles.menuItemText}>알림 설정</Text>
            </View>
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setSecurityModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <Shield size={20} color="#94A3B8" />
              <Text style={styles.menuItemText}>보안 및 인증</Text>
            </View>
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleOpenPrivacyPolicy}
          >
            <View style={styles.menuItemLeft}>
              <FileText size={20} color="#94A3B8" />
              <Text style={styles.menuItemText}>프라이버시 정책</Text>
            </View>
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.menuItemLeft}>
              <Trash2 size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, { color: '#EF4444' }]}>계정 탈퇴</Text>
            </View>
            <ChevronRight size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
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
              <Text style={styles.modalTitle}>크레딧 충전</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>원하시는 상품을 선택해 주세요.</Text>
            
            {chargeOptions.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.chargeOptionItem}
                onPress={() => handleCharge(item.credits)}
              >
                <View>
                  <Text style={styles.chargeCredits}>{item.credits} Credits</Text>
                  {item.popular && <View style={styles.popularBadge}><Text style={styles.popularText}>POPULAR</Text></View>}
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
              <Text style={styles.modalTitle}>프로필 설정</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <X size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>닉네임</Text>
              <TextInput 
                style={styles.textInput}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor="#64748B"
                value={nickname}
                onChangeText={setNickname}
              />
            </View>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleUpdateProfile}
            >
              <Text style={styles.saveButtonText}>저장하기</Text>
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
              <Text style={styles.modalTitle}>알림 설정</Text>
              <TouchableOpacity onPress={() => setNotiModalVisible(false)}>
                <X size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>매일 학습 알림</Text>
                <Text style={styles.toggleDesc}>매일 정해진 시간에 학습 알림을 받습니다.</Text>
              </View>
              <Switch 
                value={notiStudy}
                onValueChange={setNotiStudy}
                trackColor={{ false: '#334155', true: '#3B82F6' }}
              />
            </View>
            <View style={styles.toggleItem}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>보상 및 혜택 알림</Text>
                <Text style={styles.toggleDesc}>무료 크레딧 및 이벤트 소식을 받습니다.</Text>
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
              <Text style={styles.modalTitle}>보안 및 인증</Text>
              <TouchableOpacity onPress={() => setSecurityModalVisible(false)}>
                <X size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
            <View style={styles.infoBox}>
              <Shield size={32} color="#3B82F6" style={{ marginBottom: 12 }} />
              <Text style={styles.infoTitle}>보안 설정 활성화됨</Text>
              <Text style={styles.infoDesc}>현재 구글 소셜 계정을 통해 안전하게 로그인되어 있습니다. 추가 인증 수단 설정은 준비 중입니다.</Text>
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
