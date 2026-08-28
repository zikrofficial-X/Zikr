CREATE TYPE "public"."category" AS ENUM('dark', 'romantic', 'psychological', 'prophets', 'sahaba', 'documentaries', 'history');--> statement-breakpoint
CREATE TYPE "public"."favorite_item_type" AS ENUM('quran', 'hadith', 'story', 'scholar', 'dua');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'pro', 'premium');--> statement-breakpoint
CREATE TYPE "public"."progress_scope" AS ENUM('quran', 'hadith', 'stories');--> statement-breakpoint
CREATE TYPE "public"."reminder_type" AS ENUM('prayer', 'quran', 'adhkar', 'fasting', 'zakat');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "adhkar_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"adhkar_id" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adhkar_streaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"last_completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "adhkar_streaks_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"fontSize" text DEFAULT 'medium' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "article_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"slug" text NOT NULL,
	"description_ar" text,
	"description_en" text,
	"icon" text,
	"published" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "article_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"title" text NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"content_ar" text NOT NULL,
	"content_en" text,
	"summary" text,
	"summary_ar" text,
	"summary_en" text,
	"author" text,
	"tags" text[] DEFAULT '{}',
	"featured_image_url" text,
	"featured" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "battle_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"battle_id" uuid NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text NOT NULL,
	"content_ar" text NOT NULL,
	"content_en" text,
	"event_type" text,
	"order_num" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"slug" text NOT NULL,
	"description_ar" text,
	"description_en" text,
	"date_hijri" text,
	"year_hijri" integer,
	"date_gregorian" text,
	"location_ar" text,
	"location_en" text,
	"thumbnail_url" text,
	"featured_image_url" text,
	"order_num" integer,
	"published" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "battles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_type" text NOT NULL,
	"item_ref" text NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companion_stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companion_id" uuid NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text NOT NULL,
	"content_ar" text NOT NULL,
	"content_en" text,
	"story_type" text,
	"order_num" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"slug" text NOT NULL,
	"bio_ar" text,
	"bio_en" text,
	"title_ar" text,
	"birth_place_ar" text,
	"death_place_ar" text,
	"death_year" text,
	"category" text,
	"thumbnail_url" text,
	"featured_image_url" text,
	"order_num" integer,
	"published" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"prize" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"published" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conquest_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conquest_id" uuid NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text NOT NULL,
	"content_ar" text NOT NULL,
	"content_en" text,
	"event_type" text,
	"order_num" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conquests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"slug" text NOT NULL,
	"description_ar" text,
	"description_en" text,
	"date_hijri" text,
	"date_gregorian" text,
	"location_ar" text,
	"location_en" text,
	"leader_ar" text,
	"leader_en" text,
	"thumbnail_url" text,
	"featured_image_url" text,
	"order_num" integer,
	"published" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conquests_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"notificationSent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dua_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text,
	"published" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dua_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "duas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text NOT NULL,
	"slug" text NOT NULL,
	"text_ar" text NOT NULL,
	"text_en" text,
	"occasion_ar" text,
	"occasion_en" text,
	"source_ar" text,
	"source_en" text,
	"benefits_ar" text,
	"benefits_en" text,
	"category_id" uuid,
	"published" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "duas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "episodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"titleEn" text NOT NULL,
	"titleAr" text NOT NULL,
	"descriptionEn" text NOT NULL,
	"descriptionAr" text NOT NULL,
	"contentEn" text NOT NULL,
	"contentAr" text NOT NULL,
	"keywordsEn" text,
	"keywordsAr" text,
	"category" text,
	"thumbnailUrl" text,
	"youtubeVideoId" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "episodes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_type" "favorite_item_type" NOT NULL,
	"item_ref" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_research" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hadith_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"source" text NOT NULL,
	"author_ar" text,
	"author_en" text,
	"hadith_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hadith_books_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "hadith_explanations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hadith_id" uuid NOT NULL,
	"explanation_ar" text NOT NULL,
	"explanation_en" text,
	"author" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hadiths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"hadith_number" text NOT NULL,
	"text_ar" text NOT NULL,
	"text_en" text,
	"narrator_ar" text,
	"narrator_en" text,
	"grade_ar" text,
	"grade_en" text,
	"chapter" text,
	"ref" text,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hadiths_book_id_hadith_number_unique" UNIQUE("book_id","hadith_number")
);
--> statement-breakpoint
CREATE TABLE "kids_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text NOT NULL,
	"slug" text NOT NULL,
	"type" text NOT NULL,
	"content_ar" text,
	"content_en" text,
	"age_group" text NOT NULL,
	"featured_image_url" text,
	"video_url" text,
	"quiz_data" jsonb,
	"published" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kids_content_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"openId" text,
	"name" text,
	"email" text,
	"loginMethod" text,
	"role" "role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_signed_in" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "memorization_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"cadence" text DEFAULT 'daily' NOT NULL,
	"target_ref" text,
	"prompt" text,
	"tajweed_focus" text,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memorization_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"surah_number" integer NOT NULL,
	"surah_name" text NOT NULL,
	"total_ayahs" integer NOT NULL,
	"memorized_ayahs" integer DEFAULT 0 NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memorization_progress_user_surah" UNIQUE("user_id","surah_number")
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"emailNotifications" boolean DEFAULT true NOT NULL,
	"pushNotifications" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"type" text,
	"read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"amount" integer NOT NULL,
	"method" text NOT NULL,
	"reference_note" text NOT NULL,
	"screenshot_url" text,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinned_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text,
	"body" text,
	"type" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"priority" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"city" text NOT NULL,
	"country" text,
	"latitude" numeric,
	"longitude" numeric,
	"timezone" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prayer_name" text NOT NULL,
	"notification_time" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"status" text DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"calculation_method" text DEFAULT 'umm-al-qura',
	"madhab" text DEFAULT 'shafi',
	"high_latitude_method" text DEFAULT 'middle-of-night',
	"asr_method" text DEFAULT 'shafi',
	"midnight_method" text DEFAULT 'standard',
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"adhan_enabled" boolean DEFAULT true NOT NULL,
	"adhan_volume" integer DEFAULT 70 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prayer_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"display_name" text,
	"avatar_url" text,
	"locale" text DEFAULT 'ar' NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prophet_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prophet_id" text NOT NULL,
	"note" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prophet_notes_user_id_prophet_id_unique" UNIQUE("user_id","prophet_id")
);
--> statement-breakpoint
CREATE TABLE "prophet_sections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"prophet_id" uuid NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text,
	"content_ar" text NOT NULL,
	"content_en" text,
	"section_type" text,
	"order_num" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prophets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"slug" text NOT NULL,
	"bio_ar" text,
	"bio_en" text,
	"birth_place_ar" text,
	"death_place_ar" text,
	"featured_image_url" text,
	"thumbnail_url" text,
	"order_num" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prophets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quran_audio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"surah_id" integer NOT NULL,
	"reciter_id" uuid NOT NULL,
	"audio_url" text NOT NULL,
	"duration" integer
);
--> statement-breakpoint
CREATE TABLE "quran_ayahs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"surah_id" integer NOT NULL,
	"ayah_number" integer NOT NULL,
	"text_ar" text NOT NULL,
	"text_en" text,
	"audio_url" text,
	"text_uthmani" text,
	"text_simple" text,
	"page" integer,
	"juz" integer,
	"hizb" integer,
	"rub" integer,
	"sajda" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quran_ayahs_surah_id_ayah_number_unique" UNIQUE("surah_id","ayah_number")
);
--> statement-breakpoint
CREATE TABLE "quran_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"surah_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quran_favorites_user_id_surah_id_unique" UNIQUE("user_id","surah_id")
);
--> statement-breakpoint
CREATE TABLE "quran_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"surah_id" integer NOT NULL,
	"ayah_number" integer NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quran_reciters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"code" text NOT NULL,
	"style" text,
	"base_url_template" text NOT NULL,
	"thumbnail_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quran_reciters_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "quran_surahs" (
	"id" integer PRIMARY KEY NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"name_translation" text,
	"revelation_place" text,
	"ayahs_count" integer NOT NULL,
	"order" integer NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quran_surahs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quran_tafsir" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"surah_id" integer NOT NULL,
	"ayah_number" integer NOT NULL,
	"tafsir_ar" text NOT NULL,
	"tafsir_en" text,
	"author" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quran_tafsir_surah_id_ayah_number_author_unique" UNIQUE("surah_id","ayah_number","author")
);
--> statement-breakpoint
CREATE TABLE "reading_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scope" "progress_scope" NOT NULL,
	"ref" text NOT NULL,
	"progress_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recent_recitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reciter_id" uuid NOT NULL,
	"surah_id" integer NOT NULL,
	"ayah_number" integer,
	"played_at" timestamp with time zone DEFAULT now() NOT NULL,
	"duration_listened" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reciter_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reciter_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "reminder_type" NOT NULL,
	"schedule_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"field" text NOT NULL,
	"pages" integer DEFAULT 3 NOT NULL,
	"type" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"story_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scholars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"slug" text NOT NULL,
	"bio_ar" text,
	"bio_en" text,
	"thumbnail_url" text,
	"website_url" text,
	"youtube_url" text,
	"published" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scholars_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"query" text NOT NULL,
	"searched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "social_publish_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" text NOT NULL,
	"content_id" text,
	"title" text NOT NULL,
	"body" text,
	"image_url" text,
	"video_url" text,
	"target_platforms" text[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_type" text NOT NULL,
	"content_id" text NOT NULL,
	"platform" text,
	"shared_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"summary" text,
	"content" text NOT NULL,
	"mood" text,
	"category" "category" DEFAULT 'psychological' NOT NULL,
	"published" boolean DEFAULT true,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "story_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"story_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "story_favorites_user_id_story_id_unique" UNIQUE("user_id","story_id")
);
--> statement-breakpoint
CREATE TABLE "story_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"story_id" uuid NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"story_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"comment" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "story_ratings_user_id_story_id_unique" UNIQUE("user_id","story_id")
);
--> statement-breakpoint
CREATE TABLE "story_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"story_id" uuid NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "story_reads_user_id_story_id_unique" UNIQUE("user_id","story_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verificationToken" text,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"input" text NOT NULL,
	"result" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tawasheeh" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_ar" text NOT NULL,
	"title_en" text NOT NULL,
	"slug" text NOT NULL,
	"description_ar" text,
	"description_en" text,
	"artist_ar" text,
	"artist_en" text,
	"category_id" uuid,
	"audio_url" text,
	"thumbnail_url" text,
	"duration" integer,
	"views" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tawasheeh_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tawasheeh_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"slug" text NOT NULL,
	"description_ar" text,
	"description_en" text,
	"icon" text,
	"order_num" integer,
	"published" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tawasheeh_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tawasheeh_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tawasheeh_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tawasheeh_playlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playlist_id" uuid NOT NULL,
	"tawasheeh_id" uuid NOT NULL,
	"order_num" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tawasheeh_playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_behavior" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"page" text NOT NULL,
	"time_spent" integer DEFAULT 0 NOT NULL,
	"interaction" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"credits" integer DEFAULT 20 NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"slug" text NOT NULL,
	"description_ar" text,
	"description_en" text,
	"icon" text,
	"published" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "video_generation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"content" jsonb NOT NULL,
	"duration" integer,
	"thumbnail_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"youtube_id" text,
	"facebook_id" text,
	"video_url" text,
	"error_message" text,
	"error_details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_publish_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid,
	"youtube_id" text,
	"facebook_id" text,
	"status" text DEFAULT 'success' NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_publishing_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"youtube_enabled" boolean DEFAULT false NOT NULL,
	"youtube_channel_id" text,
	"facebook_enabled" boolean DEFAULT false NOT NULL,
	"facebook_page_id" text,
	"auto_publish" boolean DEFAULT false NOT NULL,
	"publish_schedule" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"youtube_id" text,
	"thumbnail_url" text,
	"duration" integer,
	"views" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "videos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_article_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."article_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_events" ADD CONSTRAINT "battle_events_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companion_stories" ADD CONSTRAINT "companion_stories_companion_id_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "public"."companions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conquest_events" ADD CONSTRAINT "conquest_events_conquest_id_conquests_id_fk" FOREIGN KEY ("conquest_id") REFERENCES "public"."conquests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duas" ADD CONSTRAINT "duas_category_id_dua_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."dua_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_research" ADD CONSTRAINT "generated_research_request_id_research_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."research_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadith_explanations" ADD CONSTRAINT "hadith_explanations_hadith_id_hadiths_id_fk" FOREIGN KEY ("hadith_id") REFERENCES "public"."hadiths"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadiths" ADD CONSTRAINT "hadiths_book_id_hadith_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."hadith_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_locations" ADD CONSTRAINT "prayer_locations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_notifications" ADD CONSTRAINT "prayer_notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_preferences" ADD CONSTRAINT "prayer_preferences_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prophet_sections" ADD CONSTRAINT "prophet_sections_prophet_id_prophets_id_fk" FOREIGN KEY ("prophet_id") REFERENCES "public"."prophets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quran_audio" ADD CONSTRAINT "quran_audio_surah_id_quran_surahs_id_fk" FOREIGN KEY ("surah_id") REFERENCES "public"."quran_surahs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quran_audio" ADD CONSTRAINT "quran_audio_reciter_id_quran_reciters_id_fk" FOREIGN KEY ("reciter_id") REFERENCES "public"."quran_reciters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quran_ayahs" ADD CONSTRAINT "quran_ayahs_surah_id_quran_surahs_id_fk" FOREIGN KEY ("surah_id") REFERENCES "public"."quran_surahs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quran_tafsir" ADD CONSTRAINT "quran_tafsir_surah_id_quran_surahs_id_fk" FOREIGN KEY ("surah_id") REFERENCES "public"."quran_surahs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recent_recitations" ADD CONSTRAINT "recent_recitations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recent_recitations" ADD CONSTRAINT "recent_recitations_reciter_id_quran_reciters_id_fk" FOREIGN KEY ("reciter_id") REFERENCES "public"."quran_reciters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reciter_favorites" ADD CONSTRAINT "reciter_favorites_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reciter_favorites" ADD CONSTRAINT "reciter_favorites_reciter_id_quran_reciters_id_fk" FOREIGN KEY ("reciter_id") REFERENCES "public"."quran_reciters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_stories" ADD CONSTRAINT "saved_stories_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_stories" ADD CONSTRAINT "saved_stories_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_favorites" ADD CONSTRAINT "story_favorites_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_progress" ADD CONSTRAINT "story_progress_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_progress" ADD CONSTRAINT "story_progress_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_ratings" ADD CONSTRAINT "story_ratings_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_reads" ADD CONSTRAINT "story_reads_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tawasheeh" ADD CONSTRAINT "tawasheeh_category_id_tawasheeh_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tawasheeh_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tawasheeh_favorites" ADD CONSTRAINT "tawasheeh_favorites_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tawasheeh_favorites" ADD CONSTRAINT "tawasheeh_favorites_tawasheeh_id_tawasheeh_id_fk" FOREIGN KEY ("tawasheeh_id") REFERENCES "public"."tawasheeh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tawasheeh_playlist_items" ADD CONSTRAINT "tawasheeh_playlist_items_playlist_id_tawasheeh_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."tawasheeh_playlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tawasheeh_playlist_items" ADD CONSTRAINT "tawasheeh_playlist_items_tawasheeh_id_tawasheeh_id_fk" FOREIGN KEY ("tawasheeh_id") REFERENCES "public"."tawasheeh"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tawasheeh_playlists" ADD CONSTRAINT "tawasheeh_playlists_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_behavior" ADD CONSTRAINT "user_behavior_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_publish_log" ADD CONSTRAINT "video_publish_log_video_id_video_generation_requests_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video_generation_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_category_id_video_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."video_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_item_unique" ON "favorites" USING btree ("user_id","item_type","item_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "reading_progress_user_scope_ref_unique" ON "reading_progress" USING btree ("user_id","scope","ref");