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
      activity_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          diff: Json
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          diff?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          diff?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      admin_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      battery_brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          body: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      callback_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          name: string
          phone: string
          preferred_time: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          name: string
          phone: string
          preferred_time?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string
          preferred_time?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      car_brands: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      car_models: {
        Row: {
          car_brand_id: string
          created_at: string
          id: string
          name: string
          slug: string
          years: string | null
        }
        Insert: {
          car_brand_id: string
          created_at?: string
          id?: string
          name: string
          slug: string
          years?: string | null
        }
        Update: {
          car_brand_id?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          years?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_models_car_brand_id_fkey"
            columns: ["car_brand_id"]
            isOneToOne: false
            referencedRelation: "car_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_files: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_url: string
          id: string
          size_bytes: number | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_url: string
          id?: string
          size_bytes?: number | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_url?: string
          id?: string
          size_bytes?: number | null
          title?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          hsn_code: string | null
          icon: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hsn_code?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hsn_code?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
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
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["request_status"]
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          subject?: string | null
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          city: string
          created_at: string
          email: string | null
          full_name: string
          gstin: string | null
          id: string
          is_default: boolean
          label: string | null
          landmark: string | null
          line1: string
          line2: string | null
          phone: string
          pincode: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          email?: string | null
          full_name: string
          gstin?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          landmark?: string | null
          line1: string
          line2?: string | null
          phone: string
          pincode: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          email?: string | null
          full_name?: string
          gstin?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          landmark?: string | null
          line1?: string
          line2?: string | null
          phone?: string
          pincode?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gst_rates: {
        Row: {
          created_at: string
          hsn_code: string | null
          id: string
          is_default: boolean
          label: string
          rate: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          hsn_code?: string | null
          id?: string
          is_default?: boolean
          label: string
          rate?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          hsn_code?: string | null
          id?: string
          is_default?: boolean
          label?: string
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      media_files: {
        Row: {
          alt_text: string | null
          bucket: string
          checksum: string | null
          content_type: string | null
          created_at: string
          file_name: string
          file_url: string
          id: string
          path: string
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          bucket?: string
          checksum?: string | null
          content_type?: string | null
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          path: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          bucket?: string
          checksum?: string | null
          content_type?: string | null
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          path?: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          applies_to: Json
          code: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          min_order_total: number
          starts_at: string | null
          title: string
          type: string
          updated_at: string
          value: number
        }
        Insert: {
          applies_to?: Json
          code: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_order_total?: number
          starts_at?: string | null
          title: string
          type: string
          updated_at?: string
          value: number
        }
        Update: {
          applies_to?: Json
          code?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_order_total?: number
          starts_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          gst_rate: number | null
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          qty: number
          tax_amount: number | null
          unit_price: number
          with_exchange: boolean
        }
        Insert: {
          created_at?: string
          gst_rate?: number | null
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          qty: number
          tax_amount?: number | null
          unit_price: number
          with_exchange?: boolean
        }
        Update: {
          created_at?: string
          gst_rate?: number | null
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          qty?: number
          tax_amount?: number | null
          unit_price?: number
          with_exchange?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: Json | null
          cashfree_order_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_label: string | null
          delivery_method: string | null
          discount: number
          id: string
          idempotency_key: string | null
          notes: string | null
          order_number: string | null
          paid_at: string | null
          payment_method: string | null
          payment_ref: string | null
          payment_status: string
          promo_code: string | null
          promo_label: string | null
          scheduled_date: string | null
          scheduled_slot: string | null
          scheduled_slot_label: string | null
          scheduled_slot_window: string | null
          shipping: number
          status: Database["public"]["Enums"]["order_status"]
          stripe_session_id: string | null
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: Json | null
          cashfree_order_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_label?: string | null
          delivery_method?: string | null
          discount?: number
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          payment_status?: string
          promo_code?: string | null
          promo_label?: string | null
          scheduled_date?: string | null
          scheduled_slot?: string | null
          scheduled_slot_label?: string | null
          scheduled_slot_window?: string | null
          shipping?: number
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: Json | null
          cashfree_order_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_label?: string | null
          delivery_method?: string | null
          discount?: number
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          payment_status?: string
          promo_code?: string | null
          promo_label?: string | null
          scheduled_date?: string | null
          scheduled_slot?: string | null
          scheduled_slot_label?: string | null
          scheduled_slot_window?: string | null
          shipping?: number
          status?: Database["public"]["Enums"]["order_status"]
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      permission_presets: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          keys: string[]
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          keys?: string[]
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          keys?: string[]
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      phone_verification_codes: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          user_id?: string
        }
        Relationships: []
      }
      private_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      product_fitment: {
        Row: {
          car_model_id: string
          product_id: string
        }
        Insert: {
          car_model_id: string
          product_id: string
        }
        Update: {
          car_model_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_fitment_car_model_id_fkey"
            columns: ["car_model_id"]
            isOneToOne: false
            referencedRelation: "car_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_fitment_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          badges: string[]
          brand_id: string | null
          capacity_ah: number | null
          category_id: string | null
          created_at: string
          description: string | null
          exchange_rebate: number
          gst_rate_id: string | null
          has_exchange: boolean
          id: string
          is_bestseller: boolean
          is_featured: boolean
          is_new: boolean
          is_on_sale: boolean
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          mrp: number | null
          name: string
          price: number
          price_with_exchange: number
          price_without_exchange: number
          primary_image_url: string | null
          short_description: string | null
          sku: string
          slug: string
          specs: Json
          status: string
          stock: number
          tags: string[]
          updated_at: string
          warranty_months: number | null
        }
        Insert: {
          badges?: string[]
          brand_id?: string | null
          capacity_ah?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          exchange_rebate?: number
          gst_rate_id?: string | null
          has_exchange?: boolean
          id?: string
          is_bestseller?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_on_sale?: boolean
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          mrp?: number | null
          name: string
          price?: number
          price_with_exchange?: number
          price_without_exchange?: number
          primary_image_url?: string | null
          short_description?: string | null
          sku: string
          slug: string
          specs?: Json
          status?: string
          stock?: number
          tags?: string[]
          updated_at?: string
          warranty_months?: number | null
        }
        Update: {
          badges?: string[]
          brand_id?: string | null
          capacity_ah?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          exchange_rebate?: number
          gst_rate_id?: string | null
          has_exchange?: boolean
          id?: string
          is_bestseller?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_on_sale?: boolean
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          mrp?: number | null
          name?: string
          price?: number
          price_with_exchange?: number
          price_without_exchange?: number
          primary_image_url?: string | null
          short_description?: string | null
          sku?: string
          slug?: string
          specs?: Json
          status?: string
          stock?: number
          tags?: string[]
          updated_at?: string
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "battery_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_gst_rate_id_fkey"
            columns: ["gst_rate_id"]
            isOneToOne: false
            referencedRelation: "gst_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          phone_verified: boolean
          phone_verified_at: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          boq_file_url: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          requirement: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          boq_file_url?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          requirement: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          boq_file_url?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          requirement?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          hits: number
          key: string
          window_start: string
        }
        Insert: {
          hits?: number
          key: string
          window_start: string
        }
        Update: {
          hits?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      return_images: {
        Row: {
          created_at: string
          id: string
          return_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          return_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          return_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_images_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "return_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      return_requests: {
        Row: {
          admin_decided_at: string | null
          admin_decided_by: string | null
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          order_id: string
          order_item_id: string | null
          reason: string
          staff_verified_at: string | null
          staff_verified_by: string | null
          status: Database["public"]["Enums"]["return_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_decided_at?: string | null
          admin_decided_by?: string | null
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id: string
          order_item_id?: string | null
          reason: string
          staff_verified_at?: string | null
          staff_verified_by?: string | null
          status?: Database["public"]["Enums"]["return_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_decided_at?: string | null
          admin_decided_by?: string | null
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string
          order_item_id?: string | null
          reason?: string
          staff_verified_at?: string | null
          staff_verified_by?: string | null
          status?: Database["public"]["Enums"]["return_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_images: {
        Row: {
          created_at: string
          id: string
          review_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "product_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      staff_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: []
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
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _order_result: { Args: { p_order_id: string }; Returns: Json }
      _price_order: {
        Args: { p_delivery: string; p_items: Json; p_promo: string }
        Returns: Json
      }
      admin_create_admin_profile: {
        Args: {
          _email: string
          _full_name?: string
          _phone?: string
          _role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: string
      }
      admin_dashboard_summary: { Args: never; Returns: Json }
      admin_list_customers: {
        Args: never
        Returns: {
          company: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          phone_verified: boolean
        }[]
      }
      admin_list_users: {
        Args: never
        Returns: {
          company: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          roles: string[]
        }[]
      }
      admin_log: {
        Args: {
          _action: string
          _diff?: Json
          _entity_id?: string
          _entity_type: string
        }
        Returns: undefined
      }
      admin_order_status_counts: {
        Args: never
        Returns: {
          status: string
          value: number
        }[]
      }
      admin_set_private_setting: {
        Args: { _key: string; _value: Json }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_storage_usage: {
        Args: never
        Returns: {
          bucket_id: string
          file_count: number
          total_bytes: number
        }[]
      }
      available_payment_methods: { Args: never; Returns: Json }
      car_brand_product_counts: {
        Args: { in_stock_only?: boolean }
        Returns: {
          product_count: number
          slug: string
        }[]
      }
      expire_unpaid_online_orders: { Args: never; Returns: number }
      has_permission: {
        Args: { _perm: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_email: { Args: { _email: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      lookup_email_by_phone: { Args: { _phone: string }; Returns: string }
      mark_order_paid: {
        Args: {
          p_amount: number
          p_order_number: string
          p_payment_ref: string
        }
        Returns: string
      }
      normalize_in_phone: { Args: { p: string }; Returns: string }
      place_order: {
        Args: {
          p_address: Json
          p_delivery: string
          p_idempotency_key?: string
          p_items: Json
          p_payment: string
          p_promo: string
          p_scheduled_date: string
          p_slot: string
          p_slot_label: string
          p_slot_window: string
        }
        Returns: Json
      }
      quote_order: {
        Args: { p_delivery?: string; p_items: Json; p_promo?: string }
        Returns: Json
      }
      rate_limit_hit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number }
        Returns: boolean
      }
      verify_phone_code: { Args: { _code: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff" | "customer"
      order_status:
        | "pending"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      request_status: "new" | "reviewed" | "quoted" | "in_progress" | "closed"
      return_status:
        | "requested"
        | "staff_verified"
        | "admin_approved"
        | "rejected"
        | "completed"
      review_status: "pending" | "approved" | "rejected"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "staff", "customer"],
      order_status: [
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      request_status: ["new", "reviewed", "quoted", "in_progress", "closed"],
      return_status: [
        "requested",
        "staff_verified",
        "admin_approved",
        "rejected",
        "completed",
      ],
      review_status: ["pending", "approved", "rejected"],
    },
  },
} as const
