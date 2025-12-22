/**
 * Unified Coverage Data Module
 *
 * This module provides a centralized, maintainable architecture for managing
 * all coverage data including:
 * - Credit Cards (Chase, Amex, etc.)
 * - Protection Plans (AppleCare+, Amazon Protection, etc.)
 * - Uploaded Policies (Auto, Home/Renters insurance)
 *
 * Architecture:
 * - JSON data files for easy editing (future admin portal)
 * - Shared benefit templates to avoid duplication
 * - Unified query engine for cross-source queries
 * - Backward-compatible exports for existing code
 *
 * Usage:
 * ```typescript
 * import {
 *   getAllCreditCards,
 *   getCreditCardById,
 *   CoverageQueryEngine,
 *   createQueryEngine,
 * } from "@/data/coverage";
 *
 * // Get all cards
 * const cards = getAllCreditCards();
 *
 * // Query across all coverage sources
 * const engine = createQueryEngine(selectedCardIds, planIds, policies);
 * const rentalCoverage = engine.getSourcesForCategory("travel-rental");
 * const gaps = engine.getCoverageGaps();
 * const chatData = engine.formatForAssistant();
 * ```
 */

// =============================================================================
// SCHEMA & TYPES
// =============================================================================

export * from "./schema";

// =============================================================================
// CREDIT CARDS
// =============================================================================

export {
  // Data access
  creditCardsByIssuer,
  getAllCreditCards,
  getCreditCardById,
  getCreditCardsByIssuer,
  getCreditCardsForCategory,
  getCreditCardsByTier,
  getCreditCardsByNetwork,
  getCreditCardsWithPrimaryRental,
  // Metadata
  creditCardMetadata,
  // Conversion
  toCreditCardSource,
} from "./sources/credit-cards";

// =============================================================================
// PROTECTION PLANS
// =============================================================================

export {
  // Data access
  protectionPlansByProvider,
  getAllProtectionPlans,
  getProtectionPlanById,
  getProtectionPlansByProvider,
  getProtectionPlansForCategory,
  getProtectionPlansByType,
  // Legacy format
  getAllCommonPlans,
  getCommonPlanById,
  // Metadata & details
  protectionPlanMetadata,
  getPlanEligibleProducts,
  getPlanWithBenefitDetails,
} from "./sources/protection-plans";

// =============================================================================
// POLICY TEMPLATES
// =============================================================================

export {
  // Types
  type PolicyType,
  type PolicyTemplate,
  type FieldDefinition,
  type BenefitMapping,
  type DefaultBenefit,
  type ParsedPolicyData,
  // Template access
  policyTemplates,
  getPolicyTemplate,
  getAvailablePolicyTypes,
  getPolicyDisplayName,
  getPolicyCoveredCategories,
  // Policy creation
  createPolicySource,
  getPolicyDefaultBenefits,
  getPolicyBenefitMapping,
  getPolicyRequiredFields,
  getPolicyOptionalFields,
  getFieldDefinition,
  // Validation
  validateParsedPolicyData,
  policyHasCoverage,
  // Metadata
  policyTemplateMetadata,
} from "./sources/policy-templates";

// =============================================================================
// BENEFIT TEMPLATES
// =============================================================================

export {
  // Template types
  type TripProtectionTemplate,
  type BaggageProtectionTemplate,
  type RentalExclusionsTemplate,
  type EmergencyAssistanceTemplate,
  type TravelPerksTemplate,
  type PurchaseProtectionTemplate,
  type ExtendedWarrantyTemplate,
  type ReturnProtectionTemplate,
  type CellPhoneProtectionTemplate,
  type RoadsideAssistanceTemplate,
  // Template accessors
  tripProtectionTemplates,
  baggageProtectionTemplates,
  rentalExclusionsTemplates,
  emergencyAssistanceTemplates,
  travelPerksTemplates,
  purchaseProtectionTemplates,
  extendedWarrantyTemplates,
  returnProtectionTemplates,
  cellPhoneProtectionTemplates,
  roadsideAssistanceTemplates,
  // Getter functions
  getTripProtectionTemplate,
  getBaggageProtectionTemplate,
  getRentalExclusionsTemplate,
  getEmergencyAssistanceTemplate,
  getTravelPerksTemplate,
  getPurchaseProtectionTemplate,
  getExtendedWarrantyTemplate,
  getReturnProtectionTemplate,
  getCellPhoneProtectionTemplate,
  getRoadsideAssistanceTemplate,
  // Utilities
  getAvailableTemplateKeys,
  getTemplatesByIssuer,
  benefitTemplatesMetadata,
} from "./benefits";

// =============================================================================
// QUERY ENGINE
// =============================================================================

export {
  // Main query engine
  CoverageQueryEngine,
  createQueryEngine,
  // Constants
  ALL_CATEGORIES,
  // Convenience functions
  getAllAvailableCreditCards,
  getAllAvailableProtectionPlans,
  getLegacyCommonPlans,
  hasAnyPrimaryRentalCoverage,
} from "./queries/coverageQueries";

// =============================================================================
// BACKWARD COMPATIBILITY - Legacy exports matching cardDatabase.ts
// =============================================================================

import { getAllCreditCards, getCreditCardById, getCreditCardsForCategory } from "./sources/credit-cards";
import { getAllCommonPlans } from "./sources/protection-plans";
import type { CreditCard, CategoryId } from "@/types/coverage";

// Re-create the cardDatabase structure for backward compatibility
import chaseData from "./sources/credit-cards/chase.json";
import amexData from "./sources/credit-cards/amex.json";

/**
 * @deprecated Use getAllCreditCards() or getCreditCardsByIssuer() instead
 */
export const cardDatabase: Record<string, CreditCard[]> = {
  chase: getAllCreditCards().filter((card) => card.issuer === "Chase"),
  amex: getAllCreditCards().filter((card) => card.issuer === "American Express"),
};

/**
 * @deprecated Use getAllCreditCards() instead
 */
export function getAllCards(): CreditCard[] {
  return getAllCreditCards();
}

/**
 * @deprecated Use getCreditCardById() instead
 */
export function getCardById(id: string): CreditCard | undefined {
  return getCreditCardById(id);
}

/**
 * @deprecated Use CoverageQueryEngine.getCreditCardsForCategory() instead
 */
export function getCardsForCategory(
  categoryId: CategoryId,
  selectedCardIds: string[]
): CreditCard[] {
  return getAllCreditCards().filter(
    (card) =>
      selectedCardIds.includes(card.id) && card.categories.includes(categoryId)
  );
}

/**
 * @deprecated Use getAllCommonPlans() instead
 */
export const commonPlans = getAllCommonPlans();
