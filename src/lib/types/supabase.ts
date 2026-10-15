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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          outcome: string
          permission: string | null
          request_id: string | null
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          outcome?: string
          permission?: string | null
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          outcome?: string
          permission?: string | null
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Relationships: []
      }
      admin_role_assignments: {
        Row: {
          created_at: string
          created_by: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_role_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      article_categories: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string
          published: boolean | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en: string
          published?: boolean | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          published?: boolean | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          author: string | null
          category_id: string | null
          content: string
          content_ar: string | null
          content_en: string | null
          created_at: string | null
          featured: boolean
          featured_image_url: string | null
          id: string
          metadata: Json | null
          published: boolean | null
          searchable: unknown
          slug: string
          summary: string | null
          summary_ar: string | null
          summary_en: string | null
          tags: string[] | null
          title: string
          title_ar: string | null
          title_en: string | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author?: string | null
          category_id?: string | null
          content: string
          content_ar?: string | null
          content_en?: string | null
          created_at?: string | null
          featured?: boolean
          featured_image_url?: string | null
          id?: string
          metadata?: Json | null
          published?: boolean | null
          searchable?: unknown
          slug: string
          summary?: string | null
          summary_ar?: string | null
          summary_en?: string | null
          tags?: string[] | null
          title: string
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author?: string | null
          category_id?: string | null
          content?: string
          content_ar?: string | null
          content_en?: string | null
          created_at?: string | null
          featured?: boolean
          featured_image_url?: string | null
          id?: string
          metadata?: Json | null
          published?: boolean | null
          searchable?: unknown
          slug?: string
          summary?: string | null
          summary_ar?: string | null
          summary_en?: string | null
          tags?: string[] | null
          title?: string
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "article_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      background_reminder_preferences: {
        Row: {
          dhikr_enabled: boolean
          dhikr_interval_minutes: number
          quran_enabled: boolean
          quran_message: string
          quran_time: string
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          salawat_enabled: boolean
          salawat_interval_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          dhikr_enabled?: boolean
          dhikr_interval_minutes?: number
          quran_enabled?: boolean
          quran_message?: string
          quran_time?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          salawat_enabled?: boolean
          salawat_interval_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          dhikr_enabled?: boolean
          dhikr_interval_minutes?: number
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          salawat_enabled?: boolean
          salawat_interval_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_reminder_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_events: {
        Row: {
          battle_id: string
          content_ar: string
          content_en: string | null
          created_at: string | null
          event_type: string | null
          id: string
          order_num: number | null
          title_ar: string
          title_en: string
          updated_at: string | null
        }
        Insert: {
          battle_id: string
          content_ar: string
          content_en?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string
          order_num?: number | null
          title_ar: string
          title_en: string
          updated_at?: string | null
        }
        Update: {
          battle_id?: string
          content_ar?: string
          content_en?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string
          order_num?: number | null
          title_ar?: string
          title_en?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_events_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
        ]
      }
      battles: {
        Row: {
          created_at: string | null
          date_gregorian: string | null
          date_hijri: string | null
          description_ar: string | null
          description_en: string | null
          featured_image_url: string | null
          id: string
          location_ar: string | null
          location_en: string | null
          metadata: Json | null
          name_ar: string
          name_en: string
          order_num: number | null
          published: boolean | null
          slug: string
          thumbnail_url: string | null
          updated_at: string | null
          year_hijri: number | null
        }
        Insert: {
          created_at?: string | null
          date_gregorian?: string | null
          date_hijri?: string | null
          description_ar?: string | null
          description_en?: string | null
          featured_image_url?: string | null
          id?: string
          location_ar?: string | null
          location_en?: string | null
          metadata?: Json | null
          name_ar: string
          name_en: string
          order_num?: number | null
          published?: boolean | null
          slug: string
          thumbnail_url?: string | null
          updated_at?: string | null
          year_hijri?: number | null
        }
        Update: {
          created_at?: string | null
          date_gregorian?: string | null
          date_hijri?: string | null
          description_ar?: string | null
          description_en?: string | null
          featured_image_url?: string | null
          id?: string
          location_ar?: string | null
          location_en?: string | null
          metadata?: Json | null
          name_ar?: string
          name_en?: string
          order_num?: number | null
          published?: boolean | null
          slug?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          year_hijri?: number | null
        }
        Relationships: []
      }
      companion_stories: {
        Row: {
          companion_id: string
          content_ar: string
          content_en: string | null
          created_at: string | null
          id: string
          order_num: number | null
          story_type: string | null
          title_ar: string
          title_en: string
          updated_at: string | null
        }
        Insert: {
          companion_id: string
          content_ar: string
          content_en?: string | null
          created_at?: string | null
          id?: string
          order_num?: number | null
          story_type?: string | null
          title_ar: string
          title_en: string
          updated_at?: string | null
        }
        Update: {
          companion_id?: string
          content_ar?: string
          content_en?: string | null
          created_at?: string | null
          id?: string
          order_num?: number | null
          story_type?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companion_stories_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "companions"
            referencedColumns: ["id"]
          },
        ]
      }
      companions: {
        Row: {
          bio_ar: string | null
          bio_en: string | null
          birth_place_ar: string | null
          category: string | null
          created_at: string | null
          death_place_ar: string | null
          death_year: string | null
          featured_image_url: string | null
          id: string
          metadata: Json | null
          name_ar: string
          name_en: string
          order_num: number | null
          published: boolean | null
          slug: string
          thumbnail_url: string | null
          title_ar: string | null
          updated_at: string | null
        }
        Insert: {
          bio_ar?: string | null
          bio_en?: string | null
          birth_place_ar?: string | null
          category?: string | null
          created_at?: string | null
          death_place_ar?: string | null
          death_year?: string | null
          featured_image_url?: string | null
          id?: string
          metadata?: Json | null
          name_ar: string
          name_en: string
          order_num?: number | null
          published?: boolean | null
          slug: string
          thumbnail_url?: string | null
          title_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          bio_ar?: string | null
          bio_en?: string | null
          birth_place_ar?: string | null
          category?: string | null
          created_at?: string | null
          death_place_ar?: string | null
          death_year?: string | null
          featured_image_url?: string | null
          id?: string
          metadata?: Json | null
          name_ar?: string
          name_en?: string
          order_num?: number | null
          published?: boolean | null
          slug?: string
          thumbnail_url?: string | null
          title_ar?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      competitions: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          metadata: Json | null
          prize: string | null
          published: boolean
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json | null
          prize?: string | null
          published?: boolean
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json | null
          prize?: string | null
          published?: boolean
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      conquest_events: {
        Row: {
          conquest_id: string
          content_ar: string
          content_en: string | null
          created_at: string | null
          event_type: string | null
          id: string
          order_num: number | null
          title_ar: string
          title_en: string
          updated_at: string | null
        }
        Insert: {
          conquest_id: string
          content_ar: string
          content_en?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string
          order_num?: number | null
          title_ar: string
          title_en: string
          updated_at?: string | null
        }
        Update: {
          conquest_id?: string
          content_ar?: string
          content_en?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string
          order_num?: number | null
          title_ar?: string
          title_en?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conquest_events_conquest_id_fkey"
            columns: ["conquest_id"]
            isOneToOne: false
            referencedRelation: "conquests"
            referencedColumns: ["id"]
          },
        ]
      }
      conquests: {
        Row: {
          created_at: string | null
          date_gregorian: string | null
          date_hijri: string | null
          description_ar: string | null
          description_en: string | null
          featured_image_url: string | null
          id: string
          leader_ar: string | null
          leader_en: string | null
          location_ar: string | null
          location_en: string | null
          metadata: Json | null
          name_ar: string
          name_en: string
          order_num: number | null
          published: boolean | null
          slug: string
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_gregorian?: string | null
          date_hijri?: string | null
          description_ar?: string | null
          description_en?: string | null
          featured_image_url?: string | null
          id?: string
          leader_ar?: string | null
          leader_en?: string | null
          location_ar?: string | null
          location_en?: string | null
          metadata?: Json | null
          name_ar: string
          name_en: string
          order_num?: number | null
          published?: boolean | null
          slug: string
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_gregorian?: string | null
          date_hijri?: string | null
          description_ar?: string | null
          description_en?: string | null
          featured_image_url?: string | null
          id?: string
          leader_ar?: string | null
          leader_en?: string | null
          location_ar?: string | null
          location_en?: string | null
          metadata?: Json | null
          name_ar?: string
          name_en?: string
          order_num?: number | null
          published?: boolean | null
          slug?: string
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          language: string
          message: string
          name: string
          notification_sent: boolean
          read: boolean
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          language?: string
          message: string
          name: string
          notification_sent?: boolean
          read?: boolean
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          language?: string
          message?: string
          name?: string
          notification_sent?: boolean
          read?: boolean
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_agent_queue: {
        Row: {
          body: string | null
          content_hash: string
          content_type: string
          created_at: string
          error_message: string | null
          external_id: string
          id: string
          is_machine_generated: boolean
          metadata: Json
          source_id: string
          source_retrieved_at: string
          source_url: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          content_hash: string
          content_type: string
          created_at?: string
          error_message?: string | null
          external_id: string
          id?: string
          is_machine_generated?: boolean
          metadata?: Json
          source_id: string
          source_retrieved_at: string
          source_url: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          content_hash?: string
          content_type?: string
          created_at?: string
          error_message?: string | null
          external_id?: string
          id?: string
          is_machine_generated?: boolean
          metadata?: Json
          source_id?: string
          source_retrieved_at?: string
          source_url?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_agent_queue_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_agent_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      content_agent_runs: {
        Row: {
          details: Json
          failed_count: number
          fetched_count: number
          finished_at: string | null
          id: string
          queued_count: number
          skipped_count: number
          started_at: string
          status: string
        }
        Insert: {
          details?: Json
          failed_count?: number
          fetched_count?: number
          finished_at?: string | null
          id?: string
          queued_count?: number
          skipped_count?: number
          started_at?: string
          status?: string
        }
        Update: {
          details?: Json
          failed_count?: number
          fetched_count?: number
          finished_at?: string | null
          id?: string
          queued_count?: number
          skipped_count?: number
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      content_agent_sources: {
        Row: {
          api_key_secret_name: string | null
          base_url: string
          created_at: string
          enabled: boolean
          fetch_url: string | null
          id: string
          last_checked_at: string | null
          name: string
          next_run_at: string
          parser_key: string
          requires_api_key: boolean
          source_type: string
        }
        Insert: {
          api_key_secret_name?: string | null
          base_url: string
          created_at?: string
          enabled?: boolean
          fetch_url?: string | null
          id?: string
          last_checked_at?: string | null
          name: string
          next_run_at?: string
          parser_key: string
          requires_api_key?: boolean
          source_type: string
        }
        Update: {
          api_key_secret_name?: string | null
          base_url?: string
          created_at?: string
          enabled?: boolean
          fetch_url?: string | null
          id?: string
          last_checked_at?: string | null
          name?: string
          next_run_at?: string
          parser_key?: string
          requires_api_key?: boolean
          source_type?: string
        }
        Relationships: []
      }
      content_library: {
        Row: {
          age_group: string | null
          author: string | null
          author_name: string | null
          body_ar: string | null
          body_en: string | null
          category: string
          content_type: string | null
          cover_url: string | null
          created_at: string
          featured: boolean
          id: string
          kind: string | null
          media: Json
          metadata: Json
          published: boolean
          published_at: string | null
          review_status: string
          reviewer_name: string | null
          searchable: unknown
          seo: Json
          slug: string
          source_id: string | null
          summary_ar: string | null
          tags: string[]
          title_ar: string
          title_en: string | null
          updated_at: string
          views: number
        }
        Insert: {
          age_group?: string | null
          author?: string | null
          author_name?: string | null
          body_ar?: string | null
          body_en?: string | null
          category: string
          content_type?: string | null
          cover_url?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          kind?: string | null
          media?: Json
          metadata?: Json
          published?: boolean
          published_at?: string | null
          review_status?: string
          reviewer_name?: string | null
          searchable?: unknown
          seo?: Json
          slug: string
          source_id?: string | null
          summary_ar?: string | null
          tags?: string[]
          title_ar: string
          title_en?: string | null
          updated_at?: string
          views?: number
        }
        Update: {
          age_group?: string | null
          author?: string | null
          author_name?: string | null
          body_ar?: string | null
          body_en?: string | null
          category?: string
          content_type?: string | null
          cover_url?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          kind?: string | null
          media?: Json
          metadata?: Json
          published?: boolean
          published_at?: string | null
          review_status?: string
          reviewer_name?: string | null
          searchable?: unknown
          seo?: Json
          slug?: string
          source_id?: string | null
          summary_ar?: string | null
          tags?: string[]
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_library_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      content_revisions: {
        Row: {
          change_note: string | null
          changed_by: string | null
          content_id: string
          created_at: string
          id: string
          revision_no: number
          snapshot: Json
        }
        Insert: {
          change_note?: string | null
          changed_by?: string | null
          content_id: string
          created_at?: string
          id?: string
          revision_no: number
          snapshot: Json
        }
        Update: {
          change_note?: string | null
          changed_by?: string | null
          content_id?: string
          created_at?: string
          id?: string
          revision_no?: number
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "content_revisions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_library"
            referencedColumns: ["id"]
          },
        ]
      }
      content_sources: {
        Row: {
          attribution: string | null
          authority_level: number
          created_at: string
          id: string
          license: string | null
          name_ar: string
          name_en: string | null
          notes: string | null
          source_type: string
          updated_at: string
          url: string | null
          verified: boolean
        }
        Insert: {
          attribution?: string | null
          authority_level?: number
          created_at?: string
          id?: string
          license?: string | null
          name_ar: string
          name_en?: string | null
          notes?: string | null
          source_type?: string
          updated_at?: string
          url?: string | null
          verified?: boolean
        }
        Update: {
          attribution?: string | null
          authority_level?: number
          created_at?: string
          id?: string
          license?: string | null
          name_ar?: string
          name_en?: string | null
          notes?: string | null
          source_type?: string
          updated_at?: string
          url?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      dua_categories: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string
          published: boolean | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en: string
          published?: boolean | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          published?: boolean | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      duas: {
        Row: {
          benefits_ar: string | null
          benefits_en: string | null
          category_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          occasion_ar: string | null
          occasion_en: string | null
          published: boolean | null
          searchable: unknown
          slug: string
          source_ar: string | null
          source_en: string | null
          text_ar: string
          text_en: string | null
          title_ar: string
          title_en: string
          updated_at: string | null
        }
        Insert: {
          benefits_ar?: string | null
          benefits_en?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          occasion_ar?: string | null
          occasion_en?: string | null
          published?: boolean | null
          searchable?: unknown
          slug: string
          source_ar?: string | null
          source_en?: string | null
          text_ar: string
          text_en?: string | null
          title_ar: string
          title_en: string
          updated_at?: string | null
        }
        Update: {
          benefits_ar?: string | null
          benefits_en?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          occasion_ar?: string | null
          occasion_en?: string | null
          published?: boolean | null
          searchable?: unknown
          slug?: string
          source_ar?: string | null
          source_en?: string | null
          text_ar?: string
          text_en?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duas_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "dua_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          item_ref: string
          item_type: Database["public"]["Enums"]["favorite_item_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_ref: string
          item_type: Database["public"]["Enums"]["favorite_item_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_ref?: string
          item_type?: Database["public"]["Enums"]["favorite_item_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_profiles_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scenarios: {
        Row: {
          age_group: string | null
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          difficulty: string | null
          educational_values: string[] | null
          free_tier: boolean | null
          game_id: string
          graphics_quality: string | null
          id: string
          lesson_plan: string[] | null
          narrative_challenge_ar: string | null
          narrative_challenge_en: string | null
          narrative_defeat_ar: string | null
          narrative_defeat_en: string | null
          narrative_intro_ar: string | null
          narrative_intro_en: string | null
          narrative_victory_ar: string | null
          narrative_victory_en: string | null
          objectives: string[] | null
          skills_developed: string[] | null
          sound_theme: string | null
          theme_accent_color: string | null
          theme_bg_color: string | null
          theme_primary_color: string | null
          theme_secondary_color: string | null
          title_ar: string
          title_en: string
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          difficulty?: string | null
          educational_values?: string[] | null
          free_tier?: boolean | null
          game_id: string
          graphics_quality?: string | null
          id?: string
          lesson_plan?: string[] | null
          narrative_challenge_ar?: string | null
          narrative_challenge_en?: string | null
          narrative_defeat_ar?: string | null
          narrative_defeat_en?: string | null
          narrative_intro_ar?: string | null
          narrative_intro_en?: string | null
          narrative_victory_ar?: string | null
          narrative_victory_en?: string | null
          objectives?: string[] | null
          skills_developed?: string[] | null
          sound_theme?: string | null
          theme_accent_color?: string | null
          theme_bg_color?: string | null
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          title_ar: string
          title_en: string
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          difficulty?: string | null
          educational_values?: string[] | null
          free_tier?: boolean | null
          game_id?: string
          graphics_quality?: string | null
          id?: string
          lesson_plan?: string[] | null
          narrative_challenge_ar?: string | null
          narrative_challenge_en?: string | null
          narrative_defeat_ar?: string | null
          narrative_defeat_en?: string | null
          narrative_intro_ar?: string | null
          narrative_intro_en?: string | null
          narrative_victory_ar?: string | null
          narrative_victory_en?: string | null
          objectives?: string[] | null
          skills_developed?: string[] | null
          sound_theme?: string | null
          theme_accent_color?: string | null
          theme_bg_color?: string | null
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hadith_books: {
        Row: {
          author_ar: string | null
          author_en: string | null
          created_at: string
          hadith_count: number | null
          id: string
          name_ar: string
          name_en: string
          slug: string
          source: string
          updated_at: string
        }
        Insert: {
          author_ar?: string | null
          author_en?: string | null
          created_at?: string
          hadith_count?: number | null
          id?: string
          name_ar: string
          name_en: string
          slug: string
          source?: string
          updated_at?: string
        }
        Update: {
          author_ar?: string | null
          author_en?: string | null
          created_at?: string
          hadith_count?: number | null
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      hadith_explanations: {
        Row: {
          author: string | null
          created_at: string
          explanation_ar: string
          explanation_en: string | null
          hadith_id: string
          id: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          explanation_ar: string
          explanation_en?: string | null
          hadith_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          created_at?: string
          explanation_ar?: string
          explanation_en?: string | null
          hadith_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hadith_explanations_hadith_id_hadiths_id_fk"
            columns: ["hadith_id"]
            isOneToOne: false
            referencedRelation: "hadiths"
            referencedColumns: ["id"]
          },
        ]
      }
      hadiths: {
        Row: {
          book_id: string
          created_at: string
          grade_ar: string | null
          grade_en: string | null
          hadith_number: string
          id: string
          narrator_ar: string | null
          narrator_en: string | null
          published: boolean
          ref: string | null
          searchable: unknown
          text_ar: string
          text_en: string | null
          updated_at: string
        }
        Insert: {
          book_id: string
          created_at?: string
          grade_ar?: string | null
          grade_en?: string | null
          hadith_number: string
          id?: string
          narrator_ar?: string | null
          narrator_en?: string | null
          published?: boolean
          ref?: string | null
          searchable?: unknown
          text_ar: string
          text_en?: string | null
          updated_at?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          grade_ar?: string | null
          grade_en?: string | null
          hadith_number?: string
          id?: string
          narrator_ar?: string | null
          narrator_en?: string | null
          published?: boolean
          ref?: string | null
          searchable?: unknown
          text_ar?: string
          text_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hadiths_book_id_hadith_books_id_fk"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "hadith_books"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_achievements: {
        Row: {
          created_at: string
          criteria: Json
          description_ar: string
          description_en: string
          icon: string
          id: string
          is_active: boolean
          title_ar: string
          title_en: string
        }
        Insert: {
          created_at?: string
          criteria?: Json
          description_ar: string
          description_en: string
          icon: string
          id: string
          is_active?: boolean
          title_ar: string
          title_en: string
        }
        Update: {
          created_at?: string
          criteria?: Json
          description_ar?: string
          description_en?: string
          icon?: string
          id?: string
          is_active?: boolean
          title_ar?: string
          title_en?: string
        }
        Relationships: []
      }
      kids_character_selection: {
        Row: {
          character_id: string
          id: string
          selected_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          character_id: string
          id?: string
          selected_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          character_id?: string
          id?: string
          selected_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      kids_content: {
        Row: {
          age_group: string
          age_max: number | null
          age_min: number | null
          content_ar: string | null
          content_en: string | null
          created_at: string | null
          facebook_share_enabled: boolean
          featured: boolean
          featured_image_url: string | null
          id: string
          is_active: boolean | null
          likes: number
          metadata: Json | null
          published: boolean | null
          quiz_data: Json | null
          shares: number
          slug: string
          summary_ar: string | null
          summary_en: string | null
          title_ar: string
          title_en: string
          type: string
          updated_at: string | null
          video_url: string | null
          youtube_video_id: string | null
        }
        Insert: {
          age_group: string
          age_max?: number | null
          age_min?: number | null
          content_ar?: string | null
          content_en?: string | null
          created_at?: string | null
          facebook_share_enabled?: boolean
          featured?: boolean
          featured_image_url?: string | null
          id?: string
          is_active?: boolean | null
          likes?: number
          metadata?: Json | null
          published?: boolean | null
          quiz_data?: Json | null
          shares?: number
          slug: string
          summary_ar?: string | null
          summary_en?: string | null
          title_ar: string
          title_en: string
          type: string
          updated_at?: string | null
          video_url?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          age_group?: string
          age_max?: number | null
          age_min?: number | null
          content_ar?: string | null
          content_en?: string | null
          created_at?: string | null
          facebook_share_enabled?: boolean
          featured?: boolean
          featured_image_url?: string | null
          id?: string
          is_active?: boolean | null
          likes?: number
          metadata?: Json | null
          published?: boolean | null
          quiz_data?: Json | null
          shares?: number
          slug?: string
          summary_ar?: string | null
          summary_en?: string | null
          title_ar?: string
          title_en?: string
          type?: string
          updated_at?: string | null
          video_url?: string | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      kids_game_levels: {
        Row: {
          config: Json
          created_at: string
          description_ar: string | null
          difficulty: string
          game_id: string
          id: string
          level_no: number
          mechanic: string
          objective_ar: string | null
          objective_en: string | null
          published: boolean
          reward_badge: string | null
          reward_xp: number
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description_ar?: string | null
          difficulty?: string
          game_id: string
          id?: string
          level_no: number
          mechanic: string
          objective_ar?: string | null
          objective_en?: string | null
          published?: boolean
          reward_badge?: string | null
          reward_xp?: number
          title_ar: string
          title_en?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description_ar?: string | null
          difficulty?: string
          game_id?: string
          id?: string
          level_no?: number
          mechanic?: string
          objective_ar?: string | null
          objective_en?: string | null
          published?: boolean
          reward_badge?: string | null
          reward_xp?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kids_game_levels_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "kids_games"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_game_progress: {
        Row: {
          badges: string[]
          best_combo: number
          best_distance: number
          best_level: number
          best_score: number | null
          created_at: string | null
          game_id: string
          id: string
          last_played_at: string | null
          level_no: number
          play_count: number
          total_plays: number | null
          total_time_seconds: number | null
          updated_at: string | null
          user_id: string
          xp: number
        }
        Insert: {
          badges?: string[]
          best_combo?: number
          best_distance?: number
          best_level?: number
          best_score?: number | null
          created_at?: string | null
          game_id: string
          id?: string
          last_played_at?: string | null
          level_no?: number
          play_count?: number
          total_plays?: number | null
          total_time_seconds?: number | null
          updated_at?: string | null
          user_id: string
          xp?: number
        }
        Update: {
          badges?: string[]
          best_combo?: number
          best_distance?: number
          best_level?: number
          best_score?: number | null
          created_at?: string | null
          game_id?: string
          id?: string
          last_played_at?: string | null
          level_no?: number
          play_count?: number
          total_plays?: number | null
          total_time_seconds?: number | null
          updated_at?: string | null
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "kids_game_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_game_questions: {
        Row: {
          correct_index: number
          created_at: string
          explanation_ar: string | null
          explanation_en: string | null
          id: string
          level_id: string
          options: Json
          options_ar: string[]
          options_en: string[]
          order_index: number
          prompt_ar: string
          published: boolean
          question_ar: string | null
          question_en: string | null
          question_no: number
          source_id: string | null
        }
        Insert: {
          correct_index?: number
          created_at?: string
          explanation_ar?: string | null
          explanation_en?: string | null
          id?: string
          level_id: string
          options?: Json
          options_ar?: string[]
          options_en?: string[]
          order_index?: number
          prompt_ar: string
          published?: boolean
          question_ar?: string | null
          question_en?: string | null
          question_no?: number
          source_id?: string | null
        }
        Update: {
          correct_index?: number
          created_at?: string
          explanation_ar?: string | null
          explanation_en?: string | null
          id?: string
          level_id?: string
          options?: Json
          options_ar?: string[]
          options_en?: string[]
          order_index?: number
          prompt_ar?: string
          published?: boolean
          question_ar?: string | null
          question_en?: string | null
          question_no?: number
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kids_game_questions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "kids_game_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_game_questions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_game_results: {
        Row: {
          client_submission_id: string
          collectibles: number | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          difficulty: string | null
          distance: number
          duration_seconds: number | null
          game_id: string
          id: string
          metadata: Json
          played_at: string
          score: number
          updated_at: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          client_submission_id: string
          collectibles?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          difficulty?: string | null
          distance?: number
          duration_seconds?: number | null
          game_id: string
          id?: string
          metadata?: Json
          played_at?: string
          score?: number
          updated_at?: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          client_submission_id?: string
          collectibles?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          difficulty?: string | null
          distance?: number
          duration_seconds?: number | null
          game_id?: string
          id?: string
          metadata?: Json
          played_at?: string
          score?: number
          updated_at?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "kids_game_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_games: {
        Row: {
          age_max: number
          age_min: number
          config: Json
          cover_url: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          difficulty: string
          engine: string
          featured: boolean
          genre: string
          icon_url: string | null
          id: string
          learning_objectives: string[]
          mechanics: string[]
          metadata: Json
          order_index: number
          published: boolean
          reward_xp: number
          short_description_ar: string | null
          slug: string
          title_ar: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          age_max?: number
          age_min?: number
          config?: Json
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          difficulty?: string
          engine?: string
          featured?: boolean
          genre?: string
          icon_url?: string | null
          id?: string
          learning_objectives?: string[]
          mechanics?: string[]
          metadata?: Json
          order_index?: number
          published?: boolean
          reward_xp?: number
          short_description_ar?: string | null
          slug: string
          title_ar: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          age_max?: number
          age_min?: number
          config?: Json
          cover_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          difficulty?: string
          engine?: string
          featured?: boolean
          genre?: string
          icon_url?: string | null
          id?: string
          learning_objectives?: string[]
          mechanics?: string[]
          metadata?: Json
          order_index?: number
          published?: boolean
          reward_xp?: number
          short_description_ar?: string | null
          slug?: string
          title_ar?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      kids_player_progress: {
        Row: {
          created_at: string
          level: number
          total_collectibles: number
          total_games: number
          total_score: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          level?: number
          total_collectibles?: number
          total_games?: number
          total_score?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          level?: number
          total_collectibles?: number
          total_games?: number
          total_score?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "kids_player_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_user_achievements: {
        Row: {
          achievement_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kids_user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "kids_achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text_ar: string | null
          asset_type: string | null
          attribution: string | null
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          height: number | null
          id: string
          license: string | null
          media_type: string | null
          metadata: Json
          mime_type: string | null
          name: string | null
          published: boolean
          rights_verified: boolean | null
          size_bytes: number | null
          source_id: string | null
          storage_path: string | null
          title: string | null
          updated_at: string
          url: string
          verified_rights: boolean | null
          width: number | null
        }
        Insert: {
          alt_text_ar?: string | null
          asset_type?: string | null
          attribution?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          height?: number | null
          id?: string
          license?: string | null
          media_type?: string | null
          metadata?: Json
          mime_type?: string | null
          name?: string | null
          published?: boolean
          rights_verified?: boolean | null
          size_bytes?: number | null
          source_id?: string | null
          storage_path?: string | null
          title?: string | null
          updated_at?: string
          url: string
          verified_rights?: boolean | null
          width?: number | null
        }
        Update: {
          alt_text_ar?: string | null
          asset_type?: string | null
          attribution?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          height?: number | null
          id?: string
          license?: string | null
          media_type?: string | null
          metadata?: Json
          mime_type?: string | null
          name?: string | null
          published?: boolean
          rights_verified?: boolean | null
          size_bytes?: number | null
          source_id?: string | null
          storage_path?: string | null
          title?: string | null
          updated_at?: string
          url?: string
          verified_rights?: boolean | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      memorization_plans: {
        Row: {
          cadence: string
          created_at: string
          id: string
          prompt: string | null
          published: boolean
          tajweed_focus: string | null
          target_ref: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cadence?: string
          created_at?: string
          id?: string
          prompt?: string | null
          published?: boolean
          tajweed_focus?: string | null
          target_ref?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cadence?: string
          created_at?: string
          id?: string
          prompt?: string | null
          published?: boolean
          tajweed_focus?: string | null
          target_ref?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      memorization_progress: {
        Row: {
          created_at: string
          id: string
          last_reviewed_at: string | null
          memorized_ayahs: number
          surah_name: string
          surah_number: number
          total_ayahs: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reviewed_at?: string | null
          memorized_ayahs?: number
          surah_name: string
          surah_number: number
          total_ayahs: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reviewed_at?: string | null
          memorized_ayahs?: number
          surah_name?: string
          surah_number?: number
          total_ayahs?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorization_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          metadata: Json | null
          read: boolean
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string | null
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
      pinned_messages: {
        Row: {
          body: string
          created_at: string
          cta_href: string | null
          cta_label: string | null
          id: string
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          id?: string
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          id?: string
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      prayer_locations: {
        Row: {
          city: string
          country: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          latitude: number | null
          longitude: number | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          latitude?: number | null
          longitude?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city?: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          latitude?: number | null
          longitude?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_notification_deliveries: {
        Row: {
          attempt_count: number
          created_at: string
          error_message: string | null
          failed_at: string | null
          id: string
          notification_kind: string
          notification_text: string | null
          prayer_name: string
          processed_at: string | null
          processing_at: string | null
          push_subscription_id: string
          retry_after: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          error_message?: string | null
          failed_at?: string | null
          id?: string
          notification_kind?: string
          notification_text?: string | null
          prayer_name: string
          processed_at?: string | null
          processing_at?: string | null
          push_subscription_id: string
          retry_after?: string | null
          scheduled_at: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          error_message?: string | null
          failed_at?: string | null
          id?: string
          notification_kind?: string
          notification_text?: string | null
          prayer_name?: string
          processed_at?: string | null
          processing_at?: string | null
          push_subscription_id?: string
          retry_after?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_notification_deliveries_push_subscription_id_fkey"
            columns: ["push_subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_notification_deliveries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_notifications: {
        Row: {
          created_at: string | null
          id: string
          notification_time: string
          prayer_name: string
          sent_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_time: string
          prayer_name: string
          sent_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_time?: string
          prayer_name?: string
          sent_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_preferences: {
        Row: {
          adhan_enabled: boolean | null
          adhan_volume: number | null
          asr_method: string | null
          calculation_method: string | null
          created_at: string | null
          high_latitude_method: string | null
          id: string
          madhab: string | null
          midnight_method: string | null
          notifications_enabled: boolean | null
          prayer_reminders: Json
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          adhan_enabled?: boolean | null
          adhan_volume?: number | null
          asr_method?: string | null
          calculation_method?: string | null
          created_at?: string | null
          high_latitude_method?: string | null
          id?: string
          madhab?: string | null
          midnight_method?: string | null
          notifications_enabled?: boolean | null
          prayer_reminders?: Json
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          adhan_enabled?: boolean | null
          adhan_volume?: number | null
          asr_method?: string | null
          calculation_method?: string | null
          created_at?: string | null
          high_latitude_method?: string | null
          id?: string
          madhab?: string | null
          midnight_method?: string | null
          notifications_enabled?: boolean | null
          prayer_reminders?: Json
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_schedule_cache: {
        Row: {
          calculation_method: string
          created_at: string
          id: string
          latitude: number
          location_id: string
          longitude: number
          madhab: string
          prayer_date: string
          timezone: string
          timings: Json
          updated_at: string
        }
        Insert: {
          calculation_method: string
          created_at?: string
          id?: string
          latitude: number
          location_id: string
          longitude: number
          madhab: string
          prayer_date: string
          timezone: string
          timings: Json
          updated_at?: string
        }
        Update: {
          calculation_method?: string
          created_at?: string
          id?: string
          latitude?: number
          location_id?: string
          longitude?: number
          madhab?: string
          prayer_date?: string
          timezone?: string
          timings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_schedule_cache_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "prayer_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          daily_wird_target: number
          display_name: string | null
          email: string | null
          id: string
          last_login_at: string | null
          locale: string
          preferred_reciter_code: string | null
          role: Database["public"]["Enums"]["role"]
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_wird_target?: number
          display_name?: string | null
          email?: string | null
          id: string
          last_login_at?: string | null
          locale?: string
          preferred_reciter_code?: string | null
          role?: Database["public"]["Enums"]["role"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_wird_target?: number
          display_name?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          locale?: string
          preferred_reciter_code?: string | null
          role?: Database["public"]["Enums"]["role"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      prophet_sections: {
        Row: {
          content_ar: string
          content_en: string | null
          created_at: string | null
          id: string
          order_num: number | null
          prophet_id: string
          section_type: string | null
          title_ar: string
          title_en: string
          updated_at: string | null
        }
        Insert: {
          content_ar: string
          content_en?: string | null
          created_at?: string | null
          id?: string
          order_num?: number | null
          prophet_id: string
          section_type?: string | null
          title_ar: string
          title_en: string
          updated_at?: string | null
        }
        Update: {
          content_ar?: string
          content_en?: string | null
          created_at?: string | null
          id?: string
          order_num?: number | null
          prophet_id?: string
          section_type?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prophet_sections_prophet_id_fkey"
            columns: ["prophet_id"]
            isOneToOne: false
            referencedRelation: "prophets"
            referencedColumns: ["id"]
          },
        ]
      }
      prophets: {
        Row: {
          bio_ar: string | null
          bio_en: string | null
          birth_place_ar: string | null
          birth_place_en: string | null
          created_at: string | null
          death_place_ar: string | null
          death_place_en: string | null
          featured_image_url: string | null
          id: string
          metadata: Json | null
          name_ar: string
          name_en: string
          order_num: number | null
          published: boolean | null
          slug: string
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          bio_ar?: string | null
          bio_en?: string | null
          birth_place_ar?: string | null
          birth_place_en?: string | null
          created_at?: string | null
          death_place_ar?: string | null
          death_place_en?: string | null
          featured_image_url?: string | null
          id?: string
          metadata?: Json | null
          name_ar: string
          name_en: string
          order_num?: number | null
          published?: boolean | null
          slug: string
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          bio_ar?: string | null
          bio_en?: string | null
          birth_place_ar?: string | null
          birth_place_en?: string | null
          created_at?: string | null
          death_place_ar?: string | null
          death_place_en?: string | null
          featured_image_url?: string | null
          id?: string
          metadata?: Json | null
          name_ar?: string
          name_en?: string
          order_num?: number | null
          published?: boolean | null
          slug?: string
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_runtime_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_id: string | null
          endpoint: string
          id: string
          is_active: boolean
          last_used_at: string | null
          p256dh: string
          platform: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_id?: string | null
          endpoint: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          p256dh: string
          platform?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_id?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          p256dh?: string
          platform?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quran_audio: {
        Row: {
          audio_url: string
          ayah_id: number | null
          created_at: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          metadata: Json
          mime_type: string | null
          reciter_id: string | null
          retrieved_at: string | null
          source_url: string | null
          storage_bucket: string | null
          storage_path: string | null
          storage_sha256: string | null
          storage_size_bytes: number | null
          storage_status: string
          storage_uploaded_at: string | null
          storage_url: string | null
          surah_id: number
          updated_at: string | null
        }
        Insert: {
          audio_url: string
          ayah_id?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          reciter_id?: string | null
          retrieved_at?: string | null
          source_url?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          storage_sha256?: string | null
          storage_size_bytes?: number | null
          storage_status?: string
          storage_uploaded_at?: string | null
          storage_url?: string | null
          surah_id: number
          updated_at?: string | null
        }
        Update: {
          audio_url?: string
          ayah_id?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          reciter_id?: string | null
          retrieved_at?: string | null
          source_url?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          storage_sha256?: string | null
          storage_size_bytes?: number | null
          storage_status?: string
          storage_uploaded_at?: string | null
          storage_url?: string | null
          surah_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quran_audio_reciter_id_fkey"
            columns: ["reciter_id"]
            isOneToOne: false
            referencedRelation: "quran_reciters"
            referencedColumns: ["id"]
          },
        ]
      }
      quran_ayahs: {
        Row: {
          audio_url: string | null
          ayah_number: number
          created_at: string
          hizb: number | null
          id: string
          juz: number | null
          page: number | null
          rub: number | null
          sajda: boolean | null
          searchable: unknown
          surah_id: number
          text_ar: string
          text_en: string | null
          text_simple: string | null
          text_uthmani: string | null
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          ayah_number: number
          created_at?: string
          hizb?: number | null
          id?: string
          juz?: number | null
          page?: number | null
          rub?: number | null
          sajda?: boolean | null
          searchable?: unknown
          surah_id: number
          text_ar: string
          text_en?: string | null
          text_simple?: string | null
          text_uthmani?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          ayah_number?: number
          created_at?: string
          hizb?: number | null
          id?: string
          juz?: number | null
          page?: number | null
          rub?: number | null
          sajda?: boolean | null
          searchable?: unknown
          surah_id?: number
          text_ar?: string
          text_en?: string | null
          text_simple?: string | null
          text_uthmani?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quran_ayahs_surah_id_quran_surahs_id_fk"
            columns: ["surah_id"]
            isOneToOne: false
            referencedRelation: "quran_surahs"
            referencedColumns: ["id"]
          },
        ]
      }
      quran_reciters: {
        Row: {
          base_url_template: string | null
          code: string | null
          created_at: string
          id: string
          metadata: Json | null
          name_ar: string
          name_en: string
          recitation_type: string | null
          style: string | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          base_url_template?: string | null
          code?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name_ar: string
          name_en: string
          recitation_type?: string | null
          style?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          base_url_template?: string | null
          code?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name_ar?: string
          name_en?: string
          recitation_type?: string | null
          style?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quran_surahs: {
        Row: {
          ayahs_count: number
          created_at: string
          id: number
          name_ar: string
          name_en: string
          name_translation: string | null
          order: number
          revelation_place: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          ayahs_count: number
          created_at?: string
          id: number
          name_ar: string
          name_en: string
          name_translation?: string | null
          order: number
          revelation_place?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          ayahs_count?: number
          created_at?: string
          id?: number
          name_ar?: string
          name_en?: string
          name_translation?: string | null
          order?: number
          revelation_place?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      quran_tafsir: {
        Row: {
          author: string | null
          ayah_number: number
          created_at: string
          id: string
          retrieved_at: string | null
          source_url: string | null
          surah_id: number
          tafsir_ar: string
          tafsir_en: string | null
          updated_at: string
        }
        Insert: {
          author?: string | null
          ayah_number: number
          created_at?: string
          id?: string
          retrieved_at?: string | null
          source_url?: string | null
          surah_id: number
          tafsir_ar: string
          tafsir_en?: string | null
          updated_at?: string
        }
        Update: {
          author?: string | null
          ayah_number?: number
          created_at?: string
          id?: string
          retrieved_at?: string | null
          source_url?: string | null
          surah_id?: number
          tafsir_ar?: string
          tafsir_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quran_tafsir_surah_id_quran_surahs_id_fk"
            columns: ["surah_id"]
            isOneToOne: false
            referencedRelation: "quran_surahs"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_progress: {
        Row: {
          id: string
          progress_json: Json
          ref: string
          scope: Database["public"]["Enums"]["progress_scope"]
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          progress_json?: Json
          ref: string
          scope: Database["public"]["Enums"]["progress_scope"]
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          progress_json?: Json
          ref?: string
          scope?: Database["public"]["Enums"]["progress_scope"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_user_id_profiles_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recent_recitations: {
        Row: {
          ayah_number: number | null
          created_at: string | null
          duration_listened: number | null
          id: string
          played_at: string | null
          reciter_id: string
          surah_id: number
          user_id: string
        }
        Insert: {
          ayah_number?: number | null
          created_at?: string | null
          duration_listened?: number | null
          id?: string
          played_at?: string | null
          reciter_id: string
          surah_id: number
          user_id: string
        }
        Update: {
          ayah_number?: number | null
          created_at?: string | null
          duration_listened?: number | null
          id?: string
          played_at?: string | null
          reciter_id?: string
          surah_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recent_recitations_reciter_id_fkey"
            columns: ["reciter_id"]
            isOneToOne: false
            referencedRelation: "quran_reciters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recent_recitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reciter_favorites: {
        Row: {
          created_at: string | null
          id: string
          reciter_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reciter_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reciter_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reciter_favorites_reciter_id_fkey"
            columns: ["reciter_id"]
            isOneToOne: false
            referencedRelation: "quran_reciters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reciter_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          schedule_json: Json
          type: Database["public"]["Enums"]["reminder_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          schedule_json?: Json
          type: Database["public"]["Enums"]["reminder_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          schedule_json?: Json
          type?: Database["public"]["Enums"]["reminder_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_user_id_profiles_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scholars: {
        Row: {
          bio_ar: string | null
          bio_en: string | null
          created_at: string
          id: string
          metadata: Json | null
          name_ar: string
          name_en: string
          published: boolean
          slug: string
          thumbnail_url: string | null
          updated_at: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name_ar: string
          name_en: string
          published?: boolean
          slug: string
          thumbnail_url?: string | null
          updated_at?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name_ar?: string
          name_en?: string
          published?: boolean
          slug?: string
          thumbnail_url?: string | null
          updated_at?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      site_audio_assets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_primary: boolean
          kind: string
          mime_type: string
          size_bytes: number
          storage_path: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_primary?: boolean
          kind: string
          mime_type: string
          size_bytes: number
          storage_path: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_primary?: boolean
          kind?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_audio_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      social_publish_queue: {
        Row: {
          automation_key: string | null
          body: string | null
          content_id: string | null
          content_type: string
          created_at: string
          error_message: string | null
          id: string
          image_url: string | null
          metadata: Json
          published_at: string | null
          scheduled_at: string | null
          status: string
          target_platforms: string[]
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          automation_key?: string | null
          body?: string | null
          content_id?: string | null
          content_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          target_platforms?: string[]
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          automation_key?: string | null
          body?: string | null
          content_id?: string | null
          content_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          target_platforms?: string[]
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_approved: boolean
          metadata: Json | null
          mood: string | null
          published: boolean | null
          slug: string
          summary: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          metadata?: Json | null
          mood?: string | null
          published?: boolean | null
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          metadata?: Json | null
          mood?: string | null
          published?: boolean | null
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tawasheeh: {
        Row: {
          artist_ar: string | null
          artist_en: string | null
          audio_url: string | null
          category_id: string | null
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          duration: number | null
          featured: boolean | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          published: boolean | null
          slug: string
          thumbnail_url: string | null
          title_ar: string
          title_en: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          artist_ar?: string | null
          artist_en?: string | null
          audio_url?: string | null
          category_id?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          duration?: number | null
          featured?: boolean | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          published?: boolean | null
          slug: string
          thumbnail_url?: string | null
          title_ar: string
          title_en: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          artist_ar?: string | null
          artist_en?: string | null
          audio_url?: string | null
          category_id?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          duration?: number | null
          featured?: boolean | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          published?: boolean | null
          slug?: string
          thumbnail_url?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tawasheeh_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tawasheeh_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tawasheeh_categories: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string
          order_num: number | null
          published: boolean | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en: string
          order_num?: number | null
          published?: boolean | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          order_num?: number | null
          published?: boolean | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tawasheeh_favorites: {
        Row: {
          created_at: string | null
          id: string
          tawasheeh_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tawasheeh_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tawasheeh_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tawasheeh_favorites_tawasheeh_id_fkey"
            columns: ["tawasheeh_id"]
            isOneToOne: false
            referencedRelation: "tawasheeh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tawasheeh_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tawasheeh_playlist_items: {
        Row: {
          created_at: string | null
          id: string
          order_num: number | null
          playlist_id: string
          tawasheeh_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_num?: number | null
          playlist_id: string
          tawasheeh_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_num?: number | null
          playlist_id?: string
          tawasheeh_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tawasheeh_playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "tawasheeh_playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tawasheeh_playlist_items_tawasheeh_id_fkey"
            columns: ["tawasheeh_id"]
            isOneToOne: false
            referencedRelation: "tawasheeh"
            referencedColumns: ["id"]
          },
        ]
      }
      tawasheeh_playlists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tawasheeh_playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_behavior: {
        Row: {
          action_type: string
          content_id: string | null
          content_type: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      video_automation_runs: {
        Row: {
          completed_count: number
          created_count: number
          error_summary: string | null
          failed_count: number
          finished_at: string | null
          id: string
          metadata: Json
          processed_count: number
          provider_stats: Json
          run_type: string
          started_at: string
        }
        Insert: {
          completed_count?: number
          created_count?: number
          error_summary?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          metadata?: Json
          processed_count?: number
          provider_stats?: Json
          run_type: string
          started_at?: string
        }
        Update: {
          completed_count?: number
          created_count?: number
          error_summary?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          metadata?: Json
          processed_count?: number
          provider_stats?: Json
          run_type?: string
          started_at?: string
        }
        Relationships: []
      }
      video_categories: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string
          published: boolean | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en: string
          published?: boolean | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          published?: boolean | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      video_generation_requests: {
        Row: {
          automation_key: string | null
          category: string
          content: Json
          content_hash: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          error_details: string | null
          error_message: string | null
          facebook_id: string | null
          generation_attempts: number
          heygen_last_polled_at: string | null
          heygen_status: string | null
          heygen_submitted_at: string | null
          heygen_video_id: string | null
          id: string
          last_attempt_at: string | null
          next_retry_at: string | null
          provider: string | null
          provider_job_id: string | null
          publish_status: string | null
          published_at: string | null
          source_hash: string | null
          status: string
          template_version: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string | null
          youtube_id: string | null
        }
        Insert: {
          automation_key?: string | null
          category: string
          content: Json
          content_hash?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          error_details?: string | null
          error_message?: string | null
          facebook_id?: string | null
          generation_attempts?: number
          heygen_last_polled_at?: string | null
          heygen_status?: string | null
          heygen_submitted_at?: string | null
          heygen_video_id?: string | null
          id?: string
          last_attempt_at?: string | null
          next_retry_at?: string | null
          provider?: string | null
          provider_job_id?: string | null
          publish_status?: string | null
          published_at?: string | null
          source_hash?: string | null
          status?: string
          template_version?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          youtube_id?: string | null
        }
        Update: {
          automation_key?: string | null
          category?: string
          content?: Json
          content_hash?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          error_details?: string | null
          error_message?: string | null
          facebook_id?: string | null
          generation_attempts?: number
          heygen_last_polled_at?: string | null
          heygen_status?: string | null
          heygen_submitted_at?: string | null
          heygen_video_id?: string | null
          id?: string
          last_attempt_at?: string | null
          next_retry_at?: string | null
          provider?: string | null
          provider_job_id?: string | null
          publish_status?: string | null
          published_at?: string | null
          source_hash?: string | null
          status?: string
          template_version?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          youtube_id?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          metadata: Json | null
          published: boolean | null
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          views: number | null
          youtube_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          metadata?: Json | null
          published?: boolean | null
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          views?: number | null
          youtube_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          metadata?: Json | null
          published?: boolean | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          views?: number | null
          youtube_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "video_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      youtube_feed_cache: {
        Row: {
          channel_id: string
          created_at: string
          description: string
          published_at: string | null
          synced_at: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_id: string
          video_url: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          description?: string
          published_at?: string | null
          synced_at?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_id: string
          video_url: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          description?: string
          published_at?: string | null
          synced_at?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_id?: string
          video_url?: string
        }
        Relationships: []
      }
      youtube_sync_state: {
        Row: {
          channel_id: string | null
          id: number
          last_attempted_at: string | null
          last_error: string | null
          last_success_at: string | null
          next_allowed_sync_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          channel_id?: string | null
          id?: number
          last_attempted_at?: string | null
          last_error?: string | null
          last_success_at?: string | null
          next_allowed_sync_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          channel_id?: string | null
          id?: number
          last_attempted_at?: string | null
          last_error?: string | null
          last_success_at?: string | null
          next_allowed_sync_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_push_vapid_bundle: { Args: { candidate: Json }; Returns: Json }
      get_push_scheduler_secret: { Args: never; Returns: string }
      get_push_vapid_bundle: { Args: never; Returns: Json }
      get_push_vapid_public_key: { Args: never; Returns: string }
      increment_kids_content_shares: {
        Args: { p_slug: string }
        Returns: {
          shares: number
          slug: string
        }[]
      }
      is_admin_user: { Args: never; Returns: boolean }
      kids_record_game_result: {
        Args: {
          p_client_submission_id: string
          p_collectibles: number
          p_combo: number
          p_completed: boolean
          p_difficulty: string
          p_distance: number
          p_game_id: string
          p_level: number
          p_metadata?: Json
          p_score: number
          p_xp_awarded: number
        }
        Returns: {
          duplicate: boolean
          newly_unlocked: string[]
          player_level: number
          result_id: string
          xp_awarded: number
        }[]
      }
      kids_record_game_result_internal: {
        Args: {
          p_client_submission_id: string
          p_collectibles: number
          p_combo: number
          p_completed: boolean
          p_difficulty: string
          p_distance: number
          p_game_id: string
          p_level: number
          p_metadata?: Json
          p_score: number
          p_user_id: string
        }
        Returns: {
          duplicate: boolean
          newly_unlocked: string[]
          player_level: number
          result_id: string
          xp_awarded: number
        }[]
      }
      consume_admin_rate_limit: {
        Args: {
          p_actor: string
          p_bucket: string
          p_limit: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      plan_background_reminder_deliveries: {
        Args: { now_at?: string }
        Returns: number
      }
    }
    Enums: {
      category:
        | "dark"
        | "romantic"
        | "psychological"
        | "prophets"
        | "sahaba"
        | "documentaries"
        | "history"
      favorite_item_type: "quran" | "hadith" | "story" | "scholar" | "dua"
      payment_status: "pending" | "approved" | "rejected"
      plan: "free" | "pro" | "premium"
      progress_scope: "quran" | "hadith" | "stories"
      reminder_type: "prayer" | "quran" | "adhkar" | "fasting" | "zakat"
      role: "user" | "admin"
      status: "pending" | "completed" | "failed"
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
      category: [
        "dark",
        "romantic",
        "psychological",
        "prophets",
        "sahaba",
        "documentaries",
        "history",
      ],
      favorite_item_type: ["quran", "hadith", "story", "scholar", "dua"],
      payment_status: ["pending", "approved", "rejected"],
      plan: ["free", "pro", "premium"],
      progress_scope: ["quran", "hadith", "stories"],
      reminder_type: ["prayer", "quran", "adhkar", "fasting", "zakat"],
      role: ["user", "admin"],
      status: ["pending", "completed", "failed"],
    },
  },
} as const
