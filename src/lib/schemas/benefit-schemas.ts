import { z } from "zod";

// Rental Car Coverage Schema
export const rentalSchema = z.object({
  coverageType: z.enum(["primary", "secondary"]).optional(),
  maxCoverage: z.number().min(0).optional(),
  maxRentalDays: z.number().min(0).optional(),
  whatsCovered: z.array(z.string()).optional(),
  whatsNotCovered: z.array(z.string()).optional(),
  vehicleExclusions: z.array(z.string()).optional(),
  countryExclusions: z.array(z.string()).optional(),
});

// Trip Protection Schema
export const tripProtectionSchema = z.object({
  cancellationCoverage: z.number().min(0).optional(),
  interruptionCoverage: z.number().min(0).optional(),
  delayCoverage: z.number().min(0).optional(),
  delayThresholdHours: z.number().min(0).optional(),
  coveredReasons: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
});

// Baggage Protection Schema
export const baggageProtectionSchema = z.object({
  delayCoverage: z.number().min(0).optional(),
  delayThresholdHours: z.number().min(0).optional(),
  lostBaggageCoverage: z.number().min(0).optional(),
  coverageDetails: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
});

// Purchase Protection Schema
export const purchaseProtectionSchema = z.object({
  maxPerClaim: z.number().min(0).optional(),
  maxPerYear: z.number().min(0).optional(),
  coveragePeriodDays: z.number().min(0).optional(),
  whatsCovered: z.array(z.string()).optional(),
  whatsNotCovered: z.array(z.string()).optional(),
});

// Extended Warranty Schema
export const extendedWarrantySchema = z.object({
  extensionYears: z.number().min(0).optional(),
  maxOriginalWarrantyYears: z.number().min(0).optional(),
  maxPerClaim: z.number().min(0).optional(),
  coverageDetails: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
});

// Cell Phone Protection Schema
export const cellPhoneProtectionSchema = z.object({
  maxPerClaim: z.number().min(0).optional(),
  maxClaimsPerYear: z.number().min(0).optional(),
  deductible: z.number().min(0).optional(),
  coverageDetails: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
});

// Roadside Assistance Schema
export const roadsideAssistanceSchema = z.object({
  provider: z.string().optional(),
  towingMiles: z.number().min(0).optional(),
  services: z.array(z.string()).optional(),
  coverageDetails: z.array(z.string()).optional(),
  limitations: z.array(z.string()).optional(),
});

// Emergency Assistance Schema
export const emergencyAssistanceSchema = z.object({
  evacuationCoverage: z.number().min(0).optional(),
  medicalCoverage: z.number().min(0).optional(),
  services: z.array(z.string()).optional(),
  coverageDetails: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
});

// Return Protection Schema
export const returnProtectionSchema = z.object({
  maxPerItem: z.number().min(0).optional(),
  maxPerYear: z.number().min(0).optional(),
  returnWindowDays: z.number().min(0).optional(),
  coverageDetails: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
});

// Travel Credit Schema (for Travel Perks)
export const travelCreditSchema = z.object({
  amount: z.number().min(0).optional(),
  description: z.string().optional(),
});

// Travel Perks Schema
export const travelPerksSchema = z.object({
  annualFee: z.number().min(0).optional(),
  loungeAccess: z.array(z.string()).optional(),
  travelCredits: z.array(travelCreditSchema).optional(),
  otherPerks: z.array(z.string()).optional(),
});

// Export types
export type RentalBenefit = z.infer<typeof rentalSchema>;
export type TripProtectionBenefit = z.infer<typeof tripProtectionSchema>;
export type BaggageProtectionBenefit = z.infer<typeof baggageProtectionSchema>;
export type PurchaseProtectionBenefit = z.infer<typeof purchaseProtectionSchema>;
export type ExtendedWarrantyBenefit = z.infer<typeof extendedWarrantySchema>;
export type CellPhoneProtectionBenefit = z.infer<typeof cellPhoneProtectionSchema>;
export type RoadsideAssistanceBenefit = z.infer<typeof roadsideAssistanceSchema>;
export type EmergencyAssistanceBenefit = z.infer<typeof emergencyAssistanceSchema>;
export type ReturnProtectionBenefit = z.infer<typeof returnProtectionSchema>;
export type TravelPerksBenefit = z.infer<typeof travelPerksSchema>;

// Schema lookup by benefit type
export const benefitSchemas: Record<string, z.ZodSchema> = {
  rental: rentalSchema,
  tripProtection: tripProtectionSchema,
  baggageProtection: baggageProtectionSchema,
  purchaseProtection: purchaseProtectionSchema,
  extendedWarranty: extendedWarrantySchema,
  cellPhoneProtection: cellPhoneProtectionSchema,
  roadsideAssistance: roadsideAssistanceSchema,
  emergencyAssistance: emergencyAssistanceSchema,
  returnProtection: returnProtectionSchema,
  travelPerks: travelPerksSchema,
};

// Get schema for a benefit type
export function getBenefitSchema(benefitType: string): z.ZodSchema | undefined {
  return benefitSchemas[benefitType];
}
