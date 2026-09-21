import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { Send, ChevronDown, Plus } from 'lucide-react-native';
import useBite from '../../hooks/useBite';
import useVocab from '../../hooks/useVocab';
import useStore from '../../store/useStore';
import { useTranslation } from 'react-i18next';

const Chat = ({ route, navigation }) => {
  const { context } = route.params;
  const { t } = useTranslation();
  const { getTutorChat, getTutorChatStream } = useBite();
  const { saveWord } = useVocab();
  const { deductCredits } = useStore();
  const scrollViewRef = React.useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Initial fetch of Tutor's explanation
    handleInitialExplanation();
  }, []);

  const handleInitialExplanation = async () => {
    setIsTyping(true);
    // Add a placeholder message for the streaming content
    setMessages([{ role: 'assistant', content: '' }]);
    
    try {
      const result = await getTutorChatStream(
        t('chat.initial_query'), 
        context, 
        [], 
        (content) => {
          setMessages([{ role: 'assistant', content }]);
        }
      );
      if (result?.success) {
        deductCredits(1);
      }
    } catch (error) {
      console.error(error);
      setMessages([{ role: 'assistant', content: '일타강사 연결에 문제가 발생했어요. 잠시 후 다시 시도해주세요!' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveWord = async (word, meaning) => {
    try {
      await saveWord(word, meaning, context.passage);
      Alert.alert(t('chat.save_success'), t('chat.save_msg', { word }));
    } catch (error) {
      if (error.response?.status === 400) {
        Alert.alert(t('common.confirm'), t('chat.already_saved'));
      } else {
        Alert.alert(t('common.error'), t('chat.save_error'));
      }
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    
    // Auto-save keywords once at start
    if (messages.length === 0 && context.keyWords) {
      context.keyWords.forEach(kw => {
        saveWord(kw.word, kw.meaning, context.passage).catch(() => {});
      });
    }

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    
    const history = messages.length > 0 ? messages : [];
    
    setIsTyping(true);
    // Add user message and a placeholder for assistant
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    
    try {
      await getTutorChatStream(
        userMsg, 
        context, 
        history, 
        (content) => {
          setMessages(prev => {
            const next = [...prev];
            // content는 이제 string[] (블록 배열)
            next[next.length - 1] = { role: 'assistant', content };
            return next;
          });
        }
      );
      deductCredits(1);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  // 마크다운 볼드(**text**)를 감지하여 렌더링하는 함수
  const renderFormattedText = (text, isUser = false) => {
    if (!text) return null;
    
    // 텍스트에서 불필요한 "** ?? **" 패턴이 남아있을 경우 제거 (서버 업데이트 전 데이터 대응)
    const cleanedText = text.replace(/\*\* \?\? \*\*/g, "").replace(/\?\?/g, "");
    
    // **로 텍스트 분리 (캡처 그룹을 사용하여 구분자도 결과에 포함)
    const parts = cleanedText.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // 강조 구문인 경우
        const boldText = part.slice(2, -2);
        return (
          <Text key={index} style={{ fontWeight: '800', color: isUser ? COLORS.white : COLORS.primary }}>
            {boldText}
          </Text>
        );
      }
      return part;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronDown color={COLORS.textSecondary} size={30} />
        </TouchableOpacity>
        <View style={styles.tutorInfo}>
          <View style={styles.avatar} />
          <View>
            <Text style={styles.tutorName}>{t('chat.title')} <Text style={styles.badge}>{t('chat.premium')}</Text></Text>
            <Text style={styles.tutorStatus}>{t('chat.status')}</Text>
          </View>
        </View>
      </View>

      {/* Recommended Keywords for Saving */}
      <View style={styles.keywordSection}>
        <Text style={styles.keywordTitle}>{t('chat.keyword_title')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.keywordScroll}>
          {context.keyWords?.map((kw, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.keywordBadge}
              onPress={() => handleSaveWord(kw.word, kw.meaning)}
            >
              <Plus size={14} color={COLORS.primary} />
              <Text style={styles.keywordText}>{kw.word}</Text>
            </TouchableOpacity>
          )) || (
            <Text style={styles.noKeywordText}>{t('chat.no_keywords')}</Text>
          )}
        </ScrollView>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.chatWrapper}
      >
        <ScrollView 
          contentContainerStyle={styles.chatArea}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, idx) => (
            <View key={idx} style={[
              styles.bubbleContainer, 
              msg.role === 'user' ? styles.userContainer : styles.assistantContainer
            ]}>
              {Array.isArray(msg.content) ? (
                // 튜터의 답변이 여러 블록(배열)인 경우 리스트로 렌더링
                <View style={styles.multiBubbleWrapper}>
                  {msg.content.map((block, bIdx) => (
                    <View key={bIdx} style={[
                      styles.bubble,
                      styles.assistantBubble,
                      // 연속된 버블 사이의 간격 조정 및 모서리 둥글기 처리
                      bIdx > 0 && { marginTop: 4 },
                      bIdx < msg.content.length - 1 && { borderBottomLeftRadius: 20 }
                    ]}>
                      <Text style={[styles.bubbleText, { color: COLORS.text }]}>
                        {renderFormattedText(block)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                // 일반 텍스트(유저 메시징 등)인 경우 단일 버블 렌더링
                <View style={[
                  styles.bubble,
                  msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                ]}>
                  <Text style={[
                    styles.bubbleText,
                    msg.role === 'user' ? {color: COLORS.white} : {color: COLORS.text}
                  ]}>
                    {renderFormattedText(msg.content, msg.role === 'user')}
                  </Text>
                </View>
              )}
            </View>
          ))}
          {isTyping && (
            <View style={styles.assistantContainer}>
              <View style={[styles.bubble, styles.assistantBubble]}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('chat.input_placeholder')}
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="sentences"
            autoCorrect={true}
            spellCheck={true}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={handleSendMessage}
            disabled={!input.trim() || isTyping}
          >
            <Send color={COLORS.white} size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  chatWrapper: {
    flex: 1,
  },
  header: {
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tutorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
    borderWidth: 2,
    marginRight: SPACING.md,
  },
  tutorName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    color: COLORS.primary,
    fontSize: 10,
  },
  tutorStatus: {
    color: COLORS.success,
    fontSize: 12,
  },
  chatArea: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  bubbleContainer: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  multiBubbleWrapper: {
    maxWidth: '85%',
    gap: 4,
  },
  bubble: {
    maxWidth: '85%',
    padding: SPACING.md,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
    gap: SPACING.md,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 25,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keywordSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  keywordTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: SPACING.lg,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  keywordScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 8,
  },
  keywordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  keywordText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  noKeywordText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  }
});

export default Chat;
