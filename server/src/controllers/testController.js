import supabase from '../config/db.js';
import mcpService from '../services/mcpService.js';
import llmService from '../services/llmService.js';
import path from 'path';
import fs from 'fs/promises';

export const generateBite = async (req, res) => {
  try {
    const { topic = "General Science", userId, persona = 'tsun', type = 'FULL' } = req.body;
    
    const activeUserId = userId || req.headers['x-user-id'];
    
    // 1. 해당 유저가 이미 푼 문제 ID 목록 가져오기
    const { data: solvedResults, error: solvedError } = await supabase
      .from('BiteResult')
      .select('questionId')
      .eq('userId', activeUserId);
    
    if (solvedError) throw solvedError;
    const solvedIds = solvedResults ? solvedResults.map(r => r.questionId) : [];

    // 2. DB 중심: 해당 주제와 타입에 맞는 문제들 검색
    let { data: questions, error: fetchError } = await supabase
      .from('BiteQuestion')
      .select('*')
      .eq('topic', topic)
      .eq('type', type);
    
    if (fetchError) throw fetchError;

    // 3. 자바스크립트 레벨에서 안 푼 문제 필터링 (DB 필터보다 더 확실함)
    const solvedIdsSet = new Set(solvedIds.map(id => String(id)));
    const unsolvedQuestions = (questions || []).filter(q => !solvedIdsSet.has(String(q.id)));

    if (unsolvedQuestions.length > 0) {
      // 안 푼 문제 중 랜덤으로 하나 선택 (매번 똑같은 최신 문제만 나오지 않게 함)
      const randomIndex = Math.floor(Math.random() * unsolvedQuestions.length);
      const existingQuestion = unsolvedQuestions[randomIndex];
      
      console.log(`[DB-Hit] Found ${unsolvedQuestions.length} unsolved questions for topic: ${topic}. Choosing random index: ${randomIndex}`);
      
      const content = typeof existingQuestion.content_json === 'string' 
        ? JSON.parse(existingQuestion.content_json) 
        : existingQuestion.content_json;

      return res.json({
        success: true,
        data: {
          ...content,
          id: existingQuestion.id,
          topic: existingQuestion.topic
        },
        reused: true,
        credits_used: 0 
      });
    }

    // 4. AI 기반 신규 생성 (DB에 안 푼 문제가 없을 때만)
    console.log(`[Hybrid-Flow] No unsolved DB match (Solved: ${solvedIds.length}, Total in DB: ${questions?.length || 0}). Generating new ${type} from AI for topic: ${topic}`);
    const lengthGuideline = type === 'SHORT' 
      ? "PASSAGE LENGTH: Maximum 100 words. Focus on a single summary paragraph. Achieve a 1-minute completion time."
      : "PASSAGE LENGTH: 150-200 words. standard TOEFL short-form style.";

    console.log(`[Hybrid-Flow] No unsolved DB match. Fetching new ${type} from AI for topic: ${topic}`);

    const writingRule = await mcpService.fetchNote("[토플 단일 문단 출제규칙]");
    const distractorRule = await mcpService.fetchNote("[유형별 오답 설계 공식]");
    const referenceSample = await mcpService.fetchNote("[토플 문제풀이 핵심로직]");

    const masterPromptPath = path.resolve('/Users/kazisis/Toefl-study/Toefl/숏폼 토플 마스터 프롬프트.md');
    const masterPrompt = await fs.readFile(masterPromptPath, 'utf8');

    const systemPrompt = `
${masterPrompt}

### SPECIFIC FORMAT RULES:
${lengthGuideline}

### REFERENCE DATA FROM KNOWLEDGE BASE (MCP):
- WRITING RULES: ${writingRule}
- DISTRACTOR FORMULAS: ${distractorRule}

### CRITICAL GENERATION GUIDELINES:
1. JSON Output: You MUST output the response in EXACT JSON format.
`;

    const userPrompt = `주제 '${topic}'에 기반하여 ${type === 'SHORT' ? '1분 숏 바이트(요약형)' : '표준 숏폼'} 토플 문제 1세트를 생성해 줘.`;

    const result = await llmService.generateContent(systemPrompt, userPrompt);

    // 4. 생성된 결과를 DB에 저장 (Reusable for future users)
    let savedQuestion = null;
    
    if (activeUserId) {
      const { data: newQuestion, error: saveError } = await supabase
        .from('BiteQuestion')
        .insert([{
          userId: activeUserId,
          topic: topic,
          type: type,
          content_json: JSON.stringify(result)
        }])
        .select()
        .single();
      
      if (saveError) {
        console.error("Save Bite DB Error (ignored for response):", saveError);
      } else {
        savedQuestion = newQuestion;
      }
    }

    res.json({
      success: true,
      data: {
        ...result,
        id: savedQuestion?.id
      },
      reused: false,
      credits_used: 5
    });

  } catch (error) {
    console.error("Generate Bite Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveResult = async (req, res) => {
  try {
    const { userId, questionId, userAnswer, isCorrect, timeSpent = 0 } = req.body;
    
    if (!questionId) {
      console.error("[Save-Result] Error: questionId is missing in request body");
      return res.status(400).json({ success: false, error: "questionId is required" });
    }

    const { data: result, error } = await supabase
      .from('BiteResult')
      .insert([{
        userId,
        questionId,
        userAnswer,
        isCorrect,
        timeSpent
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Save Result Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSummary = async (req, res) => {
  try {
    const { userId, persona = 'tsun' } = req.body;
    
    const { data: incorrectAnswers, error } = await supabase
      .from('BiteResult')
      .select('*, question:BiteQuestion(*)')
      .eq('userId', userId)
      .eq('isCorrect', false)
      .order('solvedAt', { ascending: false })
      .limit(5);

    if (error) throw error;

    if (!incorrectAnswers || incorrectAnswers.length === 0) {
      return res.json({ 
        success: true, 
        summary: "아직 틀린 문제가 없네요! 아주 훌륭해요. 지금처럼만 계속합시다." 
      });
    }

    const personaGuide = await mcpService.fetchNote("[일타강사 페르소나 가이드라인]");
    const distractorRule = await mcpService.fetchNote("[유형별 오답 설계 공식]");

    const historyText = incorrectAnswers.map(a => `Topic: ${a.question.topic}, Q: ${a.question.content_json}`).join("\n");
    
    const personaStyle = persona === 'kind' 
      ? "- 말투는 '친절하고 꼼꼼한 과외 선생님' 스타일 (상냥하게 격려)" 
      : "- 말투는 단호한 '팩폭' 스타일 (예리하게 단점 지적)";

    const systemPrompt = `
${personaGuide}
${distractorRule}

### TASK:
당신은 대한민국 최고의 일타강사입니다. 학생이 최근 틀린 5개 문제의 데이터를 보고, 
어떤 '오답 로직(Distractor Logic)'에 주로 낚이는지 예리하게 분석해주세요.

### GUIDELINE:
${personaStyle}
- 마지막엔 실질적인 해결책을 곁들일 것.
- 3문장 이내로 짧고 강력하게 요약해.
`;

    const userPrompt = `학생의 오답 이력:\n${historyText}\n\n위 데이터를 보고 이 학생의 약점이 무엇인지 짧고 굵게 팩폭해주세요.`;

    const summaryResult = await llmService.generateContent(systemPrompt, userPrompt);

    res.json({ success: true, summary: summaryResult });
  } catch (error) {
    console.error("Get Summary Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
