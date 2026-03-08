import llmService from '../services/llmService.js';
import mcpService from '../services/mcpService.js';

export const defineWord = async (req, res) => {
  try {
    const { word, context } = req.body;

    if (!word) {
      return res.status(400).json({ success: false, error: "Word is required" });
    }

    const systemPrompt = `
      너는 최고의 토플(TOEFL) 강사이자 언어학자야. 
      사용자가 지문(Passage)에서 특정 단어를 클릭했을 때, 그 문맥에 맞는 정확한 의미와 예문을 제공해야 해.
      
      ### 규칙:
      1. 반드시 JSON 형식으로만 출력할 것.
      2. 'meaning'은 한국어로 설명할 것. (해당 문맥에서의 뜻을 우선시)
      3. 'example'은 해당 단어가 포함된 영어 예문 1개를 만들고, 그 아래에 한국어 해석을 붙일 것.
      
      ### 형식:
      {
        "meaning": "문맥에 맞는 한글 뜻",
        "example": "English example sentence.\\n(한글 해석)"
      }
    `;

    const userPrompt = `
      단어: ${word}
      문맥(지문 전체 또는 주변 문장): ${context || "문맥 없음"}
    `;

    const result = await llmService.generateContent(systemPrompt, userPrompt);

    res.json(result);
  } catch (error) {
    console.error("Define Word Error:", error);
    res.status(500).json({ 
      meaning: "의미를 가져오는 중 오류가 발생했습니다.", 
      example: "" 
    });
  }
};
