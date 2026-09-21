import axios from 'axios';
import { Platform } from 'react-native';
import useStore from '../store/useStore';

import { API_BASE_URL } from '../config/apiConfig';

const BASE_URL = API_BASE_URL;

const useUser = () => {
  const { userId, setCredits, setIsPremium, setIsAdmin } = useStore();

  const syncUser = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/user/sync`, {
        headers: { 'x-user-id': userId }
      });
      if (response.data.success) {
        setCredits(response.data.data.credits);
        setIsPremium(response.data.data.isPremium);
        setIsAdmin(response.data.data.isAdmin || false);
        return response.data.data;
      }
    } catch (error) {
      console.error('[SyncUser-Error] Actual Error:', error.response?.data || error.message);
      console.log('[Mock Mode] Continuing with default credits for stability');
      setCredits(100); 
    }
  };

  const rechargeCredits = async (amount, planId, receipt) => {
    try {
      const response = await axios.post(`${BASE_URL}/credits/recharge`, 
        { amount, planId, receipt, platform: Platform.OS },
        { headers: { 'x-user-id': userId } }
      );
      if (response.data.success) {
        setCredits(response.data.newBalance);
        return response.data;
      }
    } catch (error) {
      console.error('Recharge Credits Error:', error);
      throw error;
    }
  };

  const upgradePremium = async (planId, receipt) => {
    try {
      const response = await axios.post(`${BASE_URL}/credits/upgrade-premium`, 
        { planId, receipt, platform: Platform.OS },
        { headers: { 'x-user-id': userId } }
      );
      if (response.data.success) {
        setIsPremium(true);
        setCredits(response.data.data.newBalance);
        return response.data;
      }
    } catch (error) {
      console.error('Upgrade Premium Error:', error);
      throw error;
    }
  };

  const claimReward = async (amount = 5) => {
    try {
      const response = await axios.post(`${BASE_URL}/credits/reward`, 
        { amount },
        { headers: { 'x-user-id': userId } }
      );
      if (response.data.success) {
        setCredits(response.data.newBalance);
        return response.data;
      }
    } catch (error) {
      console.error('Claim Reward Error:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      console.log(`[useUser] Attempting to delete account for user: ${userId}`);
      console.log(`[useUser] Targeting URL: ${BASE_URL}/user/delete`);
      
      const response = await axios.post(`${BASE_URL}/user/delete`, 
        {}, 
        { 
          headers: { 'x-user-id': userId },
          timeout: 15000 // 15s timeout for deletion
        }
      );
      
      console.log('[useUser] Account deletion response:', response.data);
      return response.data.success;
    } catch (error) {
      console.error('[useUser] Delete Account Error:', error.response?.status, error.response?.data || error.message);
      throw error;
    }
  };

  return { syncUser, rechargeCredits, upgradePremium, claimReward, deleteAccount };
};

export default useUser;
