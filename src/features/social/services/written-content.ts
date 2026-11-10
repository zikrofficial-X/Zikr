export type WrittenCategory = "auto" | "quran" | "hadith" | "dua" | "adhkar" | "story" | "prophets" | "companions" | "knowledge" | "kids";
export type WrittenSourceKind = Exclude<WrittenCategory, "auto" | "kids"> | "kids_story";
export type WrittenContentSource = { kind: WrittenSourceKind; id:string; title:string; sourceText:string; reference:string; publicPath:string; categoryLabel:string; sourceVerified:boolean; quoteRequired:boolean; ageGroup?: string };
export type WrittenPostDraft = { eligible?:boolean; title:string; hook:string; reflection:string; question?:string };
export function normalizeWrittenCategory(value:string):WrittenCategory { const v=value.trim().toLowerCase(); return (["auto","quran","hadith","dua","adhkar","story","prophets","companions","knowledge","kids"] as string[]).includes(v)?v as WrittenCategory:"auto"; }
export function createWrittenAutomationKey(kind:string,id:string){return `written-v1:${kind}:${id}`;}
export function validateWrittenPostDraft(d:WrittenPostDraft):{ok:boolean;reason?:string}{
 if(d.eligible===false)return {ok:false,reason:"source_insufficient"};
 const title=typeof d.title==="string"?d.title.trim():"",hook=typeof d.hook==="string"?d.hook.trim():"",reflection=typeof d.reflection==="string"?d.reflection.trim():"";
 if(title.length<8||title.length>90)return {ok:false,reason:"title_length"};
 if(hook.length<12||hook.length>260)return {ok:false,reason:"hook_length"};
 if(reflection.length<70||reflection.length>900)return {ok:false,reason:"reflection_length"};
 if(!/[\u0600-\u06FF]/u.test(title+hook+reflection))return {ok:false,reason:"arabic_required"};
 if(/(قال رسول الله|قال النبي|قال تعالى|رواه|حديث قدسي|فتوى قاطعة)/u.test(reflection))return {ok:false,reason:"unattributed_religious_quote"};
 return {ok:true};
}
export function buildWrittenPost(source:WrittenContentSource,draft:WrittenPostDraft){
 const quote=source.quoteRequired?`«${source.sourceText.trim()}»`:draft.reflection.trim();
 const reflection=source.quoteRequired?draft.reflection.trim():"";
 return {title:draft.title.trim(),body:[draft.hook.trim(),quote,reflection,draft.question?.trim()||"",source.reference.trim()].filter(Boolean).join("\n\n"),publicPath:source.publicPath};
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
  scheduled_at: now,
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
