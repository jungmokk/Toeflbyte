import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import useStore from '../../store/useStore';
import { 
  BookOpen, 
  Zap, 
  Target, 
  TrendingUp, 
  ChevronRight, 
  Clock,
  Flame,
  Sparkles
} from 'lucide-react-native';

import { Alert } from 'react-native';

import AnimatedButton from '../../components/AnimatedButton';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useTranslation } from 'react-i18next';

const Home = ({ navigation }) => {
  const { t } = useTranslation();
  const { credits, history } = useStore();

  // Helper function to calculate stats from history
  const calculateStats = () => {
    if (!history || history.length === 0) {
      return { accuracy: 0, wpm: 0, streak: 0 };
    }

    const totalAccuracy = history.reduce((acc, curr) => acc + (curr.accuracy || 0), 0);
    const avgAccuracy = Math.round(totalAccuracy / history.length);
    
    // For WPM, we can take the average of recent tests
    const totalWpm = history.reduce((acc, curr) => acc + (curr.wpm || 0), 0);
    const avgWpm = Math.round(totalWpm / history.length);

    // Simplistic streak calculation: count unique days in history
    const uniqueDays = new Set(history.map(item => {
      const date = new Date(item.timestamp);
      return date.toDateString();
    })).size;

    return { 
      accuracy: avgAccuracy, 
      wpm: avgWpm, 
      streak: uniqueDays 
    };
  };

  const stats = calculateStats();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with Streak */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={require('../../../assets/logo.png')} 
              style={styles.logoMini} 
              resizeMode="contain"
            />
            <View>
              <Text style={styles.welcomeText}>{t('home.welcome')}</Text>
              <Text style={styles.subWelcome}>{t('home.subWelcome')}</Text>
            </View>
          </View>
          <View style={styles.streakBadge}>
            <Zap fill="#FFD700" color="#FFD700" size={16} />
            <Text style={styles.streakText}>{stats.streak} {t('home.day') || 'DAY'}</Text>
          </View>
        </View>

        {/* Reading Stats Dashboard */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Target color={COLORS.primary} size={24} />
            <Text style={styles.statLabel}>{t('home.accuracy')}</Text>
            <Text style={styles.statValue}>{stats.accuracy}%</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp color={COLORS.success} size={24} />
            <Text style={styles.statLabel}>{t('home.reading_speed')}</Text>
            <Text style={styles.statValue}>{stats.wpm} <Text style={{fontSize: 12}}>{t('home.wpm') || 'WPM'}</Text></Text>
          </View>
          <View style={styles.statCard}>
            <Zap color={COLORS.error} size={24} />
            <Text style={styles.statLabel}>{t('home.credits')}</Text>
            <Text style={styles.statValue}>{credits}</Text>
          </View>
        </View>

        {/* Main Action Button */}
        <AnimatedButton 
          style={styles.mainActionButton}
          onPress={() => navigation.navigate('Test')}
        >
          <View style={styles.actionIconContainer}>
            <BookOpen color={COLORS.white} size={32} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>{t('home.start_reading')}</Text>
            <Text style={styles.actionSubtitle}>{t('home.start_subtitle')}</Text>
          </View>
          <ChevronRight color="rgba(255,255,255,0.5)" size={24} />
        </AnimatedButton>

        {/* Premium Beta Preview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>HOT! {t('home.premium_expected_title')}</Text>
          <View style={styles.betaBadge}>
            <Text style={styles.betaText}>{t('common.beta') || 'BETA'}</Text>
          </View>
        </View>

        <AnimatedButton 
          style={styles.premiumSectionCard}
          onPress={() => Alert.alert(
            "Coming Soon!", 
            "올해의 최신 시사 기반 예상 기출 기능은 현재 베타 준비 중입니다. 출시 시 알림을 드릴까요?",
            [{ text: "참여하기", onPress: () => alert("알림 예약되었습니다!") }, { text: "닫기" }]
          )}
        >
          <View style={styles.premiumIconContainer}>
            <Flame color="#FF4D4D" size={28} />
          </View>
          <View style={styles.premiumTextContainer}>
            <View style={styles.badgeRow}>
              <Text style={styles.premiumBadgeText}>PREMIUM PREDICT</Text>
              <Sparkles size={14} color="#FFD700" />
            </View>
            <Text style={styles.premiumTitle}>2026 HOT! 올해의 예상 기출</Text>
            <Text style={styles.premiumSubtitle}>실시간 시사 반영 킬러 문항</Text>
          </View>
          <View style={styles.premiumPriceTag}>
            <Text style={styles.premiumPriceText}>30P</Text>
          </View>
        </AnimatedButton>

        {/* Short Byte Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.short_byte')}</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>{t('common.see_all')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.shortByteList}>
          {[1, 2].map((item) => (
            <AnimatedButton 
              key={item} 
              style={styles.shortByteCard}
              onPress={() => navigation.navigate('Test', { 
                topic: item === 1 ? 'Astronomy and Planetary Formation' : 'Archaeology of Ancient Egypt' 
              })}
            >
              <View style={styles.shortByteIcon}>
                <Clock color={COLORS.primary} size={20} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.shortByteTitle}>천문학: 행성 형성 이론 요약</Text>
                <Text style={styles.shortByteMeta}>지문 300자 • 문제 1개 • 약 1분</Text>
              </View>
              <View style={styles.goBadge}>
                <Text style={styles.goText}>GO</Text>
              </View>
            </AnimatedButton>
          ))}
        </View>

        <View style={{height: 20}} />
      </ScrollView>

      {/* Banner Ad at bottom */}
      <View style={{ alignItems: 'center', backgroundColor: COLORS.background, paddingBottom: 10 }}>
        <BannerAd
          unitId={process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || TestIds.BANNER}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoMini: {
    width: 44,
    height: 44,
    marginRight: 12,
  },
  welcomeText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },
  subWelcome: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  streakText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    marginHorizontal: 4,
    padding: SPACING.md,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  mainActionButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: 24,
    marginBottom: SPACING.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: 13,
  },
  shortByteList: {
    gap: 12,
  },
  shortByteCard: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  shortByteIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(41, 121, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shortByteTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  shortByteMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  goBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  goText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 11,
  },
  betaBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  betaText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  premiumSectionCard: {
    backgroundColor: '#1E1B4B', // Deep indigo
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4338CA',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  premiumIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  premiumTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  premiumBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '900',
    marginRight: 4,
    letterSpacing: 0.5,
  },
  premiumTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: 'bold',
  },
  premiumSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  premiumPriceTag: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  premiumPriceText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default Home;
