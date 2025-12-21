import { useEffect, useRef } from "react";
import { create } from "zustand";
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

interface AutoPolicyStore {
  autoPolicy: AutoPolicy | null;
  loading: boolean;
  lastFetchedUserId: string | null;
  setAutoPolicy: (policy: AutoPolicy | null) => void;
  setLoading: (loading: boolean) => void;
  setLastFetchedUserId: (userId: string | null) => void;
}

const useAutoPolicyStore = create<AutoPolicyStore>((set) => ({
  autoPolicy: null,
  loading: true,
  lastFetchedUserId: null,
  setAutoPolicy: (policy) => set({ autoPolicy: policy }),
  setLoading: (loading) => set({ loading }),
  setLastFetchedUserId: (userId) => set({ lastFetchedUserId: userId }),
}));

export function useAutoPolicy() {
  const { user } = useAuth();
  const { autoPolicy, loading, lastFetchedUserId, setAutoPolicy, setLoading, setLastFetchedUserId } = useAutoPolicyStore();
  const isFetching = useRef(false);

  const fetchAutoPolicy = async (uid: string) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("auto_policies")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching auto policy:", error);
      }

      setAutoPolicy(data);
      setLastFetchedUserId(uid);
    } finally {
      // Always reset the fetching flag and loading state, even on error
      setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    const userId = user?.id;
    
    if (!userId) {
      if (lastFetchedUserId !== null) {
        setAutoPolicy(null);
        setLastFetchedUserId(null);
        setLoading(false);
      }
      return;
    }

    // Only fetch if user changed
    if (lastFetchedUserId !== userId && !isFetching.current) {
      fetchAutoPolicy(userId);
    }
  }, [user?.id, lastFetchedUserId]);

  const refetch = async () => {
    if (!user) {
      setAutoPolicy(null);
      setLoading(false);
      return;
    }
    isFetching.current = false; // Reset to allow refetch
    await fetchAutoPolicy(user.id);
  };

  return { autoPolicy, loading, refetch };
}
