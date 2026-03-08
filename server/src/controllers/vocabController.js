import supabase from '../config/db.js';

/**
 * Save a new word to user's vocabulary
 */
export const saveWord = async (req, res) => {
  try {
    const { word, meaning, context } = req.body;
    const userId = req.headers['x-user-id'];

    if (!userId) return res.status(400).json({ success: false, error: "User ID required" });

    // Check if word already exists for this user
    const { data: existing, error: checkError } = await supabase
      .from('Vocabulary')
      .select('id')
      .eq('userId', userId)
      .eq('word', word)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, message: "이미 저장된 단어입니다." });
    }

    const { data: newVocab, error: insertError } = await supabase
      .from('Vocabulary')
      .insert([{
        userId,
        word,
        meaning,
        context
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    res.json({ success: true, data: newVocab });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get all saved words for a user
 */
export const getVocabList = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(400).json({ success: false, error: "User ID required" });

    const { data: list, error } = await supabase
      .from('Vocabulary')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete a word from vocabulary
 */
export const deleteWord = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];

    // Verify ownership
    const { data: word, error: fetchError } = await supabase
      .from('Vocabulary')
      .select('userId')
      .eq('id', id)
      .single();
    
    if (fetchError || !word || word.userId !== userId) {
      return res.status(404).json({ success: false, error: "Word not found or unauthorized" });
    }

    const { error: deleteError } = await supabase
      .from('Vocabulary')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({ success: true, message: "단어가 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate a quick quiz from saved vocabulary (Placeholder for future feature)
 */
export const getVocabQuiz = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        
        const { data: words, error } = await supabase
            .from('Vocabulary')
            .select('*')
            .eq('userId', userId)
            .limit(10);

        if (error) throw error;

        if (words.length < 3) {
            return res.status(400).json({ success: false, error: "최소 3개 이상의 단어가 저장되어야 퀴즈를 생성할 수 있습니다." });
        }

        res.json({ success: true, data: words });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
