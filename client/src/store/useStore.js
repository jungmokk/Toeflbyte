import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useStore = create(
  persist(
    (set) => ({
      credits: 50,
      userId: null,
      session: null,
      
      setCredits: (amount) => set({ credits: amount }),
      deductCredits: (amount) => set((state) => ({ credits: Math.max(0, state.credits - amount) })),
      
      // User/Session State
      setUserId: (id) => set({ userId: id }),
      setSession: (session) => set({ session: session }),
      
      // Test/Session State
      currentBite: null,
      reused: false,
      history: [], 
      
      // App Settings
      persona: 'tsun',
      timerEnabled: true,
      isPremium: false,
      isAdmin: false,
      hasCompletedOnboarding: false,
      
      setHasCompletedOnboarding: (status) => set({ hasCompletedOnboarding: status }),
      
      setCurrentBite: (bite) => set({ currentBite: bite }),
      setReused: (status) => set({ reused: status }),
      setPersona: (type) => set({ persona: type }),
      setTimerEnabled: (enabled) => set({ timerEnabled: enabled }),
      setIsPremium: (status) => set({ isPremium: status }),
      setIsAdmin: (status) => set({ isAdmin: status }),
      addToHistory: (entry) => set((state) => ({ history: [entry, ...state.history].slice(0, 50) })),
      
      // Reset for logout
      resetStore: () => set({
        credits: 50, // Reset to 50 for new users or fresh state
        userId: null,
        session: null,
        currentBite: null,
        history: [],
      })
    }),
    {
      name: 'toefl-byte-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        credits: state.credits,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        persona: state.persona,
        timerEnabled: state.timerEnabled,
        isPremium: state.isPremium,
        history: state.history,
      }),
    }
  )
);

export default useStore;
