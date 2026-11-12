import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const route = read("src/app/api/admin/video-purge/route.ts");
const adminSystemActions = read("src/app/admin/system-actions.ts");
const videoGenerationRoute = read("src/app/api/admin/video-generation/route.ts");
const videoMediaContract = read("src/features/videos/services/video-media-contract.ts");
const cloudinaryMediaUrl = read("src/features/videos/services/video-media-url.ts");
const videosService = read("src/features/videos/services/videos.ts");
const socialWorker = read("scripts/jobs/social-publishing.ts");
const videoWorker = read("scripts/jobs/template-video-automation.ts");
const videoQueuePage = read("src/features/admin/video-requests/components/admin-video-requests-client.tsx");
const generationStudio = read("src/app/admin/video/studio/page.tsx");
const control = read("src/features/admin/components/purge-generated-videos-control.tsx");
const apiGuards = read("scripts/verify-admin-api-guards.mjs");

for (const token of [
  'requireAdminApi("video.delete")',
  'CONFIRMATION_PHRASE = "امسح الفيديوهات المولّدة فقط"',
  "resource_type:video AND tags=automated",
  'asset.public_id.startsWith("auto-")',
  'tags.has("zikr-generated")',
  'tags.has("automated")',
  'tags.has("cloudinary-migration")',
  'asset.format === "mp4"',
  "video_generation_requests",
  "video_automation_runs",
  "publicVideoCatalogPreserved: true",
  "manualPublicVideoCatalogPreserved: true",
  "catalogRecordsRetained: true",
  "generatedCatalogRecordsHidden: catalogRecordsHidden",
  "socialQueueRowsPreserved,",
  'action: "video.library.purge"',
  "externalSocialPostsDeleted: false",
]) {
  assert.ok(route.includes(token), "Missing purge route safety contract: " + token);
}
assert.ok(route.includes("manualPublicVideoCatalogPreserved: true"), "the manual public catalog must remain untouched by generated-video purge.");
assert.ok(route.includes("generatedCatalogRecordsHidden: catalogRecordsHidden"), "the response must distinguish hidden generated rows from the preserved manual catalog.");
assert.ok(route.includes("catalogFallbackRowsKeptPublished"), "purge audit/response must report verified YouTube fallback rows retained in public view.");
assert.ok(control.includes("manualPublicVideoCatalogPreserved") && control.includes("generatedCatalogRecordsHidden"), "admin UI must report manual catalog preservation and generated rows hidden separately.");
assert.ok(!/drop\s+table|supabase_migrations|android-releases/i.test(route), "Purge must not alter schema, migration history, or Android releases.");
assert.ok(!route.includes('deleteRows("videos", "id=not.is.null")'), "Purge must preserve unrelated/manual video records.");
assert.ok(route.includes('metadata->>generator=eq.zikr_internal_video_factory'), "Purge must select only internally generated video catalog rows.");
assert.ok(route.includes('mediaState: "purged"'), "Purge must mark removed generated media records.");
assert.ok(route.includes("mediaPurgedFromPublished: wasPublishedBeforeMediaPurge(row)"), "Purge must preserve prior-publication evidence across repeated purges.");
assert.ok(videoMediaContract.includes('"cloudinary_missing", "unavailable", "youtube_only", "purged"'), "purged internal media must never fall through to stale Cloudinary source URLs.");
assert.ok(videoMediaContract.includes("metadata.mediaFallbackAvailable !== true"), "YouTube fallback must require the explicit publisher-confirmed flag.");
assert.ok(videosService.includes("resolveVideoYoutubeId"), "all public video adapters must expose only the validated YouTube fallback ID.");
assert.ok(route.includes("published: keepPublishedFallback"), "Purge must preserve an already-published catalog row only when a verified YouTube fallback exists.");
assert.ok(route.includes("getConfirmedYoutubeFallbackId") && route.includes("shouldKeepPublishedVideoAfterMediaPurge"), "Purge must rely on a verified YouTube publication fallback, not an untrusted row.youtube_id.");
assert.ok(route.includes("catalogFallbackRowsKeptPublished"), "Purge audit metadata must report the fallback rows it kept public.");
assert.ok(route.includes('generatedVideoUrl: null') && route.includes('videoUrl: null'), "Purge must clear dead media URLs.");
assert.ok(route.includes("status=neq.published&video_url=not.is.null&select=video_url&limit=1000"), "file purge must inspect every non-published social queue media reference before deleting assets.");
assert.ok(
  route.includes("pendingSocialGenerationRefs") &&
    route.includes("status=neq.published&or=(content_type.like.*video*,video_url.not.is.null)&select=id&limit=1000") &&
    route.includes("const pendingSocialGenerationRefs = (includeFiles || includeMemory)") &&
    route.includes("(includeFiles || includeMemory) && (pendingSocialGenerationRefs ?? []).length > 0"),
  "file-only and memory cleanup must both stop while any unfinished social video row remains, including rows without video_url",
);
assert.ok(route.includes("isGeneratedCloudinaryVideoUrl") && route.includes("protectedSocialQueueMedia.size > 0"), "file purge must protect generated Cloudinary media referenced by unfinished social posts.");
assert.ok(
  cloudinaryMediaUrl.includes("const fileName = segments.at(-1) ?? \"\"") &&
    cloudinaryMediaUrl.includes('fileStem.startsWith("auto-")'),
  "pending generated-media protection must recognize terminal auto-*.mp4 IDs even when Cloudinary transformations precede the version segment.",
);
assert.ok(route.includes("deletionStarted: false") && route.includes("retryRequired: true"), "a protected queue reference must stop purge before destructive work.");
assert.ok(
  !/social_publish_queue[^\n]*method:\s*["'](?:POST|PATCH|DELETE)/i.test(route),
  "purge must never mutate historical social queue rows.",
);
const queueMediaGuardPosition = route.indexOf("const pendingSocialQueueMedia");
const cloudinaryInventoryPosition = route.indexOf("const assets = includeFiles");
assert.ok(
  queueMediaGuardPosition >= 0 && queueMediaGuardPosition < cloudinaryInventoryPosition,
  "pending social media must be checked before the Cloudinary deletion inventory is processed.",
);

const firstDestructiveOperation = route.indexOf("const cloudinaryErrors = includeFiles");
for (const marker of [
  "const generatedCatalogRows = await",
  "if ((generatedCatalogRows ?? []).length >= 1000)",
  "const generatedRequests = includeMemory",
  "if (includeMemory && (generatedRequests ?? []).length >= 1000)",
  "const automationRuns = includeMemory",
  "if (includeMemory && (automationRuns ?? []).length >= 1000)",
  "const assets = includeFiles ? await listGeneratedVideos()",
  "const storagePaths = includeFiles ? await listAutomatedStorageObjects()",
  "const processingAfterPreflight = await getActiveVideoWork()",
  "if (processingAfterPreflight.generation > 0 || processingAfterPreflight.publications > 0)",
]) {
  const position = route.indexOf(marker);
  assert.ok(
    position >= 0 && position < firstDestructiveOperation,
    "every bounded purge inventory and limit guard must complete before the first destructive operation: " + marker,
  );
}
assert.ok(
  route.includes("const MAX_AUTOMATED_STORAGE_OBJECTS = 5000") &&
    route.includes("const paths = new Set<string>()") &&
    route.includes("paths.size > MAX_AUTOMATED_STORAGE_OBJECTS") &&
    route.includes("for (let offset = 0; offset <= MAX_AUTOMATED_STORAGE_OBJECTS; offset += 1000)") &&
    route.includes("limit: offset === MAX_AUTOMATED_STORAGE_OBJECTS ? 1 : 1000") &&
    route.includes("if (offset === MAX_AUTOMATED_STORAGE_OBJECTS)") &&
    route.includes("Automated video Storage inventory exceeded the safe 5,000-object limit."),
  "automated Storage pagination must detect and reject inventories larger than the safe 5,000-object limit before deletion.",
);
const storageInventoryStart = route.indexOf("async function listAutomatedStorageObjects");
const storageInventoryEnd = route.indexOf("async function deleteAutomatedStorageObjects", storageInventoryStart);
const storageInventory = route.slice(storageInventoryStart, storageInventoryEnd);
assert.ok(
  storageInventory.includes('await walk("automated")') && storageInventory.includes('path.startsWith("automated/")'),
  "the purge may inventory only generated video objects under the dedicated automated/ prefix",
);
assert.doesNotMatch(storageInventory, /await walk\(["']{0,1}["']{0,1}\)/, "the purge must never recursively enumerate the entire videos bucket");

assert.ok(route.includes("const socialQueueRowsPreserved = true"), "historical social queue records must be explicitly preserved.");
assert.ok(route.includes("getActiveVideoWork"), "purge must inspect active internal generation before deleting media.");
assert.ok(route.includes("processing.generation > 0"), "only active internal video generation must block the purge.");
assert.ok(route.includes("processing.publications > 0"), "active scheduled video publication must also block destructive media cleanup.");
assert.ok(
  route.includes("/rest/v1/content_publish_queue?content_table=eq.videos&status=in.(queued,processing)&select=id&limit=100"),
  "purge preflight must inventory in-flight scheduled video publications before deleting media",
);

const contentPublishingWorker = read("scripts/jobs/content-publishing.ts");
assert.ok(contentPublishingWorker.includes('if (item.content_table === "videos" && await isVideoPurgeInProgress()) continue;'), "the content publisher must leave queued video publications untouched while purge is locked.");
assert.ok(contentPublishingWorker.includes('if (item.content_table === "videos" && await isVideoPurgeInProgress()) {'), "the content publisher must recheck the purge lock after claiming a video publication.");
const purgePostStart = route.indexOf("export async function POST(");
const purgePost = purgePostStart >= 0 ? route.slice(purgePostStart) : "";
assert.ok(purgePost.includes('requireAdminStepUpApi("video.delete", "/admin/media")'), "the destructive purge POST must enforce the configured MFA step-up policy.");
assert.ok(purgePost.includes('nextPath: "nextPath" in auth ? auth.nextPath : undefined'), "the purge API must return the step-up redirect target to the admin UI.");
assert.ok(control.includes('payload.error === "step_up_required" && redirectToAdminStepUp(payload.nextPath)'), "the purge UI must complete the server-enforced step-up flow.");
assert.ok(route.includes("getVideoAutomationEnabled") && route.includes("restoreVideoAutomation(automationWasEnabled)"), "cleanup must restore the previous automation state after the temporary lock");
const automationSettingActionStart = adminSystemActions.indexOf("export async function saveVideoAutomationSettingAction");
const automationSettingActionEnd = adminSystemActions.indexOf("export async function requestVideoAutomationRunAction", automationSettingActionStart);
const automationSettingAction = adminSystemActions.slice(automationSettingActionStart, automationSettingActionEnd);
assert.ok(automationSettingActionStart >= 0 && automationSettingActionEnd > automationSettingActionStart, "the guarded automation settings action must remain present");
assert.match(automationSettingAction, /key === "video_automation_enabled"[\s\S]*?video_purge_in_progress[\s\S]*?isVideoPurgeLockResponseActive\(purgeRows\)[\s\S]*?throw new Error/, "admin settings must reject changes while the shared fail-closed purge-lock policy reports an active or malformed lock");
assert.match(videoGenerationRoute, /deleteFailed\s*=\s*body !== null[\s\S]*?typeof body === "object"[\s\S]*?deleteFailed === true/, "bulk deletion must require an explicit boolean true, not truthy strings such as \"false\"");
assert.ok(
  route.includes("async function acquirePurgeLock(token: string)") &&
    route.includes("async function releasePurgeLock(token: string)") &&
    route.includes("value=eq.false") &&
    route.includes("resolution=ignore-duplicates,return=representation") &&
    route.includes("description=eq.${encodeURIComponent(description)}"),
  "purge lock acquisition must be atomic and release must be limited to the owning request token.",
);
const lockAcquisitionPosition = route.indexOf("const lockToken = randomUUID()");
const pausePosition = route.indexOf("await pauseVideoAutomation()");
assert.ok(
  lockAcquisitionPosition >= 0 && lockAcquisitionPosition < pausePosition && route.includes("if (!lockAcquired)"),
  "the purge lock must be acquired before automation is paused, and concurrent purge requests must be rejected.",
);
assert.ok(route.includes("if (purgeLockToken)") && route.includes("await releasePurgeLock(purgeLockToken)"), "purge failures must attempt to release only the lock owned by this request.");
const releaseLockStart = route.indexOf("async function releasePurgeLock");
const releaseLockEnd = route.indexOf("async function getVideoAutomationEnabled", releaseLockStart);
const releaseLockSource = route.slice(releaseLockStart, releaseLockEnd);
assert.ok(
  releaseLockSource.includes('Prefer: "return=representation"') &&
    releaseLockSource.includes("if ((released ?? []).length === 0)"),
  "the purge lock release must verify that the current request still owns and cleared the lock.",
);
assert.ok(route.includes("partialPurge: destructiveWorkStarted && !dataCleanupFinished"), "partial destructive failure must be explicitly reported");
assert.ok(route.includes("metadata->>generator=eq.multi-provider-free-ai"), "purge must select only run records created by the internal video worker");
assert.ok(!route.includes('deleteRows("video_automation_runs", "id=not.is.null")'), "purge must not delete unrelated or unclassified automation-run records");
assert.ok(route.includes('scope !== "files"') && route.includes('scope !== "memory"') && route.includes('scope !== "both"'), "the cleanup endpoint must validate distinct files, memory, and combined scopes before cleanup");
const scopeValidationPosition = route.indexOf('if (scope !== "files" && scope !== "memory" && scope !== "both")');
const purgeLockPosition = route.indexOf("const lockToken = randomUUID()");
assert.ok(
  scopeValidationPosition > 0 && scopeValidationPosition < purgeLockPosition,
  "missing or unsupported purge scopes must be rejected before lock acquisition or any destructive work",
);
assert.match(route, /Invalid purge scope/);
assert.doesNotMatch(route, /const scope = body\.scope ===[\s\S]*?:\s*"both"/, "an invalid scope must never silently widen to a combined destructive purge");

const filePurgeGuardPosition = route.indexOf("if (includeFiles) {");
const filePurgeGuardEnd = route.indexOf("const cloudinary = includeFiles ? cloudinaryConfig()", filePurgeGuardPosition);
const purgeLockAfterGuard = route.indexOf("const lockToken = randomUUID()", filePurgeGuardPosition);
assert.ok(
  filePurgeGuardPosition > scopeValidationPosition &&
    filePurgeGuardEnd > filePurgeGuardPosition &&
    purgeLockAfterGuard > filePurgeGuardPosition &&
    filePurgeGuardPosition < route.indexOf("const assets = includeFiles ? await listGeneratedVideos()") &&
    filePurgeGuardPosition < route.indexOf("const cloudinaryErrors = includeFiles"),
  "file purge must fail closed before Cloudinary configuration, lock acquisition, inventories, or destructive work",
);
const filePurgeGuard = route.slice(filePurgeGuardPosition, filePurgeGuardEnd);
assert.ok(
  filePurgeGuard.includes("complete cross-table reference inventory") &&
    filePurgeGuard.includes("filesPurgeAvailable: false") &&
    filePurgeGuard.includes("deletionStarted: false") &&
    filePurgeGuard.includes("status: 409"),
  "file purge must return a non-destructive conflict until every external and Storage reference can be proven safe",
);
const memoryPurgeGuardPosition = route.indexOf("if (includeMemory) {", filePurgeGuardPosition);
const memoryPurgeLockPosition = route.indexOf("const lockToken = randomUUID()", memoryPurgeGuardPosition);
const memoryPurgeGuard = route.slice(memoryPurgeGuardPosition, memoryPurgeLockPosition);
assert.ok(
  memoryPurgeGuardPosition > filePurgeGuardPosition &&
    memoryPurgeGuardPosition < filePurgeGuardEnd &&
    memoryPurgeLockPosition > memoryPurgeGuardPosition &&
    memoryPurgeGuard.includes("video-catalog metadata") &&
    memoryPurgeGuard.includes("social-queue") &&
    memoryPurgeGuard.includes("audit-event") &&
    memoryPurgeGuard.includes("memoryPurgeAvailable: false") &&
    memoryPurgeGuard.includes("deletionStarted: false") &&
    memoryPurgeGuard.includes("No database rows were changed") &&
    memoryPurgeGuard.includes("status: 409"),
  "memory purge must fail closed before lock acquisition or request-row deletion until every soft reference is safely preserved or detached",
);
assert.ok(
  control.includes('<option value="files" disabled>') &&
    control.includes('<option value="memory" disabled>') &&
    control.includes('<option value="both" disabled>') &&
    control.includes("حذف الملفات والذاكرة معطّل"),
  "the admin UI must disable every purge scope while file and memory reference inventories remain incomplete",
);

assert.ok(route.includes("includeFiles") && route.includes("includeMemory"), "the cleanup endpoint must honor the selected scope");
assert.ok(route.includes("automation_key=not.is.null"), "project-memory cleanup must only delete automated generation requests");
assert.ok(socialWorker.includes("isVideoPurgeInProgress"));
assert.ok(socialWorker.includes("video_purge_in_progress"));
assert.ok(videoWorker.includes("isVideoGenerationPaused"));
assert.ok(videoWorker.includes("video_automation_enabled,video_purge_in_progress"));
const videoQueueStart = videoWorker.indexOf("export async function processTemplateVideoQueue");
const videoQueueSource = videoWorker.slice(videoQueueStart);
const queueStartLockCheck = videoQueueSource.indexOf("if (await isVideoGenerationPaused())");
const staleRecoveryStart = videoQueueSource.indexOf("const staleBefore");
const claimLoopStart = videoQueueSource.indexOf("for (const request of rows || [])");
const claimStatement = videoQueueSource.indexOf("const claimed = await", claimLoopStart);
const preClaimLockCheck = videoQueueSource.indexOf("if (await isVideoGenerationPaused())", claimLoopStart);
const postClaimLockCheck = videoQueueSource.indexOf("if (await isVideoGenerationPaused())", claimStatement);
const claimRestore = videoQueueSource.indexOf("status: request.status", postClaimLockCheck);
const renderStart = videoQueueSource.indexOf("const rendered = await withLeaseHeartbeat((signal) => renderVideo(request, signal));", claimStatement);
const renderCallback = videoQueueSource.indexOf("(signal) => renderVideo(request, signal)", renderStart);
assert.ok(
  queueStartLockCheck >= 0 && queueStartLockCheck < staleRecoveryStart &&
    preClaimLockCheck >= claimLoopStart && preClaimLockCheck < claimStatement &&
    postClaimLockCheck > claimStatement && postClaimLockCheck < renderStart &&
    claimRestore > postClaimLockCheck && claimRestore < renderStart &&
    renderCallback > renderStart,
  "video queue processing must stop before claim and release any claim if the purge lock activates during the claim race.",
);
const persistedMediaHandoffPosition = videoQueueSource.indexOf('socialQueueEnqueueStatus: "processing"');
const socialQueueEnqueuePosition = videoQueueSource.indexOf("queueSocialItems(request, rendered.videoUrl, signal)");
const pendingHandoffPosition = videoQueueSource.indexOf('socialQueueEnqueueStatus: "pending"', socialQueueEnqueuePosition);
const failedHandoffContinuePosition = videoQueueSource.indexOf("continue;", pendingHandoffPosition);
const completedRequestPatchPosition = videoQueueSource.indexOf('status: "completed"', failedHandoffContinuePosition);
assert.ok(
  persistedMediaHandoffPosition >= 0 &&
    socialQueueEnqueuePosition > persistedMediaHandoffPosition &&
    pendingHandoffPosition > socialQueueEnqueuePosition &&
    failedHandoffContinuePosition > pendingHandoffPosition &&
    completedRequestPatchPosition > failedHandoffContinuePosition &&
    videoWorker.includes("recoverPendingVideoSocialQueueEnqueues(") &&
    videoWorker.includes("content->>socialQueueEnqueueStatus=eq.pending") &&
    videoWorker.includes("content->>socialQueueEnqueueStatus=eq.processing"),
  "the generated media pointer and processing lease must protect purge while social enqueue is pending; failed or interrupted handoffs must remain recoverable instead of being marked completed.",
);
assert.ok(
  videoQueueSource.includes("const withLeaseHeartbeat = <T>(operation: (signal: AbortSignal) => Promise<T>)") &&
    videoWorker.includes("throwIfVideoLeaseAborted(signal)") &&
    videoWorker.includes("...(signal ? { signal } : {})"),
  "lease loss must abort in-flight media registration and social queue REST requests before they can continue as a stale worker.",
);
assert.ok(videoQueuePage.includes("PurgeGeneratedVideosControl"));
assert.ok(generationStudio.includes("PurgeGeneratedVideosControl"));
assert.ok(read("src/app/admin/media/media-client.tsx").includes("PurgeGeneratedVideosControl"));
assert.ok(read("src/app/admin/memory/page.tsx").includes("AdminMediaClient"));
assert.ok(control.includes("امسح الفيديوهات المولّدة فقط"));
assert.ok(control.includes('fetch("/api/admin/video-purge"'));
assert.ok(control.includes("setAuthorized(allowed)"));
assert.ok(control.includes('value="files"') && control.includes('value="memory"') && control.includes('value="both"'));
assert.ok(control.includes('JSON.stringify({ confirmation, scope })'));
assert.ok(control.includes("سجلات النشر الاجتماعي التاريخية"));
assert.ok(apiGuards.includes('src/app/api/admin/video-purge/route.ts GET'));
assert.ok(apiGuards.includes('src/app/api/admin/video-purge/route.ts POST'));

console.log("Generated-video purge contracts passed.");


assert.ok(
  route.includes("automationWasEnabled === false") &&
    route.includes("!purgeLockCleared"),
  "failed lock release or a previously disabled worker must be reported as still paused.",
);
assert.ok(
  control.includes('useState<PurgeScope | "">("")') &&
    control.includes('<option value="" disabled>اختر نطاق الحذف صراحةً</option>') &&
    control.includes("disabled={busy || !scope || confirmation !== CONFIRMATION_PHRASE}"),
  "the destructive scope must be explicitly selected before the confirmation action can run.",
);
