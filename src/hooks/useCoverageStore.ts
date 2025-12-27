import { create } from "zustand";
import { Policy, CommonPlan, CategoryId } from "@/types/coverage";
import { getCardsForCategory, getCardById, commonPlans } from "@/data/cardDatabase";

// Storage version - increment this to force clearing old data formats
const STORAGE_VERSION = 2;

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
      // Verify version matches and userId matches
      if (parsed.version === STORAGE_VERSION && parsed.state && parsed.state.userId === userId) {
        return parsed.state;
      } else {
        // Version mismatch or userId mismatch - clear this corrupted/old data
        console.log(`Clearing outdated storage for user ${userId} (version: ${parsed.version}, expected: ${STORAGE_VERSION})`);
        localStorage.removeItem(key);
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
      version: STORAGE_VERSION,
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

// Clean up old/legacy storage keys on module load
if (typeof window !== 'undefined') {
  // Remove old non-namespaced storage keys to prevent data leakage
  const legacyKeys = [
    "covered-storage",
    "covered-storage-temp",
    "coverage-storage",  // Possible old key variant
  ];

  legacyKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`Removing legacy storage key: ${key}`);
      localStorage.removeItem(key);
    }
  });

  // Also check for any user-specific keys with old version format and clean them
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.startsWith("covered-storage-") && key !== "covered-storage-temp") {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.version !== STORAGE_VERSION) {
            console.log(`Removing outdated versioned storage: ${key} (version ${parsed.version})`);
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        // If we can't parse it, it's corrupted - remove it
        console.log(`Removing corrupted storage: ${key}`);
        localStorage.removeItem(key);
      }
    }
  });
}
