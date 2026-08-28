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
      adhkar_completions: {
        Row: {
          adhkar_id: string
          completed_at: string
          id: string
          user_id: string
        }
        Insert: {
          adhkar_id: string
          completed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          adhkar_id?: string
          completed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      adhkar_streaks: {
        Row: {
          id: string
          last_completed_at: string | null
          streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          last_completed_at?: string | null
          streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          last_completed_at?: string | null
          streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_history: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          query: string
          response: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          query: string
          response: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          query?: string
          response?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          fontSize: string
          id: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          fontSize?: string
          id?: string
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          fontSize?: string
          id?: string
          theme?: string
          updated_at?: string
          user_id?: string
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
          is_active: boolean
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
          is_active?: boolean
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
          is_active?: boolean
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
          content_ar: string
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
          title_ar: string
          title_en: string | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author?: string | null
          category_id?: string | null
          content: string
          content_ar: string
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
          title_ar: string
          title_en?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author?: string | null
          category_id?: string | null
          content?: string
          content_ar?: string
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
          title_ar?: string
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
      bookmarks: {
        Row: {
          created_at: string
          id: string
          item_ref: string
          item_type: string
          label: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_ref: string
          item_type: string
          label?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_ref?: string
          item_type?: string
          label?: string | null
          user_id?: string
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
      dua_categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name_ar: string
          name_en: string
          published: boolean | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name_ar: string
          name_en: string
          published?: boolean | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
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
          metadata: Json
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
          title_en: string | null
          updated_at: string
        }
        Insert: {
          benefits_ar?: string | null
          benefits_en?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json
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
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          benefits_ar?: string | null
          benefits_en?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json
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
          title_en?: string | null
          updated_at?: string
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
      episodes: {
        Row: {
          category: string | null
          contentar: string
          contenten: string
          created_at: string
          descriptionar: string
          descriptionen: string
          id: string
          keywordsar: string | null
          keywordsen: string | null
          published_at: string | null
          slug: string
          thumbnailurl: string | null
          titlear: string
          titleen: string
          updated_at: string
          youtubevideoid: string | null
        }
        Insert: {
          category?: string | null
          contentar: string
          contenten: string
          created_at?: string
          descriptionar: string
          descriptionen: string
          id?: string
          keywordsar?: string | null
          keywordsen?: string | null
          published_at?: string | null
          slug: string
          thumbnailurl?: string | null
          titlear: string
          titleen: string
          updated_at?: string
          youtubevideoid?: string | null
        }
        Update: {
          category?: string | null
          contentar?: string
          contenten?: string
          created_at?: string
          descriptionar?: string
          descriptionen?: string
          id?: string
          keywordsar?: string | null
          keywordsen?: string | null
          published_at?: string | null
          slug?: string
          thumbnailurl?: string | null
          titlear?: string
          titleen?: string
          updated_at?: string
          youtubevideoid?: string | null
        }
        Relationships: []
      }
      favorite_recitations: {
        Row: {
          created_at: string | null
          id: string
          reciter_id: string | null
          surah_id: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reciter_id?: string | null
          surah_id?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reciter_id?: string | null
          surah_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorite_recitations_reciter_id_fkey"
            columns: ["reciter_id"]
            isOneToOne: false
            referencedRelation: "quran_reciters"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_surahs: {
        Row: {
          created_at: string | null
          id: string
          surah_id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          surah_id: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          surah_id?: number
          user_id?: string | null
        }
        Relationships: []
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
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_research: {
        Row: {
          content: string
          created_at: string
          id: string
          request_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          request_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_research_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "research_requests"
            referencedColumns: ["id"]
          },
        ]
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
          source: string | null
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
          source?: string | null
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
          source?: string | null
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
          chapter: string | null
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
          chapter?: string | null
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
          chapter?: string | null
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
      kids_content: {
        Row: {
          age_group: string
          age_max: number | null
          age_min: number | null
          content_ar: string | null
          content_en: string | null
          content_type: string | null
          created_at: string | null
          facebook_share_enabled: boolean
          featured: boolean
          featured_image_url: string | null
          id: string
          is_active: boolean
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
          updated_at: string
          video_url: string | null
          youtube_video_id: string | null
        }
        Insert: {
          age_group?: string
          age_max?: number | null
          age_min?: number | null
          content_ar?: string | null
          content_en?: string | null
          content_type?: string | null
          created_at?: string | null
          facebook_share_enabled?: boolean
          featured?: boolean
          featured_image_url?: string | null
          id?: string
          is_active?: boolean
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
          type?: string
          updated_at?: string
          video_url?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          age_group?: string
          age_max?: number | null
          age_min?: number | null
          content_ar?: string | null
          content_en?: string | null
          content_type?: string | null
          created_at?: string | null
          facebook_share_enabled?: boolean
          featured?: boolean
          featured_image_url?: string | null
          id?: string
          is_active?: boolean
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
          updated_at?: string
          video_url?: string | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      memorization_attempts: {
        Row: {
          attempted_at: string | null
          ayah_number: number
          feedback: string | null
          id: string
          score: number | null
          surah_id: number
          user_id: string | null
        }
        Insert: {
          attempted_at?: string | null
          ayah_number: number
          feedback?: string | null
          id?: string
          score?: number | null
          surah_id: number
          user_id?: string | null
        }
        Update: {
          attempted_at?: string | null
          ayah_number?: number
          feedback?: string | null
          id?: string
          score?: number | null
          surah_id?: number
          user_id?: string | null
        }
        Relationships: []
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
          ayah_number: number
          created_at: string | null
          id: string
          last_attempt_at: string | null
          mastery_level: number | null
          status: string | null
          surah_id: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ayah_number: number
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          mastery_level?: number | null
          status?: string | null
          surah_id: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ayah_number?: number
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          mastery_level?: number | null
          status?: string | null
          surah_id?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          emailNotifications: boolean
          id: string
          pushNotifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          emailNotifications?: boolean
          id?: string
          pushNotifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          emailNotifications?: boolean
          id?: string
          pushNotifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          reference_note: string
          screenshot_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: string
          reference_note: string
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          reference_note?: string
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_messages: {
        Row: {
          body: string | null
          created_at: string
          end_at: string | null
          id: string
          is_active: boolean
          priority: number
          start_at: string | null
          title: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          end_at?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          start_at?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          end_at?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          start_at?: string | null
          title?: string | null
          type?: string | null
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
      prayer_times_cache: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          date: string
          id: string
          timings: Json
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          date: string
          id?: string
          timings: Json
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          date?: string
          id?: string
          timings?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          last_login_at: string | null
          locale: string
          role: Database["public"]["Enums"]["role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          last_login_at?: string | null
          locale?: string
          role?: Database["public"]["Enums"]["role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          locale?: string
          role?: Database["public"]["Enums"]["role"]
          updated_at?: string
        }
        Relationships: []
      }
      prophet_notes: {
        Row: {
          id: string
          note: string
          prophet_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          note: string
          prophet_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          note?: string
          prophet_id?: string
          updated_at?: string
          user_id?: string
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
          created_at: string | null
          death_place_ar: string | null
          featured_image_url: string | null
          id: string
          metadata: Json
          name_ar: string
          name_en: string | null
          order_num: number | null
          published: boolean | null
          slug: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          bio_ar?: string | null
          bio_en?: string | null
          birth_place_ar?: string | null
          created_at?: string | null
          death_place_ar?: string | null
          featured_image_url?: string | null
          id?: string
          metadata?: Json
          name_ar: string
          name_en?: string | null
          order_num?: number | null
          published?: boolean | null
          slug: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          bio_ar?: string | null
          bio_en?: string | null
          birth_place_ar?: string | null
          created_at?: string | null
          death_place_ar?: string | null
          featured_image_url?: string | null
          id?: string
          metadata?: Json
          name_ar?: string
          name_en?: string | null
          order_num?: number | null
          published?: boolean | null
          slug?: string
          thumbnail_url?: string | null
          updated_at?: string
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
          duration: number | null
          id: string
          metadata: Json
          reciter_id: string
          retrieved_at: string | null
          source_url: string | null
          surah_id: number
        }
        Insert: {
          audio_url: string
          duration?: number | null
          id?: string
          metadata?: Json
          reciter_id: string
          retrieved_at?: string | null
          source_url?: string | null
          surah_id: number
        }
        Update: {
          audio_url?: string
          duration?: number | null
          id?: string
          metadata?: Json
          reciter_id?: string
          retrieved_at?: string | null
          source_url?: string | null
          surah_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "quran_audio_reciter_id_quran_reciters_id_fk"
            columns: ["reciter_id"]
            isOneToOne: false
            referencedRelation: "quran_reciters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quran_audio_surah_id_quran_surahs_id_fk"
            columns: ["surah_id"]
            isOneToOne: false
            referencedRelation: "quran_surahs"
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
      quran_favorites: {
        Row: {
          created_at: string
          id: string
          surah_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          surah_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          surah_id?: number
          user_id?: string
        }
        Relationships: []
      }
      quran_reads: {
        Row: {
          ayah_number: number
          id: string
          read_at: string
          surah_id: number
          user_id: string
        }
        Insert: {
          ayah_number: number
          id?: string
          read_at?: string
          surah_id: number
          user_id: string
        }
        Update: {
          ayah_number?: number
          id?: string
          read_at?: string
          surah_id?: number
          user_id?: string
        }
        Relationships: []
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
        Relationships: []
      }
      reading_progress: {
        Row: {
          content_id: string
          content_type: string
          id: string
          metadata: Json | null
          position: number | null
          progress_json: Json
          ref: string | null
          scope: Database["public"]["Enums"]["progress_scope"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          id?: string
          metadata?: Json | null
          position?: number | null
          progress_json?: Json
          ref?: string | null
          scope?: Database["public"]["Enums"]["progress_scope"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          id?: string
          metadata?: Json | null
          position?: number | null
          progress_json?: Json
          ref?: string | null
          scope?: Database["public"]["Enums"]["progress_scope"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recent_recitations: {
        Row: {
          ayah_id: number | null
          id: string
          played_at: string | null
          reciter_id: string | null
          surah_id: number
          user_id: string | null
        }
        Insert: {
          ayah_id?: number | null
          id?: string
          played_at?: string | null
          reciter_id?: string | null
          surah_id: number
          user_id?: string | null
        }
        Update: {
          ayah_id?: number | null
          id?: string
          played_at?: string | null
          reciter_id?: string | null
          surah_id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recent_recitations_reciter_id_fkey"
            columns: ["reciter_id"]
            isOneToOne: false
            referencedRelation: "quran_reciters"
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
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      render_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          external_job_id: string | null
          id: string
          input_data: Json | null
          job_type: string
          max_retries: number | null
          output_data: Json | null
          priority: number | null
          provider: string | null
          retry_count: number | null
          started_at: string | null
          status: string
          updated_at: string
          video_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          external_job_id?: string | null
          id?: string
          input_data?: Json | null
          job_type?: string
          max_retries?: number | null
          output_data?: Json | null
          priority?: number | null
          provider?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          video_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          external_job_id?: string | null
          id?: string
          input_data?: Json | null
          job_type?: string
          max_retries?: number | null
          output_data?: Json | null
          priority?: number | null
          provider?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "render_jobs_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      research_requests: {
        Row: {
          created_at: string
          field: string
          id: string
          language: string
          pages: number
          status: Database["public"]["Enums"]["status"]
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          field: string
          id?: string
          language?: string
          pages?: number
          status?: Database["public"]["Enums"]["status"]
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          field?: string
          id?: string
          language?: string
          pages?: number
          status?: Database["public"]["Enums"]["status"]
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_requests_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_stories: {
        Row: {
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_stories_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_stories_user_id_profiles_fkey"
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
      search_history: {
        Row: {
          id: string
          query: string
          searched_at: string
          user_id: string
        }
        Insert: {
          id?: string
          query: string
          searched_at?: string
          user_id: string
        }
        Update: {
          id?: string
          query?: string
          searched_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
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
      social_shares: {
        Row: {
          content_id: string
          content_type: string
          id: string
          platform: string | null
          shared_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          id?: string
          platform?: string | null
          shared_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          id?: string
          platform?: string | null
          shared_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          category: Database["public"]["Enums"]["category"]
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
          category?: Database["public"]["Enums"]["category"]
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
          category?: Database["public"]["Enums"]["category"]
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
        Relationships: [
          {
            foreignKeyName: "stories_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_favorites: {
        Row: {
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_favorites_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_progress: {
        Row: {
          completed: boolean
          id: string
          progress: number
          story_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          id?: string
          progress?: number
          story_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          id?: string
          progress?: number
          story_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_progress_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_progress_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_ratings: {
        Row: {
          comment: string | null
          id: string
          rating: number
          story_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          id?: string
          rating: number
          story_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          id?: string
          rating?: number
          story_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_ratings_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_reads: {
        Row: {
          id: string
          read_at: string
          story_id: string
          user_id: string
        }
        Insert: {
          id?: string
          read_at?: string
          story_id: string
          user_id: string
        }
        Update: {
          id?: string
          read_at?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_reads_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          language: string
          subscribed_at: string
          unsubscribed_at: string | null
          updated_at: string
          verification_token: string | null
          verificationtoken: string | null
          verified: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          language?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
          verification_token?: string | null
          verificationtoken?: string | null
          verified?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          language?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
          verification_token?: string | null
          verificationtoken?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          id: string
          input: string
          result: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input: string
          result: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input?: string
          result?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string
          id: string
          interaction: string
          page: string
          time_spent: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          interaction: string
          page: string
          time_spent?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          interaction?: string
          page?: string
          time_spent?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_behavior_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_play_next: boolean | null
          default_reciter_id: string | null
          font_size: string | null
          language: string | null
          quran_font: string | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_play_next?: boolean | null
          default_reciter_id?: string | null
          font_size?: string | null
          language?: string | null
          quran_font?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_play_next?: boolean | null
          default_reciter_id?: string | null
          font_size?: string | null
          language?: string | null
          quran_font?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_default_reciter_id_fkey"
            columns: ["default_reciter_id"]
            isOneToOne: false
            referencedRelation: "quran_reciters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          credits: number
          expires_at: string | null
          id: string
          plan: Database["public"]["Enums"]["plan"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          expires_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          expires_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_categories: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          icon: string | null
          id: string
          is_active: boolean
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
          is_active?: boolean
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
          is_active?: boolean
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
          created_at: string
          description: string | null
          duration: number | null
          error_details: string | null
          error_message: string | null
          facebook_id: string | null
          heygen_last_polled_at: string | null
          heygen_status: string | null
          heygen_submitted_at: string | null
          heygen_video_id: string | null
          id: string
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
          youtube_id: string | null
        }
        Insert: {
          automation_key?: string | null
          category: string
          content: Json
          created_at?: string
          description?: string | null
          duration?: number | null
          error_details?: string | null
          error_message?: string | null
          facebook_id?: string | null
          heygen_last_polled_at?: string | null
          heygen_status?: string | null
          heygen_submitted_at?: string | null
          heygen_video_id?: string | null
          id?: string
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          youtube_id?: string | null
        }
        Update: {
          automation_key?: string | null
          category?: string
          content?: Json
          created_at?: string
          description?: string | null
          duration?: number | null
          error_details?: string | null
          error_message?: string | null
          facebook_id?: string | null
          heygen_last_polled_at?: string | null
          heygen_status?: string | null
          heygen_submitted_at?: string | null
          heygen_video_id?: string | null
          id?: string
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          youtube_id?: string | null
        }
        Relationships: []
      }
      video_publish_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          platform: string
          platform_id: string | null
          platform_url: string | null
          published_at: string | null
          response_data: Json | null
          status: string
          video_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          platform: string
          platform_id?: string | null
          platform_url?: string | null
          published_at?: string | null
          response_data?: Json | null
          status?: string
          video_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: string
          platform_id?: string | null
          platform_url?: string | null
          published_at?: string | null
          response_data?: Json | null
          status?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_publish_log_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_publishing_config: {
        Row: {
          auto_publish: boolean
          created_at: string
          facebook_enabled: boolean
          facebook_page_id: string | null
          id: string
          publish_schedule: string | null
          updated_at: string
          youtube_channel_id: string | null
          youtube_enabled: boolean
        }
        Insert: {
          auto_publish?: boolean
          created_at?: string
          facebook_enabled?: boolean
          facebook_page_id?: string | null
          id?: string
          publish_schedule?: string | null
          updated_at?: string
          youtube_channel_id?: string | null
          youtube_enabled?: boolean
        }
        Update: {
          auto_publish?: boolean
          created_at?: string
          facebook_enabled?: boolean
          facebook_page_id?: string | null
          id?: string
          publish_schedule?: string | null
          updated_at?: string
          youtube_channel_id?: string | null
          youtube_enabled?: boolean
        }
        Relationships: []
      }
      videos: {
        Row: {
          category_id: string | null
          content_ref: string | null
          content_source: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          facebook_id: string | null
          facebook_url: string | null
          id: string
          language: string | null
          metadata: Json | null
          published: boolean | null
          published_at: string | null
          render_completed_at: string | null
          render_error: string | null
          render_job_id: string | null
          render_started_at: string | null
          render_status: string | null
          slug: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          views: number | null
          youtube_id: string | null
          youtube_url: string | null
        }
        Insert: {
          category_id?: string | null
          content_ref?: string | null
          content_source?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          facebook_id?: string | null
          facebook_url?: string | null
          id?: string
          language?: string | null
          metadata?: Json | null
          published?: boolean | null
          published_at?: string | null
          render_completed_at?: string | null
          render_error?: string | null
          render_job_id?: string | null
          render_started_at?: string | null
          render_status?: string | null
          slug: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          views?: number | null
          youtube_id?: string | null
          youtube_url?: string | null
        }
        Update: {
          category_id?: string | null
          content_ref?: string | null
          content_source?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          facebook_id?: string | null
          facebook_url?: string | null
          id?: string
          language?: string | null
          metadata?: Json | null
          published?: boolean | null
          published_at?: string | null
          render_completed_at?: string | null
          render_error?: string | null
          render_job_id?: string | null
          render_started_at?: string | null
          render_status?: string | null
          slug?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          views?: number | null
          youtube_id?: string | null
          youtube_url?: string | null
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
