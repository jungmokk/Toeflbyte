import llmService from '../services/llmService.js';
import supabase from '../config/db.js';

export const defineWord = async (req, res) => {
  try {
    const { word, context, language = 'ko' } = req.body;

    if (!word) {
      return res.status(400).json({ success: false, error: "Word is required" });
    }

    // 1. Check DB Cache first with safe error handling
    const cleanWord = word.toLowerCase().trim();
    let cachedWord = null;
    
    try {
      const { data, error: dbError } = await supabase
        .from('Dictionary')
        .select('*')
        .eq('word', cleanWord)
        .single();
        
      if (!dbError && data) {
        cachedWord = data;
        console.log(`[Cache-Hit] Word: ${cleanWord}`);
        return res.json(cachedWord);
      }
    } catch (e) {
      // If table doesn't exist or query fails, just log and continue to AI
      console.warn(`[Cache-Skip] Dictionary table issue: ${e.message}`);
    }

    // 2. Call AI if not in cache
    console.log(`[Cache-Miss] Calling AI for: ${cleanWord}`);
    const result = await llmService.defineWord(cleanWord, context, language);

    // 3. Save to DB for future use (Background task)
    if (result && result.meaning) {
      supabase.from('Dictionary').insert([{
        word: cleanWord,
        meaning: result.meaning,
        example: result.example
      }]).then(({ error }) => {
        if (error) console.error("[DB-Save-Error] Dictionary:", error.message);
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Define Word Error:", error);
    res.status(500).json({ 
      meaning: "의미를 가져오는 중 오류가 발생했습니다.", 
      example: "" 
    });
  }
};
