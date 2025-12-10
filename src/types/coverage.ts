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
  // Additional rental properties for comparison view
  rentalCoverageType?: "primary" | "secondary";
  rentalCoverageLimit?: number;
  rentalMaxDays?: number;
  rentalExoticCovered?: boolean;
  rentalReportDays?: number;
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
