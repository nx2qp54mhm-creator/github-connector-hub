/**
 * Policy Templates Loader
 *
 * Provides templates for parsing and mapping uploaded insurance policies.
 * These templates define:
 * - What fields to extract from policy documents
 * - How to map extracted data to our unified coverage schema
 * - Default benefits when specific details aren't available
 */

import type { CategoryId } from "@/types/coverage";
import type { PolicySource, CoverageLevel } from "../../schema";

import autoInsuranceTemplate from "./auto-insurance.json";
import homeInsuranceTemplate from "./home-insurance.json";

// =============================================================================
// TYPES FOR POLICY TEMPLATES
// =============================================================================

export type PolicyType = "auto" | "home" | "renters" | "umbrella";

export interface PolicyTemplate {
  policyType: PolicyType;
  sourceType: string;
  metadata: {
    lastUpdated: string;
    version: string;
    notes?: string;
  };
  categories: CategoryId[];
  displayName: string;
  description: string;
  extractionSchema: {
    required: string[];
    optional: string[];
    identifiers: string[];
  };
  fieldDefinitions: Record<string, FieldDefinition>;
  benefitMapping: Record<CategoryId, BenefitMapping>;
  defaultBenefits: Record<CategoryId, DefaultBenefit>;
}

export interface FieldDefinition {
  displayName: string;
  description: string;
  subFields?: Record<string, SubFieldDefinition>;
  commonFormats?: string[];
}

export interface SubFieldDefinition {
  type: "currency" | "number" | "string" | "percentage" | "array";
  description?: string;
  options?: string[];
}

export interface BenefitMapping {
  fields: string[];
  condition?: string;
  coverageLevel: CoverageLevel;
  defaultCovered: string[];
  defaultNotCovered: string[];
}

export interface DefaultBenefit {
  coverageLevel: CoverageLevel;
  covered: string[];
  notCovered: string[];
  conditions?: string[];
}

// =============================================================================
// TEMPLATE ACCESSORS
// =============================================================================

export const policyTemplates: Record<PolicyType, PolicyTemplate> = {
  auto: autoInsuranceTemplate as unknown as PolicyTemplate,
  home: homeInsuranceTemplate as unknown as PolicyTemplate,
  renters: homeInsuranceTemplate as unknown as PolicyTemplate, // Renters uses same template structure
  umbrella: autoInsuranceTemplate as unknown as PolicyTemplate, // Placeholder - could be expanded
};

/**
 * Get a policy template by type
 */
export function getPolicyTemplate(policyType: PolicyType): PolicyTemplate {
  return policyTemplates[policyType];
}

/**
 * Get all available policy types
 */
export function getAvailablePolicyTypes(): PolicyType[] {
  return Object.keys(policyTemplates) as PolicyType[];
}

/**
 * Get the display name for a policy type
 */
export function getPolicyDisplayName(policyType: PolicyType): string {
  return policyTemplates[policyType]?.displayName || policyType;
}

/**
 * Get categories covered by a policy type
 */
export function getPolicyCoveredCategories(policyType: PolicyType): CategoryId[] {
  return policyTemplates[policyType]?.categories || [];
}

// =============================================================================
// POLICY CREATION HELPERS
// =============================================================================

export interface ParsedPolicyData {
  policyNumber?: string;
  carrier?: string;
  effectiveDate?: string;
  expirationDate?: string;
  namedInsured?: string;
  coverages: Record<string, unknown>;
}

/**
 * Create a PolicySource from parsed policy data
 */
export function createPolicySource(
  policyType: PolicyType,
  parsedData: ParsedPolicyData,
  documentId?: string
): PolicySource {
  const template = getPolicyTemplate(policyType);

  return {
    id: `policy_${policyType}_${Date.now()}`,
    type: "policy",
    name: template.displayName,
    fullName: `${parsedData.carrier || "Unknown Carrier"} ${template.displayName}`,
    provider: parsedData.carrier || "Unknown Carrier",
    categories: template.categories,
    benefits: {},
    metadata: {
      lastUpdated: new Date().toISOString().split("T")[0],
      version: "1.0.0",
    },
    policyType: policyType,
    policyNumber: parsedData.policyNumber,
    carrier: parsedData.carrier,
    effectiveDate: parsedData.effectiveDate,
    expirationDate: parsedData.expirationDate,
    uploadedAt: new Date().toISOString(),
    documentId: documentId,
    parsedFrom: documentId ? "document" : "manual",
  };
}

/**
 * Get default benefits for a policy type and category
 */
export function getPolicyDefaultBenefits(
  policyType: PolicyType,
  categoryId: CategoryId
): DefaultBenefit | undefined {
  const template = getPolicyTemplate(policyType);
  return template?.defaultBenefits?.[categoryId];
}

/**
 * Get benefit mapping for a policy type and category
 */
export function getPolicyBenefitMapping(
  policyType: PolicyType,
  categoryId: CategoryId
): BenefitMapping | undefined {
  const template = getPolicyTemplate(policyType);
  return template?.benefitMapping?.[categoryId];
}

/**
 * Get required fields for a policy type
 */
export function getPolicyRequiredFields(policyType: PolicyType): string[] {
  const template = getPolicyTemplate(policyType);
  return template?.extractionSchema?.required || [];
}

/**
 * Get optional fields for a policy type
 */
export function getPolicyOptionalFields(policyType: PolicyType): string[] {
  const template = getPolicyTemplate(policyType);
  return template?.extractionSchema?.optional || [];
}

/**
 * Get field definition for a specific field
 */
export function getFieldDefinition(
  policyType: PolicyType,
  fieldName: string
): FieldDefinition | undefined {
  const template = getPolicyTemplate(policyType);
  return template?.fieldDefinitions?.[fieldName];
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate that parsed data has required fields
 */
export function validateParsedPolicyData(
  policyType: PolicyType,
  parsedData: ParsedPolicyData
): { valid: boolean; missingFields: string[] } {
  const requiredFields = getPolicyRequiredFields(policyType);
  const missingFields = requiredFields.filter(
    (field) => !(field in parsedData.coverages)
  );

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Check if a policy has a specific coverage type
 */
export function policyHasCoverage(
  parsedData: ParsedPolicyData,
  coverageType: string
): boolean {
  return coverageType in parsedData.coverages && parsedData.coverages[coverageType] != null;
}

// =============================================================================
// METADATA
// =============================================================================

export const policyTemplateMetadata = {
  auto: (autoInsuranceTemplate as unknown as PolicyTemplate).metadata,
  home: (homeInsuranceTemplate as unknown as PolicyTemplate).metadata,
};
