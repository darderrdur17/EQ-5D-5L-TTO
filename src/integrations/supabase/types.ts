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
      ai_copilot_logs: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string
          session_id: string
          stage: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type: string
          session_id: string
          stage?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          session_id?: string
          stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_copilot_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      dce_responses: {
        Row: {
          chosen_state: string
          created_at: string
          id: string
          session_id: string
          state_a: string
          state_b: string
          task_number: number
          time_spent_seconds: number | null
        }
        Insert: {
          chosen_state: string
          created_at?: string
          id?: string
          session_id: string
          state_a: string
          state_b: string
          task_number: number
          time_spent_seconds?: number | null
        }
        Update: {
          chosen_state?: string
          created_at?: string
          id?: string
          session_id?: string
          state_a?: string
          state_b?: string
          task_number?: number
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dce_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      demographics: {
        Row: {
          age: number | null
          created_at: string
          education: string | null
          employment: string | null
          ethnicity: string | null
          gender: string | null
          id: string
          marital_status: string | null
          session_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          education?: string | null
          employment?: string | null
          ethnicity?: string | null
          gender?: string | null
          id?: string
          marital_status?: string | null
          session_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          education?: string | null
          employment?: string | null
          ethnicity?: string | null
          gender?: string | null
          id?: string
          marital_status?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demographics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_report_schedules: {
        Row: {
          admin_id: string
          created_at: string
          email_address: string
          id: string
          is_active: boolean
          last_sent_at: string | null
          schedule_type: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          email_address: string
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          schedule_type: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          email_address?: string
          id?: string
          is_active?: boolean
          last_sent_at?: string | null
          schedule_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      eq5d_responses: {
        Row: {
          anxiety_depression: number
          created_at: string
          id: string
          mobility: number
          pain_discomfort: number
          self_care: number
          session_id: string
          usual_activities: number
          vas_score: number | null
        }
        Insert: {
          anxiety_depression: number
          created_at?: string
          id?: string
          mobility: number
          pain_discomfort: number
          self_care: number
          session_id: string
          usual_activities: number
          vas_score?: number | null
        }
        Update: {
          anxiety_depression?: number
          created_at?: string
          id?: string
          mobility?: number
          pain_discomfort?: number
          self_care?: number
          session_id?: string
          usual_activities?: number
          vas_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "eq5d_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: string
          id: string
          interviewer_id: string
          language: string
          quality_notes: string | null
          quality_reviewed_at: string | null
          quality_reviewed_by: string | null
          quality_status: string | null
          respondent_code: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: string
          id?: string
          interviewer_id: string
          language?: string
          quality_notes?: string | null
          quality_reviewed_at?: string | null
          quality_reviewed_by?: string | null
          quality_status?: string | null
          respondent_code: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: string
          id?: string
          interviewer_id?: string
          language?: string
          quality_notes?: string | null
          quality_reviewed_at?: string | null
          quality_reviewed_by?: string | null
          quality_status?: string | null
          respondent_code?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          interviewer_id: string
          is_read: boolean
          message: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          interviewer_id: string
          is_read?: boolean
          message: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          interviewer_id?: string
          is_read?: boolean
          message?: string
        }
        Relationships: []
      }
      performance_goals: {
        Row: {
          created_at: string
          current_value: number
          goal_type: string
          id: string
          interviewer_id: string
          period_end: string
          period_start: string
          status: string
          target_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          goal_type: string
          id?: string
          interviewer_id: string
          period_end: string
          period_start: string
          status?: string
          target_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number
          goal_type?: string
          id?: string
          interviewer_id?: string
          period_end?: string
          period_start?: string
          status?: string
          target_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          session_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tto_responses: {
        Row: {
          created_at: string
          final_value: number
          flag_reason: string | null
          flagged: boolean
          health_state: string
          id: string
          is_worse_than_death: boolean
          lead_time_value: number | null
          moves_count: number | null
          session_id: string
          task_number: number
          time_spent_seconds: number | null
        }
        Insert: {
          created_at?: string
          final_value: number
          flag_reason?: string | null
          flagged?: boolean
          health_state: string
          id?: string
          is_worse_than_death?: boolean
          lead_time_value?: number | null
          moves_count?: number | null
          session_id: string
          task_number: number
          time_spent_seconds?: number | null
        }
        Update: {
          created_at?: string
          final_value?: number
          flag_reason?: string | null
          flagged?: boolean
          health_state?: string
          id?: string
          is_worse_than_death?: boolean
          lead_time_value?: number | null
          moves_count?: number | null
          session_id?: string
          task_number?: number
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tto_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "interviewer"
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
    Enums: {
      app_role: ["admin", "interviewer"],
    },
  },
} as const
