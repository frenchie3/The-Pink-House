export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      cubbies: {
        Row: {
          created_at: string | null;
          cubby_number: string;
          id: string;
          location: string | null;
          notes: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          cubby_number: string;
          id?: string;
          location?: string | null;
          notes?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          cubby_number?: string;
          id?: string;
          location?: string | null;
          notes?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      cubby_rentals: {
        Row: {
          created_at: string | null;
          cubby_id: string;
          end_date: string;
          id: string;
          payment_status: string;
          rental_fee: number;
          seller_id: string;
          start_date: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          cubby_id: string;
          end_date: string;
          id?: string;
          payment_status?: string;
          rental_fee: number;
          seller_id: string;
          start_date?: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          cubby_id?: string;
          end_date?: string;
          id?: string;
          payment_status?: string;
          rental_fee?: number;
          seller_id?: string;
          start_date?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cubby_rentals_cubby_id_fkey";
            columns: ["cubby_id"];
            isOneToOne: false;
            referencedRelation: "cubbies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cubby_rentals_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      inventory_items: {
        Row: {
          barcode: string | null;
          category: string;
          commission_rate: number | null;
          condition: string | null;
          cubby_id: string | null;
          cubby_location: string | null;
          date_added: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          last_updated: string | null;
          listing_type: string | null;
          location: string | null;
          name: string;
          notes: string | null;
          price: number;
          quantity: number;
          seller_id: string | null;
          sku: string;
        };
        Insert: {
          barcode?: string | null;
          category: string;
          commission_rate?: number | null;
          condition?: string | null;
          cubby_id?: string | null;
          cubby_location?: string | null;
          date_added?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          last_updated?: string | null;
          listing_type?: string | null;
          location?: string | null;
          name: string;
          notes?: string | null;
          price: number;
          quantity?: number;
          seller_id?: string | null;
          sku: string;
        };
        Update: {
          barcode?: string | null;
          category?: string;
          commission_rate?: number | null;
          condition?: string | null;
          cubby_id?: string | null;
          cubby_location?: string | null;
          date_added?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          last_updated?: string | null;
          listing_type?: string | null;
          location?: string | null;
          name?: string;
          notes?: string | null;
          price?: number;
          quantity?: number;
          seller_id?: string | null;
          sku?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_items_cubby_id_fkey";
            columns: ["cubby_id"];
            isOneToOne: false;
            referencedRelation: "cubbies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_items_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          message: string;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message: string;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_items: {
        Row: {
          id: string;
          inventory_item_id: string | null;
          price_sold: number;
          quantity: number;
          sale_id: string | null;
        };
        Insert: {
          id?: string;
          inventory_item_id?: string | null;
          price_sold: number;
          quantity: number;
          sale_id?: string | null;
        };
        Update: {
          id?: string;
          inventory_item_id?: string | null;
          price_sold?: number;
          quantity?: number;
          sale_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sale_items_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      sales: {
        Row: {
          created_by: string | null;
          id: string;
          notes: string | null;
          payment_method: string | null;
          sale_date: string | null;
          total_amount: number;
        };
        Insert: {
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          payment_method?: string | null;
          sale_date?: string | null;
          total_amount: number;
        };
        Update: {
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          payment_method?: string | null;
          sale_date?: string | null;
          total_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sales_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      seller_earnings: {
        Row: {
          commission_amount: number;
          created_at: string | null;
          gross_amount: number;
          id: string;
          net_amount: number;
          payout_id: string | null;
          sale_item_id: string;
          seller_id: string;
        };
        Insert: {
          commission_amount: number;
          created_at?: string | null;
          gross_amount: number;
          id?: string;
          net_amount: number;
          payout_id?: string | null;
          sale_item_id: string;
          seller_id: string;
        };
        Update: {
          commission_amount?: number;
          created_at?: string | null;
          gross_amount?: number;
          id?: string;
          net_amount?: number;
          payout_id?: string | null;
          sale_item_id?: string;
          seller_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seller_earnings_payout_id_fkey";
            columns: ["payout_id"];
            isOneToOne: false;
            referencedRelation: "seller_payouts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seller_earnings_sale_item_id_fkey";
            columns: ["sale_item_id"];
            isOneToOne: false;
            referencedRelation: "sale_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seller_earnings_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      seller_payouts: {
        Row: {
          amount: number;
          created_at: string | null;
          id: string;
          notes: string | null;
          payout_date: string | null;
          seller_id: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          payout_date?: string | null;
          seller_id: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          payout_date?: string | null;
          seller_id?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "seller_payouts_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      system_settings: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          setting_key: string;
          setting_value: Json;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          setting_key: string;
          setting_value: Json;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          setting_key?: string;
          setting_value?: Json;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          credits: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          image: string | null;
          name: string | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          subscription: string | null;
          token_identifier: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          credits?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          image?: string | null;
          name?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          subscription?: string | null;
          token_identifier: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          credits?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          image?: string | null;
          name?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          subscription?: string | null;
          token_identifier?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: "admin" | "staff" | "seller";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
