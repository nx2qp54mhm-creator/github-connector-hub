import { z } from "zod";

// Schema for auto policy form validation
export const autoPolicyFormSchema = z.object({
  // Basic policy info
  insurance_company: z.string().nullable().optional(),
  policy_number: z.string().nullable().optional(),
  coverage_start_date: z.string().nullable().optional(),
  coverage_end_date: z.string().nullable().optional(),

  // Collision coverage
  collision_covered: z.boolean().nullable().optional(),
  collision_deductible: z.number().min(0).nullable().optional(),

  // Comprehensive coverage
  comprehensive_covered: z.boolean().nullable().optional(),
  comprehensive_deductible: z.number().min(0).nullable().optional(),

  // Liability coverage
  bodily_injury_per_person: z.number().min(0).nullable().optional(),
  bodily_injury_per_accident: z.number().min(0).nullable().optional(),
  property_damage_limit: z.number().min(0).nullable().optional(),

  // Medical payments
  medical_payments_covered: z.boolean().nullable().optional(),
  medical_payments_limit: z.number().min(0).nullable().optional(),

  // Uninsured motorist
  uninsured_motorist_covered: z.boolean().nullable().optional(),
  uninsured_motorist_per_person: z.number().min(0).nullable().optional(),
  uninsured_motorist_per_accident: z.number().min(0).nullable().optional(),

  // Rental reimbursement
  rental_reimbursement_covered: z.boolean().nullable().optional(),
  rental_reimbursement_daily: z.number().min(0).nullable().optional(),
  rental_reimbursement_max: z.number().min(0).nullable().optional(),

  // Roadside assistance
  roadside_assistance_covered: z.boolean().nullable().optional(),

  // Premium
  premium_amount: z.number().min(0).nullable().optional(),
  premium_frequency: z.string().nullable().optional(),
});

export type AutoPolicyFormData = z.infer<typeof autoPolicyFormSchema>;

// Premium frequency options
export const premiumFrequencyOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semi_annual", label: "Semi-Annual (6 months)" },
  { value: "annual", label: "Annual" },
];
