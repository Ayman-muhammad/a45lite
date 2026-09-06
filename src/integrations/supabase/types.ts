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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          generated_at: string
          id: string
          input_prompt: string | null
          job_id: string | null
          match_score: number | null
          output_content: string | null
          type: string
          user_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          input_prompt?: string | null
          job_id?: string | null
          match_score?: number | null
          output_content?: string | null
          type: string
          user_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          input_prompt?: string | null
          job_id?: string | null
          match_score?: number | null
          output_content?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applied_at: string | null
          created_at: string
          custom_cover_letter: string | null
          id: string
          interview_notes: string | null
          job_id: string
          notes: string | null
          resume_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          custom_cover_letter?: string | null
          id?: string
          interview_notes?: string | null
          job_id: string
          notes?: string | null
          resume_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          custom_cover_letter?: string | null
          id?: string
          interview_notes?: string | null
          job_id?: string
          notes?: string | null
          resume_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          apply_email: string | null
          apply_url: string | null
          company: string
          company_type: string
          created_at: string
          deadline: string | null
          description: string
          experience_level: string
          id: string
          is_active: boolean
          job_type: string
          location: string
          requirements: string[]
          salary_range: string | null
          source: string | null
          source_url: string | null
          tags: string[]
          title: string
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          apply_email?: string | null
          apply_url?: string | null
          company: string
          company_type?: string
          created_at?: string
          deadline?: string | null
          description?: string
          experience_level?: string
          id?: string
          is_active?: boolean
          job_type?: string
          location?: string
          requirements?: string[]
          salary_range?: string | null
          source?: string | null
          source_url?: string | null
          tags?: string[]
          title: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          apply_email?: string | null
          apply_url?: string | null
          company?: string
          company_type?: string
          created_at?: string
          deadline?: string | null
          description?: string
          experience_level?: string
          id?: string
          is_active?: boolean
          job_type?: string
          location?: string
          requirements?: string[]
          salary_range?: string | null
          source?: string | null
          source_url?: string | null
          tags?: string[]
          title?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          job_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          job_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          job_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          education_level: string | null
          email: string | null
          experience_years: number
          fcm_token: string | null
          full_name: string | null
          headline: string | null
          id: string
          job_type_preference: string[]
          location: string | null
          notify_deadlines: boolean
          notify_new_jobs: boolean
          onboarded: boolean
          phone: string | null
          salary_expectation: string | null
          skills: string[]
          subscription_tier: string
          summary: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          education_level?: string | null
          email?: string | null
          experience_years?: number
          fcm_token?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          job_type_preference?: string[]
          location?: string | null
          notify_deadlines?: boolean
          notify_new_jobs?: boolean
          onboarded?: boolean
          phone?: string | null
          salary_expectation?: string | null
          skills?: string[]
          subscription_tier?: string
          summary?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          education_level?: string | null
          email?: string | null
          experience_years?: number
          fcm_token?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          job_type_preference?: string[]
          location?: string | null
          notify_deadlines?: boolean
          notify_new_jobs?: boolean
          onboarded?: boolean
          phone?: string | null
          salary_expectation?: string | null
          skills?: string[]
          subscription_tier?: string
          summary?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          file_name: string | null
          file_url: string | null
          id: string
          parsed_text: string | null
          skills_extracted: string[]
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_name?: string | null
          file_url?: string | null
          id?: string
          parsed_text?: string | null
          skills_extracted?: string[]
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_name?: string | null
          file_url?: string | null
          id?: string
          parsed_text?: string | null
          skills_extracted?: string[]
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          id: string
          job_id: string
          notes: string | null
          saved_at: string
          user_id: string
        }
        Insert: {
          id?: string
          job_id: string
          notes?: string | null
          saved_at?: string
          user_id: string
        }
        Update: {
          id?: string
          job_id?: string
          notes?: string | null
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_usage: {
        Row: {
          ai_generations: number
          id: string
          searches: number
          usage_date: string
          user_id: string
        }
        Insert: {
          ai_generations?: number
          id?: string
          searches?: number
          usage_date?: string
          user_id: string
        }
        Update: {
          ai_generations?: number
          id?: string
          searches?: number
          usage_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
