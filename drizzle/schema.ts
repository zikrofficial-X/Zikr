import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  smallint,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const favoriteItemTypeEnum = pgEnum("favorite_item_type", [
  "quran",
  "hadith",
  "story",
  "scholar",
  "dua",
]);
export const progressScopeEnum = pgEnum("progress_scope", [
  "quran",
  "hadith",
  "stories",
]);
export const reminderTypeEnum = pgEnum("reminder_type", [
  "prayer",
  "quran",
  "adhkar",
  "fasting",
  "zakat",
]);
export const categoryEnum = pgEnum("category", [
  "dark",
  "romantic",
  "psychological",
  "prophets",
  "sahaba",
  "documentaries",
  "history",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "approved",
  "rejected",
]);
export const planEnum = pgEnum("plan", ["free", "pro", "premium"]);
export const statusEnum = pgEnum("status", ["pending", "completed", "failed"]);

// User-owned tables
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  locale: text("locale").notNull().default("ar"),
  role: roleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    itemType: favoriteItemTypeEnum("item_type").notNull(),
    itemRef: text("item_ref").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  t => ({
    uniq: uniqueIndex("favorites_user_item_unique").on(
      t.userId,
      t.itemType,
      t.itemRef
    ),
  })
);

export const readingProgress = pgTable(
  "reading_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    scope: progressScopeEnum("scope").notNull(),
    ref: text("ref").notNull(),
    progressJson: jsonb("progress_json").notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  t => ({
    uniq: uniqueIndex("reading_progress_user_scope_ref_unique").on(
      t.userId,
      t.scope,
      t.ref
    ),
  })
);

export const reminders = pgTable("reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  type: reminderTypeEnum("type").notNull(),
  scheduleJson: jsonb("schedule_json").notNull().default({}),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Server action support tables (user-owned Supabase tables)
export const quranFavorites = pgTable(
  "quran_favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    surahId: integer("surah_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  t => ({ uniq: unique().on(t.userId, t.surahId) })
);

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  itemType: text("item_type").notNull(),
  itemRef: text("item_ref").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const searchHistory = pgTable("search_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  query: text("query").notNull(),
  searchedAt: timestamp("searched_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const quranReads = pgTable("quran_reads", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  surahId: integer("surah_id").notNull(),
  ayahNumber: integer("ayah_number").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
});

export const storyReads = pgTable(
  "story_reads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
  },
  t => ({ uniq: unique().on(t.userId, t.storyId) })
);

export const storyRatings = pgTable(
  "story_ratings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    rating: smallint("rating").notNull(),
    comment: text("comment"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  t => ({ uniq: unique().on(t.userId, t.storyId) })
);

export const storyFavorites = pgTable(
  "story_favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  t => ({ uniq: unique().on(t.userId, t.storyId) })
);

export const socialShares = pgTable("social_shares", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  contentType: text("content_type").notNull(),
  contentId: text("content_id").notNull(),
  platform: text("platform"),
  sharedAt: timestamp("shared_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const prophetNotes = pgTable(
  "prophet_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    prophetId: text("prophet_id").notNull(),
    note: text("note").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  t => ({ uniq: unique().on(t.userId, t.prophetId) })
);

export const notificationSettings = pgTable(
  "notification_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    emailNotifications: boolean("email_notifications").notNull().default(true),
    pushNotifications: boolean("push_notifications").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  t => ({ uniq: unique().on(t.userId) })
);

export const adhkarCompletions = pgTable("adhkar_completions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  adhkarId: text("adhkar_id").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const adhkarStreaks = pgTable(
  "adhkar_streaks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    streak: integer("streak").notNull().default(0),
    lastCompletedAt: timestamp("last_completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  t => ({ uniq: unique().on(t.userId) })
);

export const appSettings = pgTable(
  "app_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    theme: text("theme").notNull().default("system"),
    fontSize: text("font_size").notNull().default("medium"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  t => ({ uniq: unique().on(t.userId) })
);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  type: text("type"),
  read: boolean("read").notNull().default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Quran content (public read, admin write)
export const quranSurahs = pgTable("quran_surahs", {
  id: integer("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  nameTranslation: text("name_translation"),
  revelationPlace: text("revelation_place"),
  ayahsCount: integer("ayahs_count").notNull(),
  order: integer("order").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const quranAyahs = pgTable(
  "quran_ayahs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    surahId: integer("surah_id")
      .notNull()
      .references(() => quranSurahs.id, { onDelete: "cascade" }),
    ayahNumber: integer("ayah_number").notNull(),
    textAr: text("text_ar").notNull(),
    textEn: text("text_en"),
    audioUrl: text("audio_url"),
    textUthmani: text("text_uthmani"),
    textSimple: text("text_simple"),
    page: integer("page"),
    juz: integer("juz"),
    hizb: integer("hizb"),
    rub: integer("rub"),
    sajda: boolean("sajda").default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  t => ({
    surahAyahUnique: unique().on(t.surahId, t.ayahNumber),
  })
);

export const quranTafsir = pgTable(
  "quran_tafsir",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    surahId: integer("surah_id")
      .notNull()
      .references(() => quranSurahs.id, { onDelete: "cascade" }),
    ayahNumber: integer("ayah_number").notNull(),
    tafsirAr: text("tafsir_ar").notNull(),
    tafsirEn: text("tafsir_en"),
    author: text("author"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  t => ({
    uniquePerSurahAyahAuthor: unique().on(t.surahId, t.ayahNumber, t.author),
  })
);

export const quranReciters = pgTable("quran_reciters", {
  id: uuid("id").defaultRandom().primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  code: text("code").notNull().unique(),
  style: text("style"),
  baseUrlTemplate: text("base_url_template").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Hadith content (public read, admin write)
export const quranAudio = pgTable("quran_audio", {
  id: uuid("id").defaultRandom().primaryKey(),
  surahId: integer("surah_id")
    .notNull()
    .references(() => quranSurahs.id),
  reciterId: uuid("reciter_id")
    .notNull()
    .references(() => quranReciters.id),
  audioUrl: text("audio_url").notNull(),
  duration: integer("duration"),
});

export const hadithBooks = pgTable("hadith_books", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  source: text("source").notNull(),
  authorAr: text("author_ar"),
  authorEn: text("author_en"),
  hadithCount: integer("hadith_count"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const hadiths = pgTable(
  "hadiths",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => hadithBooks.id, { onDelete: "cascade" }),
    hadithNumber: text("hadith_number").notNull(),
    textAr: text("text_ar").notNull(),
    textEn: text("text_en"),
    narratorAr: text("narrator_ar"),
    narratorEn: text("narrator_en"),
    gradeAr: text("grade_ar"),
    gradeEn: text("grade_en"),
    chapter: text("chapter"),
    ref: text("ref"),
    published: boolean("published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  t => ({
    uniqueByBookAndNumber: unique().on(t.bookId, t.hadithNumber),
  })
);

export const hadithExplanations = pgTable("hadith_explanations", {
  id: uuid("id").defaultRandom().primaryKey(),
  hadithId: uuid("hadith_id")
    .notNull()
    .references(() => hadiths.id, { onDelete: "cascade" }),
  explanationAr: text("explanation_ar").notNull(),
  explanationEn: text("explanation_en"),
  author: text("author"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Scholars & Stories (public read, admin write)
export const scholars = pgTable("scholars", {
  id: uuid("id").defaultRandom().primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
  bioAr: text("bio_ar"),
  bioEn: text("bio_en"),
  thumbnailUrl: text("thumbnail_url"),
  websiteUrl: text("website_url"),
  youtubeUrl: text("youtube_url"),
  published: boolean("published").notNull().default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const stories = pgTable("stories", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  userId: uuid("user_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  summary: text("summary"),
  content: text("content").notNull(),
  mood: text("mood"),
  category: categoryEnum("category").notNull().default("psychological"),
  published: boolean("published").default(true),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscription & Payments (user-owned)
export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id),
  plan: planEnum("plan").notNull().default("free"),
  credits: integer("credits").notNull().default(20),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  amount: integer("amount").notNull(),
  method: text("method").notNull(),
  referenceNote: text("reference_note").notNull(),
  screenshotUrl: text("screenshot_url"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Research (user-owned)
export const researchRequests = pgTable("research_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  title: text("title").notNull(),
  field: text("field").notNull(),
  pages: integer("pages").notNull().default(3),
  type: text("type").notNull(),
  language: text("language").notNull().default("en"),
  status: statusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const generatedResearch = pgTable("generated_research", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id").references(() => researchRequests.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Site admin (admin-only write)
export const siteSettings = pgTable("site_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const competitions = pgTable("competitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  prize: text("prize"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  published: boolean("published").notNull().default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const pinnedMessages = pgTable("pinned_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  title: text("title"),
  body: text("body"),
  type: text("type"),
  isActive: boolean("is_active").notNull().default(true),
  startAt: timestamp("start_at", { withTimezone: true }),
  endAt: timestamp("end_at", { withTimezone: true }),
  priority: integer("priority").notNull().default(0),
});

export const memorizationPlans = pgTable("memorization_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  cadence: text("cadence").notNull().default("daily"),
  targetRef: text("target_ref"),
  prompt: text("prompt"),
  tajweedFocus: text("tajweed_focus"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// User memorization progress (user-owned)
export const memorizationProgress = pgTable(
  "memorization_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    surahNumber: integer("surah_number").notNull(),
    surahName: text("surah_name").notNull(),
    totalAyahs: integer("total_ayahs").notNull(),
    memorizedAyahs: integer("memorized_ayahs").notNull().default(0),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  t => ({
    uniq: unique("memorization_progress_user_surah").on(
      t.userId,
      t.surahNumber
    ),
  })
);

// Prophets (public read, admin write)
export const prophets = pgTable("prophets", {
  id: uuid("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
  bioAr: text("bio_ar"),
  bioEn: text("bio_en"),
  birthPlaceAr: text("birth_place_ar"),
  deathPlaceAr: text("death_place_ar"),
  featuredImageUrl: text("featured_image_url"),
  thumbnailUrl: text("thumbnail_url"),
  orderNum: integer("order_num").notNull().default(0),
  published: boolean("published").notNull().default(true),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const prophetSections = pgTable("prophet_sections", {
  id: uuid("id").primaryKey(),
  prophetId: uuid("prophet_id")
    .notNull()
    .references(() => prophets.id, { onDelete: "cascade" }),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en"),
  contentAr: text("content_ar").notNull(),
  contentEn: text("content_en"),
  sectionType: text("section_type"),
  orderNum: integer("order_num").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Duas (public read, admin write)
export const duaCategories = pgTable("dua_categories", {
  id: uuid("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  published: boolean("published").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const duas = pgTable("duas", {
  id: uuid("id").primaryKey(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  slug: text("slug").notNull().unique(),
  textAr: text("text_ar").notNull(),
  textEn: text("text_en"),
  occasionAr: text("occasion_ar"),
  occasionEn: text("occasion_en"),
  sourceAr: text("source_ar"),
  sourceEn: text("source_en"),
  benefitsAr: text("benefits_ar"),
  benefitsEn: text("benefits_en"),
  categoryId: uuid("category_id").references(() => duaCategories.id, {
    onDelete: "set null",
  }),
  published: boolean("published").notNull().default(true),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Additional public content modules synchronized from Supabase migrations
export const articleCategories = pgTable("article_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  icon: text("icon"),
  published: boolean("published").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const articles = pgTable("articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id").references(() => articleCategories.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en"),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  contentAr: text("content_ar").notNull(),
  contentEn: text("content_en"),
  summary: text("summary"),
  summaryAr: text("summary_ar"),
  summaryEn: text("summary_en"),
  author: text("author"),
  tags: text("tags").array().default([]),
  featuredImageUrl: text("featured_image_url"),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(true),
  views: integer("views").notNull().default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const videoCategories = pgTable("video_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  icon: text("icon"),
  published: boolean("published").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const videos = pgTable("videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id").references(() => videoCategories.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  youtubeId: text("youtube_id"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"),
  views: integer("views").notNull().default(0),
  published: boolean("published").notNull().default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const kidsContent = pgTable("kids_content", {
  id: uuid("id").defaultRandom().primaryKey(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(),
  contentAr: text("content_ar"),
  contentEn: text("content_en"),
  ageGroup: text("age_group").notNull(),
  featuredImageUrl: text("featured_image_url"),
  videoUrl: text("video_url"),
  quizData: jsonb("quiz_data"),
  published: boolean("published").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const kidsGameResults = pgTable(
  "kids_game_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    gameId: text("game_id").notNull(),
    clientSubmissionId: text("client_submission_id").notNull(),
    score: integer("score").notNull().default(0),
    collectibles: integer("collectibles").notNull().default(0),
    distance: integer("distance").notNull().default(0),
    xpAwarded: smallint("xp_awarded").notNull().default(0),
    difficulty: text("difficulty").notNull().default("easy"),
    playedAt: timestamp("played_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  t => ({
    userClientUnique: uniqueIndex("kids_game_results_user_client_unique").on(
      t.userId,
      t.clientSubmissionId
    ),
    userGameIndex: index("kids_game_results_user_game_idx").on(
      t.userId,
      t.gameId
    ),
    gameScoreIndex: index("kids_game_results_game_score_idx").on(
      t.gameId,
      t.score
    ),
    gamePlayedAtIndex: index("kids_game_results_game_played_at_idx").on(
      t.gameId,
      t.playedAt
    ),
  })
);

export type KidsGameResult = typeof kidsGameResults.$inferSelect;
export type NewKidsGameResult = typeof kidsGameResults.$inferInsert;

export const companions = pgTable("companions", {
  id: uuid("id").defaultRandom().primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
  bioAr: text("bio_ar"),
  bioEn: text("bio_en"),
  titleAr: text("title_ar"),
  birthPlaceAr: text("birth_place_ar"),
  deathPlaceAr: text("death_place_ar"),
  deathYear: text("death_year"),
  category: text("category"),
  thumbnailUrl: text("thumbnail_url"),
  featuredImageUrl: text("featured_image_url"),
  orderNum: integer("order_num"),
  published: boolean("published").notNull().default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const companionStories = pgTable("companion_stories", {
  id: uuid("id").defaultRandom().primaryKey(),
  companionId: uuid("companion_id")
    .notNull()
    .references(() => companions.id, { onDelete: "cascade" }),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  contentAr: text("content_ar").notNull(),
  contentEn: text("content_en"),
  storyType: text("story_type"),
  orderNum: integer("order_num"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const battles = pgTable("battles", {
  id: uuid("id").defaultRandom().primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  dateHijri: text("date_hijri"),
  yearHijri: integer("year_hijri"),
  dateGregorian: text("date_gregorian"),
  locationAr: text("location_ar"),
  locationEn: text("location_en"),
  thumbnailUrl: text("thumbnail_url"),
  featuredImageUrl: text("featured_image_url"),
  orderNum: integer("order_num"),
  published: boolean("published").notNull().default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const battleEvents = pgTable("battle_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  battleId: uuid("battle_id")
    .notNull()
    .references(() => battles.id, { onDelete: "cascade" }),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  contentAr: text("content_ar").notNull(),
  contentEn: text("content_en"),
  eventType: text("event_type"),
  orderNum: integer("order_num"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const conquests = pgTable("conquests", {
  id: uuid("id").defaultRandom().primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  dateHijri: text("date_hijri"),
  dateGregorian: text("date_gregorian"),
  locationAr: text("location_ar"),
  locationEn: text("location_en"),
  leaderAr: text("leader_ar"),
  leaderEn: text("leader_en"),
  thumbnailUrl: text("thumbnail_url"),
  featuredImageUrl: text("featured_image_url"),
  orderNum: integer("order_num"),
  published: boolean("published").notNull().default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const conquestEvents = pgTable("conquest_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  conquestId: uuid("conquest_id")
    .notNull()
    .references(() => conquests.id, { onDelete: "cascade" }),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  contentAr: text("content_ar").notNull(),
  contentEn: text("content_en"),
  eventType: text("event_type"),
  orderNum: integer("order_num"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const prayerLocations = pgTable("prayer_locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  city: text("city").notNull(),
  country: text("country"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  timezone: text("timezone"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const prayerPreferences = pgTable("prayer_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: "cascade" }),
  calculationMethod: text("calculation_method").default("umm-al-qura"),
  madhab: text("madhab").default("shafi"),
  highLatitudeMethod: text("high_latitude_method").default("middle-of-night"),
  asrMethod: text("asr_method").default("shafi"),
  midnightMethod: text("midnight_method").default("standard"),
  notificationsEnabled: boolean("notifications_enabled")
    .notNull()
    .default(true),
  adhanEnabled: boolean("adhan_enabled").notNull().default(true),
  adhanVolume: integer("adhan_volume").notNull().default(70),
  prayerReminders: jsonb("prayer_reminders")
    .$type<Record<string, number | null>>()
    .notNull()
    .default(
      sql`'{"Fajr":0,"Sunrise":null,"Dhuhr":0,"Asr":0,"Maghrib":0,"Isha":0}'::jsonb`
    ),
  quietHoursStart: time("quiet_hours_start"),
  quietHoursEnd: time("quiet_hours_end"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const prayerNotifications = pgTable("prayer_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  prayerName: text("prayer_name").notNull(),
  notificationTime: timestamp("notification_time", {
    withTimezone: true,
  }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const pushRuntimeSettings = pgTable("push_runtime_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  deviceId: text("device_id"),
  userAgent: text("user_agent"),
  platform: text("platform"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

export const prayerScheduleCache = pgTable(
  "prayer_schedule_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    locationId: uuid("location_id")
      .notNull()
      .references(() => prayerLocations.id, { onDelete: "cascade" }),
    prayerDate: date("prayer_date").notNull(),
    latitude: numeric("latitude").notNull(),
    longitude: numeric("longitude").notNull(),
    timezone: text("timezone").notNull(),
    calculationMethod: text("calculation_method").notNull(),
    madhab: text("madhab").notNull(),
    timings: jsonb("timings").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    cacheUnique: uniqueIndex("prayer_schedule_cache_unique").on(
      table.locationId,
      table.prayerDate,
      table.latitude,
      table.longitude,
      table.timezone,
      table.calculationMethod,
      table.madhab
    ),
  })
);

export const prayerNotificationDeliveries = pgTable(
  "prayer_notification_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    pushSubscriptionId: uuid("push_subscription_id")
      .notNull()
      .references(() => pushSubscriptions.id, { onDelete: "cascade" }),
    prayerName: text("prayer_name").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    processingAt: timestamp("processing_at", { withTimezone: true }),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    retryAfter: timestamp("retry_after", { withTimezone: true }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    deliveryUnique: uniqueIndex("prayer_notification_delivery_unique").on(
      table.pushSubscriptionId,
      table.prayerName,
      table.scheduledAt
    ),
  })
);

export const tawasheehCategories = pgTable("tawasheeh_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull().unique(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  icon: text("icon"),
  orderNum: integer("order_num"),
  published: boolean("published").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const tawasheeh = pgTable("tawasheeh", {
  id: uuid("id").defaultRandom().primaryKey(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  slug: text("slug").notNull().unique(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  artistAr: text("artist_ar"),
  artistEn: text("artist_en"),
  categoryId: uuid("category_id").references(() => tawasheehCategories.id, {
    onDelete: "set null",
  }),
  audioUrl: text("audio_url"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"),
  views: integer("views").notNull().default(0),
  published: boolean("published").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const tawasheehFavorites = pgTable("tawasheeh_favorites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  tawasheehId: uuid("tawasheeh_id")
    .notNull()
    .references(() => tawasheeh.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const tawasheehPlaylists = pgTable("tawasheeh_playlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const tawasheehPlaylistItems = pgTable("tawasheeh_playlist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  playlistId: uuid("playlist_id")
    .notNull()
    .references(() => tawasheehPlaylists.id, { onDelete: "cascade" }),
  tawasheehId: uuid("tawasheeh_id")
    .notNull()
    .references(() => tawasheeh.id, { onDelete: "cascade" }),
  orderNum: integer("order_num"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const reciterFavorites = pgTable("reciter_favorites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  reciterId: uuid("reciter_id")
    .notNull()
    .references(() => quranReciters.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const recentRecitations = pgTable("recent_recitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  reciterId: uuid("reciter_id")
    .notNull()
    .references(() => quranReciters.id, { onDelete: "cascade" }),
  surahId: integer("surah_id").notNull(),
  ayahNumber: integer("ayah_number"),
  playedAt: timestamp("played_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  durationListened: integer("duration_listened"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const videoGenerationRequests = pgTable("video_generation_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  content: jsonb("content").notNull(),
  duration: integer("duration"),
  thumbnailUrl: text("thumbnail_url"),
  status: text("status").notNull().default("pending"),
  youtubeId: text("youtube_id"),
  facebookId: text("facebook_id"),
  videoUrl: text("video_url"),
  errorMessage: text("error_message"),
  errorDetails: text("error_details"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  automationKey: text("automation_key"),
});

export const videoPublishLog = pgTable("video_publish_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  videoId: uuid("video_id").references(() => videoGenerationRequests.id, {
    onDelete: "set null",
  }),
  youtubeId: text("youtube_id"),
  facebookId: text("facebook_id"),
  status: text("status").notNull().default("success"),
  publishedAt: timestamp("published_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const socialPublishQueue = pgTable("social_publish_queue", {
  id: uuid("id").defaultRandom().primaryKey(),
  contentType: text("content_type").notNull(),
  contentId: text("content_id"),
  title: text("title").notNull(),
  body: text("body"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  targetPlatforms: text("target_platforms").array().notNull().default([]),
  status: text("status").notNull().default("queued"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  automationKey: text("automation_key"),
});

export const videoPublishingConfig = pgTable("video_publishing_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  youtubeEnabled: boolean("youtube_enabled").notNull().default(false),
  youtubeChannelId: text("youtube_channel_id"),
  facebookEnabled: boolean("facebook_enabled").notNull().default(false),
  facebookPageId: text("facebook_page_id"),
  autoPublish: boolean("auto_publish").notNull().default(false),
  publishSchedule: text("publish_schedule"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const legacyUsers = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  openId: text("open_id").unique(),
  name: text("name"),
  email: text("email").unique(),
  loginMethod: text("login_method"),
  role: roleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  language: text("language").notNull().default("en"),
  read: boolean("read").notNull().default(false),
  notificationSent: boolean("notification_sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const episodes = pgTable("episodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  contentEn: text("content_en").notNull(),
  contentAr: text("content_ar").notNull(),
  keywordsEn: text("keywords_en"),
  keywordsAr: text("keywords_ar"),
  category: text("category"),
  thumbnailUrl: text("thumbnail_url"),
  youtubeVideoId: text("youtube_video_id"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const savedStories = pgTable("saved_stories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id),
  storyId: uuid("story_id")
    .notNull()
    .references(() => stories.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storyProgress = pgTable("story_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id),
  storyId: uuid("story_id")
    .notNull()
    .references(() => stories.id),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  language: text("language").notNull().default("en"),
  verified: boolean("verified").notNull().default(false),
  verificationToken: text("verification_token"),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  input: text("input").notNull(),
  result: text("result").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userBehavior = pgTable("user_behavior", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  page: text("page").notNull(),
  timeSpent: integer("time_spent").notNull().default(0),
  interaction: text("interaction").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
