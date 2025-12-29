export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      auto_policies: {
        Row: {
          bodily_injury_per_accident: number | null
          bodily_injury_per_person: number | null
          collision_covered: boolean | null
          collision_deductible: number | null
          comprehensive_covered: boolean | null
          comprehensive_deductible: number | null
          coverage_end_date: string | null
          coverage_start_date: string | null
          created_at: string | null
          document_id: string | null
          id: string
          insurance_company: string | null
          medical_payments_covered: boolean | null
          medical_payments_limit: number | null
          policy_holder_name: string | null
          policy_number: string | null
          premium_amount: number | null
          premium_frequency: string | null
          property_damage_limit: number | null
          raw_extracted_data: Json | null
          rental_reimbursement_covered: boolean | null
          rental_reimbursement_daily: number | null
          rental_reimbursement_max: number | null
          roadside_assistance_covered: boolean | null
          uninsured_motorist_covered: boolean | null
          uninsured_motorist_per_accident: number | null
          uninsured_motorist_per_person: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bodily_injury_per_accident?: number | null
          bodily_injury_per_person?: number | null
          collision_covered?: boolean | null
          collision_deductible?: number | null
          comprehensive_covered?: boolean | null
          comprehensive_deductible?: number | null
          coverage_end_date?: string | null
          coverage_start_date?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          insurance_company?: string | null
          medical_payments_covered?: boolean | null
          medical_payments_limit?: number | null
          policy_holder_name?: string | null
          policy_number?: string | null
          premium_amount?: number | null
          premium_frequency?: string | null
          property_damage_limit?: number | null
          raw_extracted_data?: Json | null
          rental_reimbursement_covered?: boolean | null
          rental_reimbursement_daily?: number | null
          rental_reimbursement_max?: number | null
          roadside_assistance_covered?: boolean | null
          uninsured_motorist_covered?: boolean | null
          uninsured_motorist_per_accident?: number | null
          uninsured_motorist_per_person?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bodily_injury_per_accident?: number | null
          bodily_injury_per_person?: number | null
          collision_covered?: boolean | null
          collision_deductible?: number | null
          comprehensive_covered?: boolean | null
          comprehensive_deductible?: number | null
          coverage_end_date?: string | null
          coverage_start_date?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          insurance_company?: string | null
          medical_payments_covered?: boolean | null
          medical_payments_limit?: number | null
          policy_holder_name?: string | null
          policy_number?: string | null
          premium_amount?: number | null
          premium_frequency?: string | null
          property_damage_limit?: number | null
          raw_extracted_data?: Json | null
          rental_reimbursement_covered?: boolean | null
          rental_reimbursement_daily?: number | null
          rental_reimbursement_max?: number | null
          roadside_assistance_covered?: boolean | null
          uninsured_motorist_covered?: boolean | null
          uninsured_motorist_per_accident?: number | null
          uninsured_motorist_per_person?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_policies_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "policy_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_documents: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          policy_type: string
          processing_status: string | null
          updated_at: string | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          policy_type: string
          processing_status?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          policy_type?: string
          processing_status?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          has_health_insurance: boolean | null
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          has_health_insurance?: boolean | null
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          has_health_insurance?: boolean | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          created_at: string | null
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_policies: {
        Row: {
          categories: Json
          created_at: string | null
          filename: string
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          categories?: Json
          created_at?: string | null
          filename: string
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          categories?: Json
          created_at?: string | null
          filename?: string
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_selected_cards: {
        Row: {
          card_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
