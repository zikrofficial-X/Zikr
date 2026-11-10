import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {buildPublicKidsWrittenPost,countUniqueWrittenContentReservations,parseWrittenGenerationRequest,buildWrittenBackfillQueuePayload,buildWrittenPost,buildWrittenSocialQueuePayload,chooseWrittenSourceKind,shouldBackfillKidsWrittenPost,scheduleKidsBackfillWithinUtcDay,containsKidsPersonalDataSolicitation,createWrittenAutomationKey,createWrittenSocialAutomationKey,isEligibleKidsWrittenPostForPublishing,isKidsWrittenPostCandidate,normalizeWrittenCategory,validateWrittenPostDraft,type CurrentKidsStory,type KidsWrittenQueueRow,type WrittenContentSource,type WrittenPostDraft} from "../../src/features/social/services/written-content";
const source:WrittenContentSource={kind:"quran",id:"ayah-1",title:"آية",sourceText:"إِنَّ مَعَ الْعُسْرِ يُسْرًا",reference:"سورة الشرح، الآية 6",publicPath:"/quran/ash-sharh",categoryLabel:"القرآن الكريم",sourceVerified:true,quoteRequired:true};
const draft:WrittenPostDraft={eligible:true,title:"مع كل عسر يسر",hook:"قد تمر بلحظة تظن فيها أن الطريق انتهى، لكن الأمل يظل حاضرًا.",reflection:"تدعونا الآية إلى ألا نستسلم لليأس، وأن نتذكر أن الشدة لا تدوم وأن الأمل باب للعمل والصبر.",question:"ما المعنى الذي تستحضره عندما تمر بوقت صعب؟"};
assert.equal(normalizeWrittenCategory("hadith"),"hadith");assert.equal(normalizeWrittenCategory("other"),"auto");assert.equal(normalizeWrittenCategory("companions"),"companions");assert.equal(normalizeWrittenCategory("kids"),"kids");
assert.deepEqual(parseWrittenGenerationRequest({}), { ok: true, value: { category: "auto", batchSize: 1 } });
assert.deepEqual(parseWrittenGenerationRequest({ category: "kids", batchSize: "2" }), { ok: true, value: { category: "kids", batchSize: 2 } });
assert.deepEqual(parseWrittenGenerationRequest(null), { ok: false, reason: "invalid_body" });
assert.deepEqual(parseWrittenGenerationRequest([]), { ok: false, reason: "invalid_body" });
assert.deepEqual(parseWrittenGenerationRequest({ category: "unknown" }), { ok: false, reason: "invalid_category" });
assert.deepEqual(parseWrittenGenerationRequest({ category: "adhkar" }), { ok: false, reason: "invalid_category" }, "categories disabled in the studio must not dispatch an unsupported workflow input");
assert.deepEqual(parseWrittenGenerationRequest({ batchSize: 4 }), { ok: false, reason: "invalid_batch_size" });
assert.deepEqual(parseWrittenGenerationRequest({ batchSize: true }), { ok: false, reason: "invalid_batch_size" });

assert.equal(chooseWrittenSourceKind(["quran","kids_story"],"auto",false,0),"kids_story","auto generation should prioritize one approved Kids post when none exists today");
assert.equal(chooseWrittenSourceKind(["quran","kids_story"],"auto",true,0),"quran","a second Kids post should not be prioritized after today's Kids slot is filled");
assert.equal(chooseWrittenSourceKind(["quran","kids_story"],"auto",true,1),"quran","auto generation must exclude Kids even when random selection would otherwise choose it");
assert.equal(chooseWrittenSourceKind(["kids_story"],"auto",true,0),null,"auto generation must stop rather than create a second Kids post when no general source remains");
assert.equal(chooseWrittenSourceKind(["kids_story"],"kids",false,0),"kids_story","manual Kids category must keep selecting Kids sources");
assert.equal(chooseWrittenSourceKind(["kids_story"],"kids",true,0),null,"manual Kids generation must stop when the UTC-day Kids slot is already reserved");
assert.equal(chooseWrittenSourceKind([],"auto",false,0),null,"empty source kinds must stop cleanly");
assert.equal(shouldBackfillKidsWrittenPost("kids_story",false),true,"the first Kids backfill may reserve today's slot");
assert.equal(shouldBackfillKidsWrittenPost("kids_story",true),false,"a second Kids backfill must wait until another UTC day");
assert.equal(shouldBackfillKidsWrittenPost("quran",true),true,"general written-post backfill must remain unaffected by the Kids daily slot");
assert.equal(countUniqueWrittenContentReservations(
 [
  { id: "article-general-1", metadata: { automationKey: "written-v1:quran:ayah-1", source: { type: "quran", id: "ayah-1" } } },
  { id: "article-orphan-1", metadata: { automationKey: "written-v1:hadith:hadith-1", source: { type: "hadith", id: "hadith-1" } } },
 ],
 [
  { id: "queue-general-1", automation_key: "written-social-v1:quran:ayah-1", metadata: { source: { type: "quran", id: "ayah-1" } } },
  { id: "queue-kids-1", automation_key: "written-social-v1:kids_story:kids-1", metadata: { source: { type: "kids_story", id: "kids-1" } } },
 ],
), 3, "daily quota must deduplicate article/queue pairs without undercounting an orphan article alongside a Kids-only queue row");

assert.equal(scheduleKidsBackfillWithinUtcDay(new Date("2026-11-11T18:00:00.000Z")),"2026-11-11T18:05:00.000Z","Kids backfill must schedule within the current UTC day");
assert.equal(scheduleKidsBackfillWithinUtcDay(new Date("2026-11-11T23:58:00.000Z")),null,"Kids backfill must defer when its lead time would spill into the next UTC day");
assert.notEqual(createWrittenAutomationKey("quran","1"),createWrittenAutomationKey("quran","2"));
assert.deepEqual(validateWrittenPostDraft(draft),{ok:true});
assert.equal(validateWrittenPostDraft({...draft,reflection:"قال رسول الله كذا"}).ok,false);
assert.equal(validateWrittenPostDraft({...draft,hook:"قال رسول الله: افعلوا الخير دائمًا، واجعلوا الصدق طريقكم في كل يوم."}).ok,false,"unattributed religious claims in the hook must be rejected");
assert.equal(validateWrittenPostDraft({...draft,title:"حديث قدسي عن الأمل"}).ok,false,"unattributed religious claims in the title must be rejected");
assert.equal(validateWrittenPostDraft({...draft,question:"رواه البخاري عن النبي؟"}).ok,false,"unattributed religious claims in the question must be rejected");
assert.equal(validateWrittenPostDraft({...draft,eligible:false}).ok,false);
const post=buildWrittenPost(source,draft);assert.ok(post.body.includes(source.sourceText));assert.ok(post.body.includes(source.reference));assert.equal(post.publicPath,source.publicPath);
assert.ok(buildWrittenPost({...source,kind:"story",quoteRequired:false},draft).body.includes(draft.reflection));
const socialKey=createWrittenSocialAutomationKey(source.kind,source.id);
const socialPayload=buildWrittenSocialQueuePayload(source,draft,"article-1",socialKey,"2026-11-10T08:00:00.000Z");
assert.equal(socialPayload.content_type,"written_post");
assert.equal(socialPayload.content_id,"article-1");
assert.deepEqual(socialPayload.target_platforms,["facebook"]);
assert.equal(socialPayload.video_url,null);
assert.equal(socialPayload.status,"queued");
assert.equal(socialPayload.automation_key,socialKey);
assert.equal(socialPayload.metadata.publicPath,source.publicPath);
const kidsSource: WrittenContentSource = { ...source, kind: "kids_story", id: "kids-story-1", title: "الكلمة الطيبة", sourceText: "قصة منشورة للأطفال عن الكلمة الطيبة.", reference: "قصة أطفال معتمدة في ZIKR", publicPath: "/kids/story-kind-word", categoryLabel: "قصص الأطفال", sourceVerified: true, quoteRequired: false, ageGroup: "6-8" };
const kidsPayload = buildWrittenSocialQueuePayload(kidsSource, draft, kidsSource.id, createWrittenSocialAutomationKey(kidsSource.kind, kidsSource.id), "2026-11-10T08:00:00.000Z");
assert.equal(kidsPayload.content_id, kidsSource.id, "Kids written posts must link to the approved kids_content source, not create a public general article");
const kidsMetadata = kidsPayload.metadata as Record<string, unknown>;
assert.equal(kidsMetadata.audience, "kids");
assert.equal(kidsMetadata.kidsContentId, kidsSource.id);
const backfillKidsPayload = buildWrittenBackfillQueuePayload({
 articleId: "article-kids-1",
 title: "قصة للأطفال",
 body: "نص مناسب للأطفال",
 publicPath: "/kids/story-1",
 sourceType: "kids_story",
 sourceId: "123e4567-e89b-12d3-a456-426614174000",
 sourceTitle: "قصة للأطفال",
 ageGroup: "6-8",
 automationKey: "written-v1:kids_story:123e4567-e89b-12d3-a456-426614174000",
 now: "2026-11-10T08:00:00.000Z",
 scheduledAt: "2026-11-10T08:05:00.000Z",
});
assert.equal(backfillKidsPayload.content_id, "123e4567-e89b-12d3-a456-426614174000", "Kids backfill must link the live Kids source, not the article UUID");
assert.equal(backfillKidsPayload.metadata.audience, "kids", "Kids backfill must retain its audience marker");
assert.equal(backfillKidsPayload.metadata.kidsContentId, "123e4567-e89b-12d3-a456-426614174000");
assert.equal(backfillKidsPayload.metadata.ageGroup, "6-8");
const backfillGeneralPayload = buildWrittenBackfillQueuePayload({
 articleId: "article-general-1",
 title: "معلومة عامة",
 body: "نص عام",
 publicPath: "/quran/ash-sharh",
 sourceType: "quran",
 sourceId: "ayah-1",
 automationKey: "written-v1:quran:ayah-1",
 now: "2026-11-10T08:00:00.000Z",
 scheduledAt: "2026-11-10T08:05:00.000Z",
});
assert.equal(backfillGeneralPayload.content_id, "article-general-1");
assert.equal("audience" in backfillGeneralPayload.metadata, false, "general backfill must not be mislabeled as Kids");
assert.throws(() => buildWrittenBackfillQueuePayload({
 articleId: "article-kids-invalid",
 title: "قصة",
 body: "نص",
 publicPath: "/quran/ash-sharh",
 sourceType: "kids_story",
 sourceId: "not-a-uuid",
 automationKey: "written-v1:kids_story:invalid",
 now: "2026-11-10T08:00:00.000Z",
 scheduledAt: "2026-11-10T08:05:00.000Z",
}), /Kids backfill must retain a valid Kids source ID and \/kids\/ public path/);
assert.throws(() => buildWrittenBackfillQueuePayload({
 articleId: "article-kids-invalid-path",
 title: "قصة",
 body: "نص مناسب للأطفال",
 publicPath: "/kids/../admin",
 sourceType: "kids_story",
 sourceId: "123e4567-e89b-12d3-a456-426614174000",
 automationKey: "written-v1:kids_story:123e4567-e89b-12d3-a456-426614174000",
 now: "2026-11-10T08:00:00.000Z",
 scheduledAt: "2026-11-10T08:05:00.000Z",
}), /Kids backfill must retain a valid Kids source ID and \/kids\/ public path/);
assert.throws(() => buildWrittenBackfillQueuePayload({
 articleId: "article-kids-unsafe",
 title: "قصة آمنة",
 body: "أرسل رقم هاتفك لي",
 publicPath: "/kids/story-safe",
 sourceType: "kids_story",
 sourceId: "123e4567-e89b-12d3-a456-426614174000",
 automationKey: "written-v1:kids_story:123e4567-e89b-12d3-a456-426614174000",
 now: "2026-11-10T08:00:00.000Z",
 scheduledAt: "2026-11-10T08:05:00.000Z",
}), /child-safety content check/);

assert.equal(kidsMetadata.ageGroup, "6-8");

const queueRow: KidsWrittenQueueRow = {
 id: "queue-kids-1",
 content_type: "written_post",
 content_id: "kids-story-1",
 title: "الكلمة الطيبة",
 body: "من قصة الكلمة الطيبة نتعلم أن الخير يبدأ بكلمة حسنة.",
 status: "published",
 target_platforms: ["facebook"],
 published_at: "2026-11-10T12:00:00.000Z",
 metadata: {
  audience: "kids",
  kidsContentId: "kids-story-1",
  publicPath: "/kids/story-kind-word",
  source: { type: "kids_story", id: "kids-story-1", verified: true },
 },
};
const liveKidsStory: CurrentKidsStory = {
 id: "kids-story-1",
 slug: "story-kind-word",
 title_ar: "الكلمة الطيبة",
 age_group: "6-8",
 type: "story",
 published: true,
 is_active: true,
 metadata: { age_appropriate: true },
};
const kidsPublishCandidate = {
 content_type: queueRow.content_type,
 content_id: queueRow.content_id,
 title: queueRow.title,
 body: queueRow.body,
 metadata: queueRow.metadata,
};
assert.equal(isKidsWrittenPostCandidate(kidsPublishCandidate), true, "properly labeled Kids written posts must be recognized as Kids candidates");
assert.equal(isKidsWrittenPostCandidate({
 ...kidsPublishCandidate,
 metadata: { ...queueRow.metadata, audience: "general" },
}), true, "Kids source identity/path markers must still trigger the safety gate when the audience marker is inconsistent");
assert.equal(isKidsWrittenPostCandidate({
 ...kidsPublishCandidate,
 metadata: { audience: "general", source: { type: "quran" }, publicPath: "/quran/ash-sharh" },
}), false, "general written posts must not be classified as Kids candidates");
assert.equal(isEligibleKidsWrittenPostForPublishing(kidsPublishCandidate, liveKidsStory), true, "Kids written posts require a currently approved live story before provider delivery");
assert.equal(isEligibleKidsWrittenPostForPublishing(kidsPublishCandidate, { ...liveKidsStory, published: false }), false, "unpublished Kids sources must be held before provider delivery");
assert.equal(isEligibleKidsWrittenPostForPublishing(kidsPublishCandidate, { ...liveKidsStory, is_active: false }), false, "inactive Kids sources must be held before provider delivery");
assert.equal(isEligibleKidsWrittenPostForPublishing(kidsPublishCandidate, { ...liveKidsStory, metadata: { age_appropriate: false } }), false, "non-age-appropriate Kids sources must be held before provider delivery");
assert.equal(isEligibleKidsWrittenPostForPublishing({ ...kidsPublishCandidate, content_id: "different-source" }, liveKidsStory), false, "queue identity must match the live Kids source before provider delivery");
assert.equal(isEligibleKidsWrittenPostForPublishing({ ...kidsPublishCandidate, metadata: { ...queueRow.metadata, publicPath: "/kids/other-story" } }, liveKidsStory), false, "stale Kids paths must be held before provider delivery");
assert.equal(isEligibleKidsWrittenPostForPublishing({ ...kidsPublishCandidate, metadata: { ...queueRow.metadata, source: { type: "kids_story", id: "kids-story-1", verified: false } } }, liveKidsStory), false, "unverified Kids source metadata must be held before provider delivery");
const publicKidsPost = buildPublicKidsWrittenPost(queueRow, liveKidsStory);
assert.ok(publicKidsPost, "a published post with a currently approved Kids source may be displayed");
assert.equal(publicKidsPost?.publicPath, "/kids/story-kind-word");
assert.equal(publicKidsPost?.ageGroup, "6-8");
assert.equal(buildPublicKidsWrittenPost(queueRow, { ...liveKidsStory, published: false }), null, "unpublished source stories must disappear from the public Kids feed");
assert.equal(buildPublicKidsWrittenPost(queueRow, { ...liveKidsStory, is_active: false }), null, "inactive source stories must disappear from the public Kids feed");
assert.equal(buildPublicKidsWrittenPost(queueRow, { ...liveKidsStory, metadata: { age_appropriate: false } }), null, "stories no longer marked age-appropriate must disappear from the public Kids feed");
assert.equal(buildPublicKidsWrittenPost(queueRow, { ...liveKidsStory, type: "quiz" }), null, "only approved story sources may back Kids written posts");
assert.equal(buildPublicKidsWrittenPost({ ...queueRow, content_id: "different-source" }, liveKidsStory), null, "queue content_id must match the live Kids source");
assert.equal(buildPublicKidsWrittenPost({ ...queueRow, status: "queued" }, liveKidsStory), null, "queued posts must never be exposed publicly");
assert.equal(buildPublicKidsWrittenPost({ ...queueRow, metadata: { ...queueRow.metadata, audience: "general" } }, liveKidsStory), null, "non-Kids queue rows must never be exposed publicly");
assert.equal(buildPublicKidsWrittenPost({ ...queueRow, metadata: { ...queueRow.metadata, kidsContentId: "different-source" } }, liveKidsStory), null, "Kids metadata must identify the live source");
assert.equal(buildPublicKidsWrittenPost({ ...queueRow, metadata: { ...queueRow.metadata, publicPath: "/kids/other-story" } }, liveKidsStory), null, "stale story paths must never be exposed");
assert.equal(buildPublicKidsWrittenPost({ ...queueRow, metadata: { ...queueRow.metadata, source: { type: "kids_story", id: "different-source", verified: true } } }, liveKidsStory), null, "source metadata must identify the same approved story");
assert.equal(containsKidsPersonalDataSolicitation("أرسل رقم هاتفك لي"), true, "Arabic phone-number solicitation must be rejected");
assert.equal(containsKidsPersonalDataSolicitation("ما عنوان بيتك؟"), true, "direct Arabic questions about a child's address must be rejected");
assert.equal(containsKidsPersonalDataSolicitation("راسلني على واتساب"), true, "private-contact requests must be rejected");
assert.equal(containsKidsPersonalDataSolicitation("DM me your location"), true, "English personal-location requests must be rejected");
assert.equal(containsKidsPersonalDataSolicitation("لا تشارك رقم هاتفك مع أي شخص"), false, "safety warnings must not be mistaken for personal-data solicitation");
assert.equal(containsKidsPersonalDataSolicitation("ما الدرس الذي تعلمته من القصة؟"), false, "ordinary educational questions must remain allowed");

const worker = readFileSync("scripts/jobs/written-content-automation.ts", "utf8");
const socialPublishing = readFileSync("src/features/social/services/social-publishing.ts", "utf8");
const writtenFactory = readFileSync("src/features/social/services/written-content.ts", "utf8");
const kidsApi = readFileSync("src/app/api/kids/social-posts/route.ts", "utf8");
const kidsPage = readFileSync("src/app/kids/page.tsx", "utf8");
const writtenApi = readFileSync("src/app/api/admin/social/written/route.ts", "utf8");
assert.match(writtenApi, /request\.json\(\)/);
assert.match(writtenApi, /Invalid JSON request body\./, "malformed JSON must be rejected instead of silently dispatching automatic generation");
assert.match(writtenApi, /parseWrittenGenerationRequest\(requestBody\)/, "admin generation inputs must pass strict validation before workflow dispatch");

const writtenWorkflow = readFileSync(".github/workflows/generate-written-content.yml", "utf8");
const writtenStudio = readFileSync("src/app/admin/social/written-studio/written-studio-client.tsx", "utf8");
assert.match(worker, /\/rest\/v1\/articles/);
assert.match(worker, /\/rest\/v1\/content_publish_queue/);
assert.match(worker, /\/rest\/v1\/social_publish_queue/);
assert.match(worker, /buildWrittenSocialQueuePayload/);
assert.match(worker, /buildWrittenBackfillQueuePayload/);
assert.match(worker, /countUniqueWrittenContentReservations\(todays,todaysSocial\)/, "daily quota must count unique source reservations across article and social-only Kids records");
assert.match(worker, /skipped invalid written-post backfill/, "one malformed or unsafe historical row must not abort the entire backfill batch");
assert.match(worker, /createWrittenSocialAutomationKey/);
assert.match(worker, /enqueueExistingWrittenArticlesForFacebook/);
assert.match(worker, /\/rest\/v1\/kids_content/);
assert.match(worker, /metadata\.age_appropriate!==true/);
assert.match(worker, /readRequired<Row>\(\s*"\/rest\/v1\/kids_content\?/, "Kids source lookup must fail closed instead of silently bypassing daily prioritization");
assert.match(worker, /metadata->>audience=eq\.kids&or=\$\{kidsDayFilter\}/, "Kids backfill must inspect all UTC-day reservation timestamps");
assert.match(worker, /shouldBackfillKidsWrittenPost\(sourceType,hasKidsPostToday\)/, "Kids backfill must stop after one daily reservation");
assert.match(worker, /scheduleKidsBackfillWithinUtcDay\(now\)/, "Kids backfill must not schedule its reserved slot into a future UTC day");
assert.match(worker, /if\(sourceType==="kids_story"\)hasKidsPostToday=true/, "a successful Kids backfill must reserve the current UTC day for later rows");
assert.match(worker, /source\.kind==="kids_story"/);
assert.match(worker, /chooseWrittenSourceKind\(/);
assert.match(worker, /const todaysKidsPosts = category === "auto" \|\| category === "kids"/, "explicit Kids generation must inspect the same UTC-day reservation before selecting a source");
assert.match(worker, /metadata->>audience=eq\.kids/);
assert.match(worker, /scheduled_at\.gte\.\$\{dayStartIso\}/, "daily Kids reservation must include posts scheduled for the current UTC day");
assert.match(worker, /published_at\.gte\.\$\{dayStartIso\}/, "daily Kids reservation must include posts published during the current UTC day");
assert.match(worker, /created_at\.gte\.\$\{dayStartIso\}/, "daily Kids reservation must include rows created during the current UTC day");
assert.match(worker, /content_type=eq\.written_post&metadata->>audience=eq\.kids/);
assert.match(worker, /if\(kind==="kids_story"\)hasKidsPostToday=true/);
assert.match(worker, /Kids safety gate/);
assert.match(worker, /containsKidsPersonalDataSolicitation/);
assert.match(writtenFactory, /containsKidsPersonalDataSolicitation/);
assert.match(kidsApi, /status=eq\.published&metadata->>audience=eq\.kids/);
assert.match(writtenFactory, /source\.type !== "story"/);
assert.match(writtenFactory, /source\.published !== true/);
assert.match(writtenFactory, /source\.is_active !== true/);
assert.match(writtenFactory, /liveMetadata\.age_appropriate !== true/);
assert.match(writtenFactory, /kidsContentId !== source\.id/);
assert.match(writtenFactory, /sourceMetadata\.id !== source\.id/);
assert.match(kidsApi, /buildPublicKidsWrittenPost/);
assert.match(kidsApi, /order=published_at\.desc&limit=60/, "the public Kids feed must fetch extra candidates before filtering stale sources");
assert.match(kidsApi, /items\.slice\(0, 12\)/, "the public Kids feed must return up to twelve currently eligible posts after source filtering");
assert.match(kidsApi, /getServerEnv\(\)\.SUPABASE_SERVICE_ROLE_KEY/);
assert.match(kidsApi, /return NextResponse\.json\(\[\],/);
assert.match(kidsApi, /\/rest\/v1\/kids_content\?id=in\.\(/);
assert.match(kidsApi, /is_active=eq\.true/);
assert.match(kidsApi, /metadata->>age_appropriate=eq\.true/);
assert.match(kidsPage, /\/api\/kids\/social-posts/);
assert.match(kidsPage, /kidsWrittenPosts\.map/);
assert.match(writtenFactory, /"kids"/, "the strict request parser must allow the supported Kids category");
assert.match(writtenApi, /parseWrittenGenerationRequest\(requestBody\)/, "the admin endpoint must validate the parsed body before dispatch");
assert.match(writtenWorkflow, /knowledge, kids/);
assert.match(writtenStudio, /value: "kids", label: "قصص الأطفال المعتمدة"/);
assert.match(writtenFactory, /content_type:\s*"written_post"/);
assert.match(writtenFactory, /target_platforms:\s*\["facebook"\]/);
assert.match(socialPublishing, /checkKidsWrittenPostApproval\(item\)/, "social publishing must revalidate the live Kids source before provider delivery");
assert.match(socialPublishing, /isKidsWrittenPostCandidate\(item\)/, "malformed Kids metadata must not bypass live source approval");
assert.match(socialPublishing, /isEligibleKidsWrittenPostForPublishing\(item, rows\[0\]\)/);
assert.ok(
  socialPublishing.indexOf("checkKidsWrittenPostApproval(item)") < socialPublishing.indexOf("publishPlatform(item, platform)"),
  "Kids source validation must run before any external social provider call",
);
assert.match(socialPublishing, /kidsSourceApprovalBlocked/);
assert.match(socialPublishing, /kidsSourceApprovalPending/);
assert.match(worker, /published:\s*false/);
assert.match(worker, /content_table:\s*"articles"/);
console.log("Written-content source-lock, quality, idempotency, website scheduling, and Facebook queue tests passed.");
