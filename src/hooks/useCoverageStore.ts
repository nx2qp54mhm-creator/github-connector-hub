import { create } from "zustand";
import { Policy, CommonPlan, CategoryId } from "@/types/coverage";
import { getCardsForCategory, getCardById, commonPlans } from "@/data/cardDatabase";

interface CoverageState {
  userId: string | null;
  selectedCards: string[];
  uploadedPolicies: Policy[];
  addedPlans: CommonPlan[];
  lastUpdated: string | null;

  // Actions
  setUserId: (userId: string | null) => void;
  toggleCard: (cardId: string) => void;
  addPolicy: (policy: Policy) => void;
  removePolicy: (policyId: string) => void;
  addPlan: (planId: string) => void;
  removePlan: (planId: string) => void;
  removeCard: (cardId: string) => void;
  clearUserData: () => void;
  loadUserData: () => void;

  // Computed
  getSourcesForCategory: (categoryId: CategoryId) => { cards: ReturnType<typeof getCardById>[]; policies: Policy[]; plans: CommonPlan[] };
  getCoverageStatus: (categoryId: CategoryId) => "covered" | "partial" | "none";
  getTotalItems: () => number;
}

// Helper to save state to localStorage
const saveToLocalStorage = (state: Partial<CoverageState>) => {
  const userId = localStorage.getItem('current_user_id');
  if (!userId) return;

  const key = `covered-storage-${userId}`;
  const dataToSave = {
    selectedCards: state.selectedCards || [],
    uploadedPolicies: state.uploadedPolicies || [],
    addedPlans: state.addedPlans || [],
    lastUpdated: state.lastUpdated || null,
  };
  localStorage.setItem(key, JSON.stringify(dataToSave));
};

// Helper to load state from localStorage
const loadFromLocalStorage = (): Partial<CoverageState> => {
  const userId = localStorage.getItem('current_user_id');
  if (!userId) {
    return {
      selectedCards: [],
      uploadedPolicies: [],
      addedPlans: [],
      lastUpdated: null,
    };
  }

  const key = `covered-storage-${userId}`;
  const stored = localStorage.getItem(key);

  if (!stored) {
    return {
      selectedCards: [],
      uploadedPolicies: [],
      addedPlans: [],
      lastUpdated: null,
    };
  }

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load coverage data:', e);
    return {
      selectedCards: [],
      uploadedPolicies: [],
      addedPlans: [],
      lastUpdated: null,
    };
  }
};

export const useCoverageStore = create<CoverageState>()((set, get) => ({
  userId: null,
  selectedCards: [],
  uploadedPolicies: [],
  addedPlans: [],
  lastUpdated: null,

  setUserId: (userId: string | null) => {
    set({ userId });
  },

  loadUserData: () => {
    const data = loadFromLocalStorage();
    set({
      selectedCards: data.selectedCards || [],
      uploadedPolicies: data.uploadedPolicies || [],
      addedPlans: data.addedPlans || [],
      lastUpdated: data.lastUpdated || null,
    });
  },

  toggleCard: (cardId: string) => {
    const state = get();
    const index = state.selectedCards.indexOf(cardId);
    const newCards = index > -1
      ? state.selectedCards.filter(id => id !== cardId)
      : [...state.selectedCards, cardId];

    const newState = {
      selectedCards: newCards,
      lastUpdated: new Date().toISOString()
    };
    set(newState);
    saveToLocalStorage({ ...state, ...newState });
  },

  addPolicy: (policy: Policy) => {
    const state = get();
    const newState = {
      uploadedPolicies: [...state.uploadedPolicies, policy],
      lastUpdated: new Date().toISOString(),
    };
    set(newState);
    saveToLocalStorage({ ...state, ...newState });
  },

  removePolicy: (policyId: string) => {
    const state = get();
    const newState = {
      uploadedPolicies: state.uploadedPolicies.filter(p => p.id !== policyId),
      lastUpdated: new Date().toISOString(),
    };
    set(newState);
    saveToLocalStorage({ ...state, ...newState });
  },

  addPlan: (planId: string) => {
    const planInfo = commonPlans.find(p => p.id === planId);
    if (!planInfo) return;

    const state = get();
    if (state.addedPlans.find(p => p.id === planId)) return;

    const newState = {
      addedPlans: [...state.addedPlans, planInfo],
      lastUpdated: new Date().toISOString(),
    };
    set(newState);
    saveToLocalStorage({ ...state, ...newState });
  },

  removePlan: (planId: string) => {
    const state = get();
    const newState = {
      addedPlans: state.addedPlans.filter(p => p.id !== planId),
      lastUpdated: new Date().toISOString(),
    };
    set(newState);
    saveToLocalStorage({ ...state, ...newState });
  },

  removeCard: (cardId: string) => {
    const state = get();
    const newState = {
      selectedCards: state.selectedCards.filter(id => id !== cardId),
      lastUpdated: new Date().toISOString(),
    };
    set(newState);
    saveToLocalStorage({ ...state, ...newState });
  },

  clearUserData: () => {
    set({
      userId: null,
      selectedCards: [],
      uploadedPolicies: [],
      addedPlans: [],
      lastUpdated: null,
    });
  },

  getSourcesForCategory: (categoryId: CategoryId) => {
    const state = get();
    const cards = getCardsForCategory(categoryId, state.selectedCards)
      .map(card => card);
    const policies = state.uploadedPolicies.filter(p => p.categories.includes(categoryId));
    const plans = state.addedPlans.filter(p => p.categories.includes(categoryId));
    return { cards, policies, plans };
  },

  getCoverageStatus: (categoryId: CategoryId) => {
    const { cards, policies, plans } = get().getSourcesForCategory(categoryId);
    const total = cards.length + policies.length + plans.length;
    if (total === 0) return "none";
    if (total === 1) return "partial";
    return "covered";
  },

  getTotalItems: () => {
    const state = get();
    return state.selectedCards.length + state.uploadedPolicies.length + state.addedPlans.length;
  },
}));
