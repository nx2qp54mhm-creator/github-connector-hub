/**
 * Unified Coverage Query Engine
 *
 * Provides a powerful query interface across all coverage sources:
 * - Credit Cards
 * - Protection Plans
 * - Uploaded Policies
 *
 * Designed for:
 * - Easy filtering and searching
 * - Aggregating coverage across sources
 * - Finding gaps in coverage
 * - Formatting data for the chat assistant
 */

import type { CreditCard, CategoryId, CommonPlan, Policy } from "@/types/coverage";
import type {
  CoverageSource,
  CreditCardSource,
  ProtectionPlanSource,
  PolicySource,
  CoverageLevel,
  AggregatedCoverage,
  CategoryCoverageInfo,
  ComparisonMatrix,
  ComparisonCell,
  CoverageDataForAPI,
  CreditCardForAPI,
  ProtectionPlanForAPI,
  PolicyForAPI,
} from "../schema";

import {
  getAllCreditCards,
  getCreditCardById,
  getCreditCardsForCategory,
  getCreditCardsWithPrimaryRental,
} from "../sources/credit-cards";

import {
  getAllProtectionPlans,
  getProtectionPlanById,
  getProtectionPlansForCategory,
  getAllCommonPlans,
  getCommonPlanById,
  getPlanWithBenefitDetails,
} from "../sources/protection-plans";

import {
  getPolicyDefaultBenefits,
  getPolicyCoveredCategories,
} from "../sources/policy-templates";

// =============================================================================
// ALL CATEGORIES
// =============================================================================

export const ALL_CATEGORIES: CategoryId[] = [
  "travel-rental",
  "travel-trip",
  "travel-baggage",
  "travel-perks",
  "travel-emergency",
  "purchase-protection",
  "purchase-warranty",
  "purchase-return",
  "purchase-price",
  "phone-protection",
  "roadside-assistance",
  "foundational-auto",
  "foundational-home",
];

// =============================================================================
// COVERAGE QUERY ENGINE CLASS
// =============================================================================

export class CoverageQueryEngine {
  private creditCards: CreditCard[];
  private protectionPlans: ProtectionPlanSource[];
  private policies: Policy[];

  constructor(
    selectedCardIds: string[] = [],
    selectedPlanIds: string[] = [],
    uploadedPolicies: Policy[] = []
  ) {
    // Load selected credit cards
    this.creditCards = selectedCardIds
      .map((id) => getCreditCardById(id))
      .filter((card): card is CreditCard => card !== undefined);

    // Load selected protection plans
    this.protectionPlans = selectedPlanIds
      .map((id) => getProtectionPlanById(id))
      .filter((plan): plan is ProtectionPlanSource => plan !== undefined);

    // Store uploaded policies
    this.policies = uploadedPolicies;
  }

  // ===========================================================================
  // FILTERING METHODS
  // ===========================================================================

  /**
   * Get all selected credit cards
   */
  getCreditCards(): CreditCard[] {
    return this.creditCards;
  }

  /**
   * Get all selected protection plans
   */
  getProtectionPlans(): ProtectionPlanSource[] {
    return this.protectionPlans;
  }

  /**
   * Get all uploaded policies
   */
  getPolicies(): Policy[] {
    return this.policies;
  }

  /**
   * Get credit cards that cover a specific category
   */
  getCreditCardsForCategory(categoryId: CategoryId): CreditCard[] {
    return this.creditCards.filter((card) =>
      card.categories.includes(categoryId)
    );
  }

  /**
   * Get protection plans that cover a specific category
   */
  getPlansForCategory(categoryId: CategoryId): ProtectionPlanSource[] {
    return this.protectionPlans.filter((plan) =>
      plan.categories.includes(categoryId)
    );
  }

  /**
   * Get policies that cover a specific category
   */
  getPoliciesForCategory(categoryId: CategoryId): Policy[] {
    // Check policy type to determine covered categories
    return this.policies.filter((policy) => {
      const coveredCategories = getPolicyCoveredCategories(
        policy.type as "auto" | "home" | "renters" | "umbrella"
      );
      return coveredCategories.includes(categoryId);
    });
  }

  /**
   * Get all sources that cover a specific category
   */
  getSourcesForCategory(categoryId: CategoryId): {
    cards: CreditCard[];
    plans: ProtectionPlanSource[];
    policies: Policy[];
  } {
    return {
      cards: this.getCreditCardsForCategory(categoryId),
      plans: this.getPlansForCategory(categoryId),
      policies: this.getPoliciesForCategory(categoryId),
    };
  }

  /**
   * Get credit cards with primary rental coverage
   */
  getCardsWithPrimaryRental(): CreditCard[] {
    return this.creditCards.filter(
      (card) => card.rental?.coverageType === "primary"
    );
  }

  /**
   * Get credit cards by issuer
   */
  getCardsByIssuer(issuer: "Chase" | "American Express"): CreditCard[] {
    return this.creditCards.filter((card) => card.issuer === issuer);
  }

  // ===========================================================================
  // AGGREGATION METHODS
  // ===========================================================================

  /**
   * Get aggregated coverage across all sources
   */
  getAggregatedCoverage(): AggregatedCoverage {
    const categories: Record<CategoryId, CategoryCoverageInfo> = {} as Record<
      CategoryId,
      CategoryCoverageInfo
    >;

    const gaps: CategoryId[] = [];

    for (const categoryId of ALL_CATEGORIES) {
      const sources = this.getSourcesForCategory(categoryId);
      const totalSources =
        sources.cards.length + sources.plans.length + sources.policies.length;

      if (totalSources === 0) {
        gaps.push(categoryId);
        continue;
      }

      // Determine coverage level
      let coverageLevel: CoverageLevel = "none";
      if (totalSources > 0) {
        coverageLevel = totalSources >= 2 ? "full" : "partial";
      }

      // Find best source for this category (simplified logic)
      const bestCard = sources.cards[0];

      categories[categoryId] = {
        categoryId,
        coverageLevel,
        sources: [], // Would need to convert to CoverageSource type
        bestSource: undefined,
        limits: {},
        highlights: this.getCategoryHighlights(categoryId, sources),
        warnings: this.getCategoryWarnings(categoryId, sources),
      };
    }

    // Calculate total annual cost
    const cardsCost = this.creditCards.reduce(
      (sum, card) => sum + card.annualFee,
      0
    );
    const plansCost = this.protectionPlans.reduce((sum, plan) => {
      if (plan.cost.type === "yearly" && plan.cost.amount) {
        return sum + plan.cost.amount;
      }
      if (plan.cost.type === "monthly" && plan.cost.amount) {
        return sum + plan.cost.amount * 12;
      }
      return sum;
    }, 0);

    return {
      categories,
      sources: [], // Would include all converted sources
      gaps,
      totalAnnualCost: cardsCost + plansCost,
    };
  }

  /**
   * Get categories that are not covered by any source
   */
  getCoverageGaps(): CategoryId[] {
    return ALL_CATEGORIES.filter((categoryId) => {
      const sources = this.getSourcesForCategory(categoryId);
      return (
        sources.cards.length === 0 &&
        sources.plans.length === 0 &&
        sources.policies.length === 0
      );
    });
  }

  /**
   * Get coverage status for a category
   */
  getCoverageStatus(
    categoryId: CategoryId
  ): "covered" | "partial" | "none" {
    const sources = this.getSourcesForCategory(categoryId);
    const totalSources =
      sources.cards.length + sources.plans.length + sources.policies.length;

    if (totalSources === 0) return "none";
    if (totalSources >= 2) return "covered";
    return "partial";
  }

  // ===========================================================================
  // COMPARISON METHODS
  // ===========================================================================

  /**
   * Compare coverage across sources for specific categories
   */
  compareCards(
    cardIds: string[],
    categories?: CategoryId[]
  ): ComparisonMatrix {
    const cards = cardIds
      .map((id) => getCreditCardById(id))
      .filter((card): card is CreditCard => card !== undefined);

    const categoriesToCompare = categories || ALL_CATEGORIES;

    const matrix: Record<string, Record<CategoryId, ComparisonCell>> = {};

    for (const card of cards) {
      matrix[card.id] = {} as Record<CategoryId, ComparisonCell>;

      for (const categoryId of categoriesToCompare) {
        const hasCategory = card.categories.includes(categoryId);

        matrix[card.id][categoryId] = {
          hasCategory,
          coverageLevel: hasCategory ? "full" : "none",
          keyLimit: this.getKeyLimitForCategory(card, categoryId),
          highlights: hasCategory
            ? this.getCardCategoryHighlights(card, categoryId)
            : undefined,
        };
      }
    }

    return {
      categories: categoriesToCompare,
      sources: [], // Would convert cards to CoverageSource
      matrix,
    };
  }

  /**
   * Find the best card for a specific category
   */
  getBestCardForCategory(categoryId: CategoryId): CreditCard | undefined {
    const cards = this.getCreditCardsForCategory(categoryId);
    if (cards.length === 0) return undefined;

    // Simple logic: prefer primary coverage, then highest limits
    if (categoryId === "travel-rental") {
      const primaryCards = cards.filter(
        (c) => c.rental?.coverageType === "primary"
      );
      if (primaryCards.length > 0) {
        return primaryCards.reduce((best, card) =>
          (card.rental?.maxCoverage || 0) > (best.rental?.maxCoverage || 0)
            ? card
            : best
        );
      }
    }

    // Default: return first card (could be enhanced with more sophisticated logic)
    return cards[0];
  }

  // ===========================================================================
  // CHAT ASSISTANT FORMATTING
  // ===========================================================================

  /**
   * Format all coverage data for the chat assistant API
   */
  formatForAssistant(): CoverageDataForAPI {
    return {
      creditCards: this.formatCreditCardsForAPI(),
      protectionPlans: this.formatPlansForAPI(),
      policies: this.formatPoliciesForAPI(),
      summary: this.getCoverageSummary(),
    };
  }

  private formatCreditCardsForAPI(): CreditCardForAPI[] {
    return this.creditCards.map((card) => {
      const formatted: CreditCardForAPI = {
        cardName: card.fullName || card.name,
        issuer: card.issuer,
        annualFee: card.annualFee,
        categories: card.categories,
      };

      // Add rental coverage if present
      if (card.rental) {
        formatted.rental = {
          coverageType: card.rental.coverageType,
          maxCoverage: card.rental.maxCoverage,
          maxDays: card.rental.maxDays,
          whatsCovered: card.rentalExclusions?.what_is_covered || [],
          whatsNotCovered: card.rentalExclusions?.what_is_not_covered || [],
          vehicleExclusions: card.rentalExclusions?.vehicle_exclusions || [],
          countryExclusions: card.rentalExclusions?.country_exclusions || [],
        };
      }

      // Add trip protection if present
      if (card.tripProtection) {
        formatted.tripProtection = {
          cancellationCoverage: card.tripProtection.cancellation_coverage,
          interruptionCoverage: card.tripProtection.interruption_coverage,
          delayCoverage: card.tripProtection.delay_coverage,
          delayThresholdHours: card.tripProtection.delay_threshold_hours,
          coveredReasons: card.tripProtection.covered_reasons,
          exclusions: card.tripProtection.exclusions,
        };
      }

      // Add baggage protection if present
      if (card.baggageProtection) {
        formatted.baggageProtection = {
          delayCoverage: card.baggageProtection.delay_coverage,
          delayThresholdHours: card.baggageProtection.delay_threshold_hours,
          lostBaggageCoverage: card.baggageProtection.lost_baggage_coverage,
          coverageDetails: card.baggageProtection.coverage_details,
          exclusions: card.baggageProtection.exclusions,
        };
      }

      // Add purchase protection if present
      if (card.purchaseProtection) {
        formatted.purchaseProtection = {
          maxPerClaim: card.purchaseProtection.max_per_claim,
          maxPerYear: card.purchaseProtection.max_per_year,
          coveragePeriodDays: card.purchaseProtection.coverage_period_days,
          whatsCovered: card.purchaseProtection.what_is_covered,
          whatsNotCovered: card.purchaseProtection.what_is_not_covered,
        };
      }

      // Add extended warranty if present
      if (card.extendedWarranty) {
        formatted.extendedWarranty = {
          extensionYears: card.extendedWarranty.extension_years,
          maxOriginalWarrantyYears:
            card.extendedWarranty.max_original_warranty_years,
          maxPerClaim: card.extendedWarranty.max_per_claim,
          coverageDetails: card.extendedWarranty.coverage_details,
          exclusions: card.extendedWarranty.exclusions,
        };
      }

      // Add travel perks if present
      if (card.travelPerks) {
        formatted.travelPerks = {
          loungeAccess: card.travelPerks.lounge_access,
          travelCredits: card.travelPerks.travel_credits,
          otherPerks: card.travelPerks.other_perks,
        };
      }

      // Add cell phone protection if present
      if (card.cellPhoneProtection) {
        formatted.cellPhoneProtection = {
          maxPerClaim: card.cellPhoneProtection.max_per_claim,
          maxClaimsPerYear: card.cellPhoneProtection.max_claims_per_year,
          deductible: card.cellPhoneProtection.deductible,
          coverageDetails: card.cellPhoneProtection.coverage_details,
          requirements: card.cellPhoneProtection.requirements,
          exclusions: card.cellPhoneProtection.exclusions,
        };
      }

      // Add roadside assistance if present
      if (card.roadsideAssistance) {
        formatted.roadsideAssistance = {
          provider: card.roadsideAssistance.provider,
          towingMiles: card.roadsideAssistance.towing_miles,
          services: card.roadsideAssistance.services,
          coverageDetails: card.roadsideAssistance.coverage_details,
          limitations: card.roadsideAssistance.limitations,
        };
      }

      // Add emergency assistance if present
      if (card.emergencyAssistance) {
        formatted.emergencyAssistance = {
          evacuationCoverage: card.emergencyAssistance.evacuation_coverage,
          medicalCoverage: card.emergencyAssistance.medical_coverage,
          services: card.emergencyAssistance.services,
          coverageDetails: card.emergencyAssistance.coverage_details,
          exclusions: card.emergencyAssistance.exclusions,
        };
      }

      // Add return protection if present
      if (card.returnProtection) {
        formatted.returnProtection = {
          maxPerItem: card.returnProtection.max_per_item,
          maxPerYear: card.returnProtection.max_per_year,
          returnWindowDays: card.returnProtection.return_window_days,
          coverageDetails: card.returnProtection.coverage_details,
          exclusions: card.returnProtection.exclusions,
        };
      }

      return formatted;
    });
  }

  private formatPlansForAPI(): ProtectionPlanForAPI[] {
    return this.protectionPlans.map((plan) => {
      const planDetails = getPlanWithBenefitDetails(plan.id);
      const primaryCategory = plan.categories[0];
      const benefitDetails = planDetails?.benefits?.[primaryCategory];

      return {
        planName: plan.fullName || plan.name,
        provider: plan.provider,
        planType: plan.planType,
        categories: plan.categories,
        coverageDetails: benefitDetails?.covered || [],
        exclusions: benefitDetails?.notCovered || [],
        cost: plan.cost.note || `${plan.cost.type}: $${plan.cost.amount || "varies"}`,
      };
    });
  }

  private formatPoliciesForAPI(): PolicyForAPI[] {
    return this.policies.map((policy) => {
      const categories = getPolicyCoveredCategories(
        policy.type as "auto" | "home" | "renters" | "umbrella"
      );

      const coverages: Record<
        string,
        { limit?: number; deductible?: number; details: string[] }
      > = {};

      // Map auto policy coverages to standard format
      if (policy.autoCoverage) {
        if (policy.autoCoverage.bodily_injury_per_accident) {
          coverages["liability"] = {
            limit: policy.autoCoverage.bodily_injury_per_accident,
            details: [
              `Bodily Injury: $${policy.autoCoverage.bodily_injury_per_person?.toLocaleString()}/$${policy.autoCoverage.bodily_injury_per_accident?.toLocaleString()}`,
              `Property Damage: $${policy.autoCoverage.property_damage?.toLocaleString()}`,
            ],
          };
        }

        if (policy.autoCoverage.collision_covered) {
          coverages["collision"] = {
            deductible: policy.autoCoverage.collision_deductible,
            details: [`Deductible: $${policy.autoCoverage.collision_deductible}`],
          };
        }

        if (policy.autoCoverage.comprehensive_covered) {
          coverages["comprehensive"] = {
            deductible: policy.autoCoverage.comprehensive_deductible,
            details: [
              `Deductible: $${policy.autoCoverage.comprehensive_deductible}`,
            ],
          };
        }
      }

      return {
        policyType: policy.type,
        carrier: policy.autoCoverage?.insurer || policy.homeCoverage?.insurer || policy.rentersCoverage?.insurer || "Unknown Carrier",
        categories,
        coverages,
      };
    });
  }

  private getCoverageSummary() {
    const categoriesCovered = ALL_CATEGORIES.filter(
      (cat) => this.getCoverageStatus(cat) !== "none"
    );
    const categoriesNotCovered = this.getCoverageGaps();

    const cardsCost = this.creditCards.reduce(
      (sum, card) => sum + card.annualFee,
      0
    );

    return {
      totalSources:
        this.creditCards.length +
        this.protectionPlans.length +
        this.policies.length,
      categoriesCovered,
      categoriesNotCovered,
      totalAnnualCost: cardsCost,
    };
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  private getCategoryHighlights(
    categoryId: CategoryId,
    sources: { cards: CreditCard[]; plans: ProtectionPlanSource[]; policies: Policy[] }
  ): string[] {
    const highlights: string[] = [];

    if (categoryId === "travel-rental") {
      const primaryCards = sources.cards.filter(
        (c) => c.rental?.coverageType === "primary"
      );
      if (primaryCards.length > 0) {
        highlights.push(
          `${primaryCards.length} card(s) with primary rental coverage`
        );
      }
    }

    return highlights;
  }

  private getCategoryWarnings(
    categoryId: CategoryId,
    sources: { cards: CreditCard[]; plans: ProtectionPlanSource[]; policies: Policy[] }
  ): string[] {
    const warnings: string[] = [];

    if (categoryId === "travel-rental") {
      const hasOnlySecondary =
        sources.cards.length > 0 &&
        sources.cards.every((c) => c.rental?.coverageType === "secondary");
      if (hasOnlySecondary) {
        warnings.push(
          "All cards have secondary coverage - your personal auto insurance applies first"
        );
      }
    }

    return warnings;
  }

  private getKeyLimitForCategory(
    card: CreditCard,
    categoryId: CategoryId
  ): number | undefined {
    switch (categoryId) {
      case "travel-rental":
        return card.rental?.maxCoverage;
      case "travel-trip":
        return card.tripProtection?.cancellation_coverage;
      case "travel-baggage":
        return card.baggageProtection?.lost_baggage_coverage;
      case "purchase-protection":
        return card.purchaseProtection?.max_per_claim;
      case "travel-emergency":
        return card.emergencyAssistance?.evacuation_coverage;
      default:
        return undefined;
    }
  }

  private getCardCategoryHighlights(
    card: CreditCard,
    categoryId: CategoryId
  ): string[] {
    const highlights: string[] = [];

    switch (categoryId) {
      case "travel-rental":
        if (card.rental) {
          highlights.push(
            `${card.rental.coverageType} coverage up to $${card.rental.maxCoverage.toLocaleString()}`
          );
          highlights.push(`Maximum ${card.rental.maxDays} days`);
        }
        break;
      case "travel-trip":
        if (card.tripProtection) {
          highlights.push(
            `Up to $${card.tripProtection.cancellation_coverage.toLocaleString()} cancellation`
          );
        }
        break;
      case "travel-perks":
        if (card.travelPerks?.lounge_access?.length) {
          highlights.push(
            `${card.travelPerks.lounge_access.length} lounge networks`
          );
        }
        break;
    }

    return highlights;
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Create a query engine from store state
 */
export function createQueryEngine(
  selectedCardIds: string[],
  addedPlanIds: string[],
  uploadedPolicies: Policy[]
): CoverageQueryEngine {
  return new CoverageQueryEngine(selectedCardIds, addedPlanIds, uploadedPolicies);
}

/**
 * Get all available credit cards (not filtered by selection)
 */
export function getAllAvailableCreditCards(): CreditCard[] {
  return getAllCreditCards();
}

/**
 * Get all available protection plans (not filtered by selection)
 */
export function getAllAvailableProtectionPlans(): ProtectionPlanSource[] {
  return getAllProtectionPlans();
}

/**
 * Get all common plans in legacy format
 */
export function getLegacyCommonPlans(): CommonPlan[] {
  return getAllCommonPlans();
}

/**
 * Quick check if any card has primary rental coverage
 */
export function hasAnyPrimaryRentalCoverage(cardIds: string[]): boolean {
  const cards = cardIds
    .map((id) => getCreditCardById(id))
    .filter((card): card is CreditCard => card !== undefined);

  return cards.some((card) => card.rental?.coverageType === "primary");
}
