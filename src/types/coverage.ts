export type CategoryId =
  | "travel-rental"
  | "travel-trip"
  | "travel-baggage"
  | "travel-perks"
  | "purchase-protection"
  | "purchase-warranty"
  | "foundational-auto"
  | "foundational-home";

export type CardIssuer = "Chase" | "American Express";
export type CardNetwork = "Visa" | "Mastercard" | "American Express";

export interface RentalExclusions {
  what_is_covered?: string[];
  what_is_not_covered: string[];
  vehicle_exclusions: string[];
  country_exclusions: string[];
  country_notes?: string;
}

export interface TripProtection {
  cancellation_coverage?: number;
  interruption_coverage?: number;
  delay_coverage?: number;
  delay_threshold_hours?: number;
  covered_reasons?: string[];
  exclusions?: string[];
}

export interface BaggageProtection {
  delay_coverage?: number;
  delay_threshold_hours?: number;
  lost_baggage_coverage?: number;
  coverage_details?: string[];
  exclusions?: string[];
}

export interface PurchaseProtection {
  max_per_claim?: number;
  max_per_year?: number;
  coverage_period_days?: number;
  what_is_covered?: string[];
  what_is_not_covered?: string[];
}

export interface ExtendedWarranty {
  extension_years?: number;
  max_original_warranty_years?: number;
  max_per_claim?: number;
  coverage_details?: string[];
  exclusions?: string[];
}

export interface TravelPerks {
  lounge_access?: string[];
  travel_credits?: { amount: number; description: string }[];
  other_perks?: string[];
}

export interface CreditCard {
  id: string;
  name: string;
  fullName: string;
  issuer: CardIssuer;
  network: CardNetwork;
  annualFee: number;
  categories: CategoryId[];
  rental?: {
    coverageType: "primary" | "secondary";
    maxCoverage: number;
    maxDays: number;
  };
  rentalExclusions?: RentalExclusions;
  tripProtection?: TripProtection;
  baggageProtection?: BaggageProtection;
  purchaseProtection?: PurchaseProtection;
  extendedWarranty?: ExtendedWarranty;
  travelPerks?: TravelPerks;
}

export interface Policy {
  id: string;
  name: string;
  type: "auto" | "home" | "renters" | "other";
  filename: string;
  categories: CategoryId[];
}

export interface CommonPlan {
  id: string;
  name: string;
  categories: CategoryId[];
  description?: string;
  coverage_details?: string[];
  exclusions?: string[];
}

export interface CategoryGroup {
  id: string;
  title: string;
  subtitle: string;
  categories: CategoryDefinition[];
}

export interface CategoryDefinition {
  id: CategoryId;
  title: string;
  subtitle: string;
  whatsCovered?: string[];
  whatsNotCovered?: string[];
  emptyMessage?: string;
}

export type BadgeStatus = "covered" | "partial" | "none" | "coming";

export interface UserCoverageState {
  selectedCards: string[];
  uploadedPolicies: Policy[];
  addedPlans: CommonPlan[];
  lastUpdated: string | null;
}
