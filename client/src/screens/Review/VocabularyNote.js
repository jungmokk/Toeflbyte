import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import { 
  BookMarked, 
  Trash2, 
  Play, 
  ChevronLeft,
  Search,
  Plus
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useVocab from '../../hooks/useVocab';

const VocabularyNote = ({ navigation }) => {
  const { getVocabList, deleteWord } = useVocab();
  const { t } = useTranslation();
  const [vocabList, setVocabList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  
  // Quiz States
  const [quizVocabs, setQuizVocabs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    fetchVocab();
  }, []);

  const fetchVocab = async () => {
    try {
      setLoading(true);
      const data = await getVocabList();
      setVocabList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, word) => {
    Alert.alert(
      t('vocabulary.delete_title'),
      t('vocabulary.delete_confirm', { word }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWord(id);
              setVocabList(prev => prev.filter(item => item.id !== id));
            } catch (error) {
              Alert.alert(t('common.error'), t('common.error_occurred') || 'Error occurred');
            }
          }
        }
      ]
    );
  };

  const startQuiz = () => {
    if (vocabList.length < 3) return;
    const shuffled = [...vocabList].sort(() => 0.5 - Math.random());
    setQuizVocabs(shuffled);
    setCurrentIndex(0);
    setIsRevealed(false);
    setQuizFinished(false);
    setQuizModalVisible(true);
  };

  const handleNext = () => {
    if (currentIndex < quizVocabs.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsRevealed(false);
    } else {
      setQuizFinished(true);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('vocabulary.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quiz Banner */}
        {vocabList.length >= 3 ? (
          <TouchableOpacity 
            style={styles.quizBanner}
            onPress={startQuiz}
          >
            <View style={styles.quizBannerInfo}>
              <Play fill={COLORS.white} color={COLORS.white} size={20} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.quizTitle}>{t('vocabulary.quiz_challenge')}</Text>
                <Text style={styles.quizDesc}>{t('vocabulary.quiz_desc', { count: vocabList.length })}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyBanner}>
            <Search size={24} color={COLORS.textSecondary} />
            <Text style={styles.emptyBannerText}>{t('vocabulary.quiz_unlock_desc')}</Text>
          </View>
        )}

        {vocabList.length > 0 ? (
          vocabList.map((item) => (
            <View key={item.id} style={styles.vocabCard}>
              <View style={styles.vocabMain}>
                <View>
                  <Text style={styles.word}>{item.word}</Text>
                  <Text style={styles.meaning}>{item.meaning}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.word)}>
                  <Trash2 size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              {item.context && (
                <View style={styles.contextBox}>
                  <Text style={styles.contextText} numberOfLines={2}>
                    "{item.context}"
                  </Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <BookMarked size={64} color={COLORS.surface} />
            <Text style={styles.emptyText}>{t('vocabulary.no_vocab')}</Text>
            <Text style={styles.emptySubtext}>{t('vocabulary.empty_subtext')}</Text>
          </View>
        )}
      </ScrollView>

      {/* Placeholder Quiz Modal */}
      <Modal
        visible={quizModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.quizModalContent}>
            {!quizFinished ? (
              <>
                <View style={styles.quizHeader}>
                  <Text style={styles.quizProgress}>{currentIndex + 1} / {quizVocabs.length}</Text>
                  <TouchableOpacity onPress={() => setQuizModalVisible(false)}>
                    <Text style={{ color: COLORS.textSecondary }}>{t('common.close')}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => setIsRevealed(!isRevealed)}
                  style={[styles.flashcard, isRevealed && styles.flashcardRevealed]}
                >
                  <Text style={styles.quizWord}>{quizVocabs[currentIndex]?.word}</Text>
                  
                  {isRevealed ? (
                    <View style={styles.quizResultArea}>
                      <Text style={styles.quizMeaning}>{quizVocabs[currentIndex]?.meaning}</Text>
                      {quizVocabs[currentIndex]?.context && (
                        <Text style={styles.quizContext}>"{quizVocabs[currentIndex]?.context}"</Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.tapPrompt}>{t('vocabulary.quiz_tap_to_see')}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.nextButton, !isRevealed && { opacity: 0.5 }]}
                  onPress={handleNext}
                  disabled={!isRevealed}
                >
                  <Text style={styles.nextButtonText}>
                    {currentIndex === quizVocabs.length - 1 ? t('vocabulary.quiz_finish') : t('vocabulary.quiz_next')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={styles.successIcon}>
                  <Play fill={COLORS.primary} color={COLORS.primary} size={40} />
                </View>
                <Text style={styles.finishTitle}>{t('vocabulary.quiz_congrats')}</Text>
                <Text style={styles.finishSubtitle}>{t('vocabulary.quiz_summary', { total: quizVocabs.length })}</Text>
                
                <TouchableOpacity 
                  style={styles.finishButton}
                  onPress={() => setQuizModalVisible(false)}
                >
                  <Text style={styles.finishButtonText}>{t('common.confirm')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    padding: SPACING.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  quizBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    // Glow effect
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  quizBannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  quizDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  emptyBanner: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyBannerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginLeft: 12,
    flex: 1,
  },
  vocabCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vocabMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  word: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  meaning: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  contextBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  contextText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
    opacity: 0.5,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizModalContent: {
    backgroundColor: COLORS.surface,
    width: '90%',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  quizProgress: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  flashcard: {
    backgroundColor: COLORS.background,
    borderRadius: 24,
    padding: 30,
    minHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 30,
  },
  flashcardRevealed: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(74, 110, 255, 0.05)',
  },
  quizWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  tapPrompt: {
    marginTop: 20,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  quizResultArea: {
    marginTop: 30,
    alignItems: 'center',
    width: '100%',
  },
  quizMeaning: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  quizContext: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 110, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  finishTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  finishSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 30,
  },
  finishButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  finishButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  }
});

export default VocabularyNote;
