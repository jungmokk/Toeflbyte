import mcpService from '../services/mcpService.js';
import llmService from '../services/llmService.js';

export const chatTutor = async (req, res) => {
  try {
    const { message, question_context, persona: personaType = 'tsun', language = 'ko', stream = false } = req.body;

    // 언어별 스타일 정의
    const styles = {
      ko: {
        kind: "말투는 '친절하고 상냥한 과외 선생님' 스타일로 학생을 다독여주세요.",
        tsun: "말투는 단호하고 예리한 '츤데레 일타강사' 스타일로 핵심만 짚어주세요.",
        timeout: "독해 속도가 너무 느려! 이 지문은 60초 컷 해야 하는 수준이야. 키워드 위주로 스캐닝하는 연습 좀 해.",
        explain: "Explain in Korean."
      },
      ja: {
        kind: "「親切で優しい家庭教師」のスタイルで、生徒を励ましながら教えてください。",
        tsun: "きっぱりとした鋭い「ツンデレカリスマ講師」のスタイルで、ポイントだけを的確に指摘してください。",
        timeout: "読解スピードが遅すぎるわ！この文章は 60 秒以内に終わらせるべきレベルよ。キーワードを中心にスキャニングする練習をして。",
        explain: "Explain in Japanese."
      },
      "zh-TW": {
        kind: "以「親切溫柔的家教老師」的風格，多鼓勵學生並給予指導。",
        tsun: "以果斷且敏銳的「傲嬌名師」風格，一針見血地指出重點。",
        timeout: "閱讀速度太慢了！這篇短文應該要在 60 秒內完成。多練習以關鍵字為主的快速掃描練習吧。",
        explain: "Explain in Traditional Chinese (Taiwan)."
      }
    };

    const targetStyle = styles[language] || styles.ko;
    const personaStyle = targetStyle[personaType === 'kind' ? 'kind' : 'tsun'];

    // 1. MCP를 통해 NotebookLM에서 페르소나 및 템플릿 Fetch (병렬 처리로 속도 개선)
    const [persona, template] = await Promise.all([
      mcpService.fetchNote("[일타강사 페르소나 가이드라인]"),
      mcpService.fetchNote("[학생 맞춤형 Q&A 템플릿]")
    ]);

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
"${targetStyle.timeout}" 와 같은 스타일로 팩폭해주세요.
You must explain the answer and why other options are traps. ${targetStyle.explain}

### FORMATTING RULE:
- ALWAYS use standard Markdown bold syntax (**word or sentence**) to emphasize keywords or key takeaway sentences.
- NEVER use symbols like "** ?? **" or other non-standard markers for emphasis. 
- Focus on making the explanation look clean and professional.
`;

    const { history = [] } = req.body;

    // 비스트리밍 모드 (React Native 호환)
    if (!stream) {
      console.log('[Chat-Tutor] Non-streaming mode for RN client');
      const reply = await llmService.generateChat(systemPrompt, message, history);
      return res.json({ success: true, reply });
    }

    // 스트리밍 모드 (웹 클라이언트)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const streamResult = await llmService.generateChatStream(systemPrompt, message, history);

    // AI 엔진(DeepSeek/Gemini)에 따른 스트림 처리
    if (streamResult[Symbol.asyncIterator]) {
      // OpenAI/DeepSeek 스타일
      for await (const chunk of streamResult) {
        const content = chunk.choices?.[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
        }
      }
    } else {
      // Gemini 스타일 (혹은 이터러블한 스트림)
      for await (const chunk of streamResult) {
        const text = typeof chunk.text === 'function' ? chunk.text() : chunk;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error("Chat Tutor Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
