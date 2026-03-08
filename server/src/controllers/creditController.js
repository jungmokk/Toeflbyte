import supabase from '../config/db.js';

/**
 * Sync user data (credits, premium status)
 */
export const syncUser = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(400).json({ success: false, error: "User ID required" });

    let { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .single();
    
    // Create user if not exists (for first time login MVP)
    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert([{ id: userId, email: `${userId}@mock.com`, credit_balance: 50 }])
        .select()
        .single();
      
      if (createError) throw createError;
      user = newUser;
    }

    res.json({
      success: true,
      data: {
        credits: user.credit_balance,
        isPremium: user.is_premium,
        premiumExpiresAt: user.premium_expires_at,
        isAdmin: user.is_admin
      }
    });
  } catch (error) {
    console.error('[SyncUser-Error] Detailed Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Recharge credits (Simulated Payment)
 */
export const rechargeCredits = async (req, res) => {
  try {
    const { amount, planId } = req.body;
    const userId = req.headers['x-user-id'];

    if (!userId) return res.status(400).json({ success: false, error: "User ID required" });

    // Mock payment verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get current balance
    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('credit_balance')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;

    const newBalance = user.credit_balance + amount;

    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      .update({ credit_balance: newBalance })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: `${amount} credits recharged successfully!`,
      newBalance: updatedUser.credit_balance
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Upgrade to Premium (Simulated Payment)
 */
export const upgradePremium = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(400).json({ success: false, error: "User ID required" });

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

    // Get current balance to add bonus
    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('credit_balance')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;

    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      .update({
        is_premium: true,
        premium_expires_at: expiresAt,
        credit_balance: user.credit_balance + 500 // Bonus credits for premium
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: "Upgraded to Premium!",
      data: {
        isPremium: updatedUser.is_premium,
        expiresAt: updatedUser.premium_expires_at,
        newBalance: updatedUser.credit_balance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Reward Credits (e.g., from Ad Views)
 */
export const rewardCredits = async (req, res) => {
  try {
    const { amount = 5, reason = 'ad_reward' } = req.body;
    const userId = req.headers['x-user-id'];

    if (!userId) return res.status(400).json({ success: false, error: "User ID required" });

    // Get current balance
    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('credit_balance')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;

    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      .update({
        credit_balance: user.credit_balance + amount
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: `Rewarded ${amount} credits for ${reason}!`,
      newBalance: updatedUser.credit_balance
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
