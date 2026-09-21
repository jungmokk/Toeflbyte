import axios from 'axios';
import useStore from '../store/useStore';
import i18n from '../i18n';
import { supabase } from '../lib/supabase';

import { API_BASE_URL } from '../config/apiConfig';

const BASE_URL = API_BASE_URL;

const useBite = () => {
  const { userId: storeUserId, setCurrentBite, setReused, persona, setUserId } = useStore();

  const getActiveUserId = async () => {
    if (storeUserId) return storeUserId;
    
    // Fallback: Check Supabase directly if store hasn't rehydrated yet
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      setUserId(session.user.id);
      return session.user.id;
    }
    return 'anonymous'; // Ultimate fallback for server
  };

  const generateBite = async (topic, mode = 'db') => {
    try {
      const activeUserId = await getActiveUserId();
      const url = `${BASE_URL}/generate-bite`;
      const response = await axios.post(url, 
        { topic, mode, persona, language: i18n.language },
        { 
          headers: { 'x-user-id': activeUserId },
          timeout: 10000 // 10초 타임아웃: 서버가 AI 생성에 빠져도 클라이언트는 10초 이내 응답 보장
        }
      );
      
      if (response.data.success) {
        setReused(response.data.reused || false);
        const biteData = response.data.data;
        setCurrentBite({ ...biteData, id: biteData.id });
        return response.data;
      }
    } catch (error) {
      console.error('[GenerateBite-Error] Detail:', error.response?.data || error.message);
      console.log('[Mock Mode] Using mock data due to server error');
      
      const mockContent = {
        passage: "Archaeologists have recently uncovered evidence of a previously unknown urban center in the Amazon rainforest. Using LIDAR technology, researchers identified complex structures including pyramids, plazas, and elevated roads, suggesting a far more sophisticated society than previously thought. This discovery challenges the long-held belief that the Amazon was sparsely populated before the arrival of Europeans.",
        question: "What did the LIDAR technology reveal about the Amazon rainforest?",
        options: {
          "A": "It was primarily used for agricultural purposes.",
          "B": "It contained complex urban structures like pyramids and plazas.",
          "C": "It was sparsely populated throughout history.",
          "D": "It lacked elevated road systems."
        },
        answer: "B",
        explanation: "The passage state that LIDAR helped identify pyramids, plazas, and roads."
      };

      const mockBite = {
        id: 'mock-' + Date.now(),
        topic: topic || 'Archaeology',
        ...mockContent,
        content_json: JSON.stringify(mockContent)
      };

      setCurrentBite(mockBite);
      return { success: true, data: mockBite };
    }
  };

  const getTutorChat = async (message, context, history = []) => {
    try {
      const activeUserId = await getActiveUserId();
      const response = await axios.post(`${BASE_URL}/chat-tutor`,
        { message, question_context: context, persona, history, language: i18n.language },
        { headers: { 'x-user-id': activeUserId } }
      );
      return response.data;
    } catch (error) {
      return { 
        success: true, 
        reply: "지금은 오프라인 모드입니다. 궁금한 점은 실제 출시 버전에서 물어봐 주세요!" 
      };
    }
  };

  const getTutorChatStream = async (message, context, history = [], onUpdate) => {
    try {
      const activeUserId = await getActiveUserId();
      
      const response = await axios.post(`${BASE_URL}/chat-tutor`, {
        message,
        question_context: context,
        persona,
        history,
        language: i18n.language,
        stream: false
      }, {
        headers: { 'x-user-id': activeUserId },
        timeout: 30000
      });

      if (response.data?.success && response.data.reply) {
        const fullText = response.data.reply;
        
        // 블록 분할 로직: 번호 매기기(1., 2..) 또는 빈 줄(\n\n) 기준
        // 정규식 설명: \n 다음에 '1.', '2.' 형태가 오거나 빈 줄이 두 개 이상인 경우를 나눔
        const blocks = fullText.split(/\n+(?=\d+\.|\n\n)/g).filter(b => b.trim());
        
        let completedBlocks = [];
        
        for (let i = 0; i < blocks.length; i++) {
          const currentBlock = blocks[i].trim();
          const sentences = currentBlock.split(/(?<=[.!?。\n])\s*/g).filter(s => s.trim());
          let typingInBlock = '';
          
          for (let j = 0; j < sentences.length; j++) {
            typingInBlock += (j > 0 ? ' ' : '') + sentences[j];
            // 현재 완료된 블록들과 현재 타이핑 중인 블록을 합쳐서 전달
            if (onUpdate) onUpdate([...completedBlocks, typingInBlock]);
            
            // 문장 간 타이핑 딜레이 (마지막 문장은 딜레이 짧게)
            await new Promise(resolve => setTimeout(resolve, 80));
          }
          completedBlocks.push(currentBlock);
        }
        
        return { success: true, reply: fullText };
      }
      
      throw new Error('Invalid tutor response');
    } catch (error) {
      console.error('Tutor Chat Error:', error.message);
      const fallbackMsg = "지금 일타강사가 잠시 쉬고 있어요. 잠시 후 다시 시도해주세요! 💪";
      if (onUpdate) onUpdate([fallbackMsg]);
      return { success: false, reply: fallbackMsg };
    }
  };

  const saveResult = async (questionId, userAnswer, isCorrect, timeSpent) => {
    try {
      const activeUserId = await getActiveUserId();
      const response = await axios.post(`${BASE_URL}/save-result`, {
        userId: activeUserId,
        questionId,
        userAnswer,
        isCorrect,
        timeSpent
      });
      return response.data;
    } catch (error) {
      console.log('[Mock Mode] Skip actual database save. Result tracked locally.');
      return { success: true };
    }
  };

  const getSummary = async () => {
    try {
      const activeUserId = await getActiveUserId();
      const response = await axios.post(`${BASE_URL}/get-summary`, {
        userId: activeUserId,
        persona,
        language: i18n.language
      });
      return response.data;
    } catch (error) {
      return { success: true, summary: "지금까지의 학습 통계입니다. 잘하고 계시네요!" };
    }
  };

  const getRandomBites = async (limit = 5) => {
    try {
      const activeUserId = await getActiveUserId();
      const response = await axios.get(`${BASE_URL}/random-bites?limit=${limit}`, {
        headers: { 'x-user-id': activeUserId }
      });
      return response.data;
    } catch (error) {
      console.error('Fetch Random Bites Error:', error);
      return { success: false, data: [] };
    }
  };

  const syncUser = async () => {
    try {
      const activeUserId = await getActiveUserId();
      const response = await axios.get(`${BASE_URL}/user/sync`, {
        headers: { 'x-user-id': activeUserId }
      });
      return response.data;
    } catch (error) {
      console.error('Sync User Error:', error);
      return { success: false };
    }
  };

  return { generateBite, getTutorChat, getTutorChatStream, saveResult, getSummary, getRandomBites, syncUser };
};

export default useBite;
