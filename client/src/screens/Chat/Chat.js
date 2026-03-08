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
  const { getTutorChat } = useBite();
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
    try {
      const response = await getTutorChat(t('chat.initial_query'), context);
      setMessages([{ role: 'assistant', content: response.reply }]);
      deductCredits(1);
    } catch (error) {
      console.error(error);
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
    
    setIsTyping(true);
    try {
      const response = await getTutorChat(userMsg, context, messages);
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
      deductCredits(1);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
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
              <View style={[
                styles.bubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble
              ]}>
                <Text style={[
                  styles.bubbleText,
                  msg.role === 'user' ? {color: COLORS.white} : {color: COLORS.text}
                ]}>
                  {msg.content}
                </Text>
              </View>
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
