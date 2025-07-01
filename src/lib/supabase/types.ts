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
      ai_models: {
        Row: {
          capabilities: Json | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_featured: boolean | null
          max_duration: number | null
          name: string
          pricing_credits: number
          provider: string
          sort_order: number | null
          status: string
          supported_aspect_ratios: string[] | null
          type: string
          updated_at: string | null
        }
        Insert: {
          capabilities?: Json | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_featured?: boolean | null
          max_duration?: number | null
          name: string
          pricing_credits?: number
          provider: string
          sort_order?: number | null
          status?: string
          supported_aspect_ratios?: string[] | null
          type: string
          updated_at?: string | null
        }
        Update: {
          capabilities?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_featured?: boolean | null
          max_duration?: number | null
          name?: string
          pricing_credits?: number
          provider?: string
          sort_order?: number | null
          status?: string
          supported_aspect_ratios?: string[] | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          bonus_percentage: number | null
          created_at: string | null
          credits: number
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          bonus_percentage?: number | null
          created_at?: string | null
          credits: number
          description?: string | null
          id: string
          is_active?: boolean | null
          name: string
          price: number
        }
        Update: {
          bonus_percentage?: number | null
          created_at?: string | null
          credits?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          generation_id: string | null
          id: string
          payment_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          generation_id?: string | null
          id?: string
          payment_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          generation_id?: string | null
          id?: string
          payment_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_tags: {
        Row: {
          created_at: string | null
          generation_id: string
          id: string
          tag: string
        }
        Insert: {
          created_at?: string | null
          generation_id: string
          id?: string
          tag: string
        }
        Update: {
          created_at?: string | null
          generation_id?: string
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_tags_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      generations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          credits_used: number
          error_message: string | null
          file_size: number | null
          id: string
          is_favorite: boolean
          is_public: boolean
          model: string
          negative_prompt: string | null
          parameters: Json | null
          processing_time_ms: number | null
          prompt: string
          result_url: string | null
          source_image_prompt: string | null
          source_image_url: string | null
          source_type: string | null
          status: string
          thumbnail_url: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          credits_used?: number
          error_message?: string | null
          file_size?: number | null
          id?: string
          is_favorite?: boolean
          is_public?: boolean
          model: string
          negative_prompt?: string | null
          parameters?: Json | null
          processing_time_ms?: number | null
          prompt: string
          result_url?: string | null
          source_image_prompt?: string | null
          source_image_url?: string | null
          source_type?: string | null
          status?: string
          thumbnail_url?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          credits_used?: number
          error_message?: string | null
          file_size?: number | null
          id?: string
          is_favorite?: boolean
          is_public?: boolean
          model?: string
          negative_prompt?: string | null
          parameters?: Json | null
          processing_time_ms?: number | null
          prompt?: string
          result_url?: string | null
          source_image_prompt?: string | null
          source_image_url?: string | null
          source_type?: string | null
          status?: string
          thumbnail_url?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          created_at: string | null
          file_path: string
          file_size: number
          filename: string
          generation_id: string | null
          height: number | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          mime_type: string
          original_filename: string | null
          updated_at: string | null
          user_id: string
          video_duration: number | null
          video_fps: number | null
          video_resolution: Json | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_size: number
          filename: string
          generation_id?: string | null
          height?: number | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          mime_type: string
          original_filename?: string | null
          updated_at?: string | null
          user_id: string
          video_duration?: number | null
          video_fps?: number | null
          video_resolution?: Json | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_size?: number
          filename?: string
          generation_id?: string | null
          height?: number | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          mime_type?: string
          original_filename?: string | null
          updated_at?: string | null
          user_id?: string
          video_duration?: number | null
          video_fps?: number | null
          video_resolution?: Json | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_files_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_files_user_id_fkey"
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
          clerk_user_id: string
          created_at: string | null
          credits: number | null
          email: string
          id: string
          name: string | null
          onboarding_completed: boolean | null
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          clerk_user_id: string
          created_at?: string | null
          credits?: number | null
          email: string
          id?: string
          name?: string | null
          onboarding_completed?: boolean | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          clerk_user_id?: string
          created_at?: string | null
          credits?: number | null
          email?: string
          id?: string
          name?: string | null
          onboarding_completed?: boolean | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_analytics: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          created_at: string | null
          credits: number
          credits_limit_per_month: number
          credits_used_this_month: number
          id: string
          last_reset_date: string
          subscription_expires_at: string | null
          subscription_status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits?: number
          credits_limit_per_month?: number
          credits_used_this_month?: number
          id?: string
          last_reset_date?: string
          subscription_expires_at?: string | null
          subscription_status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits?: number
          credits_limit_per_month?: number
          credits_used_this_month?: number
          id?: string
          last_reset_date?: string
          subscription_expires_at?: string | null
          subscription_status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string | null
          generation_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          generation_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          generation_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
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
      deduct_credits: {
        Args: { user_uuid: string; credits_to_deduct: number }
        Returns: boolean
      }
      get_user_stats: {
        Args: { user_uuid: string }
        Returns: Json
      }
      initialize_user_credits: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      reset_monthly_credits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
