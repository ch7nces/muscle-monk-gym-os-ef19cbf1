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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity: string | null
          entity_id: string | null
          gym_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string | null
          entity_id?: string | null
          gym_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string | null
          entity_id?: string | null
          gym_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          gym_id: string
          handled: boolean
          id: string
          message: string
          phone: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          gym_id: string
          handled?: boolean
          id?: string
          message: string
          phone: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          gym_id?: string
          handled?: boolean
          id?: string
          message?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          description: string | null
          gym_id: string
          id: string
          image_url: string | null
          is_published: boolean
          name: string
          sort_order: number
        }
        Insert: {
          description?: string | null
          gym_id: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          description?: string | null
          gym_id?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "facilities_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          gym_id: string
          id: string
          is_published: boolean
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          gym_id: string
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          gym_id?: string
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "faqs_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_settings: {
        Row: {
          about_text: string | null
          checkin_cooldown_minutes: number
          entrance_qr_ttl_seconds: number
          expiring_soon_days: number
          gym_id: string
          hours: Json
          trial_slot_capacity: number
          trial_slots: Json
          updated_at: string
        }
        Insert: {
          about_text?: string | null
          checkin_cooldown_minutes?: number
          entrance_qr_ttl_seconds?: number
          expiring_soon_days?: number
          gym_id: string
          hours?: Json
          trial_slot_capacity?: number
          trial_slots?: Json
          updated_at?: string
        }
        Update: {
          about_text?: string | null
          checkin_cooldown_minutes?: number
          entrance_qr_ttl_seconds?: number
          expiring_soon_days?: number
          gym_id?: string
          hours?: Json
          trial_slot_capacity?: number
          trial_slots?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_settings_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: true
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          address: string | null
          city: string | null
          country: string
          created_at: string
          id: string
          name: string
          name_hi: string | null
          phone: string | null
          postal_code: string | null
          slug: string
          state: string | null
          timezone: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          name: string
          name_hi?: string | null
          phone?: string | null
          postal_code?: string | null
          slug: string
          state?: string | null
          timezone?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          name?: string
          name_hi?: string | null
          phone?: string | null
          postal_code?: string | null
          slug?: string
          state?: string | null
          timezone?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          consent_to_contact: boolean
          created_at: string
          email: string | null
          fitness_goal: string | null
          full_name: string
          gym_id: string
          id: string
          notes: string | null
          phone: string
          source: string
          stage: string
        }
        Insert: {
          consent_to_contact?: boolean
          created_at?: string
          email?: string | null
          fitness_goal?: string | null
          full_name: string
          gym_id: string
          id?: string
          notes?: string | null
          phone: string
          source?: string
          stage?: string
        }
        Update: {
          consent_to_contact?: boolean
          created_at?: string
          email?: string | null
          fitness_goal?: string | null
          full_name?: string
          gym_id?: string
          id?: string
          notes?: string | null
          phone?: string
          source?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          archived_at: string | null
          category: string
          duration_days: number
          features: string[]
          gym_id: string
          id: string
          is_published: boolean
          is_recommended: boolean
          joining_fee: number
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          archived_at?: string | null
          category?: string
          duration_days: number
          features?: string[]
          gym_id: string
          id?: string
          is_published?: boolean
          is_recommended?: boolean
          joining_fee?: number
          name: string
          price: number
          sort_order?: number
        }
        Update: {
          archived_at?: string | null
          category?: string
          duration_days?: number
          features?: string[]
          gym_id?: string
          id?: string
          is_published?: boolean
          is_recommended?: boolean
          joining_fee?: number
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          consent_confirmed: boolean
          gym_id: string
          id: string
          is_published: boolean
          quote: string
          rating: number | null
          source: string | null
        }
        Insert: {
          author_name: string
          consent_confirmed?: boolean
          gym_id: string
          id?: string
          is_published?: boolean
          quote: string
          rating?: number | null
          source?: string | null
        }
        Update: {
          author_name?: string
          consent_confirmed?: boolean
          gym_id?: string
          id?: string
          is_published?: boolean
          quote?: string
          rating?: number | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      trainers: {
        Row: {
          experience_years: number | null
          full_name: string
          gym_id: string
          id: string
          is_active: boolean
          is_published: boolean
          photo_url: string | null
          qualifications: string | null
          specialization: string | null
          user_id: string | null
        }
        Insert: {
          experience_years?: number | null
          full_name: string
          gym_id: string
          id?: string
          is_active?: boolean
          is_published?: boolean
          photo_url?: string | null
          qualifications?: string | null
          specialization?: string | null
          user_id?: string | null
        }
        Update: {
          experience_years?: number | null
          full_name?: string
          gym_id?: string
          id?: string
          is_active?: boolean
          is_published?: boolean
          photo_url?: string | null
          qualifications?: string | null
          specialization?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainers_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      transformation_stories: {
        Row: {
          consent_confirmed: boolean
          gym_id: string
          id: string
          image_url: string | null
          is_published: boolean
          story: string
          title: string
        }
        Insert: {
          consent_confirmed?: boolean
          gym_id: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          story: string
          title: string
        }
        Update: {
          consent_confirmed?: boolean
          gym_id?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          story?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "transformation_stories_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_bookings: {
        Row: {
          created_at: string
          email: string | null
          fitness_goal: string | null
          full_name: string
          gym_id: string
          id: string
          lead_id: string | null
          phone: string
          preferred_date: string
          status: string
          time_slot: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          fitness_goal?: string | null
          full_name: string
          gym_id: string
          id?: string
          lead_id?: string | null
          phone: string
          preferred_date: string
          status?: string
          time_slot: string
        }
        Update: {
          created_at?: string
          email?: string | null
          fitness_goal?: string | null
          full_name?: string
          gym_id?: string
          id?: string
          lead_id?: string | null
          phone?: string
          preferred_date?: string
          status?: string
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_bookings_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          gym_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          gym_id: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          gym_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_gym_role: {
        Args: {
          _gym: string
          _roles: Database["public"]["Enums"]["app_role"][]
        }
        Returns: boolean
      }
      submit_public_request: {
        Args: {
          _consent: boolean
          _date: string
          _email: string
          _kind: string
          _message: string
          _name: string
          _phone: string
          _slot: string
          _slug: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "receptionist" | "trainer" | "member"
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
      app_role: ["owner", "manager", "receptionist", "trainer", "member"],
    },
  },
} as const
