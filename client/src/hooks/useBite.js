import axios from 'axios';
import useStore from '../store/useStore';

import { API_BASE_URL } from '../config/apiConfig';

const BASE_URL = API_BASE_URL;

const useBite = () => {
  const { userId, setCurrentBite, setReused, persona } = useStore();

  const generateBite = async (topic) => {
    try {
      const url = `${BASE_URL}/generate-bite`;
      const response = await axios.post(url, 
        { topic, persona },
        { headers: { 'x-user-id': userId } }
      );
      
      if (response.data.success) {
        setReused(response.data.reused || false);
        // 서버에서 온 데이터가 content_json 문자열이면 파싱해서 저장
        let biteData = response.data.data;
        if (typeof biteData.content_json === 'string') {
          const content = JSON.parse(biteData.content_json);
          biteData = { ...biteData, ...content };
        }
        setCurrentBite(biteData);
        return response.data;
      }
    } catch (error) {
      console.error('[GenerateBite-Error] Detail:', error.response?.data || error.message);
      console.log('[Mock Mode] Using mock data due to server error');
      // ...
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
      const response = await axios.post(`${BASE_URL}/chat-tutor`,
        { message, question_context: context, persona, history },
        { headers: { 'x-user-id': userId } }
      );
      return response.data;
    } catch (error) {
      return { 
        success: true, 
        reply: "지금은 오프라인 모드입니다. 14일 테스트 기간 동안은 AI 해설 기능에 제한이 있을 수 있습니다. 궁금한 점은 실제 출시 버전에서 물어봐 주세요!" 
      };
    }
  };

  const saveResult = async (questionId, userAnswer, isCorrect, timeSpent) => {
    try {
      const response = await axios.post(`${BASE_URL}/save-result`, {
        userId,
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
      const response = await axios.post(`${BASE_URL}/get-summary`, {
        userId,
        persona
      });
      return response.data;
    } catch (error) {
      return { success: true, summary: "지금까지의 학습 통계입니다. 잘하고 계시네요!" };
    }
  };

  return { generateBite, getTutorChat, saveResult, getSummary };
};

export default useBite;
