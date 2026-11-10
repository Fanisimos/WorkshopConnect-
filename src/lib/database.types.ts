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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          checked_in_at: string
          id: string
          student_id: string
          workshop_id: string
        }
        Insert: {
          checked_in_at?: string
          id?: string
          student_id: string
          workshop_id: string
        }
        Update: {
          checked_in_at?: string
          id?: string
          student_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          student_id: string
          workshop_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          student_id?: string
          workshop_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          student_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_pulse_responses: {
        Row: {
          confidence_after: number
          confidence_before: number
          confidence_change: number | null
          created_at: string
          id: string
          student_id: string
          support_topic: string | null
          workshop_id: string
        }
        Insert: {
          confidence_after: number
          confidence_before: number
          confidence_change?: number | null
          created_at?: string
          id?: string
          student_id?: string
          support_topic?: string | null
          workshop_id: string
        }
        Update: {
          confidence_after?: number
          confidence_before?: number
          confidence_change?: number | null
          created_at?: string
          id?: string
          student_id?: string
          support_topic?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_pulse_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_pulse_responses_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      resource_requests: {
        Row: {
          created_at: string
          description: string
          fulfilled_at: string | null
          id: string
          organiser_note: string | null
          resource_id: string | null
          status: Database["public"]["Enums"]["request_status"]
          student_id: string
          topic: string | null
          updated_at: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          description: string
          fulfilled_at?: string | null
          id?: string
          organiser_note?: string | null
          resource_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          student_id?: string
          topic?: string | null
          updated_at?: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          description?: string
          fulfilled_at?: string | null
          id?: string
          organiser_note?: string | null
          resource_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          student_id?: string
          topic?: string | null
          updated_at?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_resource_same_workshop"
            columns: ["resource_id", "workshop_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id", "workshop_id"]
          },
          {
            foreignKeyName: "resource_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_requests_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          id: string
          organiser_id: string
          title: string
          topic: string | null
          url: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organiser_id?: string
          title: string
          topic?: string | null
          url: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organiser_id?: string
          title?: string
          topic?: string | null
          url?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_organiser_id_fkey"
            columns: ["organiser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_qr_tokens: {
        Row: {
          created_at: string
          token: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          token?: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          token?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_qr_tokens_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: true
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          created_at: string
          description: string
          ends_at: string
          focus_topics: string[]
          id: string
          location: string
          organiser_id: string
          starts_at: string
          status: Database["public"]["Enums"]["workshop_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          ends_at: string
          focus_topics?: string[]
          id?: string
          location: string
          organiser_id?: string
          starts_at: string
          status?: Database["public"]["Enums"]["workshop_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          ends_at?: string
          focus_topics?: string[]
          id?: string
          location?: string
          organiser_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["workshop_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshops_organiser_id_fkey"
            columns: ["organiser_id"]
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
      check_in: { Args: { p_token: string }; Returns: Json }
      has_attended: { Args: { p_workshop_id: string }; Returns: boolean }
      is_organiser: { Args: never; Returns: boolean }
      owns_workshop: { Args: { p_workshop_id: string }; Returns: boolean }
      promote_to_organiser: { Args: { p_email: string }; Returns: undefined }
    }
    Enums: {
      request_status: "pending" | "in_progress" | "fulfilled"
      user_role: "student" | "organiser"
      workshop_status: "draft" | "published" | "completed" | "cancelled"
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
    Enums: {
      request_status: ["pending", "in_progress", "fulfilled"],
      user_role: ["student", "organiser"],
      workshop_status: ["draft", "published", "completed", "cancelled"],
    },
  },
} as const
