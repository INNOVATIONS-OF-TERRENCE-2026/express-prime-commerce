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
      ai_decisions: {
        Row: {
          applied_at: string | null
          confidence: number | null
          created_at: string
          decision_type: string
          id: string
          new_value: Json | null
          old_value: Json | null
          product_id: string | null
          reason: string
          was_applied: boolean | null
        }
        Insert: {
          applied_at?: string | null
          confidence?: number | null
          created_at?: string
          decision_type: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          product_id?: string | null
          reason: string
          was_applied?: boolean | null
        }
        Update: {
          applied_at?: string | null
          confidence?: number | null
          created_at?: string
          decision_type?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          product_id?: string | null
          reason?: string
          was_applied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_decisions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "ai_decisions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          handle: string | null
          id: string
          image_url: string | null
          is_synced: boolean | null
          last_synced_at: string | null
          products_count: number | null
          shopify_collection_id: string | null
          shopify_installation_id: string | null
          sort_order: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          handle?: string | null
          id?: string
          image_url?: string | null
          is_synced?: boolean | null
          last_synced_at?: string | null
          products_count?: number | null
          shopify_collection_id?: string | null
          shopify_installation_id?: string | null
          sort_order?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          handle?: string | null
          id?: string
          image_url?: string | null
          is_synced?: boolean | null
          last_synced_at?: string | null
          products_count?: number | null
          shopify_collection_id?: string | null
          shopify_installation_id?: string | null
          sort_order?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_shopify_installation_id_fkey"
            columns: ["shopify_installation_id"]
            isOneToOne: false
            referencedRelation: "shopify_installations"
            referencedColumns: ["id"]
          },
        ]
      }
      global_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      orders: {
        Row: {
          cancelled_at: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          estimated_cost: number | null
          estimated_profit: number | null
          fulfilled_at: string | null
          id: string
          line_items: Json | null
          order_number: string | null
          profit_margin_percent: number | null
          refunded_at: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          shopify_installation_id: string | null
          shopify_order_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number | null
          total_discounts: number | null
          total_price: number | null
          total_tax: number | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          estimated_cost?: number | null
          estimated_profit?: number | null
          fulfilled_at?: string | null
          id?: string
          line_items?: Json | null
          order_number?: string | null
          profit_margin_percent?: number | null
          refunded_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shopify_installation_id?: string | null
          shopify_order_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          total_discounts?: number | null
          total_price?: number | null
          total_tax?: number | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          estimated_cost?: number | null
          estimated_profit?: number | null
          fulfilled_at?: string | null
          id?: string
          line_items?: Json | null
          order_number?: string | null
          profit_margin_percent?: number | null
          refunded_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shopify_installation_id?: string | null
          shopify_order_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          total_discounts?: number | null
          total_price?: number | null
          total_tax?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_shopify_installation_id_fkey"
            columns: ["shopify_installation_id"]
            isOneToOne: false
            referencedRelation: "shopify_installations"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          ad_spend: number | null
          add_to_carts: number | null
          cost: number | null
          created_at: string
          date: string
          id: string
          orders_count: number | null
          product_id: string | null
          profit: number | null
          refund_amount: number | null
          refund_count: number | null
          revenue: number | null
          units_sold: number | null
          views: number | null
        }
        Insert: {
          ad_spend?: number | null
          add_to_carts?: number | null
          cost?: number | null
          created_at?: string
          date: string
          id?: string
          orders_count?: number | null
          product_id?: string | null
          profit?: number | null
          refund_amount?: number | null
          refund_count?: number | null
          revenue?: number | null
          units_sold?: number | null
          views?: number | null
        }
        Update: {
          ad_spend?: number | null
          add_to_carts?: number | null
          cost?: number | null
          created_at?: string
          date?: string
          id?: string
          orders_count?: number | null
          product_id?: string | null
          profit?: number | null
          refund_amount?: number | null
          refund_count?: number | null
          revenue?: number | null
          units_sold?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "performance_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          compare_at_price: number | null
          cost: number | null
          created_at: string
          description: string | null
          handle: string | null
          id: string
          image_url: string | null
          images: Json | null
          inventory_quantity: number | null
          is_synced: boolean | null
          last_synced_at: string | null
          margin_percent: number | null
          price: number | null
          product_type: string | null
          shopify_installation_id: string | null
          shopify_product_id: string | null
          shopify_variant_id: string | null
          status: Database["public"]["Enums"]["product_status"]
          tags: string[] | null
          title: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          compare_at_price?: number | null
          cost?: number | null
          created_at?: string
          description?: string | null
          handle?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          inventory_quantity?: number | null
          is_synced?: boolean | null
          last_synced_at?: string | null
          margin_percent?: number | null
          price?: number | null
          product_type?: string | null
          shopify_installation_id?: string | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          compare_at_price?: number | null
          cost?: number | null
          created_at?: string
          description?: string | null
          handle?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          inventory_quantity?: number | null
          is_synced?: boolean | null
          last_synced_at?: string | null
          margin_percent?: number | null
          price?: number | null
          product_type?: string | null
          shopify_installation_id?: string | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_shopify_installation_id_fkey"
            columns: ["shopify_installation_id"]
            isOneToOne: false
            referencedRelation: "shopify_installations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopify_installations: {
        Row: {
          access_token_encrypted: string | null
          id: string
          installed_at: string
          is_active: boolean
          scopes: string[] | null
          shop_domain: string
          shop_name: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted?: string | null
          id?: string
          installed_at?: string
          is_active?: boolean
          scopes?: string[] | null
          shop_domain: string
          shop_name?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string | null
          id?: string
          installed_at?: string
          is_active?: boolean
          scopes?: string[] | null
          shop_domain?: string
          shop_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sync_items: {
        Row: {
          created_at: string
          error_message: string | null
          external_id: string | null
          id: string
          input_data: Json | null
          item_type: string
          processed_at: string | null
          result_data: Json | null
          status: Database["public"]["Enums"]["sync_status"]
          sync_run_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          input_data?: Json | null
          item_type: string
          processed_at?: string | null
          result_data?: Json | null
          status?: Database["public"]["Enums"]["sync_status"]
          sync_run_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          input_data?: Json | null
          item_type?: string
          processed_at?: string | null
          result_data?: Json | null
          status?: Database["public"]["Enums"]["sync_status"]
          sync_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_items_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          failed_items: number | null
          id: string
          initiated_by: string | null
          processed_items: number | null
          shopify_installation_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["sync_status"]
          successful_items: number | null
          sync_type: string
          total_items: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_items?: number | null
          id?: string
          initiated_by?: string | null
          processed_items?: number | null
          shopify_installation_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["sync_status"]
          successful_items?: number | null
          sync_type: string
          total_items?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_items?: number | null
          id?: string
          initiated_by?: string | null
          processed_items?: number | null
          shopify_installation_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["sync_status"]
          successful_items?: number | null
          sync_type?: string
          total_items?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_runs_shopify_installation_id_fkey"
            columns: ["shopify_installation_id"]
            isOneToOne: false
            referencedRelation: "shopify_installations"
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
      product_analytics: {
        Row: {
          conversion_rate_percent: number | null
          created_at: string | null
          handle: string | null
          inventory_quantity: number | null
          last_metric_date: string | null
          margin_percent: number | null
          price: number | null
          product_id: string | null
          refund_rate_percent: number | null
          status: Database["public"]["Enums"]["product_status"] | null
          title: string | null
          total_add_to_carts: number | null
          total_orders: number | null
          total_refund_amount: number | null
          total_refunds: number | null
          total_revenue: number | null
          total_views: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bulk_seed_products: {
        Args: { products: Json }
        Returns: {
          inserted_count: number
          updated_count: number
        }[]
      }
      has_any_role: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_founder: { Args: never; Returns: boolean }
      is_operator: { Args: never; Returns: boolean }
      seed_product: {
        Args: {
          p_compare_at_price: number
          p_description: string
          p_handle: string
          p_image_url: string
          p_price: number
          p_product_type: string
          p_status?: string
          p_tags: string[]
          p_title: string
          p_vendor: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "founder" | "admin" | "operator"
      order_status: "pending" | "paid" | "fulfilled" | "cancelled" | "refunded"
      product_status: "active" | "paused" | "killed" | "draft"
      sync_status: "pending" | "processing" | "completed" | "failed"
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
      app_role: ["founder", "admin", "operator"],
      order_status: ["pending", "paid", "fulfilled", "cancelled", "refunded"],
      product_status: ["active", "paused", "killed", "draft"],
      sync_status: ["pending", "processing", "completed", "failed"],
    },
  },
} as const
