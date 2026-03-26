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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      checkin_logs: {
        Row: {
          actual_guests: number | null
          checked_in_at: string | null
          checked_out_at: string | null
          checkin_notes: string | null
          checkin_staff_id: string | null
          checkout_notes: string | null
          checkout_staff_id: string | null
          created_at: string
          extra_charges: number | null
          id: string
          id_document: string | null
          reservation_id: string
          updated_at: string
        }
        Insert: {
          actual_guests?: number | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          checkin_notes?: string | null
          checkin_staff_id?: string | null
          checkout_notes?: string | null
          checkout_staff_id?: string | null
          created_at?: string
          extra_charges?: number | null
          id?: string
          id_document?: string | null
          reservation_id: string
          updated_at?: string
        }
        Update: {
          actual_guests?: number | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          checkin_notes?: string | null
          checkin_staff_id?: string | null
          checkout_notes?: string | null
          checkout_staff_id?: string | null
          created_at?: string
          extra_charges?: number | null
          id?: string
          id_document?: string | null
          reservation_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_logs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "daily_operations"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "checkin_logs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      consumptions: {
        Row: {
          cancelled: boolean
          created_at: string
          created_by: string | null
          description: string
          id: string
          quantity: number
          reservation_id: string
          total_price: number | null
          unit_price: number
        }
        Insert: {
          cancelled?: boolean
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          quantity?: number
          reservation_id: string
          total_price?: number | null
          unit_price?: number
        }
        Update: {
          cancelled?: boolean
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          quantity?: number
          reservation_id?: string
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "consumptions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "daily_operations"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "consumptions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          discount_fixed: number | null
          discount_percent: number | null
          id: string
          image_url: string | null
          title: string
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          discount_fixed?: number | null
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          discount_fixed?: number | null
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          check_in: string
          check_out: string
          client_id: string
          created_at: string
          guests_count: number
          id: string
          notes: string | null
          room_id: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          check_in: string
          check_out: string
          client_id: string
          created_at?: string
          guests_count?: number
          id?: string
          notes?: string | null
          room_id: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          client_id?: string
          created_at?: string
          guests_count?: number
          id?: string
          notes?: string | null
          room_id?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "daily_operations"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_status: {
        Row: {
          current_reservation_id: string | null
          housekeeping_status: string
          id: string
          notes: string | null
          occupancy_status: string
          room_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          current_reservation_id?: string | null
          housekeeping_status?: string
          id?: string
          notes?: string | null
          occupancy_status?: string
          room_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          current_reservation_id?: string | null
          housekeeping_status?: string
          id?: string
          notes?: string | null
          occupancy_status?: string
          room_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_status_current_reservation_id_fkey"
            columns: ["current_reservation_id"]
            isOneToOne: false
            referencedRelation: "daily_operations"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "room_status_current_reservation_id_fkey"
            columns: ["current_reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_status_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "daily_operations"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "room_status_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: string[] | null
          beds: string
          capacity: number
          category: string
          created_at: string
          description: string | null
          display_order: number
          gallery: string[] | null
          id: string
          image_url: string | null
          name: string
          price: number
          promotional_price: number | null
          status: string
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          beds?: string
          capacity?: number
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          gallery?: string[] | null
          id?: string
          image_url?: string | null
          name: string
          price?: number
          promotional_price?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          beds?: string
          capacity?: number
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          gallery?: string[] | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          promotional_price?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      daily_operations: {
        Row: {
          actual_guests: number | null
          check_in: string | null
          check_out: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          checkin_notes: string | null
          checkout_notes: string | null
          extra_charges: number | null
          guest_name: string | null
          guest_phone: string | null
          guests_count: number | null
          housekeeping_status: string | null
          id_document: string | null
          notes: string | null
          occupancy_status: string | null
          operation_status: string | null
          reservation_id: string | null
          room_category: string | null
          room_id: string | null
          room_name: string | null
          status: string | null
          total_price: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_room_availability: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_exclude_reservation_id?: string
          p_room_id: string
        }
        Returns: boolean
      }
      perform_checkin: {
        Args: {
          p_actual_guests?: number
          p_id_document?: string
          p_notes?: string
          p_reservation_id: string
          p_staff_id: string
        }
        Returns: Json
      }
      perform_checkout: {
        Args: {
          p_extra_charges?: number
          p_notes?: string
          p_reservation_id: string
          p_staff_id: string
        }
        Returns: Json
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
