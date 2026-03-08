import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import useStore from '../../store/useStore';
import { 
  BookOpen, 
  Zap, 
  Target, 
  TrendingUp, 
  ChevronRight, 
  Clock 
} from 'lucide-react-native';

const Home = ({ navigation }) => {
  const { credits } = useStore();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with Streak */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>안녕하세요, 수험생님!</Text>
            <Text style={styles.subWelcome}>오늘도 리딩 바이트 할 시간입니다 ⚡️</Text>
          </View>
          <View style={styles.streakBadge}>
            <Zap fill="#FFD700" color="#FFD700" size={16} />
            <Text style={styles.streakText}>15 DAY</Text>
          </View>
        </View>

        {/* Reading Stats Dashboard */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Target color={COLORS.primary} size={24} />
            <Text style={styles.statLabel}>정확도</Text>
            <Text style={styles.statValue}>84%</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp color={COLORS.success} size={24} />
            <Text style={styles.statLabel}>읽기 속도</Text>
            <Text style={styles.statValue}>180 <Text style={{fontSize: 12}}>WPM</Text></Text>
          </View>
          <View style={styles.statCard}>
            <Zap color={COLORS.error} size={24} />
            <Text style={styles.statLabel}>크레딧</Text>
            <Text style={styles.statValue}>{credits}</Text>
          </View>
        </View>

        {/* Main Action Button */}
        <TouchableOpacity 
          style={styles.mainActionButton}
          onPress={() => navigation.navigate('Test')}
          activeOpacity={0.9}
        >
          <View style={styles.actionIconContainer}>
            <BookOpen color={COLORS.white} size={32} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>오늘의 리딩 시작하기</Text>
            <Text style={styles.actionSubtitle}>실전 기출 문제로 훈련하세요</Text>
          </View>
          <ChevronRight color="rgba(255,255,255,0.5)" size={24} />
        </TouchableOpacity>

        {/* Short Byte Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>출퇴근 1분 컷 (Short Byte) 🚌</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>전체보기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.shortByteList}>
          {[1, 2].map((item) => (
            <TouchableOpacity 
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
            </TouchableOpacity>
          ))}
        </View>

        <View style={{height: 40}} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
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
});

export default Home;
