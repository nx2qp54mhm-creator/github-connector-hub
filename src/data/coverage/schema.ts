/**
 * Unified Coverage Data Architecture
 *
 * This schema provides a consistent interface for all coverage sources:
 * - Credit Cards (Chase, Amex, etc.)
 * - Protection Plans (AppleCare+, Amazon Protection, etc.)
 * - Uploaded Policies (Auto, Home/Renters insurance)
 *
 * Designed for:
 * - Easy querying across all coverage types
 * - JSON-based data files for non-dev editing
 * - Future admin portal integration
 */

import { CategoryId } from "@/types/coverage";

// =============================================================================
// CORE TYPES
// =============================================================================

export type CoverageSourceType = "credit-card" | "protection-plan" | "policy";
export type CoverageLevel = "full" | "partial" | "limited" | "none";
export type CardNetwork = "Visa" | "Mastercard" | "American Express" | "Discover";
export type CardTier = "premium" | "mid-tier" | "basic";
export type PlanCostType = "monthly" | "yearly" | "one-time" | "variable";
export type RentalCoverageType = "primary" | "secondary";

// =============================================================================
// COVERAGE LIMITS
// =============================================================================

export interface CoverageLimits {
  maxPerClaim?: number;
  maxPerYear?: number;
  maxCoverage?: number;
  deductible?: number;
  coveragePeriodDays?: number;
  maxDays?: number;
  maxClaims?: number;
  thresholdHours?: number;
  extensionYears?: number;
  [key: string]: number | string | undefined;
}

// =============================================================================
// BENEFIT DETAILS
// =============================================================================

export interface BenefitDetails {
  categoryId: CategoryId;
  coverageLevel: CoverageLevel;
  limits: CoverageLimits;
  covered: string[];
  notCovered: string[];
  conditions?: string[];
  claimProcess?: string;
  importantNotes?: string[];
}

// Rental-specific benefit details
export interface RentalBenefitDetails extends BenefitDetails {
  coverageType: RentalCoverageType;
  vehicleExclusions: string[];
  countryExclusions: string[];
  countryNotes?: string;
  activationSteps?: string[];
}

// Trip protection specific
export interface TripBenefitDetails extends BenefitDetails {
  cancellationCoverage: number;
  interruptionCoverage: number;
  delayCoverage: number;
  delayThresholdHours: number;
  coveredReasons: string[];
  exclusions: string[];
}

// Baggage protection specific
export interface BaggageBenefitDetails extends BenefitDetails {
  delayCoverage: number;
  delayThresholdHours: number;
  lostBaggageCoverage: number;
}

// Purchase protection specific
export interface PurchaseBenefitDetails extends BenefitDetails {
  maxPerClaim: number;
  maxPerYear: number;
  coveragePeriodDays: number;
}

// Extended warranty specific
export interface WarrantyBenefitDetails extends BenefitDetails {
  extensionYears: number;
  maxOriginalWarrantyYears: number;
  maxPerClaim: number;
}

// Travel perks specific
export interface TravelPerksBenefitDetails extends BenefitDetails {
  loungeAccess: string[];
  travelCredits: Array<{ amount: number; description: string }>;
  otherPerks: string[];
}

// Cell phone protection specific
export interface PhoneBenefitDetails extends BenefitDetails {
  maxPerClaim: number;
  maxClaimsPerYear: number;
  deductible: number;
  requirements: string[];
}

// Roadside assistance specific
export interface RoadsideBenefitDetails extends BenefitDetails {
  provider: string;
  towingMiles: number;
  services: string[];
  limitations: string[];
}

// Emergency assistance specific
export interface EmergencyBenefitDetails extends BenefitDetails {
  evacuationCoverage: number;
  medicalCoverage?: number;
  services: string[];
}

// Return protection specific
export interface ReturnBenefitDetails extends BenefitDetails {
  maxPerItem: number;
  maxPerYear: number;
  returnWindowDays: number;
}

// =============================================================================
// BASE COVERAGE SOURCE
// =============================================================================

export interface CoverageSourceBase {
  id: string;
  type: CoverageSourceType;
  name: string;
  fullName: string;
  provider: string;
  categories: CategoryId[];
  benefits: Partial<Record<CategoryId, BenefitDetails>>;
  metadata: CoverageSourceMetadata;
}

export interface CoverageSourceMetadata {
  lastUpdated: string;
  version: string;
  sourceUrl?: string;
  notes?: string;
}

// =============================================================================
// CREDIT CARD SOURCE
// =============================================================================

export interface CreditCardSource extends CoverageSourceBase {
  type: "credit-card";
  network: CardNetwork;
  annualFee: number;
  tier: CardTier;

  // Card-specific benefit overrides with full details
  rental?: RentalBenefitDetails;
  tripProtection?: TripBenefitDetails;
  baggageProtection?: BaggageBenefitDetails;
  purchaseProtection?: PurchaseBenefitDetails;
  extendedWarranty?: WarrantyBenefitDetails;
  travelPerks?: TravelPerksBenefitDetails;
  cellPhoneProtection?: PhoneBenefitDetails;
  roadsideAssistance?: RoadsideBenefitDetails;
  emergencyAssistance?: EmergencyBenefitDetails;
  returnProtection?: ReturnBenefitDetails;
}

// =============================================================================
// PROTECTION PLAN SOURCE
// =============================================================================

export interface PlanCost {
  type: PlanCostType;
  amount?: number;
  note?: string;
}

export interface ProtectionPlanSource extends CoverageSourceBase {
  type: "protection-plan";
  planType: "device" | "purchase" | "subscription" | "service";
  cost: PlanCost;
  eligibleProducts?: string[];
  purchaseRequirements?: string[];
}

// =============================================================================
// POLICY SOURCE (Uploaded by user)
// =============================================================================

export interface PolicySource extends CoverageSourceBase {
  type: "policy";
  policyType: "auto" | "home" | "renters" | "umbrella" | "other";
  policyNumber?: string;
  carrier?: string;
  effectiveDate?: string;
  expirationDate?: string;
  uploadedAt: string;
  documentId?: string;
  parsedFrom: "document" | "manual" | "api";

  // Auto-specific fields
  vehicles?: VehicleInfo[];
  drivers?: DriverInfo[];

  // Home-specific fields
  propertyAddress?: string;
  dwellingCoverage?: number;
  personalPropertyCoverage?: number;
}

export interface VehicleInfo {
  year: number;
  make: string;
  model: string;
  vin?: string;
}

export interface DriverInfo {
  name: string;
  relation: string;
}

// =============================================================================
// UNION TYPE FOR ALL SOURCES
// =============================================================================

export type CoverageSource = CreditCardSource | ProtectionPlanSource | PolicySource;

// =============================================================================
// JSON FILE SCHEMAS (for loading from JSON files)
// =============================================================================

export interface CreditCardDataFile {
  provider: string;
  sourceType: "credit-card";
  metadata: CoverageSourceMetadata;
  benefitTemplates?: Record<string, string>; // Map to benefit template IDs
  cards: CreditCardJSON[];
}

export interface CreditCardJSON {
  id: string;
  name: string;
  fullName: string;
  network: CardNetwork;
  annualFee: number;
  tier: CardTier;
  categories: CategoryId[];
  benefits: CardBenefitsJSON;
}

export interface CardBenefitsJSON {
  rental?: RentalBenefitJSON;
  tripProtection?: string | TripProtectionJSON;
  baggageProtection?: string | BaggageProtectionJSON;
  purchaseProtection?: string | PurchaseProtectionJSON;
  extendedWarranty?: string | ExtendedWarrantyJSON;
  travelPerks?: TravelPerksJSON;
  cellPhoneProtection?: CellPhoneProtectionJSON;
  roadsideAssistance?: string | RoadsideAssistanceJSON;
  emergencyAssistance?: string | EmergencyAssistanceJSON;
  returnProtection?: string | ReturnProtectionJSON;
}

export interface RentalBenefitJSON {
  coverageType: RentalCoverageType;
  maxCoverage: number;
  maxDays: number;
  exclusionsTemplate: string;
}

export interface TripProtectionJSON {
  cancellationCoverage: number;
  interruptionCoverage: number;
  delayCoverage: number;
  delayThresholdHours: number;
  coveredReasons: string[];
  exclusions: string[];
}

export interface BaggageProtectionJSON {
  delayCoverage: number;
  delayThresholdHours: number;
  lostBaggageCoverage: number;
  coverageDetails: string[];
  exclusions: string[];
}

export interface PurchaseProtectionJSON {
  maxPerClaim: number;
  maxPerYear: number;
  coveragePeriodDays: number;
  covered: string[];
  notCovered: string[];
}

export interface ExtendedWarrantyJSON {
  extensionYears: number;
  maxOriginalWarrantyYears: number;
  maxPerClaim: number;
  coverageDetails: string[];
  exclusions: string[];
}

export interface TravelPerksJSON {
  loungeAccess: string[];
  travelCredits: Array<{ amount: number; description: string }>;
  otherPerks: string[];
}

export interface CellPhoneProtectionJSON {
  maxPerClaim: number;
  maxClaimsPerYear: number;
  deductible: number;
  coverageDetails: string[];
  requirements: string[];
  exclusions: string[];
}

export interface RoadsideAssistanceJSON {
  provider: string;
  towingMiles: number;
  services: string[];
  coverageDetails: string[];
  limitations: string[];
}

export interface EmergencyAssistanceJSON {
  evacuationCoverage: number;
  medicalCoverage?: number;
  services: string[];
  coverageDetails: string[];
  exclusions: string[];
}

export interface ReturnProtectionJSON {
  maxPerItem: number;
  maxPerYear: number;
  returnWindowDays: number;
  coverageDetails: string[];
  exclusions: string[];
}

// =============================================================================
// PROTECTION PLAN JSON SCHEMA
// =============================================================================

export interface ProtectionPlanDataFile {
  provider: string;
  sourceType: "protection-plan";
  metadata: CoverageSourceMetadata;
  plans: ProtectionPlanJSON[];
}

export interface ProtectionPlanJSON {
  id: string;
  name: string;
  fullName: string;
  planType: "device" | "purchase" | "subscription" | "service";
  cost: PlanCost;
  categories: CategoryId[];
  eligibleProducts?: string[];
  purchaseRequirements?: string[];
  benefits: {
    [key in CategoryId]?: {
      coverageLevel: CoverageLevel;
      limits: CoverageLimits;
      covered: string[];
      notCovered: string[];
      conditions?: string[];
    };
  };
}

// =============================================================================
// POLICY TEMPLATE JSON SCHEMA (for parsing uploaded policies)
// =============================================================================

export interface PolicyTemplateDataFile {
  policyType: "auto" | "home" | "renters" | "umbrella";
  sourceType: "policy";
  metadata: CoverageSourceMetadata;
  categories: CategoryId[];
  extractionSchema: {
    required: string[];
    optional: string[];
  };
  benefitMapping: Record<CategoryId, PolicyBenefitMapping>;
  defaultBenefits: Record<CategoryId, Partial<BenefitDetails>>;
}

export interface PolicyBenefitMapping {
  fields: string[];
  condition?: string;
  template?: string;
}

// =============================================================================
// BENEFIT TEMPLATE FILES
// =============================================================================

export interface BenefitTemplateFile {
  templateType: string;
  metadata: CoverageSourceMetadata;
  templates: Record<string, BenefitTemplateDefinition>;
}

export interface BenefitTemplateDefinition {
  id: string;
  name: string;
  tier: "premium" | "standard" | "basic";
  issuer?: string;
  [key: string]: unknown;
}

// =============================================================================
// AGGREGATED COVERAGE (for queries and chat)
// =============================================================================

export interface AggregatedCoverage {
  categories: Record<CategoryId, CategoryCoverageInfo>;
  sources: CoverageSource[];
  gaps: CategoryId[];
  totalAnnualCost: number;
}

export interface CategoryCoverageInfo {
  categoryId: CategoryId;
  coverageLevel: CoverageLevel;
  sources: CoverageSource[];
  bestSource?: CoverageSource;
  limits: CoverageLimits;
  highlights: string[];
  warnings: string[];
}

// =============================================================================
// COMPARISON TYPES
// =============================================================================

export interface ComparisonMatrix {
  categories: CategoryId[];
  sources: CoverageSource[];
  matrix: Record<string, Record<CategoryId, ComparisonCell>>;
}

export interface ComparisonCell {
  hasCategory: boolean;
  coverageLevel: CoverageLevel;
  keyLimit?: number;
  highlights?: string[];
}

// =============================================================================
// API FORMAT (for chat assistant)
// =============================================================================

export interface CoverageDataForAPI {
  creditCards: CreditCardForAPI[];
  protectionPlans: ProtectionPlanForAPI[];
  policies: PolicyForAPI[];
  summary: CoverageSummaryForAPI;
}

export interface CreditCardForAPI {
  cardName: string;
  issuer: string;
  annualFee: number;
  categories: CategoryId[];
  rental?: {
    coverageType: RentalCoverageType;
    maxCoverage: number;
    maxDays: number;
    whatsCovered: string[];
    whatsNotCovered: string[];
    vehicleExclusions: string[];
    countryExclusions: string[];
  };
  tripProtection?: {
    cancellationCoverage: number;
    interruptionCoverage: number;
    delayCoverage: number;
    delayThresholdHours: number;
    coveredReasons: string[];
    exclusions: string[];
  };
  baggageProtection?: {
    delayCoverage: number;
    delayThresholdHours: number;
    lostBaggageCoverage: number;
    coverageDetails: string[];
    exclusions: string[];
  };
  purchaseProtection?: {
    maxPerClaim: number;
    maxPerYear: number;
    coveragePeriodDays: number;
    whatsCovered: string[];
    whatsNotCovered: string[];
  };
  extendedWarranty?: {
    extensionYears: number;
    maxOriginalWarrantyYears: number;
    maxPerClaim: number;
    coverageDetails: string[];
    exclusions: string[];
  };
  travelPerks?: {
    loungeAccess: string[];
    travelCredits: Array<{ amount: number; description: string }>;
    otherPerks: string[];
  };
  cellPhoneProtection?: {
    maxPerClaim: number;
    maxClaimsPerYear: number;
    deductible: number;
    coverageDetails: string[];
    requirements: string[];
    exclusions: string[];
  };
  roadsideAssistance?: {
    provider: string;
    towingMiles: number;
    services: string[];
    coverageDetails: string[];
    limitations: string[];
  };
  emergencyAssistance?: {
    evacuationCoverage: number;
    medicalCoverage?: number;
    services: string[];
    coverageDetails: string[];
    exclusions: string[];
  };
  returnProtection?: {
    maxPerItem: number;
    maxPerYear: number;
    returnWindowDays: number;
    coverageDetails: string[];
    exclusions: string[];
  };
}

export interface ProtectionPlanForAPI {
  planName: string;
  provider: string;
  planType: string;
  categories: CategoryId[];
  coverageDetails: string[];
  exclusions: string[];
  cost?: string;
}

export interface PolicyForAPI {
  policyType: string;
  carrier: string;
  categories: CategoryId[];
  coverages: Record<string, {
    limit?: number;
    deductible?: number;
    details: string[];
  }>;
}

export interface CoverageSummaryForAPI {
  totalSources: number;
  categoriesCovered: CategoryId[];
  categoriesNotCovered: CategoryId[];
  totalAnnualCost: number;
}
