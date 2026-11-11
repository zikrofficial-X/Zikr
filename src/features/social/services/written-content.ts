export type WrittenGenerationRequest = {
 category: WrittenCategory;
 batchSize: number;
};

export function parseWrittenGenerationRequest(value: unknown):
 { ok: true; value: WrittenGenerationRequest } |
 { ok: false; reason: "invalid_body" | "invalid_category" | "invalid_batch_size" } {
 if (!value || typeof value !== "object" || Array.isArray(value)) {
  return { ok: false, reason: "invalid_body" };
 }
 const body = value as Record<string, unknown>;
 const rawCategory = body.category === undefined ? "auto" : body.category;
 const allowedCategories: readonly WrittenCategory[] = [
  "auto", "quran", "hadith", "dua", "story", "prophets", "companions", "knowledge", "kids",
 ];
 if (typeof rawCategory !== "string" || !allowedCategories.includes(rawCategory as WrittenCategory)) {
  return { ok: false, reason: "invalid_category" };
 }
 const rawBatchSize = body.batchSize ?? 1;
 if (typeof rawBatchSize !== "number" && typeof rawBatchSize !== "string") {
  return { ok: false, reason: "invalid_batch_size" };
 }
 if (typeof rawBatchSize === "string" && !/^\d+$/.test(rawBatchSize.trim())) {
  return { ok: false, reason: "invalid_batch_size" };
 }
 const batchSize = Number(rawBatchSize);
 if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 3) {
  return { ok: false, reason: "invalid_batch_size" };
 }
 return { ok: true, value: { category: rawCategory as WrittenCategory, batchSize } };
}

export type WrittenCategory = "auto" | "quran" | "hadith" | "dua" | "adhkar" | "story" | "prophets" | "companions" | "knowledge" | "kids";
export type WrittenSourceKind = Exclude<WrittenCategory, "auto" | "kids"> | "kids_story";
export type WrittenContentSource = { kind: WrittenSourceKind; id:string; title:string; sourceText:string; reference:string; publicPath:string; categoryLabel:string; sourceVerified:boolean; quoteRequired:boolean; ageGroup?: string };
export type WrittenPostDraft = { eligible:boolean; title:string; hook:string; reflection:string; question?:string | null };
export function normalizeWrittenCategory(value:string):WrittenCategory { const v=value.trim().toLowerCase(); return (["auto","quran","hadith","dua","adhkar","story","prophets","companions","knowledge","kids"] as string[]).includes(v)?v as WrittenCategory:"auto"; }
export function createWrittenAutomationKey(kind:string,id:string){return `written-v1:${kind}:${id}`;}
export function chooseWrittenSourceKind(
 availableKinds: readonly WrittenSourceKind[],
 category: WrittenCategory,
 hasKidsPostToday: boolean,
 randomIndex: number,
): WrittenSourceKind | null {
 if (availableKinds.length === 0) return null;
 if (category === "auto" && !hasKidsPostToday && availableKinds.includes("kids_story")) {
  return "kids_story";
 }
 const eligibleKinds = (category === "auto" || category === "kids") && hasKidsPostToday
  ? availableKinds.filter((kind) => kind !== "kids_story")
  : availableKinds;
 if (eligibleKinds.length === 0) return null;
 const index = Number.isFinite(randomIndex)
  ? Math.max(0, Math.min(eligibleKinds.length - 1, Math.floor(randomIndex)))
  : 0;
 return eligibleKinds[index] ?? null;
}

export function shouldBackfillKidsWrittenPost(sourceType: string, hasKidsPostToday: boolean): boolean {
 return sourceType !== "kids_story" || !hasKidsPostToday;
}

export function scheduleKidsBackfillWithinUtcDay(now: Date): string | null {
 const timestamp = now.getTime();
 if (!Number.isFinite(timestamp)) throw new Error("Invalid Kids backfill scheduling time.");
 const nextUtcDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
 const scheduledAt = timestamp + 5 * 60_000;
 return scheduledAt < nextUtcDay ? new Date(scheduledAt).toISOString() : null;
}

export function containsKidsPersonalDataSolicitation(value: string): boolean {
 const normalized = value
  .normalize("NFKC")
  .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
  .replace(/[أإآ]/g, "ا")
  .replace(/ى/g, "ي")
  .toLowerCase()
  .replace(/\s+/g, " ")
  .trim();
 const personalData = "(?:اسم(?:ك(?: الكامل)?| مدرستك| ولي امرك| والديك)|رقم(?:ك| هاتفك| الموبايل| جوالك| ولي امرك)|عنوانك|عنوان (?:بيتك|منزلك)|مدرستك|بريدك(?: الالكتروني)?|ايميلك|كلمة المرور|كلمة السر|موقعك|مكانك|صورتك|صورك|صورة لك|صورة شخصية|حسابك|اسم المستخدم|بياناتك الشخصية|معلوماتك الشخصية)";
 const askVerbs = "(?:ارسل(?:لي)?|ابعث(?:لي)?|ابعت(?:لي)?|ابعتي(?:لي)?|شارك|اكتب(?:لي)?|اذكر|قل لي|قوللي|قولي|اخبرني|اعطني|اديني|تعطيني|هات(?:لي)?|وريني|اترك|ضع|سجل|ادخل|ارسل لي|ابعث لي|ابعت لي|ارسال|مشاركة|تبعت(?:لي)?|ترسل(?:لي)?|تديني|تقولي|تكتب(?:لي)?)";
 const channels = "(?:واتساب|واتس اب|تيليجرام|تلجرام|انستجرام|سناب(?: شات)?|فيسبوك|ماسنجر|الخاص|رسالة خاصة)";
 const asksForData = new RegExp("(?:^|\\s)" + askVerbs + "(?:\\s+[^.!؟?]{1,30})?\\s+" + personalData, "u");
 const asksDirectly = new RegExp("(?:^|\\s)(?:ما|ما هو|ما هي|اين|اين هو|اين هي)(?:\\s+[^.!؟?]{0,24})?\\s+" + personalData, "u");
 const asksForContact = new RegExp("(?:^|\\s)(?:راسلني|تواصل معي|اتصل بي|قابلني|كلمني)(?:\\s+[^.!؟?]{1,30})?(?:" + channels + ")?", "u");
 const asksInEnglish = /\b(?:send|share|tell me|give me|write|enter|leave|dm|message|contact|call|meet|text me)\b[\s\S]{0,45}\b(?:your (?:full )?name|phone(?: number)?|home address|address|school|email|password|location|photo|picture|selfie|account|username|whatsapp|telegram|instagram|snapchat|facebook|where you live)\b/i;
 const asksForPrivateChannel = /(?:^|\s)(?:ابعت(?:لي)?|ابعث(?:لي)?|ابعتي(?:لي)?|ارسل(?:لي)?|ابعث لي|ابعت لي|ابعتي لي|ارسل لي)(?:\s+[^.!؟?]{0,16})?(?:على\s+)?(?:الخاص|رسالة خاصة|واتساب|واتس اب|تيليجرام|تلجرام|انستجرام|سناب(?: شات)?|ماسنجر)(?:\s|$)/u;
 const privateEnglishContact = /\b(?:dm me|message me privately|contact me|call me|meet me|send (?:me )?(?:a )?(?:private )?dm|leave (?:me )?(?:a )?dm|(?:whatsapp|telegram|instagram|snapchat) me)\b/i;
 return asksForData.test(normalized) || asksDirectly.test(normalized) ||
  asksForContact.test(normalized) || asksForPrivateChannel.test(normalized) ||
  asksInEnglish.test(normalized) || privateEnglishContact.test(normalized);
}

export function validateWrittenPostDraft(value:unknown):{ok:boolean;reason?:string}{
 if(!value||typeof value!=="object"||Array.isArray(value))return {ok:false,reason:"invalid_body"};
 const d=value as Record<string,unknown>;
 if(d.eligible!==true)return {ok:false,reason:d.eligible===false?"source_insufficient":"eligibility_required"};
 const title=typeof d.title==="string"?d.title.trim():"",hook=typeof d.hook==="string"?d.hook.trim():"",reflection=typeof d.reflection==="string"?d.reflection.trim():"";
 if(title.length<8||title.length>90)return {ok:false,reason:"title_length"};
 if(hook.length<12||hook.length>260)return {ok:false,reason:"hook_length"};
 if(reflection.length<70||reflection.length>900)return {ok:false,reason:"reflection_length"};
 if(!/[\u0600-\u06FF]/u.test(title+hook+reflection))return {ok:false,reason:"arabic_required"};
 if (d.question !== undefined && d.question !== null && typeof d.question !== "string") {
  return {ok:false,reason:"question_type"};
 }
 const question = typeof d.question === "string" ? d.question.trim() : "";
 if (question.length > 240) return {ok:false,reason:"question_length"};
 const generatedText=[title,hook,reflection,question].join("\n")
  .normalize("NFKC")
  .replace(/[\u064B-\u065F\u0670\u0640]/g,"")
  .replace(/[أإآ]/g,"ا")
  .replace(/ى/g,"ي")
  .replace(/\s+/g," ")
  .trim();
 if(/(?:قال\s+(?:رسول\s+الله|النبي|تعالى)|رواه|روى\s+\S+|حديث\s+قدسي|فتوى\s+قاطعة)/u.test(generatedText))return {ok:false,reason:"unattributed_religious_quote"};
 return {ok:true};
}

export function buildWrittenPost(source:WrittenContentSource,draft:WrittenPostDraft){
 const quote=source.quoteRequired?`«${source.sourceText.trim()}»`:draft.reflection.trim();
 const reflection=source.quoteRequired?draft.reflection.trim():"";
 const question=typeof draft.question==="string"?draft.question.trim():"";
 return {title:draft.title.trim(),body:[draft.hook.trim(),quote,reflection,question,source.reference.trim()].filter(Boolean).join("\n\n"),publicPath:source.publicPath};
}

export function countUniqueWrittenContentReservations(
 articles: readonly Record<string, unknown>[],
 socialRows: readonly Record<string, unknown>[],
): number {
 const reservations = new Set<string>();
 const add = (row: Record<string, unknown>, kind: "article" | "social", index: number) => {
  const metadata = asWrittenRecord(row.metadata);
  const rawAutomationKey = kind === "article" ? metadata.automationKey : row.automation_key;
  if (typeof rawAutomationKey === "string" && rawAutomationKey.trim()) {
   reservations.add(rawAutomationKey.trim().replace(/^written-social-v1:/, "written-v1:"));
   return;
  }
  const source = asWrittenRecord(metadata.source);
  const sourceType = typeof source.type === "string" ? source.type.trim() : "";
  const sourceId = typeof source.id === "string" ? source.id.trim() : "";
  if (sourceType && sourceId) {
   reservations.add("written-v1:" + sourceType + ":" + sourceId);
   return;
  }
  const id = typeof row.id === "string" && row.id.trim() ? row.id.trim() : String(index);
  reservations.add(kind + ":" + id);
 };
 articles.forEach((row, index) => add(row, "article", index));
 socialRows.forEach((row, index) => add(row, "social", index));
 return reservations.size;
}

export function createWrittenSocialAutomationKey(kind: string, id: string) {
 return `written-social-v1:${kind}:${id}`;
}

export function buildWrittenSocialQueuePayload(
 source: WrittenContentSource,
 draft: WrittenPostDraft,
 articleId: string,
 automationKey: string,
 now: string,
 scheduledAt: string = now,
) {
 const post = buildWrittenPost(source, draft);
 return {
  content_type: "written_post",
  content_id: source.kind === "kids_story" ? source.id : articleId,
  title: post.title,
  body: post.body,
  image_url: null,
  video_url: null,
  target_platforms: ["facebook"],
  status: "queued",
  scheduled_at: scheduledAt,
  published_at: null,
  error_message: null,
  metadata: {
   contentType: "written_post",
   publicPath: post.publicPath,
   ...(source.kind === "kids_story" ? {
    audience: "kids",
    kidsContentId: source.id,
    ageGroup: source.ageGroup ?? null,
   } : {}),
   source: {
    type: source.kind,
    id: source.id,
    title: source.title,
    reference: source.reference,
    verified: source.sourceVerified,
   },
   generation: {
    provider: "gemini",
    version: "written-facebook-v1",
    generatedAt: now,
   },
  },
  automation_key: automationKey,
  created_at: now,
  updated_at: now,
 };
}

export function buildWrittenBackfillQueuePayload(input: {
 articleId: string;
 title: string;
 body: string;
 publicPath: string;
 sourceType: string;
 sourceId: string;
 sourceTitle?: string | null;
 sourceReference?: string | null;
 ageGroup?: string | null;
 originalCreatedAt?: string | null;
 automationKey: string;
 now: string;
 scheduledAt: string;
}) {
 const isKidsStory = input.sourceType === "kids_story";
 if (isKidsStory && (
  !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.sourceId) ||
  !/^\/kids\/[a-z0-9-]+$/i.test(input.publicPath)
 )) {
  throw new Error("Kids backfill must retain a valid Kids source ID and /kids/ public path.");
 }
 if (isKidsStory && containsKidsPersonalDataSolicitation([input.title, input.body].join("\n"))) {
  throw new Error("Kids backfill must pass the child-safety content check.");
 }
 return {
  content_type: "written_post",
  content_id: isKidsStory ? input.sourceId : input.articleId,
  title: input.title,
  body: input.body,
  image_url: null,
  video_url: null,
  target_platforms: ["facebook"],
  status: "queued",
  scheduled_at: input.scheduledAt,
  published_at: null,
  error_message: null,
  metadata: {
   contentType: "written_post",
   publicPath: input.publicPath,
   ...(isKidsStory ? {
    audience: "kids",
    kidsContentId: input.sourceId,
    ageGroup: input.ageGroup ?? null,
   } : {}),
   source: {
    type: input.sourceType,
    id: input.sourceId,
    title: input.sourceTitle || input.title,
    reference: input.sourceReference || "",
    verified: true,
   },
   generation: {
    provider: "gemini",
    version: "written-facebook-backfill-v1",
    importedFromArticleId: input.articleId,
    originalCreatedAt: input.originalCreatedAt ?? null,
   },
  },
  automation_key: input.automationKey,
  created_at: input.now,
  updated_at: input.now,
 };
}

export type KidsWrittenQueueRow = {
 id: string;
 content_type: string;
 content_id: string | null;
 title: string;
 body: string | null;
 status: string;
 target_platforms: string[] | null;
 published_at: string | null;
 metadata: Record<string, unknown> | null;
};

export type CurrentKidsStory = {
 id: string;
 slug: string;
 title_ar: string;
 age_group: string | null;
 type: string;
 published: boolean | null;
 is_active: boolean | null;
 metadata: Record<string, unknown> | null;
};

export type PublicKidsWrittenPost = {
 id: string;
 title: string;
 body: string;
 publishedAt: string;
 ageGroup: string | null;
 publicPath: string;
 sourceTitle: string | null;
 platforms: Array<"facebook" | "facebook_reels" | "youtube">;
};

function asWrittenRecord(value: unknown): Record<string, unknown> {
 return value && typeof value === "object" && !Array.isArray(value)
  ? value as Record<string, unknown>
  : {};
}

export type KidsWrittenPublishQueueItem = Pick<
  KidsWrittenQueueRow,
  "content_type" | "content_id" | "title" | "body" | "metadata"
>;

export function isKidsWrittenSourceReservation(value: unknown): boolean {
  const metadata = asWrittenRecord(value);
  const sourceMetadata = asWrittenRecord(metadata.source);
  const publicPath = typeof metadata.publicPath === "string" ? metadata.publicPath : "";
  return metadata.audience === "kids" ||
    typeof metadata.kidsContentId === "string" ||
    sourceMetadata.type === "kids_story" ||
    publicPath === "/kids" ||
    publicPath.startsWith("/kids/");
}

export function isKidsWrittenPostCandidate(
  row: { content_type?: unknown; metadata?: unknown; automation_key?: unknown },
): boolean {
  if (row.content_type !== "written_post") return false;
  const automationKey = typeof row.automation_key === "string" ? row.automation_key : "";
  return isKidsWrittenSourceReservation(row.metadata) ||
    automationKey.startsWith("written-social-v1:kids_story:");
}

export function isEligibleKidsWrittenPostForPublishing(
  row: KidsWrittenPublishQueueItem,
  source: CurrentKidsStory,
): boolean {
  const metadata = asWrittenRecord(row.metadata);
  const sourceMetadata = asWrittenRecord(metadata.source);
  const liveMetadata = asWrittenRecord(source.metadata);
  const kidsContentId = typeof metadata.kidsContentId === "string" ? metadata.kidsContentId : "";
  const rawPublicPath = typeof metadata.publicPath === "string" ? metadata.publicPath : "";
  const slug = typeof source.slug === "string" ? source.slug.trim() : "";
  const title = typeof row.title === "string" ? row.title.trim() : "";
  const body = typeof row.body === "string" ? row.body.trim() : "";
  const sourceTitle = typeof source.title_ar === "string" ? source.title_ar.trim() : "";

  return row.content_type === "written_post" &&
    Boolean(row.content_id) &&
    row.content_id === source.id &&
    Boolean(source.id) &&
    source.type === "story" &&
    source.published === true &&
    source.is_active === true &&
    liveMetadata.age_appropriate === true &&
    metadata.audience === "kids" &&
    kidsContentId === source.id &&
    sourceMetadata.type === "kids_story" &&
    sourceMetadata.id === source.id &&
    sourceMetadata.verified === true &&
    /^[a-z0-9-]+$/i.test(slug) &&
    rawPublicPath === "/kids/" + slug &&
    Boolean(title) &&
    Boolean(body) &&
    !containsKidsPersonalDataSolicitation([title, body, sourceTitle].filter(Boolean).join("\n"));
}

/** Re-check the live Kids source before exposing a previously published social post. */
export function buildPublicKidsWrittenPost(
 row: KidsWrittenQueueRow,
 source: CurrentKidsStory,
): PublicKidsWrittenPost | null {
 const metadata = asWrittenRecord(row.metadata);
 const sourceMetadata = asWrittenRecord(metadata.source);
 const liveMetadata = asWrittenRecord(source.metadata);
 const kidsContentId = typeof metadata.kidsContentId === "string" ? metadata.kidsContentId : "";
 const rawPublicPath = typeof metadata.publicPath === "string" ? metadata.publicPath : "";
 const slug = typeof source.slug === "string" ? source.slug.trim() : "";
 const title = typeof row.title === "string" ? row.title.trim() : "";
 const body = typeof row.body === "string" ? row.body.trim() : "";
 const sourceTitle = typeof source.title_ar === "string" ? source.title_ar.trim() : "";
 const publishedAt = typeof row.published_at === "string" ? row.published_at.trim() : "";
 const publicPath = "/kids/" + slug;
 const platforms = (row.target_platforms ?? []).filter(
  (platform): platform is "facebook" | "facebook_reels" | "youtube" =>
   platform === "facebook" || platform === "facebook_reels" || platform === "youtube",
 );
 if (
  row.content_type !== "written_post" ||
  row.status !== "published" ||
  !row.id ||
  !row.content_id ||
  row.content_id !== source.id ||
  !source.id ||
  source.type !== "story" ||
  source.published !== true ||
  source.is_active !== true ||
  liveMetadata.age_appropriate !== true ||
  metadata.audience !== "kids" ||
  kidsContentId !== source.id ||
  sourceMetadata.type !== "kids_story" ||
  sourceMetadata.id !== source.id ||
  sourceMetadata.verified !== true ||
  !/^[a-z0-9-]+$/i.test(slug) ||
  rawPublicPath !== publicPath ||
  !title ||
  !body ||
  containsKidsPersonalDataSolicitation([title, body, sourceTitle].filter(Boolean).join("\n")) ||
  !publishedAt ||
  platforms.length === 0
 ) return null;
 return {
  id: row.id,
  title,
  body: body.slice(0, 4500),
  publishedAt,
  ageGroup: typeof source.age_group === "string" && source.age_group.trim() ? source.age_group.trim() : null,
  publicPath,
  sourceTitle: sourceTitle || null,
  platforms,
 };
}
