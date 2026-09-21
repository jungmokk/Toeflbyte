import supabase from '../config/db.js';
import mcpService from '../services/mcpService.js';
import llmService from '../services/llmService.js';
import path from 'path';
import fs from 'fs/promises';

// [Internal Helper] TOEFL 공식 유형 정의
const TOEFL_QUESTION_TYPES = [
  { 
    name: "Factual Information", 
    desc: "According to the passage, [X] happened because...",
    rule: "Find the specific detail stated explicitly in the passage."
  },
  { 
    name: "Negative Factual Information", 
    desc: "Which of the following is NOT True about [X]?",
    rule: "Use 'EXCEPT' or 'NOT' in the question. Three options must be true, one must be false or not mentioned."
  },
  { 
    name: "Inference", 
    desc: "Which of the following can be inferred about [X]?",
    rule: "The answer is not explicitly stated but strongly implied by the facts."
  },
  { 
    name: "Rhetorical Purpose", 
    desc: "The author mentions [X] in order to...",
    rule: "Analyze WHY the author included special information or examples."
  },
  { 
    name: "Vocabulary", 
    desc: "The word [X] is closest in meaning to...",
    rule: "Pick a synonym that fits the context of the passage."
  },
  { 
    name: "Reference", 
    desc: "The word [it/they/which] refers to...",
    rule: "Identify the antecedent of a pronoun or relative pronoun."
  },
  { 
    name: "Sentence Simplification", 
    desc: "Which of the following best expresses the essential information...",
    rule: "Pick the option that keeps all core information but removes unnecessary details without changing meaning."
  },
  { 
    name: "Insert Text", 
    desc: "[■] square bracket placement question.",
    rule: "Provide a sentence to be inserted and mark 4 potential places in the passage with [A], [B], [C], [D] or [■]."
  }
];

// [Internal Helper] AI를 통해 문제를 생성하고 DB에 저장하는 함수
const generateAndSaveNewBite = async (topic, type, activeUserId, language, persona = 'tsun', mode = 'db') => {
  try {
    // 1. 유형 랜덤 선택
    const selectedType = TOEFL_QUESTION_TYPES[Math.floor(Math.random() * TOEFL_QUESTION_TYPES.length)];
    
    // 2. 시사(Current Affairs) 테마 처리: 최신 뉴스 로드
    let newsContext = "";
    if (topic === "Current Affairs" || topic === "시사" || topic === "Hot Topics") {
      try {
        const newsPath = path.join(process.cwd(), 'src', 'config', 'news_context.json');
        const newsData = JSON.parse(await fs.readFile(newsPath, 'utf8'));
        // 무작위 뉴스 하나 선택
        const selectedNews = newsData[Math.floor(Math.random() * newsData.length)];
        newsContext = `RECENT NEWS CONTEXT (from ${selectedNews.date}):\n${selectedNews.title}: ${selectedNews.content}`;
        topic = `Academic News: ${selectedNews.topic}`;
      } catch (e) {
        console.warn("[Background-Task] News context load failed, using general topic.");
      }
    }

    console.log(`[Background-Task] Generating new '${selectedType.name}' bite for ${topic}`);
    
    // 3. 가이드라인 및 규칙 로드
    const lengthGuideline = type === 'SHORT' 
      ? "PASSAGE LENGTH: Maximum 100 words."
      : "PASSAGE LENGTH: 150-200 words.";

    const writingRule = await mcpService.fetchNote("[토플 단일 문단 출제규칙]");
    const distractorRule = await mcpService.fetchNote("[유형별 오답 설계 공식]");
    const masterPromptPath = path.join(process.cwd(), '..', 'Toefl', '숏폼 토플 마스터 프롬프트.md');
    
    let masterPrompt = "";
    try { masterPrompt = await fs.readFile(masterPromptPath, 'utf8'); } catch (e) {
      masterPrompt = "Generate a TOEFL bite-sized question. JSON format.";
    }

    const langNames = { ko: "Korean", ja: "Japanese", "zh-TW": "Traditional Chinese (Taiwan)" };
    const targetLang = langNames[language] || "Korean";

    const premiumInstruction = mode === 'ai' 
      ? `### PREMIUM PREDICTION MODE:
- Focus on "2026 Academic Trends" and "Recent Scientific Discoveries".
- Create a "Killer Question" with higher difficulty.
- The tone should be slightly more advanced than standard TOEFL.`
      : "### STANDARD MODE: Verified exam-level difficulty.";

    const systemPrompt = `
${masterPrompt}
${premiumInstruction}
### NEWS CONTEXT: ${newsContext || "General academic knowledge"}
### TOEFL QUESTION TYPE: ${selectedType.name}
### DESCRIPTION: ${selectedType.desc}
### SPECIFIC RULE: ${selectedType.rule}
### FORMAT: ${lengthGuideline}
### RULES: ${writingRule}
### DISTRACTORS: ${distractorRule}

Respond in JSON ONLY. The 'explanation' field must be written in ${targetLang}. 
The JSON must include a "questionType" field matching EXACTLY one of the 8 types above.
If the news context is provided, you MUST base the passage and question on that news.
`;
    const userPrompt = `주제 '${topic}'에 기반하여 ${selectedType.name} 유형의 토플 문제 1세트를 생성해 줘.`;

    // 4. AI 호출
    const result = await llmService.generateFast(systemPrompt, userPrompt, "qwen-plus");
    if (!result) return null;

    // 5. DB 저장
    let savedId = 'gen-' + Date.now();
    
    // activeUserId가 없으면 'system' 대신 null을 사용 (UUID 타입 매칭을 위함)
    const dbUserId = (activeUserId && activeUserId !== 'system') ? activeUserId : null;

    const { data: newQuestion, error: saveError } = await supabase
      .from('BiteQuestion')
      .insert([{
        userId: dbUserId,
        topic: topic,
        type: type,
        content_json: JSON.stringify({ ...result, questionType: selectedType.name, isCurrentAffair: !!newsContext })
      }])
      .select()
      .single();

    if (saveError) console.error("[Background-Task] Save failed:", saveError.message);
    else {
      savedId = newQuestion.id;
      console.log(`[Background-Task] Successfully added new ${selectedType.name} to DB. (ID: ${savedId}${newsContext ? ", NEWS-based" : ""})`);
    }

    // 5. 단어장 자동 캐싱
    if (result.keyWords) {
      const dictionaryEntries = result.keyWords.map(kw => ({
        word: kw.word.toLowerCase().trim(),
        meaning: kw.meaning,
        example: `Context: ${result.passage.substring(0, 30)}...` 
      }));
      supabase.from('Dictionary').upsert(dictionaryEntries, { onConflict: 'word' }).then(() => {});
    }

    return { ...result, id: savedId, questionType: selectedType.name };

  } catch (error) {
    console.error("[Background-Task] ERROR:", error.message);
    return null;
  }
};

export const generateBite = async (req, res) => {
  try {
    const { topic = "General Science", userId, persona = 'tsun', type = 'FULL', language = 'ko', mode = 'db' } = req.body;
    const activeUserId = userId || req.headers['x-user-id'];
    
    // PREMIUM: If mode is 'ai', skip DB search and always generate synchronously
    if (mode === 'ai') {
      console.log(`[Premium-AI] Forcing real-time AI generation for premium topic: ${topic}`);
      const result = await generateAndSaveNewBite(topic, type, activeUserId, language, persona, mode);
      
      if (!result) throw new Error("AI Generation failed.");

      return res.json({
        success: true,
        data: { ...result, topic: topic },
        reused: false,
        credits_used: 5 
      });
    }

    // 0. 연속 카테고리 방지: 유저의 마지막으로 푼 문제 토픽 조회
    let lastSolvedTopic = null;
    try {
      const { data: lastResult } = await supabase
        .from('BiteResult')
        .select('questionId, question:BiteQuestion(topic)')
        .eq('userId', activeUserId)
        .order('solvedAt', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (lastResult?.question?.topic) {
        lastSolvedTopic = lastResult.question.topic;
        console.log(`[Anti-Repeat] Last solved topic: "${lastSolvedTopic}", will try to avoid.`);
      }
    } catch (e) {
      // 조회 실패해도 무시하고 진행
    }

    // 1. RPC를 통한 효율적인 DB 검색 (DB 레벨에서 안 푼 문제 중 랜덤 1개 추출)
    console.log(`[Standard-DB] Searching library via RPC for topic: ${topic}, userId: ${activeUserId}`);
    
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_random_unsolved_bite', {
      p_user_id: activeUserId,
      p_topic: topic,
      p_type: type
    });

    if (rpcError) {
      console.error("[RPC-Error] get_random_unsolved_bite failed:", rpcError.message);
    } else if (rpcData && rpcData.length > 0) {
      // 연속 카테고리 방지 필터: 같은 토픽이면 다른 후보 찾기
      let selected = rpcData[0];
      if (lastSolvedTopic && rpcData.length > 1 && selected.topic === lastSolvedTopic) {
        const altCandidate = rpcData.find(q => q.topic !== lastSolvedTopic);
        if (altCandidate) {
          selected = altCandidate;
          console.log(`[Anti-Repeat] Swapped to different topic: "${selected.topic}"`);
        }
      }
      console.log(`[DB-Hit] Serving ${selected.id} from library (RPC).`);

      return res.json({
        success: true,
        data: {
          ...JSON.parse(selected.content_json),
          id: selected.id,
          topic: selected.topic
        },
        reused: true,
        credits_used: 2 
      });
    }

    // [Fallback] RPC 결과가 없으면 전체 풀에서 랜덤하게 하나 선택 (중복 허용 가능성 있음)
    console.log(`[DB-Miss] No unsolved questions found via RPC. falling back to pool...`);
    const { data: fallbackPool } = await supabase.from('BiteQuestion').select('*').eq('type', type).limit(10);
    
    if (fallbackPool && fallbackPool.length > 0) {
      // 연속 카테고리 방지: 다른 토픽 우선 선택
      let candidates = fallbackPool;
      if (lastSolvedTopic) {
        const differentTopic = fallbackPool.filter(q => q.topic !== lastSolvedTopic);
        if (differentTopic.length > 0) candidates = differentTopic;
      }
      const selected = candidates[Math.floor(Math.random() * candidates.length)];
      return res.json({
        success: true,
        data: {
          ...JSON.parse(selected.content_json),
          id: selected.id,
          topic: selected.topic
        },
        reused: true,
        credits_used: 2
      });
    }

    // If DB is completely empty and we're in 'db' mode, we might still generate once to seed the pool
    console.log(`[DB-Miss] No questions in library. Seeding first question via AI...`);
    const result = await generateAndSaveNewBite(topic, type, activeUserId, language, persona, mode);

    if (!result) throw new Error("AI Generation failed and DB was empty.");

    res.json({
      success: true,
      data: { ...result, topic: topic },
      reused: false,
      credits_used: 2 
    });

  } catch (error) {
    console.error("Generate Bite Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveResult = async (req, res) => {
  try {
    const { userId, questionId, userAnswer, isCorrect, timeSpent = 0 } = req.body;
    
    if (!questionId || String(questionId).startsWith('mock-')) {
      console.log("[Save-Result] Skipping save for mock/invalid ID:", questionId);
      return res.json({ success: true, message: "Mock result skipped" });
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
    const { userId, persona = 'tsun', language = 'ko' } = req.body;
    
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
    
    const styles = {
      ko: {
        kind: "- 말투는 '친절하고 꼼꼼한 과외 선생님' 스타일 (상냥하게 격려)",
        tsun: "- 말투는 단호한 '팩폭' 스타일 (예리하게 단점 지적)",
        langName: "Korean"
      },
      ja: {
        kind: "- 口調は「親切で几帳面な家庭教師」のスタイル（優しく励ます）",
        tsun: "- 口調は断固とした「核心を突く」スタイル（鋭く欠点を指摘）",
        langName: "Japanese"
      },
      "zh-TW": {
        kind: "- 語氣是「親切細心的家教老師」風格（溫柔地鼓勵）",
        tsun: "- 語氣是果斷的「毒舌名師」風格（鋭利地指出缺點）",
        langName: "Traditional Chinese (Taiwan)"
      }
    };

    const targetStyle = styles[language] || styles.ko;
    const personaStyle = targetStyle[persona === 'kind' ? 'kind' : 'tsun'];

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
- MUST respond in ${targetStyle.langName}.
`;

    const userPrompt = `학생의 오답 이력:\n${historyText}\n\n위 데이터를 보고 이 학생의 약점이 무엇인지 짧고 굵게 분석해주세요. 반드시 ${targetStyle.langName}(으)로 답변해야 합니다.`;

    const summaryResult = await llmService.generateFast(systemPrompt, userPrompt, "qwen-flash");

    res.json({ success: true, summary: summaryResult });
  } catch (error) {
    console.error("Get Summary Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getRandomBites = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const limit = parseInt(req.query.limit || '5', 10);
    
    const { data: solvedResults, error: solvedError } = await supabase
      .from('BiteResult')
      .select('questionId')
      .eq('userId', userId);
      
    if (solvedError && solvedError.code !== 'PGRST116') {
      console.warn("Solved fetching error, proceeding anyway:", solvedError);
    }
    const solvedIds = (solvedResults || []).map(r => String(r.questionId));
    
    let query = supabase.from('BiteQuestion').select('*');
    
    // DB 수준에서 고도화된 필터링
    if (solvedIds.length > 0) {
      query = query.not('id', 'in', `(${solvedIds.join(',')})`);
    }
    
    const { data: unsolved, error } = await query.limit(limit * 2); // 랜덤 추출 보정을 위해 여유있게 가져옴
    if (error) throw error;
    
    // Fisher-Yates shuffle for true uniform randomness
    const shuffled = [...(unsolved || [])];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    const selected = shuffled.slice(0, limit);
    
    res.json({ success: true, data: selected });
  } catch (err) {
    console.error("Get Random Bites Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
