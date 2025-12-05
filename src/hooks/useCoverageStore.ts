import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Policy, CommonPlan, CategoryId } from "@/types/coverage";
import { getCardsForCategory, getCardById, commonPlans } from "@/data/cardDatabase";

interface CoverageState {
  selectedCards: string[];
  uploadedPolicies: Policy[];
  addedPlans: CommonPlan[];
  lastUpdated: string | null;

  // Actions
  toggleCard: (cardId: string) => void;
  addPolicy: (policy: Policy) => void;
  removePolicy: (policyId: string) => void;
  addPlan: (planId: string) => void;
  removePlan: (planId: string) => void;
  removeCard: (cardId: string) => void;

  // Computed
  getSourcesForCategory: (categoryId: CategoryId) => { cards: ReturnType<typeof getCardById>[]; policies: Policy[]; plans: CommonPlan[] };
  getCoverageStatus: (categoryId: CategoryId) => "covered" | "partial" | "none";
  getTotalItems: () => number;
}

export const useCoverageStore = create<CoverageState>()(
  persist(
    (set, get) => ({
      selectedCards: [],
      uploadedPolicies: [],
      addedPlans: [],
      lastUpdated: null,

      toggleCard: (cardId: string) => {
        set((state) => {
          const index = state.selectedCards.indexOf(cardId);
          const newCards = index > -1
            ? state.selectedCards.filter(id => id !== cardId)
            : [...state.selectedCards, cardId];
          return { selectedCards: newCards, lastUpdated: new Date().toISOString() };
        });
      },

      addPolicy: (policy: Policy) => {
        set((state) => ({
          uploadedPolicies: [...state.uploadedPolicies, policy],
          lastUpdated: new Date().toISOString(),
        }));
      },

      removePolicy: (policyId: string) => {
        set((state) => ({
          uploadedPolicies: state.uploadedPolicies.filter(p => p.id !== policyId),
          lastUpdated: new Date().toISOString(),
        }));
      },

      addPlan: (planId: string) => {
        const planInfo = commonPlans.find(p => p.id === planId);
        if (!planInfo) return;

        set((state) => {
          if (state.addedPlans.find(p => p.id === planId)) return state;
          return {
            addedPlans: [...state.addedPlans, planInfo],
            lastUpdated: new Date().toISOString(),
          };
        });
      },

      removePlan: (planId: string) => {
        set((state) => ({
          addedPlans: state.addedPlans.filter(p => p.id !== planId),
          lastUpdated: new Date().toISOString(),
        }));
      },

      removeCard: (cardId: string) => {
        set((state) => ({
          selectedCards: state.selectedCards.filter(id => id !== cardId),
          lastUpdated: new Date().toISOString(),
        }));
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
    }),
    {
      name: "covered-storage",
    }
  )
);
