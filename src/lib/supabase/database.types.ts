export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          id: string
          note: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          note?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          note?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_config: {
        Row: {
          anti_snipe_minutes: number
          auction_end_at: string
          auction_start_at: string
          created_at: string
          id: string
          listing_id: string
          min_increment: number
          starting_price: number
          updated_at: string
        }
        Insert: {
          anti_snipe_minutes?: number
          auction_end_at: string
          auction_start_at?: string
          created_at?: string
          id?: string
          listing_id: string
          min_increment?: number
          starting_price: number
          updated_at?: string
        }
        Update: {
          anti_snipe_minutes?: number
          auction_end_at?: string
          auction_start_at?: string
          created_at?: string
          id?: string
          listing_id?: string
          min_increment?: number
          starting_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_config_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_config_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_config_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_config_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "mv_trending_listings"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      auto_bids: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          listing_id: string
          max_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          listing_id: string
          max_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          listing_id?: string
          max_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "auto_bids_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount: number
          bidder_id: string
          created_at: string
          id: string
          is_auto_bid: boolean
          listing_id: string
          status: Database["public"]["Enums"]["bid_status"]
        }
        Insert: {
          amount: number
          bidder_id: string
          created_at?: string
          id?: string
          is_auto_bid?: boolean
          listing_id: string
          status?: Database["public"]["Enums"]["bid_status"]
        }
        Update: {
          amount?: number
          bidder_id?: string
          created_at?: string
          id?: string
          is_auto_bid?: boolean
          listing_id?: string
          status?: Database["public"]["Enums"]["bid_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bids_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_listings"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          platform: Database["public"]["Enums"]["platform_type"]
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          platform: Database["public"]["Enums"]["platform_type"]
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          platform?: Database["public"]["Enums"]["platform_type"]
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          added_at: string
          cart_id: string
          id: string
          listing_id: string
          qty: number
          snapshot_price: number
        }
        Insert: {
          added_at?: string
          cart_id: string
          id?: string
          listing_id: string
          qty?: number
          snapshot_price: number
        }
        Update: {
          added_at?: string
          cart_id?: string
          id?: string
          listing_id?: string
          qty?: number
          snapshot_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_listings"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon_url: string | null
          id: string
          inspection_schema: Json
          is_active: boolean
          name: string
          parent_id: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          position: number
          slug: string
          spec_schema: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_url?: string | null
          id?: string
          inspection_schema?: Json
          is_active?: boolean
          name: string
          parent_id?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          position?: number
          slug: string
          spec_schema?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_url?: string | null
          id?: string
          inspection_schema?: Json
          is_active?: boolean
          name?: string
          parent_id?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          position?: number
          slug?: string
          spec_schema?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "mv_category_counts"
            referencedColumns: ["category_id"]
          },
        ]
      }
      chatbot_sessions: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          messages: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          messages?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          messages?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          listing_id: string | null
          order_id: string | null
          seller_id: string
          unread_count_buyer: number
          unread_count_seller: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          listing_id?: string | null
          order_id?: string | null
          seller_id: string
          unread_count_buyer?: number
          unread_count_seller?: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          listing_id?: string | null
          order_id?: string | null
          seller_id?: string
          unread_count_buyer?: number
          unread_count_seller?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          description: string
          evidence_urls: Json
          id: string
          opened_by: string
          order_id: string
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          description: string
          evidence_urls?: Json
          id?: string
          opened_by: string
          order_id: string
          reason: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          description?: string
          evidence_urls?: Json
          id?: string
          opened_by?: string
          order_id?: string
          reason?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "order_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          amount: number
          created_at: string
          external_tx_id: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          refunded_at: string | null
          release_trigger: string | null
          released_at: string | null
          seller_payout: number | null
          ss_status: string
          status: Database["public"]["Enums"]["escrow_tx_status"]
          type: Database["public"]["Enums"]["escrow_tx_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          external_tx_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          refunded_at?: string | null
          release_trigger?: string | null
          released_at?: string | null
          seller_payout?: number | null
          ss_status?: string
          status?: Database["public"]["Enums"]["escrow_tx_status"]
          type: Database["public"]["Enums"]["escrow_tx_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          external_tx_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          refunded_at?: string | null
          release_trigger?: string | null
          released_at?: string | null
          seller_payout?: number | null
          ss_status?: string
          status?: Database["public"]["Enums"]["escrow_tx_status"]
          type?: Database["public"]["Enums"]["escrow_tx_type"]
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_signals: {
        Row: {
          created_at: string
          details: Json
          id: string
          score: number
          signal_type: string
          status: string
          subject_id: string
          subject_type: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          score?: number
          signal_type: string
          status?: string
          subject_id: string
          subject_type: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          score?: number
          signal_type?: string
          status?: string
          subject_id?: string
          subject_type?: string
        }
        Relationships: []
      }
      kb_documents: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json
          source: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          source?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          source?: string | null
          title?: string
        }
        Relationships: []
      }
      listing_compatibility: {
        Row: {
          listing_id: string
          vehicle_id: string
          year_from: number | null
          year_to: number | null
        }
        Insert: {
          listing_id: string
          vehicle_id: string
          year_from?: number | null
          year_to?: number | null
        }
        Update: {
          listing_id?: string
          vehicle_id?: string
          year_from?: number | null
          year_to?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_compatibility_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_compatibility_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_compatibility_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_compatibility_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "listing_compatibility_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          position: number
          storage_path: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          position?: number
          storage_path: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          position?: number
          storage_path?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_listings"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      listings: {
        Row: {
          ai_description: string | null
          ai_generated_fields: Json | null
          ai_rating: Json | null
          area: string | null
          category_id: string
          city: string
          compare_at_price: number | null
          condition: Database["public"]["Enums"]["item_condition"]
          created_at: string
          current_bid: number | null
          current_bidder_id: string | null
          deleted_at: string | null
          description: string | null
          details: Json
          embedding: string | null
          expires_at: string | null
          favorite_count: number
          id: string
          is_negotiable: boolean
          is_wholesale: boolean
          listing_condition: string | null
          min_order_qty: number
          model_id: string | null
          part_category_id: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          price: number
          published_at: string | null
          rejection_reason: string | null
          sale_type: Database["public"]["Enums"]["sale_type"]
          search_vector: unknown
          slug: string | null
          sold_at: string | null
          status: Database["public"]["Enums"]["listing_status"]
          stock: number
          store_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_description?: string | null
          ai_generated_fields?: Json | null
          ai_rating?: Json | null
          area?: string | null
          category_id: string
          city: string
          compare_at_price?: number | null
          condition: Database["public"]["Enums"]["item_condition"]
          created_at?: string
          current_bid?: number | null
          current_bidder_id?: string | null
          deleted_at?: string | null
          description?: string | null
          details?: Json
          embedding?: string | null
          expires_at?: string | null
          favorite_count?: number
          id?: string
          is_negotiable?: boolean
          is_wholesale?: boolean
          listing_condition?: string | null
          min_order_qty?: number
          model_id?: string | null
          part_category_id?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          price: number
          published_at?: string | null
          rejection_reason?: string | null
          sale_type?: Database["public"]["Enums"]["sale_type"]
          search_vector?: unknown
          slug?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          stock?: number
          store_id?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          ai_description?: string | null
          ai_generated_fields?: Json | null
          ai_rating?: Json | null
          area?: string | null
          category_id?: string
          city?: string
          compare_at_price?: number | null
          condition?: Database["public"]["Enums"]["item_condition"]
          created_at?: string
          current_bid?: number | null
          current_bidder_id?: string | null
          deleted_at?: string | null
          description?: string | null
          details?: Json
          embedding?: string | null
          expires_at?: string | null
          favorite_count?: number
          id?: string
          is_negotiable?: boolean
          is_wholesale?: boolean
          listing_condition?: string | null
          min_order_qty?: number
          model_id?: string | null
          part_category_id?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          price?: number
          published_at?: string | null
          rejection_reason?: string | null
          sale_type?: Database["public"]["Enums"]["sale_type"]
          search_vector?: unknown
          slug?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          stock?: number
          store_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_category_counts"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "listings_current_bidder_id_fkey"
            columns: ["current_bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_part_category_id_fkey"
            columns: ["part_category_id"]
            isOneToOne: false
            referencedRelation: "part_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "seller_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_verifications: {
        Row: {
          created_at: string
          fee: number
          id: string
          listing_id: string | null
          mechanic_id: string | null
          mechanic_notes: string | null
          paid: boolean
          requester_id: string
          responded_at: string | null
          status: string
          vehicle_details: Json | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          fee?: number
          id?: string
          listing_id?: string | null
          mechanic_id?: string | null
          mechanic_notes?: string | null
          paid?: boolean
          requester_id: string
          responded_at?: string | null
          status?: string
          vehicle_details?: Json | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          fee?: number
          id?: string
          listing_id?: string | null
          mechanic_id?: string | null
          mechanic_notes?: string | null
          paid?: boolean
          requester_id?: string
          responded_at?: string | null
          status?: string
          vehicle_details?: Json | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_verifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_verifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_verifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_verifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "mechanic_verifications_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_verifications_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_verifications_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanics: {
        Row: {
          hourly_rate: number | null
          id: string
          rating: number
          service_areas: string[]
          specialties: string[]
          total_jobs: number
          verified_at: string | null
        }
        Insert: {
          hourly_rate?: number | null
          id: string
          rating?: number
          service_areas?: string[]
          specialties?: string[]
          total_jobs?: number
          verified_at?: string | null
        }
        Update: {
          hourly_rate?: number | null
          id?: string
          rating?: number
          service_areas?: string[]
          specialties?: string[]
          total_jobs?: number
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanics_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachments?: Json
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachments?: Json
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          brand_id: string
          category_id: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          updated_at: string
          year: number | null
        }
        Insert: {
          brand_id: string
          category_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          brand_id?: string
          category_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "mv_category_counts"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "models_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_category_counts"
            referencedColumns: ["category_id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          listing_id: string | null
          listing_snapshot: Json
          order_id: string
          qty: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          listing_id?: string | null
          listing_snapshot: Json
          order_id: string
          qty?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          listing_id?: string | null
          listing_snapshot?: Json
          order_id?: string
          qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_events: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          order_id: string
          to_status: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id: string
          to_status: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          amount: number | null
          approved_at: string | null
          assigned_tester_id: string | null
          buyer_id: string
          cancelled_at: string | null
          completed_at: string | null
          courier_name: string | null
          created_at: string
          delivered_at: string | null
          id: string
          listing_id: string | null
          order_number: string | null
          paid_at: string | null
          payment_method: string
          payment_ref: string | null
          placed_at: string | null
          platform_fee: number
          received_at_center_at: string | null
          rejected_at: string | null
          seller_id: string
          shipped_at: string | null
          shipped_to_buyer_at: string | null
          shipped_to_center_at: string | null
          shipping_address: Json | null
          shipping_fee: number
          shipping_tracking_to_buyer: string | null
          shipping_tracking_to_center: string | null
          ss_status: string
          status: Database["public"]["Enums"]["order_status"]
          store_id: string | null
          subtotal: number | null
          testing_completed_at: string | null
          total: number | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          amount?: number | null
          approved_at?: string | null
          assigned_tester_id?: string | null
          buyer_id: string
          cancelled_at?: string | null
          completed_at?: string | null
          courier_name?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          listing_id?: string | null
          order_number?: string | null
          paid_at?: string | null
          payment_method?: string
          payment_ref?: string | null
          placed_at?: string | null
          platform_fee?: number
          received_at_center_at?: string | null
          rejected_at?: string | null
          seller_id: string
          shipped_at?: string | null
          shipped_to_buyer_at?: string | null
          shipped_to_center_at?: string | null
          shipping_address?: Json | null
          shipping_fee?: number
          shipping_tracking_to_buyer?: string | null
          shipping_tracking_to_center?: string | null
          ss_status?: string
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string | null
          subtotal?: number | null
          testing_completed_at?: string | null
          total?: number | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          amount?: number | null
          approved_at?: string | null
          assigned_tester_id?: string | null
          buyer_id?: string
          cancelled_at?: string | null
          completed_at?: string | null
          courier_name?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          listing_id?: string | null
          order_number?: string | null
          paid_at?: string | null
          payment_method?: string
          payment_ref?: string | null
          placed_at?: string | null
          platform_fee?: number
          received_at_center_at?: string | null
          rejected_at?: string | null
          seller_id?: string
          shipped_at?: string | null
          shipped_to_buyer_at?: string | null
          shipped_to_center_at?: string | null
          shipping_address?: Json | null
          shipping_fee?: number
          shipping_tracking_to_buyer?: string | null
          shipping_tracking_to_center?: string | null
          ss_status?: string
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string | null
          subtotal?: number | null
          testing_completed_at?: string | null
          total?: number | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_tester_id_fkey"
            columns: ["assigned_tester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "seller_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      part_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "part_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string | null
          order_id: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          seller_id: string
          status: string
          transaction_ref: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string | null
          order_id?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          seller_id: string
          status?: string
          transaction_ref?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string | null
          order_id?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          seller_id?: string
          status?: string
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_role: string
          area: string | null
          avatar_url: string | null
          avg_rating: number
          bio: string | null
          city: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          handle: string | null
          id: string
          is_banned: boolean
          is_verified: boolean
          last_seen_at: string | null
          locale: string
          onboarding_completed_at: string | null
          phone: string | null
          phone_number: string | null
          phone_verified: boolean
          role: Database["public"]["Enums"]["user_role"]
          roles: string[]
          total_listings: number
          total_reviews: number
          total_sales: number
          updated_at: string
        }
        Insert: {
          active_role?: string
          area?: string | null
          avatar_url?: string | null
          avg_rating?: number
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          handle?: string | null
          id: string
          is_banned?: boolean
          is_verified?: boolean
          last_seen_at?: string | null
          locale?: string
          onboarding_completed_at?: string | null
          phone?: string | null
          phone_number?: string | null
          phone_verified?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          roles?: string[]
          total_listings?: number
          total_reviews?: number
          total_sales?: number
          updated_at?: string
        }
        Update: {
          active_role?: string
          area?: string | null
          avatar_url?: string | null
          avg_rating?: number
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          handle?: string | null
          id?: string
          is_banned?: boolean
          is_verified?: boolean
          last_seen_at?: string | null
          locale?: string
          onboarding_completed_at?: string | null
          phone?: string | null
          phone_number?: string | null
          phone_verified?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          roles?: string[]
          total_listings?: number
          total_reviews?: number
          total_sales?: number
          updated_at?: string
        }
        Relationships: []
      }
      repair_centers: {
        Row: {
          address: string
          capabilities: Json | null
          city: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          address: string
          capabilities?: Json | null
          city: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          capabilities?: Json | null
          city?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          listing_id: string
          order_id: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id: string
          order_id: string
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          order_id?: string
          rating?: number
          reviewed_user_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_user_id_fkey"
            columns: ["reviewed_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_addresses: {
        Row: {
          address_line: string
          city: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string
          phone: string
          province: string
          user_id: string
        }
        Insert: {
          address_line: string
          city: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          phone: string
          province?: string
          user_id: string
        }
        Update: {
          address_line?: string
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string
          province?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_stores: {
        Row: {
          approval_status: string
          banner_url: string | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          owner_id: string
          payout_details: Json | null
          rating: number
          review_count: number
          slug: string
          store_name: string
          verified: boolean
        }
        Insert: {
          approval_status?: string
          banner_url?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          owner_id: string
          payout_details?: Json | null
          rating?: number
          review_count?: number
          slug: string
          store_name: string
          verified?: boolean
        }
        Update: {
          approval_status?: string
          banner_url?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          owner_id?: string
          payout_details?: Json | null
          rating?: number
          review_count?: number
          slug?: string
          store_name?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "seller_stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spare_parts_orders: {
        Row: {
          claim_id: string
          cost: number | null
          created_at: string
          id: string
          part_name: string
          quantity: number
          status: Database["public"]["Enums"]["spare_part_status"]
          updated_at: string
        }
        Insert: {
          claim_id: string
          cost?: number | null
          created_at?: string
          id?: string
          part_name: string
          quantity?: number
          status?: Database["public"]["Enums"]["spare_part_status"]
          updated_at?: string
        }
        Update: {
          claim_id?: string
          cost?: number | null
          created_at?: string
          id?: string
          part_name?: string
          quantity?: number
          status?: Database["public"]["Enums"]["spare_part_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spare_parts_orders_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "warranty_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      specifications: {
        Row: {
          created_at: string
          id: string
          model_id: string
          specs: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          model_id: string
          specs?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          model_id?: string
          specs?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specifications_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: true
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_active_listings: number
          max_featured_listings: number
          starts_at: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_active_listings?: number
          max_featured_listings?: number
          starts_at?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_active_listings?: number
          max_featured_listings?: number
          starts_at?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_reports: {
        Row: {
          created_at: string
          id: string
          inspection_results: Json
          order_id: string
          overall_notes: string | null
          overall_score: number | null
          passed: boolean | null
          tester_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_results?: Json
          order_id: string
          overall_notes?: string | null
          overall_score?: number | null
          passed?: boolean | null
          tester_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inspection_results?: Json
          order_id?: string
          overall_notes?: string | null
          overall_score?: number | null
          passed?: boolean | null
          tester_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "order_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_reports_tester_id_fkey"
            columns: ["tester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          body_type: string | null
          created_at: string
          engine: string | null
          id: string
          make: string
          model: string
          year_from: number
          year_to: number | null
        }
        Insert: {
          body_type?: string | null
          created_at?: string
          engine?: string | null
          id?: string
          make: string
          model: string
          year_from: number
          year_to?: number | null
        }
        Update: {
          body_type?: string | null
          created_at?: string
          engine?: string | null
          id?: string
          make?: string
          model?: string
          year_from?: number
          year_to?: number | null
        }
        Relationships: []
      }
      viewed_listings: {
        Row: {
          id: string
          listing_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          user_id?: string
          viewed_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewed_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewed_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewed_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewed_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "viewed_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      warranties: {
        Row: {
          buyer_id: string
          created_at: string
          expires_at: string
          id: string
          listing_id: string
          order_id: string
          seller_id: string
          starts_at: string
          status: Database["public"]["Enums"]["warranty_status"]
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          expires_at: string
          id?: string
          listing_id: string
          order_id: string
          seller_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["warranty_status"]
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          listing_id?: string
          order_id?: string
          seller_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["warranty_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranties_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "warranties_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "order_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_claims: {
        Row: {
          assigned_repair_center_id: string | null
          claimant_id: string
          created_at: string
          id: string
          issue_description: string
          photos: Json | null
          resolution_notes: string | null
          status: Database["public"]["Enums"]["claim_status"]
          updated_at: string
          warranty_id: string
        }
        Insert: {
          assigned_repair_center_id?: string | null
          claimant_id: string
          created_at?: string
          id?: string
          issue_description: string
          photos?: Json | null
          resolution_notes?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
          warranty_id: string
        }
        Update: {
          assigned_repair_center_id?: string | null
          claimant_id?: string
          created_at?: string
          id?: string
          issue_description?: string
          photos?: Json | null
          resolution_notes?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
          warranty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranty_claims_assigned_repair_center_id_fkey"
            columns: ["assigned_repair_center_id"]
            isOneToOne: false
            referencedRelation: "repair_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_claimant_id_fkey"
            columns: ["claimant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_claims_warranty_id_fkey"
            columns: ["warranty_id"]
            isOneToOne: false
            referencedRelation: "order_details"
            referencedColumns: ["warranty_id"]
          },
          {
            foreignKeyName: "warranty_claims_warranty_id_fkey"
            columns: ["warranty_id"]
            isOneToOne: false
            referencedRelation: "warranties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      listing_cards: {
        Row: {
          ai_rating: Json | null
          area: string | null
          auction_end_at: string | null
          auction_starting_price: number | null
          brand_name: string | null
          category_id: string | null
          category_name: string | null
          city: string | null
          condition: Database["public"]["Enums"]["item_condition"] | null
          created_at: string | null
          current_bid: number | null
          details: Json | null
          favorite_count: number | null
          id: string | null
          image_url: string | null
          is_negotiable: boolean | null
          model_name: string | null
          platform: Database["public"]["Enums"]["platform_type"] | null
          price: number | null
          published_at: string | null
          sale_type: Database["public"]["Enums"]["sale_type"] | null
          seller_avatar: string | null
          seller_id: string | null
          seller_name: string | null
          seller_rating: number | null
          seller_verified: boolean | null
          status: Database["public"]["Enums"]["listing_status"] | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_category_counts"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "listings_user_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_details: {
        Row: {
          ai_description: string | null
          ai_rating: Json | null
          anti_snipe_minutes: number | null
          area: string | null
          auction_end_at: string | null
          auction_min_increment: number | null
          auction_start_at: string | null
          auction_starting_price: number | null
          bid_count: number | null
          brand_name: string | null
          brand_slug: string | null
          category_id: string | null
          category_name: string | null
          city: string | null
          condition: Database["public"]["Enums"]["item_condition"] | null
          created_at: string | null
          current_bid: number | null
          current_bidder_id: string | null
          deleted_at: string | null
          description: string | null
          details: Json | null
          expires_at: string | null
          favorite_count: number | null
          id: string | null
          is_negotiable: boolean | null
          model_id: string | null
          model_name: string | null
          model_specs: Json | null
          platform: Database["public"]["Enums"]["platform_type"] | null
          price: number | null
          published_at: string | null
          sale_type: Database["public"]["Enums"]["sale_type"] | null
          search_vector: unknown
          seller_avatar: string | null
          seller_city: string | null
          seller_member_since: string | null
          seller_name: string | null
          seller_rating: number | null
          seller_total_reviews: number | null
          seller_total_sales: number | null
          seller_verified: boolean | null
          sold_at: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_category_counts"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "listings_current_bidder_id_fkey"
            columns: ["current_bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_admin_daily_stats: {
        Row: {
          metric: string | null
          platform: Database["public"]["Enums"]["platform_type"] | null
          stat_date: string | null
          value: number | null
        }
        Relationships: []
      }
      mv_category_counts: {
        Row: {
          brand_id: string | null
          brand_name: string | null
          brand_slug: string | null
          category_id: string | null
          category_name: string | null
          city: string | null
          condition: Database["public"]["Enums"]["item_condition"] | null
          listing_count: number | null
          platform: Database["public"]["Enums"]["platform_type"] | null
        }
        Relationships: []
      }
      mv_trending_listings: {
        Row: {
          favorite_count: number | null
          listing_id: string | null
          platform: Database["public"]["Enums"]["platform_type"] | null
          trend_score: number | null
          view_count: number | null
        }
        Relationships: []
      }
      order_details: {
        Row: {
          amount: number | null
          approved_at: string | null
          buyer_avatar: string | null
          buyer_id: string | null
          buyer_name: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          delivered_at: string | null
          id: string | null
          listing_id: string | null
          listing_image_url: string | null
          listing_platform: Database["public"]["Enums"]["platform_type"] | null
          listing_title: string | null
          paid_at: string | null
          received_at_center_at: string | null
          rejected_at: string | null
          seller_avatar: string | null
          seller_id: string | null
          seller_name: string | null
          shipped_to_buyer_at: string | null
          shipped_to_center_at: string | null
          shipping_tracking_to_buyer: string | null
          shipping_tracking_to_center: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          test_overall_score: number | null
          test_passed: boolean | null
          testing_completed_at: string | null
          updated_at: string | null
          warranty_expires_at: string | null
          warranty_id: string | null
          warranty_status: Database["public"]["Enums"]["warranty_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "mv_trending_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_resolve_report_atomic: {
        Args: {
          p_actor_id: string
          p_new_status: Database["public"]["Enums"]["report_status"]
          p_report_id: string
        }
        Returns: Json
      }
      auto_release_escrow: { Args: never; Returns: number }
      complete_subscription_escrow: {
        Args: { p_escrow_id: string; p_external_tx_id: string }
        Returns: Json
      }
      create_buy_now_order: { Args: { p_listing_id: string }; Returns: Json }
      create_payout_for_order: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      create_warranty_claim_atomic: {
        Args: {
          p_claimant_id: string
          p_issue_description: string
          p_warranty_id: string
        }
        Returns: string
      }
      expire_ended_auctions: { Args: never; Returns: undefined }
      expire_stale_listings: { Args: never; Returns: undefined }
      expire_warranties: { Args: never; Returns: undefined }
      fail_subscription_escrow: { Args: { p_escrow_id: string }; Returns: Json }
      find_similar_listings: {
        Args: {
          exclude_id: string
          match_count?: number
          query_embedding: string
          target_category_id: string
        }
        Returns: {
          category_id: string
          city: string
          condition: string
          id: string
          price: number
          similarity: number
          title: string
        }[]
      }
      find_similar_listings_multi_category: {
        Args: {
          category_ids: string[]
          exclude_ids: string[]
          match_count?: number
          query_embedding: string
        }
        Returns: {
          category_id: string
          city: string
          condition: string
          id: string
          price: number
          similarity: number
          title: string
        }[]
      }
      has_role: {
        Args: { required_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_tester: { Args: never; Returns: boolean }
      mark_all_notifications_read: {
        Args: { p_user_id: string }
        Returns: number
      }
      mark_messages_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      place_bid: {
        Args: { p_amount: number; p_listing_id: string }
        Returns: Json
      }
      search_kb_documents: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: string
          similarity: number
          title: string
        }[]
      }
      search_listings_by_embedding: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          city: string
          condition: string
          id: string
          price: number
          similarity: number
          title: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      transition_order: {
        Args: {
          p_metadata?: Json
          p_new_status: Database["public"]["Enums"]["order_status"]
          p_order_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      bid_status: "active" | "outbid" | "won" | "lost" | "cancelled"
      claim_status:
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "in_repair"
        | "resolved"
      escrow_tx_status: "pending" | "completed" | "failed"
      escrow_tx_type: "hold" | "release" | "refund"
      item_condition:
        | "new"
        | "like_new"
        | "excellent"
        | "good"
        | "fair"
        | "poor"
      listing_status:
        | "draft"
        | "pending_review"
        | "active"
        | "sold"
        | "expired"
        | "removed"
        | "flagged"
        | "rejected"
      notification_type:
        | "new_message"
        | "outbid"
        | "auction_ending"
        | "auction_won"
        | "auction_sold"
        | "order_status"
        | "price_drop"
        | "warranty_expiring"
        | "review_received"
        | "listing_approved"
        | "listing_flagged"
        | "payment_received"
        | "order_delivered"
        | "escrow_released"
        | "payout_paid"
        | "seller_approved"
        | "seller_rejected"
      order_status:
        | "awaiting_payment"
        | "payment_received"
        | "shipped_to_center"
        | "under_testing"
        | "testing_complete"
        | "approved"
        | "rejected"
        | "shipped_to_buyer"
        | "delivered"
        | "completed"
        | "cancelled"
        | "refunded"
      payment_method:
        | "jazzcash"
        | "easypaisa"
        | "stripe"
        | "bank_transfer"
        | "cod"
        | "card"
      platform_type: "mobile" | "automotive"
      report_status: "pending" | "reviewed" | "resolved" | "dismissed"
      report_target: "listing" | "user"
      sale_type: "fixed" | "auction" | "both"
      spare_part_status: "ordered" | "received" | "installed"
      subscription_tier: "free" | "premium" | "wholesale"
      user_role: "user" | "seller" | "tester" | "admin"
      warranty_status: "active" | "expired" | "claimed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      bid_status: ["active", "outbid", "won", "lost", "cancelled"],
      claim_status: [
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "in_repair",
        "resolved",
      ],
      escrow_tx_status: ["pending", "completed", "failed"],
      escrow_tx_type: ["hold", "release", "refund"],
      item_condition: ["new", "like_new", "excellent", "good", "fair", "poor"],
      listing_status: [
        "draft",
        "pending_review",
        "active",
        "sold",
        "expired",
        "removed",
        "flagged",
        "rejected",
      ],
      notification_type: [
        "new_message",
        "outbid",
        "auction_ending",
        "auction_won",
        "auction_sold",
        "order_status",
        "price_drop",
        "warranty_expiring",
        "review_received",
        "listing_approved",
        "listing_flagged",
        "payment_received",
        "order_delivered",
        "escrow_released",
        "payout_paid",
        "seller_approved",
        "seller_rejected",
      ],
      order_status: [
        "awaiting_payment",
        "payment_received",
        "shipped_to_center",
        "under_testing",
        "testing_complete",
        "approved",
        "rejected",
        "shipped_to_buyer",
        "delivered",
        "completed",
        "cancelled",
        "refunded",
      ],
      payment_method: [
        "jazzcash",
        "easypaisa",
        "stripe",
        "bank_transfer",
        "cod",
        "card",
      ],
      platform_type: ["mobile", "automotive"],
      report_status: ["pending", "reviewed", "resolved", "dismissed"],
      report_target: ["listing", "user"],
      sale_type: ["fixed", "auction", "both"],
      spare_part_status: ["ordered", "received", "installed"],
      subscription_tier: ["free", "premium", "wholesale"],
      user_role: ["user", "seller", "tester", "admin"],
      warranty_status: ["active", "expired", "claimed"],
    },
  },
} as const

