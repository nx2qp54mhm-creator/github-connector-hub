import { useState, useEffect } from "react";
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

export function useAutoPolicy() {
  const { user } = useAuth();
  const [autoPolicy, setAutoPolicy] = useState<AutoPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAutoPolicy() {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("auto_policies")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching auto policy:", error);
      }

      setAutoPolicy(data);
      setLoading(false);
    }

    fetchAutoPolicy();
  }, [user]);

  return { autoPolicy, loading, refetch: () => {
    setLoading(true);
    if (user) {
      supabase
        .from("auto_policies")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          setAutoPolicy(data);
          setLoading(false);
        });
    }
  }};
}
