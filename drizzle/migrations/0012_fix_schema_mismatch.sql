ALTER TYPE "public"."category" ADD VALUE 'prophets';--> statement-breakpoint
ALTER TYPE "public"."category" ADD VALUE 'sahaba';--> statement-breakpoint
ALTER TYPE "public"."category" ADD VALUE 'documentaries';--> statement-breakpoint
ALTER TYPE "public"."category" ADD VALUE 'history';--> statement-breakpoint
ALTER TABLE "saved_stories" DROP CONSTRAINT "saved_stories_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "story_progress" DROP CONSTRAINT "story_progress_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "category" SET DEFAULT 'psychological'::"public"."category";--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "category" SET DATA TYPE "public"."category" USING "category"::"public"."category";--> statement-breakpoint
ALTER TABLE "saved_stories" ADD CONSTRAINT "saved_stories_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_progress" ADD CONSTRAINT "story_progress_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;