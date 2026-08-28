CREATE TABLE "hadith_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"slug" text NOT NULL,
	"author_ar" text,
	"author_en" text,
	"hadith_count" integer,
	CONSTRAINT "hadith_books_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "hadith_explanations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hadith_id" uuid NOT NULL,
	"explanation_ar" text NOT NULL,
	"explanation_en" text,
	"author" text
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
	"grade_en" text
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
	"audio_url" text
);
--> statement-breakpoint
CREATE TABLE "quran_reciters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"style" text,
	"thumbnail_url" text
);
--> statement-breakpoint
CREATE TABLE "quran_surahs" (
	"id" integer PRIMARY KEY NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"name_translation" text,
	"revelation_place" text,
	"ayahs_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quran_tafsir" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"surah_id" integer NOT NULL,
	"ayah_number" integer NOT NULL,
	"tafsir_ar" text NOT NULL,
	"tafsir_en" text,
	"author" text
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
	CONSTRAINT "scholars_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "hadith_explanations" ADD CONSTRAINT "hadith_explanations_hadith_id_hadiths_id_fk" FOREIGN KEY ("hadith_id") REFERENCES "public"."hadiths"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hadiths" ADD CONSTRAINT "hadiths_book_id_hadith_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."hadith_books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quran_audio" ADD CONSTRAINT "quran_audio_surah_id_quran_surahs_id_fk" FOREIGN KEY ("surah_id") REFERENCES "public"."quran_surahs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quran_audio" ADD CONSTRAINT "quran_audio_reciter_id_quran_reciters_id_fk" FOREIGN KEY ("reciter_id") REFERENCES "public"."quran_reciters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quran_ayahs" ADD CONSTRAINT "quran_ayahs_surah_id_quran_surahs_id_fk" FOREIGN KEY ("surah_id") REFERENCES "public"."quran_surahs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quran_tafsir" ADD CONSTRAINT "quran_tafsir_surah_id_quran_surahs_id_fk" FOREIGN KEY ("surah_id") REFERENCES "public"."quran_surahs"("id") ON DELETE no action ON UPDATE no action;