import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface AutoPolicy {
  id: string;
  document_id: string | null;
  insurance_company: string | null;
  policy_number: string | null;
  coverage_start_date: string | null;
  coverage_end_date: string | null;
  collision_covered: boolean | null;
  collision_deductible: number | null;
  comprehensive_covered: boolean | null;
  comprehensive_deductible: number | null;
  bodily_injury_per_person: number | null;
  bodily_injury_per_accident: number | null;
  property_damage_limit: number | null;
  medical_payments_covered: boolean | null;
  medical_payments_limit: number | null;
  uninsured_motorist_covered: boolean | null;
  uninsured_motorist_per_person: number | null;
  uninsured_motorist_per_accident: number | null;
  rental_reimbursement_covered: boolean | null;
  rental_reimbursement_daily: number | null;
  rental_reimbursement_max: number | null;
  roadside_assistance_covered: boolean | null;
  premium_amount: number | null;
  premium_frequency: string | null;
}

async function fetchAutoPolicy(userId: string): Promise<AutoPolicy | null> {
  const { data, error } = await supabase
    .from("auto_policies")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching auto policy:", error);
    throw error;
  }

  return data;
}

export function useAutoPolicy() {
  const { user } = useAuth();

  const {
    data: autoPolicy,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["autoPolicy", user?.id],
    queryFn: () => fetchAutoPolicy(user!.id),
    enabled: !!user?.id, // Only fetch if user is logged in
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
  });

  return {
    autoPolicy: autoPolicy ?? null,
    loading,
    refetch,
  };
}
