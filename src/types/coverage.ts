export type CategoryId =
  | "travel-rental"
  | "travel-trip"
  | "travel-baggage"
  | "travel-perks"
  | "travel-emergency"
  | "purchase-protection"
  | "purchase-warranty"
  | "purchase-return"
  | "purchase-price"
  | "phone-protection"
  | "roadside-assistance"
  | "foundational-auto"
  | "foundational-home";

export type CardIssuer = "Chase" | "American Express";
export type CardNetwork = "Visa" | "Mastercard" | "American Express";

// ============================================
// CREDIT CARD BENEFIT INTERFACES
// ============================================

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

// New benefit types
export interface CellPhoneProtection {
  max_per_claim?: number;
  max_claims_per_year?: number;
  deductible?: number;
  coverage_details?: string[];
  requirements?: string[];
  exclusions?: string[];
}

export interface ReturnProtection {
  max_per_item?: number;
  max_per_year?: number;
  return_window_days?: number;
  coverage_details?: string[];
  exclusions?: string[];
}

export interface PriceProtection {
  max_per_item?: number;
  max_per_year?: number;
  price_drop_window_days?: number;
  coverage_details?: string[];
  exclusions?: string[];
}

export interface RoadsideAssistance {
  provider?: string;
  towing_miles?: number;
  services?: string[];
  coverage_details?: string[];
  limitations?: string[];
}

export interface EmergencyAssistance {
  evacuation_coverage?: number;
  medical_coverage?: number;
  services?: string[];
  coverage_details?: string[];
  exclusions?: string[];
}

// ============================================
// INSURANCE POLICY COVERAGE INTERFACES
// ============================================

export interface AutoInsuranceCoverage {
  policy_number?: string;
  insurer?: string;
  // Liability coverage
  bodily_injury_per_person?: number;
  bodily_injury_per_accident?: number;
  property_damage?: number;
  // Vehicle coverage
  collision_covered?: boolean;
  collision_deductible?: number;
  comprehensive_covered?: boolean;
  comprehensive_deductible?: number;
  // Uninsured motorist
  uninsured_motorist_covered?: boolean;
  uninsured_motorist_per_person?: number;
  uninsured_motorist_per_accident?: number;
  // Additional coverage
  uninsured_motorist?: number; // Legacy field
  underinsured_motorist?: number;
  medical_payments_covered?: boolean;
  medical_payments?: number;
  personal_injury_protection?: number;
  // Rental reimbursement
  rental_reimbursement_covered?: boolean;
  rental_reimbursement_daily?: number;
  rental_reimbursement_max?: number;
  // Roadside
  roadside_assistance?: boolean;
  roadside_details?: string[];
  // Gap coverage
  gap_coverage?: boolean;
  // General
  covered_vehicles?: string[];
  covered_drivers?: string[];
  exclusions?: string[];
}

export interface HomeInsuranceCoverage {
  policy_number?: string;
  insurer?: string;
  policy_type?: "HO-1" | "HO-2" | "HO-3" | "HO-4" | "HO-5" | "HO-6" | "HO-7" | "HO-8";
  // Dwelling coverage
  dwelling_coverage?: number;
  other_structures?: number;
  personal_property?: number;
  loss_of_use?: number;
  // Liability
  personal_liability?: number;
  medical_payments?: number;
  // Deductibles
  standard_deductible?: number;
  wind_hail_deductible?: number;
  hurricane_deductible?: number;
  // Additional coverages
  scheduled_items?: { item: string; value: number }[];
  water_backup?: number;
  identity_theft?: boolean;
  equipment_breakdown?: boolean;
  // Exclusions
  exclusions?: string[];
  flood_coverage?: boolean;
  earthquake_coverage?: boolean;
}

export interface RentersInsuranceCoverage {
  policy_number?: string;
  insurer?: string;
  // Coverage amounts
  personal_property?: number;
  loss_of_use?: number;
  personal_liability?: number;
  medical_payments?: number;
  // Deductible
  deductible?: number;
  // Additional
  replacement_cost?: boolean;
  scheduled_items?: { item: string; value: number }[];
  identity_theft?: boolean;
  // Exclusions
  exclusions?: string[];
}

export interface CreditCard {
  id: string;
  name: string;
  fullName: string;
  issuer: CardIssuer;
  network: CardNetwork;
  annualFee: number;
  categories: CategoryId[];
  // Rental car coverage
  rental?: {
    coverageType: "primary" | "secondary";
    maxCoverage: number;
    maxDays: number;
  };
  rentalExclusions?: RentalExclusions;
  // Travel benefits
  tripProtection?: TripProtection;
  baggageProtection?: BaggageProtection;
  travelPerks?: TravelPerks;
  emergencyAssistance?: EmergencyAssistance;
  // Purchase benefits
  purchaseProtection?: PurchaseProtection;
  extendedWarranty?: ExtendedWarranty;
  returnProtection?: ReturnProtection;
  priceProtection?: PriceProtection;
  // Other benefits
  cellPhoneProtection?: CellPhoneProtection;
  roadsideAssistance?: RoadsideAssistance;
}

export interface Policy {
  id: string;
  name: string;
  type: "auto" | "home" | "renters" | "other";
  filename: string;
  categories: CategoryId[];
  // Structured coverage data (optional - can be filled in by user)
  autoCoverage?: AutoInsuranceCoverage;
  homeCoverage?: HomeInsuranceCoverage;
  rentersCoverage?: RentersInsuranceCoverage;
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
