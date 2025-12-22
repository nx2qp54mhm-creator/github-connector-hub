/**
 * Credit Card Source Loader
 *
 * Loads credit card data from JSON files and hydrates them with benefit templates.
 * This allows cards to reference shared benefit definitions while maintaining
 * card-specific overrides.
 */

import type { CreditCard, CategoryId } from "@/types/coverage";
import type { CreditCardSource, CardTier, CardNetwork } from "../../schema";
import {
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
} from "../../benefits";

import chaseData from "./chase.json";
import amexData from "./amex.json";

// =============================================================================
// TYPES FOR JSON DATA
// =============================================================================

interface CardDataFile {
  provider: string;
  sourceType: string;
  metadata: {
    lastUpdated: string;
    version: string;
    sourceUrl?: string;
    notes?: string;
  };
  cards: CardJSON[];
}

interface CardJSON {
  id: string;
  name: string;
  fullName: string;
  network: string;
  annualFee: number;
  tier: string;
  categories: string[];
  benefits: {
    rental?: {
      coverageType: "primary" | "secondary";
      maxCoverage: number;
      maxDays: number;
      exclusionsTemplate: string;
    };
    tripProtection?: string;
    baggageProtection?: string;
    purchaseProtection?: string;
    extendedWarranty?: string;
    travelPerks?: string;
    cellPhoneProtection?: string;
    roadsideAssistance?: string;
    emergencyAssistance?: string;
    returnProtection?: string;
  };
}

// =============================================================================
// CARD HYDRATION - Convert JSON to full CreditCard objects
// =============================================================================

function hydrateCard(cardJson: CardJSON, provider: string): CreditCard {
  const benefits = cardJson.benefits;

  // Get rental exclusions template
  const rentalExclusions = benefits.rental?.exclusionsTemplate
    ? getRentalExclusionsTemplate(benefits.rental.exclusionsTemplate)
    : undefined;

  // Get trip protection template
  const tripTemplate = benefits.tripProtection
    ? getTripProtectionTemplate(benefits.tripProtection)
    : undefined;

  // Get baggage protection template
  const baggageTemplate = benefits.baggageProtection
    ? getBaggageProtectionTemplate(benefits.baggageProtection)
    : undefined;

  // Get purchase protection template
  const purchaseTemplate = benefits.purchaseProtection
    ? getPurchaseProtectionTemplate(benefits.purchaseProtection)
    : undefined;

  // Get extended warranty template
  const warrantyTemplate = benefits.extendedWarranty
    ? getExtendedWarrantyTemplate(benefits.extendedWarranty)
    : undefined;

  // Get travel perks template
  const perksTemplate = benefits.travelPerks
    ? getTravelPerksTemplate(benefits.travelPerks)
    : undefined;

  // Get cell phone protection template
  const phoneTemplate = benefits.cellPhoneProtection
    ? getCellPhoneProtectionTemplate(benefits.cellPhoneProtection)
    : undefined;

  // Get roadside assistance template
  const roadsideTemplate = benefits.roadsideAssistance
    ? getRoadsideAssistanceTemplate(benefits.roadsideAssistance)
    : undefined;

  // Get emergency assistance template
  const emergencyTemplate = benefits.emergencyAssistance
    ? getEmergencyAssistanceTemplate(benefits.emergencyAssistance)
    : undefined;

  // Get return protection template
  const returnTemplate = benefits.returnProtection
    ? getReturnProtectionTemplate(benefits.returnProtection)
    : undefined;

  // Build the hydrated card object
  const card: CreditCard = {
    id: cardJson.id,
    name: cardJson.name,
    fullName: cardJson.fullName,
    issuer: provider as "Chase" | "American Express",
    network: cardJson.network as "Visa" | "Mastercard" | "American Express",
    annualFee: cardJson.annualFee,
    categories: cardJson.categories as CategoryId[],
  };

  // Add rental coverage if present
  if (benefits.rental) {
    card.rental = {
      coverageType: benefits.rental.coverageType,
      maxCoverage: benefits.rental.maxCoverage,
      maxDays: benefits.rental.maxDays,
    };

    if (rentalExclusions) {
      card.rentalExclusions = {
        what_is_covered: rentalExclusions.whatsCovered,
        what_is_not_covered: rentalExclusions.whatsNotCovered,
        vehicle_exclusions: rentalExclusions.vehicleExclusions,
        country_exclusions: rentalExclusions.countryExclusions,
        country_notes: rentalExclusions.countryNotes,
      };
    }
  }

  // Add trip protection if present
  if (tripTemplate) {
    card.tripProtection = {
      cancellation_coverage: tripTemplate.cancellationCoverage,
      interruption_coverage: tripTemplate.interruptionCoverage,
      delay_coverage: tripTemplate.delayCoverage,
      delay_threshold_hours: tripTemplate.delayThresholdHours,
      covered_reasons: tripTemplate.coveredReasons,
      exclusions: tripTemplate.exclusions,
    };
  }

  // Add baggage protection if present
  if (baggageTemplate) {
    card.baggageProtection = {
      delay_coverage: baggageTemplate.delayCoverage,
      delay_threshold_hours: baggageTemplate.delayThresholdHours,
      lost_baggage_coverage: baggageTemplate.lostBaggageCoverage,
      coverage_details: baggageTemplate.coverageDetails,
      exclusions: baggageTemplate.exclusions,
    };
  }

  // Add purchase protection if present
  if (purchaseTemplate) {
    card.purchaseProtection = {
      max_per_claim: purchaseTemplate.maxPerClaim,
      max_per_year: purchaseTemplate.maxPerYear,
      coverage_period_days: purchaseTemplate.coveragePeriodDays,
      what_is_covered: purchaseTemplate.covered,
      what_is_not_covered: purchaseTemplate.notCovered,
    };
  }

  // Add extended warranty if present
  if (warrantyTemplate) {
    card.extendedWarranty = {
      extension_years: warrantyTemplate.extensionYears,
      max_original_warranty_years: warrantyTemplate.maxOriginalWarrantyYears,
      max_per_claim: warrantyTemplate.maxPerClaim,
      coverage_details: warrantyTemplate.coverageDetails,
      exclusions: warrantyTemplate.exclusions,
    };
  }

  // Add travel perks if present
  if (perksTemplate) {
    card.travelPerks = {
      lounge_access: perksTemplate.loungeAccess,
      travel_credits: perksTemplate.travelCredits,
      other_perks: perksTemplate.otherPerks,
    };
  }

  // Add cell phone protection if present
  if (phoneTemplate) {
    card.cellPhoneProtection = {
      max_per_claim: phoneTemplate.maxPerClaim,
      max_claims_per_year: phoneTemplate.maxClaimsPerYear,
      deductible: phoneTemplate.deductible,
      coverage_details: phoneTemplate.coverageDetails,
      requirements: phoneTemplate.requirements,
      exclusions: phoneTemplate.exclusions,
    };
  }

  // Add roadside assistance if present
  if (roadsideTemplate) {
    card.roadsideAssistance = {
      provider: roadsideTemplate.provider,
      towing_miles: roadsideTemplate.towingMiles,
      services: roadsideTemplate.services,
      coverage_details: roadsideTemplate.coverageDetails,
      limitations: roadsideTemplate.limitations,
    };
  }

  // Add emergency assistance if present
  if (emergencyTemplate) {
    card.emergencyAssistance = {
      evacuation_coverage: emergencyTemplate.evacuationCoverage,
      medical_coverage: emergencyTemplate.medicalCoverage,
      services: emergencyTemplate.services,
      coverage_details: emergencyTemplate.coverageDetails,
      exclusions: emergencyTemplate.exclusions,
    };
  }

  // Add return protection if present
  if (returnTemplate) {
    card.returnProtection = {
      max_per_item: returnTemplate.maxPerItem,
      max_per_year: returnTemplate.maxPerYear,
      return_window_days: returnTemplate.returnWindowDays,
      coverage_details: returnTemplate.coverageDetails,
      exclusions: returnTemplate.exclusions,
    };
  }

  return card;
}

// =============================================================================
// LOAD AND HYDRATE ALL CARDS
// =============================================================================

function loadCardsFromFile(dataFile: CardDataFile): CreditCard[] {
  return dataFile.cards.map((cardJson) =>
    hydrateCard(cardJson, dataFile.provider)
  );
}

// Load all cards
const chaseCards = loadCardsFromFile(chaseData as CardDataFile);
const amexCards = loadCardsFromFile(amexData as CardDataFile);

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * All credit cards organized by issuer
 */
export const creditCardsByIssuer: Record<string, CreditCard[]> = {
  chase: chaseCards,
  amex: amexCards,
};

/**
 * Get all credit cards as a flat array
 */
export function getAllCreditCards(): CreditCard[] {
  return [...chaseCards, ...amexCards];
}

/**
 * Get a credit card by ID
 */
export function getCreditCardById(id: string): CreditCard | undefined {
  return getAllCreditCards().find((card) => card.id === id);
}

/**
 * Get credit cards by issuer
 */
export function getCreditCardsByIssuer(
  issuer: "chase" | "amex"
): CreditCard[] {
  return creditCardsByIssuer[issuer] || [];
}

/**
 * Get credit cards that cover a specific category
 */
export function getCreditCardsForCategory(
  categoryId: CategoryId
): CreditCard[] {
  return getAllCreditCards().filter((card) =>
    card.categories.includes(categoryId)
  );
}

/**
 * Get credit cards by tier
 */
export function getCreditCardsByTier(tier: CardTier): CreditCard[] {
  const allCards = getAllCreditCards();
  const tierMapping: Record<string, CardTier> = {};

  // Build tier mapping from JSON data
  [...(chaseData as CardDataFile).cards, ...(amexData as CardDataFile).cards].forEach(
    (card) => {
      tierMapping[card.id] = card.tier as CardTier;
    }
  );

  return allCards.filter((card) => tierMapping[card.id] === tier);
}

/**
 * Get credit cards by network
 */
export function getCreditCardsByNetwork(network: CardNetwork): CreditCard[] {
  return getAllCreditCards().filter((card) => card.network === network);
}

/**
 * Get credit cards with primary rental coverage
 */
export function getCreditCardsWithPrimaryRental(): CreditCard[] {
  return getAllCreditCards().filter(
    (card) => card.rental?.coverageType === "primary"
  );
}

/**
 * Get metadata for all card data files
 */
export const creditCardMetadata = {
  chase: (chaseData as CardDataFile).metadata,
  amex: (amexData as CardDataFile).metadata,
};

/**
 * Convert a CreditCard to CreditCardSource format
 */
export function toCreditCardSource(card: CreditCard): CreditCardSource {
  // Find the tier from the JSON data
  const jsonCard = [
    ...(chaseData as CardDataFile).cards,
    ...(amexData as CardDataFile).cards,
  ].find((c) => c.id === card.id);

  return {
    id: card.id,
    type: "credit-card",
    name: card.name,
    fullName: card.fullName,
    provider: card.issuer,
    categories: card.categories,
    benefits: {},
    metadata: {
      lastUpdated:
        card.issuer === "Chase"
          ? (chaseData as CardDataFile).metadata.lastUpdated
          : (amexData as CardDataFile).metadata.lastUpdated,
      version:
        card.issuer === "Chase"
          ? (chaseData as CardDataFile).metadata.version
          : (amexData as CardDataFile).metadata.version,
    },
    network: card.network as CardNetwork,
    annualFee: card.annualFee,
    tier: (jsonCard?.tier as CardTier) || "basic",
  };
}
