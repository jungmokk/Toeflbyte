import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import useBite from '../../hooks/useBite';
import useVocab from '../../hooks/useVocab';
import useStore from '../../store/useStore';
import { ChevronLeft, Info, CheckCircle2, XCircle, ChevronRight, HelpCircle, Zap, Bookmark, CheckCircle, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_URL } from '../../api/config';

const ReviewDetail = ({ navigation, route }) => {
  const { bite } = route.params;
  const { t } = useTranslation();
  const { saveWord } = useVocab();
  const parsedBite = typeof bite.question.content_json === 'string' 
    ? JSON.parse(bite.question.content_json) 
    : bite.question.content_json;

  const [selectedWord, setSelectedWord] = useState(null);
  const [wordLoading, setWordLoading] = useState(false);
  const [wordMeaning, setWordMeaning] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleWordClick = async (word) => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
    if (cleanWord.length < 2) return;

    setSelectedWord(cleanWord);
    setWordLoading(true);
    setWordMeaning(null);
    setIsSaved(false);

    try {
      const response = await axios.post(`${API_URL}/ai/define-word`, { 
        word: cleanWord,
        context: parsedBite.passage
      });
      setWordMeaning(response.data);
    } catch (error) {
      console.error('[Define-Word] API Error:', error.message);
      setWordMeaning({ meaning: t('review_detail.define_error'), example: '' });
    } finally {
      setWordLoading(false);
    }
  };

  const handleSaveWordDetail = async () => {
    if (!selectedWord || !wordMeaning) return;
    try {
      await saveWord(selectedWord, wordMeaning.meaning, parsedBite.passage);
      setIsSaved(true);
      Alert.alert(t('chat.save_success'), t('chat.save_msg', { word: selectedWord }));
    } catch (error) {
      if (error.response?.status === 400) {
        Alert.alert(t('common.confirm'), t('chat.already_saved'));
      } else {
        Alert.alert(t('common.error'), t('vocabulary.save_error') || t('chat.save_error'));
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={COLORS.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('review_detail.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Topic Badge */}
        <View style={styles.topicBadge}>
          <Text style={styles.topicText}>{bite.topic}</Text>
        </View>

        {/* Passage Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{t('review_detail.passage')}</Text>
          </View>
          <View style={styles.passageCard}>
            <View style={styles.passageWrapper}>
              {(parsedBite.passage || '').split(' ').map((word, index) => (
                <TouchableOpacity
                  key={`${index}-${word}`}
                  onPress={() => handleWordClick(word)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.passageText}>{word}{' '}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Question & Answers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <HelpCircle size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{t('review_detail.question_options')}</Text>
          </View>
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{parsedBite.question}</Text>
            
            <View style={styles.optionsList}>
              {Object.entries(parsedBite.options || {}).map(([key, text]) => {
                const isUserAnswer = bite.userAnswer === key;
                const isCorrectAnswer = parsedBite.answer === key;
                
                let optionStyle = styles.optionItem;
                if (isCorrectAnswer) optionStyle = [styles.optionItem, styles.correctOption];
                else if (isUserAnswer && !bite.isCorrect) optionStyle = [styles.optionItem, styles.wrongOption];

                return (
                  <View key={key} style={optionStyle}>
                    <View style={styles.optionKeyWrapper}>
                      <Text style={[styles.optionKey, (isCorrectAnswer || isUserAnswer) && { color: COLORS.white }]}>{key}</Text>
                    </View>
                    <Text style={[styles.optionText, (isCorrectAnswer || isUserAnswer) && { color: COLORS.white }]}>{text}</Text>
                    {isCorrectAnswer && <CheckCircle2 size={18} color={COLORS.white} />}
                    {isUserAnswer && !bite.isCorrect && <XCircle size={18} color={COLORS.white} />}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* AI Explanation Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={18} color={COLORS.success} />
            <Text style={[styles.sectionTitle, { color: COLORS.success }]}>{t('review_detail.instructor_explanation')}</Text>
          </View>
          <View style={styles.explanationCard}>
            <Text style={styles.explanationText}>
              {parsedBite.distractor_logic?.instructor_comment || parsedBite.explanation || t('review_detail.default_explanation')}
            </Text>
          </View>
        </View>

        {/* Key Keywords Section */}
        {parsedBite.keyWords && parsedBite.keyWords.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bookmark size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>{t('review_detail.key_vocab')}</Text>
            </View>
            <View style={styles.keywordContainer}>
              {parsedBite.keyWords.map((kw, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.keywordItem}
                  onPress={() => {
                    setSelectedWord(kw.word);
                    setWordMeaning({ meaning: kw.meaning, example: '' });
                    setIsSaved(false);
                  }}
                >
                  <View>
                    <Text style={styles.keywordWord}>{kw.word}</Text>
                    <Text style={styles.keywordMeaning}>{kw.meaning}</Text>
                  </View>
                  <Plus size={18} color={COLORS.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => navigation.navigate('Chat', { context: parsedBite })}
        >
          <Text style={styles.chatButtonText}>{t('review_detail.ask_tutor')}</Text>
          <ChevronRight color={COLORS.white} size={20} />
        </TouchableOpacity>
      </ScrollView>

      {/* Word Definition Modal (Shared Logic) */}
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
                <Text style={styles.drawerMeaning}>{wordMeaning?.meaning || t('common.loading')}</Text>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  topicBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 20,
  },
  topicText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  passageCard: {
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  passageText: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 24,
  },
  questionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  questionText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: 'bold',
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  optionKeyWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionKey: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  optionText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  correctOption: {
    backgroundColor: COLORS.success + '80', // opacity
  },
  wrongOption: {
    backgroundColor: COLORS.error + '80', // opacity
  },
  explanationCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  explanationText: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 24,
  },
  chatButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  chatButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Added Vocab Modal Styles
  passageWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  // Added Keyword styles
  keywordContainer: {
    gap: 10,
  },
  keywordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  keywordWord: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  keywordMeaning: {
    color: COLORS.textSecondary,
    fontSize: 14,
  }
});


export default ReviewDetail;

