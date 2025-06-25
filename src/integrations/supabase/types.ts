export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cleaning_records: {
        Row: {
          after_photo_url: string | null
          approval_status: string | null
          before_photo_url: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          rating: number | null
          staff_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["cleaning_status"] | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
          washroom_id: string | null
        }
        Insert: {
          after_photo_url?: string | null
          approval_status?: string | null
          before_photo_url?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          staff_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["cleaning_status"] | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          washroom_id?: string | null
        }
        Update: {
          after_photo_url?: string | null
          approval_status?: string | null
          before_photo_url?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          staff_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["cleaning_status"] | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          washroom_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_records_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_records_washroom_id_fkey"
            columns: ["washroom_id"]
            isOneToOne: false
            referencedRelation: "washrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_sessions: {
        Row: {
          expires_at: string | null
          id: string
          is_active: boolean | null
          qr_scanned_at: string | null
          session_token: string
          staff_id: string | null
          washroom_id: string | null
        }
        Insert: {
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          qr_scanned_at?: string | null
          session_token: string
          staff_id?: string | null
          washroom_id?: string | null
        }
        Update: {
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          qr_scanned_at?: string | null
          session_token?: string
          staff_id?: string | null
          washroom_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_sessions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_sessions_washroom_id_fkey"
            columns: ["washroom_id"]
            isOneToOne: false
            referencedRelation: "washrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          coach_number: string
          coach_type: string | null
          created_at: string | null
          id: string
          qr_code: string
          train_id: string | null
          washroom_count: number | null
        }
        Insert: {
          coach_number: string
          coach_type?: string | null
          created_at?: string | null
          id?: string
          qr_code: string
          train_id?: string | null
          washroom_count?: number | null
        }
        Update: {
          coach_number?: string
          coach_type?: string | null
          created_at?: string | null
          id?: string
          qr_code?: string
          train_id?: string | null
          washroom_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coaches_train_id_fkey"
            columns: ["train_id"]
            isOneToOne: false
            referencedRelation: "trains"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_sessions: {
        Row: {
          coach_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          otp_code: string
          staff_id: string | null
          train_id: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          otp_code: string
          staff_id?: string | null
          train_id?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          otp_code?: string
          staff_id?: string | null
          train_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "otp_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "otp_sessions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "otp_sessions_train_id_fkey"
            columns: ["train_id"]
            isOneToOne: false
            referencedRelation: "trains"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          employee_id: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          employee_id: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          employee_id?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          assigned_at: string | null
          id: string
          is_active: boolean | null
          train_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          is_active?: boolean | null
          train_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          id?: string
          is_active?: boolean | null
          train_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_train_id_fkey"
            columns: ["train_id"]
            isOneToOne: false
            referencedRelation: "trains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trains: {
        Row: {
          created_at: string | null
          id: string
          route: string
          status: Database["public"]["Enums"]["train_status"] | null
          total_coaches: number
          train_name: string
          train_number: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          route: string
          status?: Database["public"]["Enums"]["train_status"] | null
          total_coaches?: number
          train_name: string
          train_number: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          route?: string
          status?: Database["public"]["Enums"]["train_status"] | null
          total_coaches?: number
          train_name?: string
          train_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      washrooms: {
        Row: {
          coach_id: string | null
          created_at: string | null
          id: string
          location_description: string | null
          qr_code: string
          washroom_number: string
          washroom_type: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          id?: string
          location_description?: string | null
          qr_code: string
          washroom_number: string
          washroom_type?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          id?: string
          location_description?: string | null
          qr_code?: string
          washroom_number?: string
          washroom_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "washrooms_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin_or_supervisor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      cleaning_status: "pending" | "in_progress" | "completed" | "verified"
      train_status: "active" | "maintenance" | "out_of_service"
      user_role: "admin" | "supervisor" | "laborer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cleaning_status: ["pending", "in_progress", "completed", "verified"],
      train_status: ["active", "maintenance", "out_of_service"],
      user_role: ["admin", "supervisor", "laborer"],
    },
  },
} as const
