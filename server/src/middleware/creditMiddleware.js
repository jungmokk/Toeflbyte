import supabase from '../config/db.js';

/**
 * Middleware to check and deduct credits
 * @param {number} amount - Credits to deduct
 */
export const checkAndDeductCredits = (amount) => {
  return async (req, res, next) => {
    try {
      const userId = req.headers['x-user-id'];

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User ID is required in headers (x-user-id)' });
      }

      const { data: user, error: userError } = await supabase
        .from('User')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Check solved questions count for free trial
      const { count: userResultCount, error: countError } = await supabase
        .from('BiteResult')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId);

      if (countError) throw countError;

      // If user has solved less than 3 questions, it's free
      if (userResultCount < 3) {
        console.log(`[Free-Try] User ${userId} has solved ${userResultCount} questions. This turn is free.`);
        return next();
      }

      if (user.credit_balance < amount) {
        return res.status(402).json({ 
          success: false, 
          message: '크레딧이 부족합니다 (처음 3회 무료 체험 종료)', 
          current_balance: user.credit_balance,
          required: amount 
        });
      }

      // Deduct credits
      const { error: updateError } = await supabase
        .from('User')
        .update({ credit_balance: user.credit_balance - amount })
        .eq('id', userId);

      if (updateError) throw updateError;

      next();

    } catch (error) {
      console.error("Credit Middleware Error:", error);
      res.status(500).json({ success: false, error: 'Internal server error during credit check' });
    }
  };
};
