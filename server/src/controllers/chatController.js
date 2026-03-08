import mcpService from '../services/mcpService.js';
import llmService from '../services/llmService.js';

export const chatTutor = async (req, res) => {
  try {
    const { message, question_context, persona: personaType = 'tsun' } = req.body;

    const personaStyle = personaType === 'kind'
      ? "말투는 '친절하고 상냥한 과외 선생님' 스타일로 학생을 다독여주세요."
      : "말투는 단호하고 예리한 '츤데레 일타강사' 스타일로 핵심만 짚어주세요.";

    // 1. MCP를 통해 NotebookLM에서 페르소나 및 템플릿 Fetch
    const persona = await mcpService.fetchNote("[일타강사 페르소나 가이드라인]");
    const template = await mcpService.fetchNote("[학생 맞춤형 Q&A 템플릿]");

    // 2. Persona와 Template을 결합한 System Prompt 구성
    const systemPrompt = `
You are the Star Tutor (일타강사) for TOEFL. 
### YOUR PERSONA:
${persona}
${personaStyle}

### RESPONSE STRUCTURE (MUST FOLLOW):
${template}

### CONTEXT:
The student is asking about the following question/passage: ${JSON.stringify(question_context)}
If question_context contains { isTimeout: true }, you MUST tell the student that their reading speed is too slow. 
"독해 속도가 너무 느려! 이 지문은 60초 컷 해야 하는 수준이야. 키워드 위주로 스캐닝하는 연습 좀 해." 와 같은 스타일로 팩폭해주세요.
You must explain the answer and why other options are traps in Korean.
`;

    // 3. LLM 호출 (History 포함)
    const { history = [] } = req.body;
    const aiResponse = await llmService.generateChat(systemPrompt, message, history);

    res.json({
      success: true,
      reply: aiResponse,
      credits_used: 1
    });

  } catch (error) {
    console.error("Chat Tutor Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
