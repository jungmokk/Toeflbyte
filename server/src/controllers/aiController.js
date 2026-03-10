import llmService from '../services/llmService.js';
import mcpService from '../services/mcpService.js';

export const defineWord = async (req, res) => {
  try {
    const { word, context, language = 'ko' } = req.body;

    if (!word) {
      return res.status(400).json({ success: false, error: "Word is required" });
    }

    const result = await llmService.defineWord(word, context, language);

    res.json(result);
  } catch (error) {
    console.error("Define Word Error:", error);
    res.status(500).json({ 
      meaning: "의미를 가져오는 중 오류가 발생했습니다.", 
      example: "" 
    });
  }
};
