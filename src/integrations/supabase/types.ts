export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      banners: {
        Row: {
          active: boolean;
          created_at: string;
          display_order: number;
          id: string;
          image_url: string;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          display_order?: number;
          id?: string;
          image_url: string;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          display_order?: number;
          id?: string;
          image_url?: string;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      checkin_logs: {
        Row: {
          actual_guests: number | null;
          checked_in_at: string | null;
          checked_out_at: string | null;
          checkin_notes: string | null;
          checkin_staff_id: string | null;
          checkout_notes: string | null;
          checkout_staff_id: string | null;
          created_at: string;
          extra_charges: number | null;
          id: string;
          id_document: string | null;
          reservation_id: string;
          updated_at: string;
        };
        Insert: {
          actual_guests?: number | null;
          checked_in_at?: string | null;
          checked_out_at?: string | null;
          checkin_notes?: string | null;
          checkin_staff_id?: string | null;
          checkout_notes?: string | null;
          checkout_staff_id?: string | null;
          created_at?: string;
          extra_charges?: number | null;
          id?: string;
          id_document?: string | null;
          reservation_id: string;
          updated_at?: string;
        };
        Update: {
          actual_guests?: number | null;
          checked_in_at?: string | null;
          checked_out_at?: string | null;
          checkin_notes?: string | null;
          checkin_staff_id?: string | null;
          checkout_notes?: string | null;
          checkout_staff_id?: string | null;
          created_at?: string;
          extra_charges?: number | null;
          id?: string;
          id_document?: string | null;
          reservation_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checkin_logs_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "daily_operations";
            referencedColumns: ["reservation_id"];
          },
          {
            foreignKeyName: "checkin_logs_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "operations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkin_logs_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      consumption_items: {
        Row: {
          available: boolean;
          category: string;
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          name: string;
          price: number;
          updated_at: string;
        };
        Insert: {
          available?: boolean;
          category?: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          name: string;
          price?: number;
          updated_at?: string;
        };
        Update: {
          available?: boolean;
          category?: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          name?: string;
          price?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      consumption_orders: {
        Row: {
          created_at: string;
          id: string;
          item_id: string | null;
          item_name: string;
          notes: string | null;
          quantity: number;
          reservation_id: string | null;
          room_number: string;
          status: string;
          total: number;
          unit_price: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_id?: string | null;
          item_name: string;
          notes?: string | null;
          quantity?: number;
          reservation_id?: string | null;
          room_number: string;
          status?: string;
          total?: number;
          unit_price?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string | null;
          item_name?: string;
          notes?: string | null;
          quantity?: number;
          reservation_id?: string | null;
          room_number?: string;
          status?: string;
          total?: number;
          unit_price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "consumption_orders_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "consumption_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "consumption_orders_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "daily_operations";
            referencedColumns: ["reservation_id"];
          },
          {
            foreignKeyName: "consumption_orders_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "operations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "consumption_orders_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      guests: {
        Row: {
          cpf: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          phone: string | null;
        };
        Insert: {
          cpf?: string | null;
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          phone?: string | null;
        };
        Update: {
          cpf?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          phone?: string | null;
        };
        Relationships: [];
      };
      hall_bookings: {
        Row: {
          client_email: string | null;
          client_name: string;
          client_phone: string | null;
          created_at: string;
          end_time: string;
          event_date: string;
          event_type: string;
          guests_count: number;
          id: string;
          notes: string | null;
          start_time: string;
          status: string;
          total_price: number;
          updated_at: string;
        };
        Insert: {
          client_email?: string | null;
          client_name: string;
          client_phone?: string | null;
          created_at?: string;
          end_time?: string;
          event_date: string;
          event_type?: string;
          guests_count?: number;
          id?: string;
          notes?: string | null;
          start_time?: string;
          status?: string;
          total_price?: number;
          updated_at?: string;
        };
        Update: {
          client_email?: string | null;
          client_name?: string;
          client_phone?: string | null;
          created_at?: string;
          end_time?: string;
          event_date?: string;
          event_type?: string;
          guests_count?: number;
          id?: string;
          notes?: string | null;
          start_time?: string;
          status?: string;
          total_price?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      hotel_info: {
        Row: {
          active: boolean | null;
          content: string;
          created_at: string | null;
          display_order: number | null;
          icon: string | null;
          id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          content: string;
          created_at?: string | null;
          display_order?: number | null;
          icon?: string | null;
          id?: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          content?: string;
          created_at?: string | null;
          display_order?: number | null;
          icon?: string | null;
          id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      hotel_media: {
        Row: {
          category: string;
          created_at: string;
          file_name: string;
          file_path: string;
          id: string;
          public_url: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          file_name: string;
          file_path: string;
          id?: string;
          public_url: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          file_name?: string;
          file_path?: string;
          id?: string;
          public_url?: string;
        };
        Relationships: [];
      };
      hotel_settings: {
        Row: {
          key: string;
          updated_at: string | null;
          value: string | null;
        };
        Insert: {
          key: string;
          updated_at?: string | null;
          value?: string | null;
        };
        Update: {
          key?: string;
          updated_at?: string | null;
          value?: string | null;
        };
        Relationships: [];
      };
      pool_config: {
        Row: {
          close_time: string;
          id: string;
          max_capacity: number;
          open_time: string;
          rules: string[];
          status: string;
          updated_at: string;
        };
        Insert: {
          close_time?: string;
          id?: string;
          max_capacity?: number;
          open_time?: string;
          rules?: string[];
          status?: string;
          updated_at?: string;
        };
        Update: {
          close_time?: string;
          id?: string;
          max_capacity?: number;
          open_time?: string;
          rules?: string[];
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pool_incidents: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          incident_date: string;
          incident_time: string;
          resolved: boolean;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          incident_date?: string;
          incident_time?: string;
          resolved?: boolean;
          type?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          incident_date?: string;
          incident_time?: string;
          resolved?: boolean;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      popup_config: {
        Row: {
          button_text: string | null;
          collect_email: boolean | null;
          description: string | null;
          enabled: boolean | null;
          id: number;
          subtitle: string | null;
          success_message: string | null;
          title: string | null;
        };
        Insert: {
          button_text?: string | null;
          collect_email?: boolean | null;
          description?: string | null;
          enabled?: boolean | null;
          id?: number;
          subtitle?: string | null;
          success_message?: string | null;
          title?: string | null;
        };
        Update: {
          button_text?: string | null;
          collect_email?: boolean | null;
          description?: string | null;
          enabled?: boolean | null;
          id?: number;
          subtitle?: string | null;
          success_message?: string | null;
          title?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          address: string | null;
          city: string | null;
          cpf: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: string;
          state: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          cpf?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: string;
          state?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          cpf?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: string;
          state?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      promotions: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          discount_fixed: number | null;
          discount_percent: number | null;
          id: string;
          image_url: string | null;
          title: string;
          updated_at: string;
          valid_from: string;
          valid_until: string | null;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          discount_fixed?: number | null;
          discount_percent?: number | null;
          id?: string;
          image_url?: string | null;
          title: string;
          updated_at?: string;
          valid_from?: string;
          valid_until?: string | null;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          discount_fixed?: number | null;
          discount_percent?: number | null;
          id?: string;
          image_url?: string | null;
          title?: string;
          updated_at?: string;
          valid_from?: string;
          valid_until?: string | null;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          check_in: string;
          check_out: string;
          checked_in_at: string | null;
          checked_out_at: string | null;
          client_id: string | null;
          created_at: string;
          guest_id: string | null;
          guests_count: number;
          id: string;
          notes: string | null;
          profile_id: string | null;
          room_id: string;
          status: string;
          total_price: number;
          updated_at: string;
        };
        Insert: {
          check_in: string;
          check_out: string;
          checked_in_at?: string | null;
          checked_out_at?: string | null;
          client_id?: string | null;
          created_at?: string;
          guest_id?: string | null;
          guests_count?: number;
          id?: string;
          notes?: string | null;
          profile_id?: string | null;
          room_id: string;
          status?: string;
          total_price?: number;
          updated_at?: string;
        };
        Update: {
          check_in?: string;
          check_out?: string;
          checked_in_at?: string | null;
          checked_out_at?: string | null;
          client_id?: string | null;
          created_at?: string;
          guest_id?: string | null;
          guests_count?: number;
          id?: string;
          notes?: string | null;
          profile_id?: string | null;
          room_id?: string;
          status?: string;
          total_price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_guest_id_fkey";
            columns: ["guest_id"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          amenities: string[] | null;
          beds: string;
          capacity: number;
          category: string;
          created_at: string;
          description: string | null;
          display_order: number;
          gallery: string[] | null;
          id: string;
          image_url: string | null;
          name: string;
          price: number;
          promotional_price: number | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          amenities?: string[] | null;
          beds?: string;
          capacity?: number;
          category?: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          gallery?: string[] | null;
          id?: string;
          image_url?: string | null;
          name: string;
          price?: number;
          promotional_price?: number | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          amenities?: string[] | null;
          beds?: string;
          capacity?: number;
          category?: string;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          gallery?: string[] | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          price?: number;
          promotional_price?: number | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      daily_operations: {
        Row: {
          check_in: string | null;
          check_out: string | null;
          guest_name: string | null;
          guest_phone: string | null;
          guests_count: number | null;
          notes: string | null;
          operation_status: string | null;
          profile_id: string | null;
          reservation_id: string | null;
          room_category: string | null;
          room_id: string | null;
          room_name: string | null;
          status: string | null;
          total_price: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      operations: {
        Row: {
          check_in: string | null;
          check_out: string | null;
          client_id: string | null;
          created_at: string | null;
          guests_count: number | null;
          id: string | null;
          notes: string | null;
          profile_id: string | null;
          room_id: string | null;
          status: string | null;
          total_price: number | null;
          updated_at: string | null;
        };
        Insert: {
          check_in?: string | null;
          check_out?: string | null;
          client_id?: string | null;
          created_at?: string | null;
          guests_count?: number | null;
          id?: string | null;
          notes?: string | null;
          profile_id?: string | null;
          room_id?: string | null;
          status?: string | null;
          total_price?: number | null;
          updated_at?: string | null;
        };
        Update: {
          check_in?: string | null;
          check_out?: string | null;
          client_id?: string | null;
          created_at?: string | null;
          guests_count?: number | null;
          id?: string | null;
          notes?: string | null;
          profile_id?: string | null;
          room_id?: string | null;
          status?: string | null;
          total_price?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      check_room_availability: {
        Args: {
          p_check_in: string;
          p_check_out: string;
          p_exclude_reservation_id?: string;
          p_room_id: string;
        };
        Returns: boolean;
      };
      perform_checkin: {
        Args: {
          p_actual_guests?: number;
          p_id_document?: string;
          p_notes?: string;
          p_reservation_id: string;
          p_staff_id: string;
        };
        Returns: Json;
      };
      perform_checkout: {
        Args: {
          p_extra_charges?: number;
          p_notes?: string;
          p_reservation_id: string;
          p_staff_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
