import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useStore from '../../store/useStore';
import useBite from '../../hooks/useBite';
import { BarChart2, AlertCircle, ChevronRight, Hash, Trophy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/theme';

const Review = ({ navigation }) => {
  const { history } = useStore();
  const { getSummary } = useBite();
  const { t } = useTranslation();
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await getSummary();
        if (response.success) {
          setSummary(response.summary);
        }
      } catch (error) {
        console.error('Summary Fetch Error:', error);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  const incorrectHistory = history ? history.filter(item => !item.isCorrect) : [];
  
  // Calculate Stats
  const totalSolved = history ? history.length : 0;
  const correctCount = history ? history.filter(item => item.isCorrect).length : 0;
  const accuracy = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;

  // Weak Topics (Simple Top 3)
  const topicFrequency = incorrectHistory.reduce((acc, item) => {
    acc[item.topic] = (acc[item.topic] || 0) + 1;
    return acc;
  }, {});
  const weakTopics = Object.entries(topicFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('review.title')}</Text>

        {/* Dashboard Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Trophy size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>{t('review.accuracy_label')}</Text>
          </View>
          <View style={styles.statCard}>
            <AlertCircle size={20} color={COLORS.error} />
            <Text style={styles.statValue}>{incorrectHistory.length}</Text>
            <Text style={styles.statLabel}>{t('review.incorrect_label')}</Text>
          </View>
        </View>

        {/* AI 일타강사의 총평 */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>{t('review.instructor_comment_title')}</Text>
          </View>
          {loadingSummary ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 10 }} />
          ) : (
            <Text style={styles.summaryText}>{summary}</Text>
          )}
        </View>

        {/* Vocabulary Note Link */}
        <TouchableOpacity 
          style={styles.vocabLink}
          onPress={() => navigation.navigate('VocabularyNote')}
        >
          <View style={styles.vocabLinkLeft}>
            <Hash size={20} color="#F59E0B" />
            <Text style={styles.vocabLinkText}>{t('review.vocab_note_link')}</Text>
          </View>
          <View style={styles.vocabBadge}>
            <Text style={styles.vocabBadgeText}>{t('common.new')}</Text>
            <ChevronRight size={16} color="#F59E0B" />
          </View>
        </TouchableOpacity>

        {/* Weak Topics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('review.weak_topics_title')}</Text>
          {weakTopics.length > 0 ? (
            weakTopics.map(([topic, count], index) => (
              <View key={topic} style={styles.topicItem}>
                <Text style={styles.topicRank}>{index + 1}</Text>
                <Text style={styles.topicName}>{topic}</Text>
                <Text style={styles.topicCount}>{count}{t('review.incorrect_label')}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>{t('review.no_data')}</Text>
          )}
        </View>

        {/* Incorrect List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('review.incorrect_list_title')}</Text>
          {incorrectHistory.length > 0 ? (
            incorrectHistory.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.historyCard}
                onPress={() => navigation.navigate('ReviewDetail', { bite: item })}
              >
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTopic}>#{item.topic}</Text>
                  <Text style={styles.historyDate}>{item.solvedAt ? new Date(item.solvedAt).toLocaleDateString() : t('review.unknown_date')}</Text>
                </View>
                <ChevronRight size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>{t('review.no_incorrect')}</Text>
          )}
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
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    fontFamily: 'Inter-Bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  summaryContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  topicRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    width: 30,
  },
  topicName: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  topicCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  historyInfo: {
    flex: 1,
  },
  historyTopic: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginVertical: 20,
    fontSize: 14,
  },
  vocabLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vocabLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vocabLinkText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  vocabBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vocabBadgeText: {
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  }
});

export default Review;
