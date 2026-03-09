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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cached_jobs: {
        Row: {
          apply_link: string | null
          cached_at: string
          company: string
          competition_level: string | null
          description: string | null
          id: string
          industry: string | null
          is_hybrid: boolean
          is_remote: boolean
          location: string
          match_score: number | null
          missing_skills: string[] | null
          partial_match_skills: string[] | null
          posted_date: string | null
          priority_score: number | null
          required_skills: string[] | null
          salary_max: number | null
          salary_min: number | null
          seniority: string | null
          source: string | null
          strong_match_skills: string[] | null
          timing_tag: string | null
          title: string
          visa_status: string | null
        }
        Insert: {
          apply_link?: string | null
          cached_at?: string
          company: string
          competition_level?: string | null
          description?: string | null
          id: string
          industry?: string | null
          is_hybrid?: boolean
          is_remote?: boolean
          location: string
          match_score?: number | null
          missing_skills?: string[] | null
          partial_match_skills?: string[] | null
          posted_date?: string | null
          priority_score?: number | null
          required_skills?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: string | null
          source?: string | null
          strong_match_skills?: string[] | null
          timing_tag?: string | null
          title: string
          visa_status?: string | null
        }
        Update: {
          apply_link?: string | null
          cached_at?: string
          company?: string
          competition_level?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          is_hybrid?: boolean
          is_remote?: boolean
          location?: string
          match_score?: number | null
          missing_skills?: string[] | null
          partial_match_skills?: string[] | null
          posted_date?: string | null
          priority_score?: number | null
          required_skills?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: string | null
          source?: string | null
          strong_match_skills?: string[] | null
          timing_tag?: string | null
          title?: string
          visa_status?: string | null
        }
        Relationships: []
      }
      job_cache_meta: {
        Row: {
          id: number
          last_fetched_at: string | null
          total_jobs: number | null
        }
        Insert: {
          id?: number
          last_fetched_at?: string | null
          total_jobs?: number | null
        }
        Update: {
          id?: number
          last_fetched_at?: string | null
          total_jobs?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          certifications: Json | null
          created_at: string
          current_title: string | null
          desired_titles: string[] | null
          education: Json | null
          email: string | null
          experience: Json | null
          id: string
          industries: string[] | null
          location: string | null
          name: string | null
          phone: string | null
          preferred_locations: string[] | null
          remote_preference: string | null
          requires_visa_sponsorship: boolean | null
          resume_file_name: string | null
          resume_file_path: string | null
          salary_max: number | null
          salary_min: number | null
          skills: string[] | null
          summary: string | null
          tools: string[] | null
          updated_at: string
          user_id: string
          years_of_experience: number | null
        }
        Insert: {
          certifications?: Json | null
          created_at?: string
          current_title?: string | null
          desired_titles?: string[] | null
          education?: Json | null
          email?: string | null
          experience?: Json | null
          id?: string
          industries?: string[] | null
          location?: string | null
          name?: string | null
          phone?: string | null
          preferred_locations?: string[] | null
          remote_preference?: string | null
          requires_visa_sponsorship?: boolean | null
          resume_file_name?: string | null
          resume_file_path?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          summary?: string | null
          tools?: string[] | null
          updated_at?: string
          user_id: string
          years_of_experience?: number | null
        }
        Update: {
          certifications?: Json | null
          created_at?: string
          current_title?: string | null
          desired_titles?: string[] | null
          education?: Json | null
          email?: string | null
          experience?: Json | null
          id?: string
          industries?: string[] | null
          location?: string | null
          name?: string | null
          phone?: string | null
          preferred_locations?: string[] | null
          remote_preference?: string | null
          requires_visa_sponsorship?: boolean | null
          resume_file_name?: string | null
          resume_file_path?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          summary?: string | null
          tools?: string[] | null
          updated_at?: string
          user_id?: string
          years_of_experience?: number | null
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
