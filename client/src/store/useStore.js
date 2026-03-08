import { create } from 'zustand';

const useStore = create((set) => ({
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
  
  setCurrentBite: (bite) => set({ currentBite: bite }),
  setReused: (status) => set({ reused: status }),
  setPersona: (type) => set({ persona: type }),
  setTimerEnabled: (enabled) => set({ timerEnabled: enabled }),
  setIsPremium: (status) => set({ isPremium: status }),
  setIsAdmin: (status) => set({ isAdmin: status }),
  addToHistory: (entry) => set((state) => ({ history: [entry, ...state.history].slice(0, 50) })),
  
  // Reset for logout
  resetStore: () => set({
    credits: 0,
    userId: null,
    session: null,
    currentBite: null,
    history: [],
  })
}));

export default useStore;
