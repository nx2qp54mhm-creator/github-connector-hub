import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { Policy, CommonPlan, CategoryId } from "@/types/coverage";
import { getCardsForCategory, getCardById, commonPlans } from "@/data/cardDatabase";

// Custom storage that uses user-namespaced keys
const createUserStorage = (): StateStorage => {
  let currentUserId: string | null = null;

  const getStorageKey = () => {
    if (currentUserId) {
      return `covered-storage-${currentUserId}`;
    }
    return "covered-storage-temp"; // Temporary storage for unauthenticated state
  };

  return {
    getItem: (name: string): string | null => {
      // Use the user-specific key
      const key = getStorageKey();
      const value = localStorage.getItem(key);
      return value;
    },
    setItem: (name: string, value: string): void => {
      const key = getStorageKey();
      if (currentUserId) {
        localStorage.setItem(key, value);
      }
      // Don't persist to temp storage - only persist for authenticated users
    },
    removeItem: (name: string): void => {
      const key = getStorageKey();
      localStorage.removeItem(key);
    },
  };
};

// Singleton storage instance
const userStorage = createUserStorage();

// Function to update the current user ID in storage (called from useAuth)
let setStorageUserId: (userId: string | null) => void = () => {};

interface CoverageState {
  userId: string | null;
  selectedCards: string[];
  uploadedPolicies: Policy[];
  addedPlans: CommonPlan[];
  lastUpdated: string | null;

  // Actions
  initializeForUser: (userId: string) => void;
  toggleCard: (cardId: string) => void;
  addPolicy: (policy: Policy) => void;
  removePolicy: (policyId: string) => void;
  addPlan: (planId: string) => void;
  removePlan: (planId: string) => void;
  removeCard: (cardId: string) => void;
  clearStore: () => void;

  // Computed
  getSourcesForCategory: (categoryId: CategoryId) => { cards: ReturnType<typeof getCardById>[]; policies: Policy[]; plans: CommonPlan[] };
  getCoverageStatus: (categoryId: CategoryId) => "covered" | "partial" | "none";
  getTotalItems: () => number;
}

// Helper to load user data from localStorage
const loadUserData = (userId: string): Partial<CoverageState> => {
  try {
    const key = `covered-storage-${userId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state && parsed.state.userId === userId) {
        return parsed.state;
      }
    }
  } catch (e) {
    console.error("Error loading user data:", e);
  }
  return {
    userId,
    selectedCards: [],
    uploadedPolicies: [],
    addedPlans: [],
    lastUpdated: null,
  };
};

// Helper to save user data to localStorage
const saveUserData = (userId: string, state: Partial<CoverageState>) => {
  try {
    const key = `covered-storage-${userId}`;
    const data = {
      state: {
        userId: state.userId,
        selectedCards: state.selectedCards,
        uploadedPolicies: state.uploadedPolicies,
        addedPlans: state.addedPlans,
        lastUpdated: state.lastUpdated,
      },
      version: 0,
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving user data:", e);
  }
};

export const useCoverageStore = create<CoverageState>()(
  (set, get) => ({
    userId: null,
    selectedCards: [],
    uploadedPolicies: [],
    addedPlans: [],
    lastUpdated: null,

    initializeForUser: (userId: string) => {
      const currentState = get();

      // If same user, no need to reload
      if (currentState.userId === userId) {
        return;
      }

      // Save current user's data before switching (if there was a previous user)
      if (currentState.userId) {
        saveUserData(currentState.userId, currentState);
      }

      // Load the new user's data
      const userData = loadUserData(userId);
      set({
        userId: userData.userId ?? userId,
        selectedCards: userData.selectedCards ?? [],
        uploadedPolicies: userData.uploadedPolicies ?? [],
        addedPlans: userData.addedPlans ?? [],
        lastUpdated: userData.lastUpdated ?? null,
      });
    },

    toggleCard: (cardId: string) => {
      set((state) => {
        const index = state.selectedCards.indexOf(cardId);
        const newCards = index > -1
          ? state.selectedCards.filter(id => id !== cardId)
          : [...state.selectedCards, cardId];
        const newState = { selectedCards: newCards, lastUpdated: new Date().toISOString() };

        // Auto-save for authenticated users
        if (state.userId) {
          setTimeout(() => {
            const current = get();
            saveUserData(state.userId!, current);
          }, 0);
        }

        return newState;
      });
    },

    addPolicy: (policy: Policy) => {
      set((state) => {
        const newState = {
          uploadedPolicies: [...state.uploadedPolicies, policy],
          lastUpdated: new Date().toISOString(),
        };

        if (state.userId) {
          setTimeout(() => {
            const current = get();
            saveUserData(state.userId!, current);
          }, 0);
        }

        return newState;
      });
    },

    removePolicy: (policyId: string) => {
      set((state) => {
        const newState = {
          uploadedPolicies: state.uploadedPolicies.filter(p => p.id !== policyId),
          lastUpdated: new Date().toISOString(),
        };

        if (state.userId) {
          setTimeout(() => {
            const current = get();
            saveUserData(state.userId!, current);
          }, 0);
        }

        return newState;
      });
    },

    addPlan: (planId: string) => {
      const planInfo = commonPlans.find(p => p.id === planId);
      if (!planInfo) return;

      set((state) => {
        if (state.addedPlans.find(p => p.id === planId)) return state;
        const newState = {
          addedPlans: [...state.addedPlans, planInfo],
          lastUpdated: new Date().toISOString(),
        };

        if (state.userId) {
          setTimeout(() => {
            const current = get();
            saveUserData(state.userId!, current);
          }, 0);
        }

        return newState;
      });
    },

    removePlan: (planId: string) => {
      set((state) => {
        const newState = {
          addedPlans: state.addedPlans.filter(p => p.id !== planId),
          lastUpdated: new Date().toISOString(),
        };

        if (state.userId) {
          setTimeout(() => {
            const current = get();
            saveUserData(state.userId!, current);
          }, 0);
        }

        return newState;
      });
    },

    removeCard: (cardId: string) => {
      set((state) => {
        const newState = {
          selectedCards: state.selectedCards.filter(id => id !== cardId),
          lastUpdated: new Date().toISOString(),
        };

        if (state.userId) {
          setTimeout(() => {
            const current = get();
            saveUserData(state.userId!, current);
          }, 0);
        }

        return newState;
      });
    },

    clearStore: () => {
      const currentUserId = get().userId;

      // Clear the localStorage for this user if exists
      if (currentUserId) {
        localStorage.removeItem(`covered-storage-${currentUserId}`);
      }

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
  })
);

// Clean up old global storage key on module load
if (typeof window !== 'undefined') {
  // Remove the old non-namespaced storage to prevent data leakage
  localStorage.removeItem("covered-storage");
  localStorage.removeItem("covered-storage-temp");
}
