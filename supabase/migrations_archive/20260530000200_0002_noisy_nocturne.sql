CREATE TYPE "public"."favorite_item_type" AS ENUM('quran', 'hadith', 'story', 'scholar', 'dua');--> statement-breakpoint
CREATE TYPE "public"."progress_scope" AS ENUM('quran', 'hadith', 'stories');--> statement-breakpoint
CREATE TYPE "public"."reminder_type" AS ENUM('prayer', 'quran', 'adhkar', 'fasting', 'zakat');--> statement-breakpoint
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
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_type" "favorite_item_type" NOT NULL,
	"item_ref" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "pinned_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"cta_label" text,
	"cta_href" text,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"locale" text DEFAULT 'ar' NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "contacts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "episodes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "quran_audio" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "saved_stories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "story_progress" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscriptions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tasks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_behavior" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "contacts" CASCADE;--> statement-breakpoint
DROP TABLE "episodes" CASCADE;--> statement-breakpoint
DROP TABLE "quran_audio" CASCADE;--> statement-breakpoint
DROP TABLE "saved_stories" CASCADE;--> statement-breakpoint
DROP TABLE "story_progress" CASCADE;--> statement-breakpoint
DROP TABLE "subscriptions" CASCADE;--> statement-breakpoint
DROP TABLE "tasks" CASCADE;--> statement-breakpoint
DROP TABLE "user_behavior" CASCADE;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "hadith_explanations" DROP CONSTRAINT IF EXISTS "hadith_explanations_hadith_id_hadiths_id_fk";
--> statement-breakpoint
ALTER TABLE "hadiths" DROP CONSTRAINT IF EXISTS "hadiths_book_id_hadith_books_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "quran_ayahs" DROP CONSTRAINT IF EXISTS "quran_ayahs_surah_id_quran_surahs_id_fk";
--> statement-breakpoint
ALTER TABLE "quran_tafsir" DROP CONSTRAINT IF EXISTS "quran_tafsir_surah_id_quran_surahs_id_fk";
--> statement-breakpoint
ALTER TABLE "research_requests" DROP CONSTRAINT IF EXISTS "research_requests_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "stories" DROP CONSTRAINT IF EXISTS "stories_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_subscriptions" DROP CONSTRAINT IF EXISTS "user_subscriptions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "generated_research" ALTER COLUMN "request_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "research_requests" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "category" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hadith_books" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "hadith_books" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "hadith_explanations" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "hadith_explanations" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "hadiths" ADD COLUMN "published" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "hadiths" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "hadiths" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "quran_ayahs" ADD COLUMN "text_uthmani" text;--> statement-breakpoint
ALTER TABLE "quran_ayahs" ADD COLUMN "text_simple" text;--> statement-breakpoint
ALTER TABLE "quran_ayahs" ADD COLUMN "page" integer;--> statement-breakpoint
ALTER TABLE "quran_ayahs" ADD COLUMN "juz" integer;--> statement-breakpoint
ALTER TABLE "quran_ayahs" ADD COLUMN "hizb" integer;--> statement-breakpoint
ALTER TABLE "quran_ayahs" ADD COLUMN "rub" integer;--> statement-breakpoint
ALTER TABLE "quran_ayahs" ADD COLUMN "sajda" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "quran_ayahs" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "quran_ayahs" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "quran_reciters" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "quran_reciters" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "quran_reciters" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "quran_surahs" ADD COLUMN "order" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "quran_surahs" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "quran_surahs" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "quran_surahs" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "quran_tafsir" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "quran_tafsir" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "scholars" ADD COLUMN "published" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "scholars" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "scholars" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "scholars" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "published" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_item_unique" ON "favorites" USING btree ("user_id","item_type","item_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "reading_progress_user_scope_ref_unique" ON "reading_progress" USING btree ("user_id","scope","ref");--> statement-breakpoint
ALTER TABLE "hadith_explanations" ADD CONSTRAINT "hadith_explanations_hadith_id_hadiths_id_fk" FOREIGN KEY ("hadith_id") REFERENCES "public"."hadiths"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadiths" ADD CONSTRAINT "hadiths_book_id_hadith_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."hadith_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quran_ayahs" ADD CONSTRAINT "quran_ayahs_surah_id_quran_surahs_id_fk" FOREIGN KEY ("surah_id") REFERENCES "public"."quran_surahs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quran_tafsir" ADD CONSTRAINT "quran_tafsir_surah_id_quran_surahs_id_fk" FOREIGN KEY ("surah_id") REFERENCES "public"."quran_surahs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadiths" ADD CONSTRAINT "hadiths_book_id_hadith_number_unique" UNIQUE("book_id","hadith_number");--> statement-breakpoint
ALTER TABLE "quran_ayahs" ADD CONSTRAINT "quran_ayahs_surah_id_ayah_number_unique" UNIQUE("surah_id","ayah_number");--> statement-breakpoint
ALTER TABLE "quran_surahs" ADD CONSTRAINT "quran_surahs_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "quran_tafsir" ADD CONSTRAINT "quran_tafsir_surah_id_ayah_number_author_unique" UNIQUE("surah_id","ayah_number","author");
