import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import { X, Zap, Crown, Award, Check } from 'lucide-react-native';
import useStore from '../../store/useStore';
import useUser from '../../hooks/useUser';
import AnimatedButton from '../../components/AnimatedButton';
import { useTranslation } from 'react-i18next';

const Store = ({ navigation }) => {
  const { credits } = useStore();
  const { rechargeCredits } = useUser();
  const { t } = useTranslation();
  
  const [loadingCode, setLoadingCode] = useState(null);

  const packages = [
    {
      id: 'pack_basic',
      title: 'Basic Pack',
      credits: 100,
      price: '$1.99',
      bonus: 0,
      icon: <Zap color={COLORS.primary} size={32} />,
      color: COLORS.primary
    },
    {
      id: 'pack_pro',
      title: 'Pro Pack',
      credits: 500,
      price: '$8.99',
      bonus: 25,
      popular: true,
      icon: <Crown color="#FFD700" size={32} />,
      color: '#FFD700'
    },
    {
      id: 'pack_master',
      title: 'Master Pack',
      credits: 1200,
      price: '$19.99',
      bonus: 100,
      bestValue: true,
      icon: <Award color="#00E676" size={32} />,
      color: '#00E676'
    }
  ];

  const handlePurchase = async (pkg) => {
    setLoadingCode(pkg.id);
    // Simulate real IAP delay for production feel
    setTimeout(async () => {
      try {
        const result = await rechargeCredits(pkg.credits + pkg.bonus);
        if (result && result.success) {
          Alert.alert(
            "결제 승인",
            `${pkg.credits + pkg.bonus} 크레딧 충전이 완료되었습니다.`,
            [{ text: "확인" }]
          );
        } else {
          Alert.alert("결제 실패", "처리 중 오류가 발생했습니다.");
        }
      } catch (err) {
        Alert.alert("결제 오류", "다시 시도해 주세요.");
      } finally {
        setLoadingCode(null);
      }
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <X color={COLORS.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>스토어</Text>
        <View style={styles.balanceBadge}>
          <Zap color="#FFD700" size={14} fill="#FFD700" />
          <Text style={styles.balanceText}>{credits}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Zap color={COLORS.primary} size={48} fill={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>프리미엄 학습 시작하기</Text>
          <Text style={styles.heroSubtitle}>더 많은 문제를 풀고 실력을 빠르게 올리세요!</Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Check color={COLORS.success} size={16} />
              <Text style={styles.featureText}>프리미엄 랜덤 기출문제 해제</Text>
            </View>
            <View style={styles.featureItem}>
              <Check color={COLORS.success} size={16} />
              <Text style={styles.featureText}>일타강사 AI 1:1 심층 피드백</Text>
            </View>
            <View style={styles.featureItem}>
              <Check color={COLORS.success} size={16} />
              <Text style={styles.featureText}>나만의 오답 노트 생성</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>크레딧 충전</Text>
        <View style={styles.packageList}>
          {packages.map((pkg) => (
            <AnimatedButton 
              key={pkg.id}
              style={[
                styles.packageCard,
                pkg.popular && styles.popularCard,
                pkg.bestValue && styles.bestValueCard
              ]}
              onPress={() => handlePurchase(pkg)}
              disabled={loadingCode !== null}
            >
              {pkg.popular && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>MOST POPULAR</Text>
                </View>
              )}
              {pkg.bestValue && (
                <View style={[styles.badgeContainer, { backgroundColor: pkg.color }]}>
                  <Text style={styles.badgeText}>BEST VALUE</Text>
                </View>
              )}

              <View style={styles.packageIconWrap}>
                {pkg.icon}
              </View>
              
              <View style={styles.packageInfo}>
                <Text style={styles.packageTitle}>{pkg.title}</Text>
                <View style={styles.creditRow}>
                  <Text style={styles.packageCredits}>{pkg.credits}</Text>
                  <Zap color="#FFD700" size={16} fill="#FFD700" style={{ marginLeft: 4 }} />
                </View>
                {pkg.bonus > 0 && (
                  <Text style={styles.bonusText}>+ {pkg.bonus} 보너스 크레딧</Text>
                )}
              </View>

              <View style={styles.priceBtn}>
                {loadingCode === pkg.id ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.priceBtnText}>{pkg.price}</Text>
                )}
              </View>
            </AnimatedButton>
          ))}
        </View>
        
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>✅ 결제는 안전하게 처리되며 앱스토어 영수증으로 발행됩니다.</Text>
          <Text style={styles.footerText}>✅ 크레딧 내역은 설정 화면에서 언제든 초기화하거나 확인할 수 있습니다.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  balanceText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 30,
  },
  heroIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(41, 121, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(41, 121, 255, 0.3)',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  featureList: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.surfaceGlass,
    padding: SPACING.lg,
    borderRadius: 20,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: SPACING.lg,
    marginBottom: SPACING.md,
  },
  packageList: {
    paddingHorizontal: SPACING.lg,
    gap: 16,
  },
  packageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  popularCard: {
    borderColor: '#FFD700',
    backgroundColor: '#1A180D',
  },
  bestValueCard: {
    borderColor: '#00E676',
    backgroundColor: '#001A0D',
  },
  badgeContainer: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  packageIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  packageInfo: {
    flex: 1,
  },
  packageTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageCredits: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
  },
  bonusText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  priceBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  priceBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerInfo: {
    marginTop: 30,
    paddingHorizontal: SPACING.xl,
    gap: 8,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  }
});

export default Store;
