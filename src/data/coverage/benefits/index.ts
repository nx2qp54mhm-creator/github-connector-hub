/**
 * Benefit Templates Loader
 *
 * Loads and provides access to all benefit templates from JSON files.
 * These templates are referenced by credit cards to avoid duplication.
 */

import travelBenefits from "./travel.json";
import purchaseBenefits from "./purchase.json";
import phoneAutoBenefits from "./phone-auto.json";

// =============================================================================
// TYPE DEFINITIONS FOR BENEFIT TEMPLATES
// =============================================================================

export interface TripProtectionTemplate {
  id: string;
  name: string;
  tier: string;
  issuer: string;
  cancellationCoverage: number;
  interruptionCoverage: number;
  delayCoverage: number;
  delayThresholdHours: number;
  coveredReasons: string[];
  exclusions: string[];
}

export interface BaggageProtectionTemplate {
  id: string;
  name: string;
  tier: string;
  issuer: string;
  delayCoverage: number;
  delayThresholdHours: number;
  lostBaggageCoverage: number;
  coverageDetails: string[];
  exclusions: string[];
}

export interface RentalExclusionsTemplate {
  id: string;
  name: string;
  issuer: string;
  whatsCovered: string[];
  whatsNotCovered: string[];
  vehicleExclusions: string[];
  countryExclusions: string[];
  countryNotes: string;
}

export interface EmergencyAssistanceTemplate {
  id: string;
  name: string;
  tier: string;
  evacuationCoverage: number;
  medicalCoverage?: number;
  services: string[];
  coverageDetails: string[];
  exclusions: string[];
}

export interface TravelPerksTemplate {
  id: string;
  name: string;
  tier: string;
  issuer: string;
  loungeAccess: string[];
  travelCredits: Array<{ amount: number; description: string }>;
  otherPerks: string[];
}

export interface PurchaseProtectionTemplate {
  id: string;
  name: string;
  tier: string;
  issuer: string;
  maxPerClaim: number;
  maxPerYear: number;
  coveragePeriodDays: number;
  covered: string[];
  notCovered: string[];
}

export interface ExtendedWarrantyTemplate {
  id: string;
  name: string;
  tier: string;
  issuer: string;
  extensionYears: number;
  maxOriginalWarrantyYears: number;
  maxPerClaim: number;
  coverageDetails: string[];
  exclusions: string[];
}

export interface ReturnProtectionTemplate {
  id: string;
  name: string;
  tier: string;
  issuer: string;
  maxPerItem: number;
  maxPerYear: number;
  returnWindowDays: number;
  coverageDetails: string[];
  exclusions: string[];
}

export interface CellPhoneProtectionTemplate {
  id: string;
  name: string;
  tier: string;
  issuer: string;
  maxPerClaim: number;
  maxClaimsPerYear: number;
  deductible: number;
  coverageDetails: string[];
  requirements: string[];
  exclusions: string[];
}

export interface RoadsideAssistanceTemplate {
  id: string;
  name: string;
  tier: string;
  issuer: string;
  provider: string;
  towingMiles: number;
  services: string[];
  coverageDetails: string[];
  limitations: string[];
}

// =============================================================================
// TEMPLATE ACCESSORS
// =============================================================================

// Trip Protection Templates
export const tripProtectionTemplates = travelBenefits.tripProtection as Record<
  string,
  TripProtectionTemplate
>;

export function getTripProtectionTemplate(
  key: string
): TripProtectionTemplate | undefined {
  return tripProtectionTemplates[key];
}

// Baggage Protection Templates
export const baggageProtectionTemplates =
  travelBenefits.baggageProtection as Record<string, BaggageProtectionTemplate>;

export function getBaggageProtectionTemplate(
  key: string
): BaggageProtectionTemplate | undefined {
  return baggageProtectionTemplates[key];
}

// Rental Exclusions Templates
export const rentalExclusionsTemplates =
  travelBenefits.rentalExclusions as Record<string, RentalExclusionsTemplate>;

export function getRentalExclusionsTemplate(
  key: string
): RentalExclusionsTemplate | undefined {
  return rentalExclusionsTemplates[key];
}

// Emergency Assistance Templates
export const emergencyAssistanceTemplates =
  travelBenefits.emergencyAssistance as Record<
    string,
    EmergencyAssistanceTemplate
  >;

export function getEmergencyAssistanceTemplate(
  key: string
): EmergencyAssistanceTemplate | undefined {
  return emergencyAssistanceTemplates[key];
}

// Travel Perks Templates
export const travelPerksTemplates = travelBenefits.travelPerks as Record<
  string,
  TravelPerksTemplate
>;

export function getTravelPerksTemplate(
  key: string
): TravelPerksTemplate | undefined {
  return travelPerksTemplates[key];
}

// Purchase Protection Templates
export const purchaseProtectionTemplates =
  purchaseBenefits.purchaseProtection as Record<
    string,
    PurchaseProtectionTemplate
  >;

export function getPurchaseProtectionTemplate(
  key: string
): PurchaseProtectionTemplate | undefined {
  return purchaseProtectionTemplates[key];
}

// Extended Warranty Templates
export const extendedWarrantyTemplates =
  purchaseBenefits.extendedWarranty as Record<string, ExtendedWarrantyTemplate>;

export function getExtendedWarrantyTemplate(
  key: string
): ExtendedWarrantyTemplate | undefined {
  return extendedWarrantyTemplates[key];
}

// Return Protection Templates
export const returnProtectionTemplates =
  purchaseBenefits.returnProtection as Record<string, ReturnProtectionTemplate>;

export function getReturnProtectionTemplate(
  key: string
): ReturnProtectionTemplate | undefined {
  return returnProtectionTemplates[key];
}

// Cell Phone Protection Templates
export const cellPhoneProtectionTemplates =
  phoneAutoBenefits.cellPhoneProtection as Record<
    string,
    CellPhoneProtectionTemplate
  >;

export function getCellPhoneProtectionTemplate(
  key: string
): CellPhoneProtectionTemplate | undefined {
  return cellPhoneProtectionTemplates[key];
}

// Roadside Assistance Templates
export const roadsideAssistanceTemplates =
  phoneAutoBenefits.roadsideAssistance as Record<
    string,
    RoadsideAssistanceTemplate
  >;

export function getRoadsideAssistanceTemplate(
  key: string
): RoadsideAssistanceTemplate | undefined {
  return roadsideAssistanceTemplates[key];
}

// =============================================================================
// METADATA
// =============================================================================

export const benefitTemplatesMetadata = {
  travel: travelBenefits.metadata,
  purchase: purchaseBenefits.metadata,
  phoneAuto: phoneAutoBenefits.metadata,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get all available template keys for a given benefit type
 */
export function getAvailableTemplateKeys(
  benefitType:
    | "tripProtection"
    | "baggageProtection"
    | "rentalExclusions"
    | "emergencyAssistance"
    | "travelPerks"
    | "purchaseProtection"
    | "extendedWarranty"
    | "returnProtection"
    | "cellPhoneProtection"
    | "roadsideAssistance"
): string[] {
  const templateMaps: Record<string, Record<string, unknown>> = {
    tripProtection: tripProtectionTemplates,
    baggageProtection: baggageProtectionTemplates,
    rentalExclusions: rentalExclusionsTemplates,
    emergencyAssistance: emergencyAssistanceTemplates,
    travelPerks: travelPerksTemplates,
    purchaseProtection: purchaseProtectionTemplates,
    extendedWarranty: extendedWarrantyTemplates,
    returnProtection: returnProtectionTemplates,
    cellPhoneProtection: cellPhoneProtectionTemplates,
    roadsideAssistance: roadsideAssistanceTemplates,
  };

  return Object.keys(templateMaps[benefitType] || {});
}

/**
 * Get templates filtered by issuer
 */
export function getTemplatesByIssuer(issuer: "Chase" | "American Express") {
  const issuerKey = issuer === "Chase" ? "chase" : "amex";

  return {
    tripProtection: Object.entries(tripProtectionTemplates)
      .filter(([key]) => key.toLowerCase().includes(issuerKey))
      .map(([, value]) => value),
    baggageProtection: Object.entries(baggageProtectionTemplates)
      .filter(([key]) => key.toLowerCase().includes(issuerKey))
      .map(([, value]) => value),
    purchaseProtection: Object.entries(purchaseProtectionTemplates)
      .filter(([key]) => key.toLowerCase().includes(issuerKey))
      .map(([, value]) => value),
    extendedWarranty: Object.entries(extendedWarrantyTemplates)
      .filter(([key]) => key.toLowerCase().includes(issuerKey))
      .map(([, value]) => value),
    roadsideAssistance: Object.entries(roadsideAssistanceTemplates)
      .filter(([key]) => key.toLowerCase().includes(issuerKey))
      .map(([, value]) => value),
  };
}
