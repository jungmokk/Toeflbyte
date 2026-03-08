import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Animated,
  Modal
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import useBite from '../../hooks/useBite';
import useVocab from '../../hooks/useVocab';
import useStore from '../../store/useStore';
import { X, Trophy, MessageCircle, Timer as TimerIcon, Eye, EyeOff, Bookmark, Zap, CheckCircle } from 'lucide-react-native';
import axios from 'axios';
import { API_URL } from '../../api/config';
import AnimatedButton from '../../components/AnimatedButton';

const Test = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { generateBite, saveResult } = useBite();
  const { saveWord } = useVocab();
  const { currentBite, deductCredits, reused, addToHistory, setCurrentBite, timerEnabled, userId } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordLoading, setWordLoading] = useState(false);
  const [wordMeaning, setWordMeaning] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  // Timer States
  const [timeLeft, setTimeLeft] = useState(90);
  const [timerActive, setTimerActive] = useState(false);
  const [timerOpacity] = useState(new Animated.Value(1));

  const reviewMode = route.params?.reviewMode;
  const reviewBite = route.params?.bite;

  // AdMob Setup
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    const adUnitId = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || TestIds.INTERSTITIAL;
    const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setAdLoaded(true);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setAdLoaded(false);
      navigation.navigate('Home');
    });

    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('AdMob Interstitial Error:', error);
      setAdLoaded(false);
    });

    interstitial.load();
    adRef.current = interstitial;

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);

  const handleFinish = () => {
    if (adLoaded) {
      adRef.current.show();
    } else {
      navigation.navigate('Home');
    }
  };

  // 1. Timer Logic
  useEffect(() => {
    if (!timerEnabled || reviewMode || loading || !currentBite || selectedAnswer) return;

    setTimerActive(true);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerEnabled, reviewMode, loading, currentBite]);

  // 2. Flashing color & animation at 10s
  useEffect(() => {
    if (timeLeft <= 10 && timerActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerOpacity, { toValue: 0.3, duration: 500, useNativeDriver: true }),
          Animated.timing(timerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      timerOpacity.stopAnimation();
      timerOpacity.setValue(1);
    }
  }, [timeLeft, timerActive]);

  const handleTimeout = () => {
    setTimerActive(false);
    handleSelectAnswer('TIMEOUT', true);
  };

  useEffect(() => {
    if (reviewMode && reviewBite) {
      // 복습 모드: 파라미터로 넘어온 문제 설정
      const parsedBite = typeof reviewBite.question.content_json === 'string' 
        ? JSON.parse(reviewBite.question.content_json) 
        : reviewBite.question.content_json;
      
      setCurrentBite({
        ...parsedBite,
      });
      setLoading(false);
    } else {
      loadNewBite();
    }
  }, [reviewMode, reviewBite]);

  const loadNewBite = async () => {
    setLoading(true);
    setCurrentBite(null); // 이전 문제 확실히 비우기
    setSelectedAnswer(null);
    setIsCorrect(null);
    try {
      if (reviewMode && reviewBite) {
        // 이 경로는 사실 위 useEffect에서 처리되지만 안전장치
        return;
      }

      // TOEFL 빈출 주제 리스트
      const topics = [
        'Archaeology of Ancient Egypt',
        'Astronomy and Planetary Formation',
        'Marine Biology and Coral Reefs',
        'History of the Renaissance Art',
        'Geology and Plate Tectonics',
        'Sociology of Urbanization',
        'Economics of the Great Depression',
        'Environmental Science and Climate Change',
        'Psychology of Cognitive Development',
        'Early American Literature',
        'Linguistics and Language Evolution',
        'Microbiology of Extremophiles',
        'Modern Architecture Movements'
      ];
      
      // 토픽을 랜덤하게 섞거나, Home에서 넘어온 토픽이 없으면 무조건 랜덤
      const selectedTopic = route.params?.topic || topics[Math.floor(Math.random() * topics.length)];
      console.log(`[Load-Bite] Requesting new bite for topic: ${selectedTopic}`);
      const res = await generateBite(selectedTopic);
      
      // Only deduct if it's NOT a reused question
      if (res && !res.reused) {
        deductCredits(5);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('test.generate_error'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = async (key, timedOut = false) => {
    if (selectedAnswer) return;
    setTimerActive(false); // 타이머 정지
    
    setSelectedAnswer(key);
    const correct = timedOut ? false : (key === currentBite?.answer);
    setIsCorrect(correct);
    
    if (reviewMode) return; // 복습 모드에서는 히스토리 중복 저장 안함

    const timeSpent = 90 - timeLeft;

    try {
      // 1. DB 저장 (BiteResult) - timeSpent 포함
      await saveResult(currentBite.id, key, correct, timeSpent);

      // 2. 이력 연동 (Zustand)
      addToHistory({
        id: currentBite.id || Date.now().toString(),
        topic: currentBite.topic || 'General',
        isCorrect: correct,
        isTimeout: timedOut,
        timeSpent: timeSpent,
        solvedAt: new Date().toISOString(),
        question: {
          id: currentBite.id,
          topic: currentBite.topic,
          content_json: JSON.stringify(currentBite)
        }
      });

      if (timedOut) {
        Alert.alert(t('test.timeout_title'), t('test.timeout_msg'));
      }
    } catch (error) {
      console.error('Save Result Error (Client-side):', error);
      Alert.alert(t('test.save_fail'), t('test.save_fail_msg'));
    }
  };

  const handleWordClick = async (word) => {
    // Remove punctuation
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
    if (cleanWord.length < 2) return;

    setSelectedWord(cleanWord);
    setWordLoading(true);
    setWordMeaning(null);
    setIsSaved(false);

    try {
      console.log(`[Define-Word] Fetching for: ${cleanWord}`);
      const response = await axios.post(`${API_URL}/ai/define-word`, { 
        word: cleanWord,
        context: currentBite.passage
      });
      setWordMeaning(response.data);
    } catch (error) {
      console.error('[Define-Word] API Error:', error.message);
      setWordMeaning({ 
        meaning: '단어 정보를 가져오지 못했습니다. 네트워크를 확인하세요.', 
        example: '' 
      });
    } finally {
      setWordLoading(false);
    }
  };

  const handleSaveWordDetail = async () => {
    if (!selectedWord || !wordMeaning) return;
    try {
      await saveWord(selectedWord, wordMeaning.meaning, currentBite.passage);
      setIsSaved(true);
      Alert.alert('저장 완료', `'${selectedWord}' 단어가 내 단어장에 저장되었습니다.`, [{ text: '확인' }]);
    } catch (error) {
      if (error.response?.status === 400) {
        Alert.alert(t('common.confirm'), t('chat.already_saved'));
      } else {
        Alert.alert(t('common.error'), t('chat.save_error'));
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>
          {reused 
            ? t('test.loading_reused')
            : t('test.loading_new')
          }
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <X color={COLORS.text} size={24} />
        </TouchableOpacity>
        
        {timerEnabled && !reviewMode && !loading && !focusMode && (
          <Animated.View style={[styles.timerBar, { opacity: timerOpacity }]}>
            <TimerIcon size={18} color={timeLeft <= 10 ? COLORS.error : COLORS.primary} />
            <Text style={[styles.timerText, timeLeft <= 10 && styles.timerAlert]}>
              {timeLeft}s
            </Text>
          </Animated.View>
        )}

        {focusMode ? (
          <Text style={styles.focusLabel}>{t('test.focus_mode')}</Text>
        ) : (
          <Text style={styles.headerTitle}>{t('test.title')}</Text>
        )}

        <TouchableOpacity onPress={() => setFocusMode(!focusMode)} style={styles.headerIcon}>
          {focusMode ? <EyeOff color={COLORS.primary} size={24} /> : <Eye color={COLORS.text} size={24} />}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.contentScroll} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.passageContainer, focusMode && styles.passageFocus]}>
          {reused && !focusMode && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{t('test.reused_badge', { count: '1,240' })}</Text>
            </View>
          )}
          
          <View style={styles.passageWrapper}>
            {(currentBite?.passage || '').split(' ').map((word, index) => (
              <TouchableOpacity
                key={`${index}-${word}`}
                onPress={() => handleWordClick(word)}
                activeOpacity={0.6}
              >
                <Text style={styles.clickableWord}>{word}{' '}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {!focusMode && (
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{currentBite?.question}</Text>
            
            <View style={styles.optionsGrid}>
              {Object.entries(currentBite?.options || {}).map(([key, text]) => {
                const isSelected = selectedAnswer === key;
                const buttonStyle = [
                  styles.optionButton,
                  isSelected && (isCorrect ? styles.correctOption : styles.wrongOption)
                ];

                return (
                  <TouchableOpacity 
                    key={key} 
                    style={buttonStyle}
                    onPress={() => handleSelectAnswer(key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionKey, isSelected && {color: COLORS.white}]}>{key}</Text>
                    <Text style={[styles.optionText, isSelected && {color: COLORS.white}]}>{text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Word Definition Modal */}
      <Modal
        visible={!!selectedWord}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedWord(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.vocabDrawer}>
            <View style={styles.drawerHandle} />
            <View style={styles.drawerHeader}>
              <View style={styles.wordTitleRow}>
                <Zap color={COLORS.primary} fill={COLORS.primary} size={20} />
                <Text style={styles.drawerWord}>{selectedWord}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.bookmarkButton, isSaved && {backgroundColor: 'rgba(16, 185, 129, 0.1)'}]} 
                onPress={handleSaveWordDetail}
                disabled={isSaved}
              >
                {isSaved ? (
                  <CheckCircle color={COLORS.success} size={24} />
                ) : (
                  <Bookmark color={COLORS.primary} size={24} />
                )}
              </TouchableOpacity>
            </View>

            {wordLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{marginVertical: 40}} />
            ) : (
              <ScrollView>
                <Text style={styles.drawerMeaning}>{wordMeaning?.meaning || '로딩 중...'}</Text>
                {wordMeaning?.example && (
                  <Text style={styles.drawerExample}>{wordMeaning.example}</Text>
                )}
                <TouchableOpacity 
                  style={styles.closeDrawerButton}
                  onPress={() => setSelectedWord(null)}
                >
                  <Text style={styles.closeDrawerText}>{t('review_detail.learn_done')}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {selectedAnswer && (
        <View style={styles.footer}>
          <AnimatedButton 
            style={styles.chatButton}
            onPress={() => navigation.navigate('Chat', { 
              context: { ...currentBite, isTimeout: selectedAnswer === 'TIMEOUT' } 
            })}
          >
            <MessageCircle color={COLORS.white} size={20} />
            <Text style={styles.chatButtonText}>{t('test.ask_tutor_btn')}</Text>
          </AnimatedButton>
          
          <AnimatedButton 
            style={styles.nextButton}
            onPress={() => loadNewBite()}
          >
            <Zap color={COLORS.primary} size={20} />
            <Text style={styles.nextButtonText}>{t('test.next_problem_btn')}</Text>
          </AnimatedButton>
          
          <TouchableOpacity 
            style={styles.finishButton}
            onPress={handleFinish}
          >
            <Text style={styles.finishButtonText}>{t('test.stop_learning_btn')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.primary,
    marginTop: SPACING.md,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  headerIcon: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  focusLabel: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
  },
  timerText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  timerAlert: {
    color: COLORS.error,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  passageContainer: {
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surfaceGlass,
    marginHorizontal: SPACING.md,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  passageFocus: {
    marginTop: 20,
    marginHorizontal: 0,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  passageWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: SPACING.lg,
  },
  clickableWord: {
    color: COLORS.text,
    fontSize: 18,
    lineHeight: 30,
    fontFamily: 'serif', // 실제 폰트 설정이 어렵다면 시스템 세리프 사용
  },
  badgeContainer: {
    backgroundColor: 'rgba(41, 121, 255, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(41, 121, 255, 0.3)',
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  questionContainer: {
    padding: SPACING.lg,
    marginTop: 10,
  },
  questionText: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: 'bold',
    lineHeight: 28,
    marginBottom: SPACING.lg,
  },
  optionsGrid: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  optionKey: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginRight: 16,
    fontSize: 20,
  },
  optionText: {
    color: COLORS.text,
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  correctOption: {
    backgroundColor: COLORS.success + '40',
    borderColor: COLORS.success,
  },
  wrongOption: {
    backgroundColor: COLORS.error + '40',
    borderColor: COLORS.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  vocabDrawer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: SPACING.xl,
    maxHeight: '50%',
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  wordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawerWord: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bookmarkButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(41, 121, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerMeaning: {
    fontSize: 18,
    color: COLORS.text,
    lineHeight: 28,
    marginBottom: 16,
  },
  drawerExample: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
  },
  closeDrawerButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  closeDrawerText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: 40,
    backgroundColor: COLORS.background,
  },
  chatButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  chatButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gap: 8,
  },
  nextButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  finishButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  finishButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default Test;
