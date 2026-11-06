import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  isVideoTemplateAssetAllowedForAudience,
  parseVideoTemplateConfig,
  videoTemplateAssetPath,
  videoTemplateScene,
} from "../../src/features/videos/services/template-config";
import { resolveVideoComposition } from "../../src/features/videos/services/video-composition";
import { CURRENT_VIDEO_RENDERER_VERSION } from "../../src/features/videos/services/video-template-version";

const general = parseVideoTemplateConfig({
  assetKey: "emerald",
  defaultFormat: "vertical",
  motion: "slow",
});
assert.deepEqual(general, {
  assetKey: "emerald",
  defaultFormat: "vertical",
  motion: "slow",
  fontPreset: "auto",
  palette: "template",
  safeArea: "standard",
  captionStyle: "classic",
  sourceCardStyle: "standard",
  audioPolicy: "allow-tts",
});
const customized = parseVideoTemplateConfig({
  assetKey: "emerald",
  defaultFormat: "horizontal",
  motion: "fade",
  fontPreset: "naskh",
  palette: "monochrome",
  safeArea: "wide",
  captionStyle: "boxed",
  sourceCardStyle: "compact",
  audioPolicy: "verified-audio-only",
});
assert.equal(customized?.fontPreset, "naskh");
assert.equal(customized?.palette, "monochrome");
assert.equal(customized?.safeArea, "wide");
assert.equal(customized?.captionStyle, "boxed");
assert.equal(customized?.sourceCardStyle, "compact");
assert.equal(customized?.audioPolicy, "verified-audio-only");
assert.equal(parseVideoTemplateConfig({ assetKey: "gold", defaultFormat: "vertical", motion: "slow", palette: "remote-css" }), null);
assert.equal(parseVideoTemplateConfig({ assetKey: "gold", defaultFormat: "vertical", motion: "slow", audioPolicy: "mute-source" }), null);
const standardComposition = resolveVideoComposition({
  category: "quran", seed: "template-test", width: 1080, height: 1920,
});
const customComposition = resolveVideoComposition({
  category: "quran", seed: "template-test", width: 1080, height: 1920,
  template: {
    fontPreset: "sans",
    palette: "emerald",
    safeArea: "wide",
    captionStyle: "boxed",
    sourceCardStyle: "compact",
  },
});
assert.equal(standardComposition.fontFamily, "Noto Naskh Arabic");
assert.equal(customComposition.fontFamily, "Noto Sans Arabic");
assert.notEqual(customComposition.accentHex, standardComposition.accentHex);
assert.ok(customComposition.panelLeft > standardComposition.panelLeft);
assert.ok(customComposition.lineChars < standardComposition.lineChars);
assert.equal(customComposition.captionStyle, "boxed");
assert.equal(customComposition.sourceCardStyle, "compact");
assert.equal(CURRENT_VIDEO_RENDERER_VERSION, "2026-11-06-template-controls-v9");
assert.equal(parseVideoTemplateConfig({ assetKey: "../../secrets", defaultFormat: "vertical", motion: "slow" }), null);
assert.equal(parseVideoTemplateConfig({ assetKey: "gold", defaultFormat: "square", motion: "slow" }), null);
assert.equal(isVideoTemplateAssetAllowedForAudience("kids-garden", "kids"), true);
assert.equal(isVideoTemplateAssetAllowedForAudience("kids-garden", "general"), false);
assert.equal(isVideoTemplateAssetAllowedForAudience("gold", "general"), true);
assert.equal(videoTemplateAssetPath("kids-garden", "kids"), "public/video/templates/kids-garden.svg");
assert.equal(videoTemplateAssetPath("kids-garden", "general"), null);
assert.equal(videoTemplateScene("kids-garden"), "calm");
assert.equal(videoTemplateScene("emerald"), "emerald");

const read = (path: string) => readFileSync(path, "utf8");
const migration = read("supabase/migrations/20261106010000_admin_video_template_studio.sql");
const blockerFixMigration = read("supabase/migrations/20261106090800_production_blockers_and_social_insights.sql");
const api = read("src/app/api/admin/video/templates/route.ts");
const createApi = read("src/app/api/admin/videos/create/route.ts");
const worker = read("scripts/jobs/template-video-automation.ts");
const automation = read("src/features/videos/services/video-automation.ts");
const adminPage = read("src/app/admin/video/templates/page.tsx");
const studioClient = read("src/features/admin/video-templates/components/template-studio-client.tsx");
const studioCreateClient = read("src/features/admin/video-studio/components/admin-video-studio-client.tsx");
const types = read("src/lib/types/supabase.ts");

assert.match(migration, /ALTER TABLE public\.video_template_versions ENABLE ROW LEVEL SECURITY/i);
assert.match(migration, /REVOKE ALL PRIVILEGES ON public\.video_templates, public\.video_template_versions FROM PUBLIC, anon, authenticated/i);
assert.match(migration, /BEFORE UPDATE OR DELETE ON public\.video_template_versions/i);
assert.match(migration, /video template version identity and config are immutable/i);
assert.match(migration, /admin_create_video_template_version/i);
assert.match(migration, /activate_video_template_version/i);
assert.match(blockerFixMigration, /FROM public\.profiles AS actor WHERE actor\.id = p_actor_user_id/i);
assert.doesNotMatch(blockerFixMigration, /FROM auth\.users/i);
assert.match(migration, /video_template_versions_one_active_per_template/i);

assert.match(api, /requireAdminApi\("video\.manage"\)/);
for (const action of ["create-version", "approve-version", "activate-version", "preview-version"]) {
  assert.ok(api.includes(action), `template API action ${action} missing`);
}
assert.match(api, /created_by === auth\.profile\.id/);
assert.match(api, /skipSocialPublish: true/);
assert.match(api, /templatePreview: true/);
assert.match(api, /templateVersionId: version\.id/);

assert.match(createApi, /video_template_versions/);
assert.match(createApi, /templateVersion\.status !== "active"/);
assert.match(createApi, /isVideoTemplateAssetAllowedForAudience/);
assert.match(createApi, /versionedTemplateLabel/);

assert.match(worker, /async function bindTemplateVersion/);
assert.match(worker, /version\.status !== "active"/);
assert.match(worker, /videoTemplateAssetPath/);
assert.match(worker, /videoTemplateScene/);
assert.match(worker, /request\.content\.templatePreview === true/);
assert.match(worker, /if \(!isTemplatePreview\) aiPlan = await generateAiVideoPlan/);
assert.match(worker, /!isTemplatePreview &&\s*!boundTemplate &&\s*engineConfig\(\)\.aiEnabled/);
assert.match(worker, /content\.skipSocialPublish !== true/);
assert.match(worker, /source_hash: rendered\.sourceHash/);
assert.match(worker, /content_hash: rendered\.contentHash/);
assert.match(worker, /template_version: rendered\.templateVersion/);
assert.match(worker, /templateVersion,\s*resolution: width \+ "x" \+ height/);
assert.match(worker, /template: boundTemplate\?\.config/);
assert.match(worker, /boundTemplate\?\.config\.audioPolicy === "verified-audio-only"/);
assert.match(worker, /!isTemplatePreview[\s\S]*verified-audio-only/);
assert.match(worker, /templateIdentity = `\$\{template\.slug\}@\$\{version\.version\}`/);
assert.match(worker, /composition\.fontFamily/);
assert.match(worker, /composition\.captionStyle/);
assert.match(worker, /composition\.sourceCardStyle/);
assert.match(studioClient, /fontPreset/);
assert.match(studioClient, /palette/);
assert.match(studioClient, /safeArea/);
assert.match(studioClient, /captionStyle/);
assert.match(studioClient, /sourceCardStyle/);
assert.match(studioClient, /audioPolicy/);
assert.match(studioClient, /بطاقة المصدر لا يمكن إخفاؤها/);


assert.match(automation, /source_hash: sourceHashValue/);
assert.match(automation, /content_hash: contentHashValue/);
assert.match(automation, /template_version: templateVersion/);

assert.match(adminPage, /requireAdminPermission\("video\.manage"\)/);
assert.match(adminPage, /TemplateStudioClient/);
assert.match(studioClient, /create-version/);
assert.match(studioClient, /approve-version/);
assert.match(studioClient, /activate-version/);
assert.match(studioClient, /preview-version/);
assert.match(studioCreateClient, /templateVersionId/);

assert.match(types, /video_templates:\s*\{/);
assert.match(types, /video_template_versions:\s*\{/);
assert.match(types, /admin_create_video_template_version:/);
assert.match(types, /activate_video_template_version:/);

console.log("✅ Video Template Studio contracts passed.");
