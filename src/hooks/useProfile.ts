import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  name: string | null;
  has_health_insurance: boolean | null;
  is_admin: boolean | null;
  onboarding_completed: boolean | null;
  onboarding_step: number | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching profile:", error);
    }
    
    setProfile(data);
    setLoading(false);
  };

  const updateProfile = async (updates: {
    name?: string | null;
    has_health_insurance?: boolean | null;
    onboarding_completed?: boolean | null;
    onboarding_step?: number | null;
  }) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...updates });

    if (!error) {
      setProfile((prev) => prev ? { ...prev, ...updates } : null);
    }

    return { error };
  };

  return { profile, loading, updateProfile, refetch: fetchProfile };
}
