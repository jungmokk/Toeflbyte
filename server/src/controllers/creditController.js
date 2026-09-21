import googlePlayService from '../services/googlePlayService.js';
import appleStoreService from '../services/appleStoreService.js';
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
 * Recharge credits (Real Google Play Transaction)
 */
export const rechargeCredits = async (req, res) => {
  try {
    const { amount, planId, receipt, platform = 'android' } = req.body;
    const userId = req.headers['x-user-id'];

    if (!userId) return res.status(400).json({ success: false, error: "User ID required" });
    if (!receipt) return res.status(400).json({ success: false, error: "Purchase receipt required" });

    // 1. Verify with appropriate store
    let verification;
    if (platform === 'ios') {
      verification = await appleStoreService.verifyProduct(planId, receipt);
    } else {
      verification = await googlePlayService.verifyProduct(planId, receipt);
    }

    if (!verification.success) {
      return res.status(402).json({ success: false, error: "Payment verification failed", details: verification.error });
    }

    // 2. Get current balance
    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('credit_balance')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;

    const newBalance = user.credit_balance + amount;

    // 3. Update balance
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
      newBalance: updatedUser.credit_balance,
      mock: verification.mock || false
    });
  } catch (error) {
    console.error('[Recharge-Error]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Upgrade to Premium (Real Google Play Subscription)
 */
export const upgradePremium = async (req, res) => {
  try {
    const { planId, receipt, platform = 'android' } = req.body;
    const userId = req.headers['x-user-id'];
    
    if (!userId) return res.status(400).json({ success: false, error: "User ID required" });
    if (!receipt) return res.status(400).json({ success: false, error: "Subscription receipt required" });

    // 1. Verify with appropriate store
    let verification;
    if (platform === 'ios') {
      verification = await appleStoreService.verifySubscription(planId, receipt);
    } else {
      verification = await googlePlayService.verifySubscription(planId, receipt);
    }

    if (!verification.success) {
      return res.status(402).json({ success: false, error: "Subscription verification failed", details: verification.error });
    }

    // 2. Set expiry (default 1 month or 1 year)
    const expiresAt = new Date();
    if (planId === 'premium_yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // 3. Update User table
    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('credit_balance')
      .eq('id', userId)
      .single();
    
    if (fetchError) throw fetchError;

    const bonusCredits = planId === 'premium_yearly' ? 2000 : 500;

    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      .update({
        is_premium: true,
        premium_expires_at: expiresAt,
        credit_balance: user.credit_balance + bonusCredits
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
      },
      mock: verification.mock || false
    });
  } catch (error) {
    console.error('[UpgradePremium-Error]', error);
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

/**
 * Delete User Account and all associated data
 */
export const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(400).json({ success: false, error: "User ID required" });

    console.log(`[DeleteAccount] Deleting all data for user: ${userId}`);

    // 1. Transaction-related
    await supabase.from('InAppPurchase').delete().eq('userId', userId);
    await supabase.from('Subscription').delete().eq('userId', userId);
    
    // 2. Performance & Submissions
    await supabase.from('WritingSubmission').delete().eq('userId', userId);
    await supabase.from('SpeakingSubmission').delete().eq('userId', userId);
    await supabase.from('BiteResult').delete().eq('userId', userId);
    
    // 3. User Engagement
    await supabase.from('Attendance').delete().eq('userId', userId);
    await supabase.from('DailyUsage').delete().eq('userId', userId);
    await supabase.from('ShareLog').delete().eq('userId', userId);
    await supabase.from('ReferralUsage').delete().eq('referredUserId', userId); // FK is referredUserId
    await supabase.from('Referral').delete().eq('userId', userId);
    
    // 4. Learning Content
    await supabase.from('ChatHistory').delete().eq('userId', userId);
    await supabase.from('Vocabulary').delete().eq('userId', userId);
    await supabase.from('BiteQuestion').delete().eq('userId', userId);
    
    // 5. User (Final step)
    const { error: userDeleteError } = await supabase.from('User').delete().eq('id', userId);
    
    if (userDeleteError) {
      console.error('[DeleteAccount] User Table Error:', userDeleteError);
      throw userDeleteError;
    }

    res.json({ 
      success: true, 
      message: "모든 계정이 성공적으로 탈퇴 처리되었고, 연동된 데이터가 삭제되었습니다." 
    });
  } catch (error) {
    console.error('[DeleteAccount-Error]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
