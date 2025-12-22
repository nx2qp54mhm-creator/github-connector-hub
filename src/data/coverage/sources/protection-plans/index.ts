/**
 * Protection Plans Source Loader
 *
 * Loads protection plan data from JSON files (AppleCare+, Amazon Protection, etc.)
 */

import type { CommonPlan, CategoryId } from "@/types/coverage";
import type { ProtectionPlanSource, PlanCost, CoverageLevel } from "../../schema";

import appleData from "./apple.json";
import amazonData from "./amazon.json";
import carriersData from "./carriers.json";

// =============================================================================
// TYPES FOR JSON DATA
// =============================================================================

interface PlanDataFile {
  provider: string;
  sourceType: string;
  metadata: {
    lastUpdated: string;
    version: string;
    sourceUrl?: string;
    notes?: string;
  };
  plans: PlanJSON[];
}

interface PlanJSON {
  id: string;
  name: string;
  fullName: string;
  planType: string;
  cost: {
    type: string;
    amount?: number;
    note?: string;
  };
  categories: string[];
  eligibleProducts?: string[];
  purchaseRequirements?: string[];
  benefits: Record<
    string,
    {
      coverageLevel: string;
      limits: Record<string, unknown>;
      covered: string[];
      notCovered: string[];
      conditions?: string[];
    }
  >;
}

// =============================================================================
// PLAN HYDRATION - Convert JSON to usable objects
// =============================================================================

function hydratePlan(planJson: PlanJSON, provider: string): ProtectionPlanSource {
  return {
    id: planJson.id,
    type: "protection-plan",
    name: planJson.name,
    fullName: planJson.fullName,
    provider: provider,
    categories: planJson.categories as CategoryId[],
    benefits: {},
    metadata: {
      lastUpdated: new Date().toISOString().split("T")[0],
      version: "1.0.0",
    },
    planType: planJson.planType as "device" | "purchase" | "subscription" | "service",
    cost: planJson.cost as PlanCost,
    eligibleProducts: planJson.eligibleProducts,
    purchaseRequirements: planJson.purchaseRequirements,
  };
}

/**
 * Convert JSON plan to legacy CommonPlan format for backward compatibility
 */
function toCommonPlan(planJson: PlanJSON): CommonPlan {
  // Get the primary benefit category's details
  const primaryCategory = planJson.categories[0] as CategoryId;
  const benefitDetails = planJson.benefits[primaryCategory];

  return {
    id: planJson.id,
    name: planJson.name,
    categories: planJson.categories as CategoryId[],
    description: `${planJson.fullName} - ${planJson.cost.note || ""}`.trim(),
    coverage_details: benefitDetails?.covered || [],
    exclusions: benefitDetails?.notCovered || [],
  };
}

// =============================================================================
// LOAD ALL PLANS
// =============================================================================

function loadPlansFromFile(dataFile: PlanDataFile): ProtectionPlanSource[] {
  return dataFile.plans.map((planJson) =>
    hydratePlan(planJson, dataFile.provider)
  );
}

function loadCommonPlansFromFile(dataFile: PlanDataFile): CommonPlan[] {
  return dataFile.plans.map(toCommonPlan);
}

// Load all plans as ProtectionPlanSource
const applePlans = loadPlansFromFile(appleData as PlanDataFile);
const amazonPlans = loadPlansFromFile(amazonData as PlanDataFile);
const carrierPlans = loadPlansFromFile(carriersData as PlanDataFile);

// Load all plans as CommonPlan (legacy format)
const appleCommonPlans = loadCommonPlansFromFile(appleData as PlanDataFile);
const amazonCommonPlans = loadCommonPlansFromFile(amazonData as PlanDataFile);
const carrierCommonPlans = loadCommonPlansFromFile(carriersData as PlanDataFile);

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * All protection plans organized by provider
 */
export const protectionPlansByProvider: Record<string, ProtectionPlanSource[]> = {
  apple: applePlans,
  amazon: amazonPlans,
  carriers: carrierPlans,
};

/**
 * Get all protection plans as a flat array
 */
export function getAllProtectionPlans(): ProtectionPlanSource[] {
  return [...applePlans, ...amazonPlans, ...carrierPlans];
}

/**
 * Get a protection plan by ID
 */
export function getProtectionPlanById(id: string): ProtectionPlanSource | undefined {
  return getAllProtectionPlans().find((plan) => plan.id === id);
}

/**
 * Get protection plans by provider
 */
export function getProtectionPlansByProvider(
  provider: "apple" | "amazon" | "carriers"
): ProtectionPlanSource[] {
  return protectionPlansByProvider[provider] || [];
}

/**
 * Get protection plans that cover a specific category
 */
export function getProtectionPlansForCategory(
  categoryId: CategoryId
): ProtectionPlanSource[] {
  return getAllProtectionPlans().filter((plan) =>
    plan.categories.includes(categoryId)
  );
}

/**
 * Get protection plans by type
 */
export function getProtectionPlansByType(
  planType: "device" | "purchase" | "subscription" | "service"
): ProtectionPlanSource[] {
  return getAllProtectionPlans().filter((plan) => plan.planType === planType);
}

/**
 * Get all plans in legacy CommonPlan format
 */
export function getAllCommonPlans(): CommonPlan[] {
  return [...appleCommonPlans, ...amazonCommonPlans, ...carrierCommonPlans];
}

/**
 * Get a common plan by ID (legacy format)
 */
export function getCommonPlanById(id: string): CommonPlan | undefined {
  return getAllCommonPlans().find((plan) => plan.id === id);
}

/**
 * Get metadata for all plan data files
 */
export const protectionPlanMetadata = {
  apple: (appleData as PlanDataFile).metadata,
  amazon: (amazonData as PlanDataFile).metadata,
  carriers: (carriersData as PlanDataFile).metadata,
};

/**
 * Get eligible products for a plan
 */
export function getPlanEligibleProducts(planId: string): string[] {
  const allPlans = [
    ...(appleData as PlanDataFile).plans,
    ...(amazonData as PlanDataFile).plans,
    ...(carriersData as PlanDataFile).plans,
  ];
  const plan = allPlans.find((p) => p.id === planId);
  return plan?.eligibleProducts || [];
}

/**
 * Get raw plan data including all benefit details
 */
export function getPlanWithBenefitDetails(planId: string): PlanJSON | undefined {
  const allPlans = [
    ...(appleData as PlanDataFile).plans,
    ...(amazonData as PlanDataFile).plans,
    ...(carriersData as PlanDataFile).plans,
  ];
  return allPlans.find((p) => p.id === planId);
}
