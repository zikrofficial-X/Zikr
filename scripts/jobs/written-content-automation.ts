import { createHash } from "node:crypto";
import { supabaseServerAdminRequest } from "../../src/lib/supabase/admin-rest";
import { buildWrittenPost, buildWrittenSocialQueuePayload, chooseWrittenSourceKind, containsKidsPersonalDataSolicitation, createWrittenAutomationKey, createWrittenSocialAutomationKey, normalizeWrittenCategory, validateWrittenPostDraft, type WrittenContentSource, type WrittenPostDraft } from "../../src/features/social/services/written-content";

type Row = Record<string, unknown>;
const str=(v:unknown)=>typeof v==="string"?v.trim():"";
const clamp=(v:unknown,base:number,min:number,max:number)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Math.floor(Number(v)))):base;
const pick=<T,>(xs:T[])=>xs.length?xs[Math.floor(Math.random()*xs.length)]:null;
async function read<T extends Row>(path:string):Promise<T[]>{
 try{const data=await supabaseServerAdminRequest<T[]>(path);return Array.isArray(data)?data:[];}
 catch(error){console.warn("[written-content] source unavailable",path.split("?")[0],error instanceof Error?error.message:String(error));return [];}
}
async function readRequired<T extends Row>(path:string):Promise<T[]> {
 const data=await supabaseServerAdminRequest<T[]>(path);
 if(!Array.isArray(data)) throw new Error("Required queue read returned invalid data.");
 return data;
}
async function loadSources():Promise<WrittenContentSource[]>{
 const ayahOffset=Math.floor(Math.random()*5900);
 const hadithOffset=Math.floor(Math.random()*1450);
 const [ayahs,surahs,hadiths,books,duas,stories,sections,prophets,library,articles,companionStories,companions,kidsStories]=await Promise.all([
  read<Row>("/rest/v1/quran_ayahs?select=id,surah_id,ayah_number,text_ar,text_uthmani&order=id.asc&limit=250&offset="+ayahOffset),
  read<Row>("/rest/v1/quran_surahs?select=id,name_ar,slug&limit=114"),
  read<Row>("/rest/v1/hadiths?select=id,text_ar,narrator_ar,grade_ar,ref,hadith_number,book_id&published=eq.true&grade_ar=not.is.null&order=created_at.desc&limit=150&offset="+hadithOffset),
  read<Row>("/rest/v1/hadith_books?select=id,name_ar&limit=150"),
  read<Row>("/rest/v1/duas?select=id,title_ar,text_ar,source_ar,slug&published=eq.true&limit=150"),
  read<Row>("/rest/v1/stories?select=id,title,summary,content,slug&published=eq.true&is_approved=eq.true&limit=100"),
  read<Row>("/rest/v1/prophet_sections?select=id,prophet_id,title_ar,content_ar,order_num&order=order_num.asc&limit=120"),
  read<Row>("/rest/v1/prophets?select=id,name_ar,slug,published&published=eq.true&limit=50"),
  read<Row>("/rest/v1/content_library?select=id,title_ar,summary_ar,body_ar,category,slug,review_status,author_name&published=eq.true&review_status=eq.approved&limit=200"),
  read<Row>("/rest/v1/articles?select=id,title,title_ar,summary,summary_ar,content,content_ar,slug,author,published&published=eq.true&limit=200"),
  read<Row>("/rest/v1/companion_stories?select=id,companion_id,title_ar,content_ar,story_type&order=order_num.asc&limit=200"),
  read<Row>("/rest/v1/companions?select=id,name_ar,slug,published&published=eq.true&limit=200"),
  read<Row>("/rest/v1/kids_content?select=id,title_ar,content_ar,summary_ar,slug,age_group,metadata,published,is_active&type=eq.story&published=eq.true&is_active=eq.true&metadata->>age_appropriate=eq.true&order=created_at.desc&limit=100"),
 ]);
 const surahMap=new Map(surahs.map(x=>[String(x.id),x]));
 const bookMap=new Map(books.map(x=>[String(x.id),x]));
 const prophetMap=new Map(prophets.map(x=>[String(x.id),x]));
 const companionMap=new Map(companions.map(x=>[String(x.id),x]));
 const out:WrittenContentSource[]=[];
 for(const x of ayahs){
  const surah=surahMap.get(String(x.surah_id));
  const text=str(x.text_uthmani)||str(x.text_ar);
  if(!surah||!text)continue;
  out.push({kind:"quran",id:String(x.id),title:"آية من سورة "+str(surah.name_ar),sourceText:text,reference:"القرآن الكريم — سورة "+str(surah.name_ar)+"، الآية "+String(x.ayah_number),publicPath:"/quran/"+str(surah.slug),categoryLabel:"القرآن الكريم",sourceVerified:true,quoteRequired:true});
 }
 for(const x of hadiths){
  const book=bookMap.get(String(x.book_id)),grade=str(x.grade_ar),text=str(x.text_ar);
  if(!book||!text||!/(صحيح|حسن)/u.test(grade))continue;
  const reference=[str(book.name_ar),x.hadith_number?"رقم "+String(x.hadith_number):"",x.narrator_ar?"راويه: "+str(x.narrator_ar):"","الدرجة: "+grade,str(x.ref)].filter(Boolean).join(" — ");
  out.push({kind:"hadith",id:String(x.id),title:"حديث من "+str(book.name_ar),sourceText:text,reference,publicPath:"/hadith",categoryLabel:"الحديث النبوي",sourceVerified:true,quoteRequired:true});
 }
 for(const x of duas){
  if(!str(x.text_ar))continue;
  out.push({kind:"dua",id:String(x.id),title:str(x.title_ar)||"دعاء",sourceText:str(x.text_ar),reference:str(x.source_ar)||"من مكتبة الأدعية المعتمدة في ZIKR",publicPath:"/duas",categoryLabel:"الأدعية",sourceVerified:true,quoteRequired:true});
 }
 for(const x of library){
  const category=str(x.category).toLowerCase(),title=str(x.title_ar),text=str(x.body_ar)||str(x.summary_ar);
  if(!title||!text)continue;
  if(/adhkar|azkar|dhikr|أذكار|ذكر/u.test(category+" "+title)){
   out.push({kind:"adhkar",id:String(x.id),title,sourceText:text,reference:x.author_name?"مكتبة ZIKR المعتمدة — "+str(x.author_name):"مكتبة الأذكار المعتمدة في ZIKR",publicPath:"/adhkar",categoryLabel:"الأذكار",sourceVerified:true,quoteRequired:true});
  }else if(/knowledge|ethics|adab|آداب|أخلاق|معلومة|معرفة/u.test(category)){
   out.push({kind:"knowledge",id:String(x.id),title,sourceText:text.slice(0,6000),reference:x.author_name?"مكتبة ZIKR المعتمدة — "+str(x.author_name):"مكتبة ZIKR المعتمدة",publicPath:"/articles",categoryLabel:"معلومة وفائدة",sourceVerified:true,quoteRequired:false});
  }
 }
 for(const x of stories){
  const text=str(x.summary)||str(x.content);
  if(!text)continue;
  out.push({kind:"story",id:String(x.id),title:str(x.title),sourceText:text.slice(0,6000),reference:"قصة منشورة ومعتمدة في ZIKR: "+str(x.title),publicPath:"/stories/"+str(x.slug),categoryLabel:"القصص",sourceVerified:true,quoteRequired:false});
 }
 for(const x of sections){
  const prophet=prophetMap.get(String(x.prophet_id)),text=str(x.content_ar);
  if(!prophet||!text)continue;
  out.push({kind:"prophets",id:String(x.id),title:str(prophet.name_ar)+": "+str(x.title_ar),sourceText:text.slice(0,6000),reference:"قسم منشور من سيرة "+str(prophet.name_ar)+" في مكتبة ZIKR",publicPath:"/prophets/"+str(prophet.slug),categoryLabel:"قصص الأنبياء",sourceVerified:true,quoteRequired:false});
 }
 for(const x of companionStories){
  const companion=companionMap.get(String(x.companion_id)),text=str(x.content_ar);
  if(!companion||!text)continue;
  out.push({kind:"companions",id:String(x.id),title:str(companion.name_ar)+": "+str(x.title_ar),sourceText:text.slice(0,6000),reference:"قصة منشورة في ملف الصحابي "+str(companion.name_ar)+" على ZIKR",publicPath:"/companions/"+str(companion.slug),categoryLabel:"قصص الصحابة",sourceVerified:true,quoteRequired:false});
 }
 for(const x of kidsStories){
  const metadata=x.metadata&&typeof x.metadata==="object"&&!Array.isArray(x.metadata)?x.metadata as Row:{};
  const title=str(x.title_ar),text=str(x.content_ar)||str(x.summary_ar),slug=str(x.slug),ageGroup=str(x.age_group);
  if(!title||!text||!slug||metadata.age_appropriate!==true)continue;
  out.push({kind:"kids_story",id:String(x.id),title,sourceText:text.slice(0,6000),reference:"قصة أطفال منشورة ومعتمدة في عالم ZIKR للأطفال",publicPath:"/kids/"+slug,categoryLabel:"قصص الأطفال",sourceVerified:true,quoteRequired:false,ageGroup});
 }
 for(const x of articles){
  const title=str(x.title_ar)||str(x.title);
  const text=str(x.content_ar)||str(x.summary_ar)||str(x.content)||str(x.summary);
  if(!title||!text)continue;
  out.push({kind:"knowledge",id:String(x.id),title,sourceText:text.slice(0,6000),reference:x.author?"مقال منشور في ZIKR — الكاتب: "+str(x.author):"مقال منشور ومعتمد في ZIKR",publicPath:"/articles/"+str(x.slug),categoryLabel:"معلومة ومعرفة",sourceVerified:true,quoteRequired:false});
 }
 return out;
}
async function makeDraft(source:WrittenContentSource,key:string):Promise<WrittenPostDraft>{
 const model=process.env.GEMINI_MODEL?.trim()||"gemini-3.1-flash-lite";
 const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
 const kidsPolicy=source.kind==="kids_story"?("هذا منشور مخصص للأطفال من الفئة العمرية "+(source.ageGroup||"غير محددة")+". استخدم لغة بسيطة جدًا ودافئة، وفكرة واحدة إيجابية من القصة فقط. لا تطلب من الطفل اسمه أو صورته أو رقم هاتفه أو عنوانه أو اسم مدرسته أو موقعه. لا تذكر مقابلة أو مراسلة خاصة أو مشاركة أسرار. لا تضف أحداثًا أو شخصيات أو أحكامًا غير موجودة في المصدر. إذا كان المصدر لا يسمح بمنشور آمن ومناسب للعمر فأعد eligible=false."):"";
 const policy=source.quoteRequired?"النص المصدر ديني موثق: لا تعيد صياغته أو تغير حرفًا منه. لا تضف حديثًا أو آية أو حكمًا أو فضلًا غير وارد بالمصدر. اكتب تأملًا عامًا وليس تفسيرًا متخصصًا أو فتوى.":kidsPolicy||"لخص المصدر كما هو دون اختراع أحداث أو أقوال أو أحكام أو اقتباسات. إذا لم يكف المصدر أعد eligible=false.";
 const prompt=["أنت محرر محتوى عربي لمنصة إسلامية موثوقة اسمها ZIKR.","أنشئ منشور Facebook واحدًا بالعربية الفصحى السهلة، جذابًا دون مبالغة أو تفاعل مضلل.",policy,"أعد JSON فقط بالمفاتيح eligible boolean, title, hook, reflection, question.","العنوان 8-90 حرفًا، المقدمة 12-260، reflection 70-900. لا تنسب كلامًا لله أو النبي أو العلماء.","لا تضع نص المصدر داخل reflection؛ سيضاف كما هو في موضع مستقل.","التصنيف: "+source.categoryLabel,"العنوان: "+source.title,"المرجع: "+source.reference,"النص المعتمد:\n"+source.sourceText].join("\n\n");
 const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:0.45,responseMimeType:"application/json"}}),signal:AbortSignal.timeout(60000)});
 if(!res.ok)throw new Error("Gemini HTTP "+res.status+": "+(await res.text().catch(()=>"")).slice(0,350));
 const payload=await res.json() as {candidates?:Array<{content?:{parts?:Array<{text?:string}>}}>} ;
 const text=payload.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("\n").trim()||"";
 if(!text)throw new Error("Gemini returned empty text.");
 const draft=JSON.parse(text.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"")) as WrittenPostDraft;
 const valid=validateWrittenPostDraft(draft);if(!valid.ok)throw new Error("Quality gate: "+valid.reason);
 if(source.kind==="kids_story"&&containsKidsPersonalDataSolicitation([draft.title,draft.hook,draft.reflection,draft.question||""].join(" ")))throw new Error("Kids safety gate: personal-data solicitation or unsafe contact language.");
 return draft;
}
function writtenArticleSlug(automationKey: string) {
 return "zikr-auto-" + createHash("sha256").update(automationKey).digest("hex").slice(0,24);
}

export function buildWrittenArticlePayload(
 source: WrittenContentSource,
 draft: WrittenPostDraft,
 automationKey: string,
 slug: string,
 now: string,
) {
 const post=buildWrittenPost(source,draft);
 const body=post.body.trim();
 return {
  title: post.title,
  title_ar: post.title,
  slug,
  content: body,
  content_ar: body,
  summary: draft.hook.trim(),
  summary_ar: draft.hook.trim(),
  author: "فريق تحرير ZIKR",
  published: false,
  featured: false,
  tags: [source.kind, "ذِكر", "محتوى موثق"],
  metadata: {
   automation: "written-content-v2",
   automationKey,
   publicPath: source.publicPath,
   generation: {
    provider: "gemini",
    model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
    version: "written-site-v2",
    generatedAt: now,
    contentHash: createHash("sha256").update(body).digest("hex"),
   },
   quality: {
    passed: true,
    checks: ["reviewed_source", "arabic_text", "bounded_length", "no_unattributed_religious_quote", "site_only"],
   },
   source: {
    type: source.kind,
    id: source.id,
    title: source.title,
    reference: source.reference,
    verified: source.sourceVerified,
   },
  },
  created_at: now,
  updated_at: now,
 };
}

async function enqueue(source: WrittenContentSource, draft: WrittenPostDraft) {
 const automationKey=createWrittenAutomationKey(source.kind,source.id);
 const isKidsStory=source.kind==="kids_story";
 const slug=isKidsStory?"":writtenArticleSlug(automationKey);
 const existing=isKidsStory?[]:await readRequired<Row>(
  "/rest/v1/articles?slug=eq."+encodeURIComponent(slug)+"&select=id,published,metadata&limit=1",
 );
 let articleId=isKidsStory?source.id:(existing[0]?str(existing[0].id):"");
 const now=new Date();
 const nowIso=now.toISOString();
 if(!isKidsStory&&!articleId){
  const payload=buildWrittenArticlePayload(source,draft,automationKey,slug,nowIso);
  const saved=await supabaseServerAdminRequest<Array<{id:string}>>("/rest/v1/articles",{
   method:"POST",
   headers:{"Content-Type":"application/json",Prefer:"return=representation"},
   body:JSON.stringify(payload),
  });
  articleId=Array.isArray(saved)?str(saved[0]?.id):"";
  if(!articleId)throw new Error("Article insert returned no record.");
 }

 // Keep the existing internal ZIKR article workflow, but do not let it replace
 // the independent Facebook written-post delivery record.
 if(!isKidsStory&&existing[0]?.published!==true){
  const contentQueue=await readRequired<Row>(
   "/rest/v1/content_publish_queue?content_table=eq.articles&content_id=eq."+encodeURIComponent(articleId)+"&select=id,status&limit=1",
  );
  if(!contentQueue[0]){
   const scheduledAt=new Date(now.getTime()+5*60*1000).toISOString();
   await supabaseServerAdminRequest("/rest/v1/content_publish_queue",{
    method:"POST",
    headers:{"Content-Type":"application/json",Prefer:"return=minimal"},
    body:JSON.stringify({
     content_table:"articles",
     content_id:articleId,
     scheduled_at:scheduledAt,
     status:"queued",
     created_at:nowIso,
     updated_at:nowIso,
    }),
   });
  }
 }

 const socialAutomationKey=createWrittenSocialAutomationKey(source.kind,source.id);
 const socialRows=await readRequired<Row>(
  "/rest/v1/social_publish_queue?automation_key=eq."+encodeURIComponent(socialAutomationKey)+"&select=id,status&limit=1",
 );
 if(!socialRows[0]){
  const socialPayload=buildWrittenSocialQueuePayload(
   source,draft,articleId,socialAutomationKey,nowIso,
  );
  await supabaseServerAdminRequest("/rest/v1/social_publish_queue",{
   method:"POST",
   headers:{"Content-Type":"application/json",Prefer:"return=minimal"},
   body:JSON.stringify(socialPayload),
  });
  return {status:"queued",id:articleId};
 }
 return {status:"duplicate",id:articleId};
}
async function enqueueExistingWrittenArticlesForFacebook(limit=100) {
 const cutoffValue=process.env.SOCIAL_PUBLISH_AFTER?.trim()||"2026-11-06T20:00:00Z";
 const cutoff=new Date(cutoffValue);
 if(!Number.isFinite(cutoff.getTime()))throw new Error("Invalid SOCIAL_PUBLISH_AFTER cutoff for written-post backfill.");
 const rows=await readRequired<Row>(
  "/rest/v1/articles?metadata->>automation=eq.written-content-v2&created_at=gte."+encodeURIComponent(cutoff.toISOString())+
  "&select=id,title,content,slug,metadata,created_at&order=created_at.asc&limit="+String(Math.max(1,Math.min(200,limit))),
 );
 let created=0,slot=0;
 for(const article of rows){
  const metadata=article.metadata&&typeof article.metadata==="object"&&!Array.isArray(article.metadata)?article.metadata as Row:{};
  const quality=metadata.quality&&typeof metadata.quality==="object"&&!Array.isArray(metadata.quality)?metadata.quality as Row:{};
  const source=metadata.source&&typeof metadata.source==="object"&&!Array.isArray(metadata.source)?metadata.source as Row:{};
  const articleId=str(article.id),title=str(article.title),body=str(article.content);
  const publicPath=str(metadata.publicPath);
  const sourceType=str(source.type),sourceId=str(source.id);
  if(!articleId||title.length<8||!body||body.length>12000||quality.passed!==true||source.verified!==true||
     !sourceType||!sourceId||!publicPath.startsWith("/")||publicPath.startsWith("//"))continue;
  const automationKey=createWrittenSocialAutomationKey(sourceType,sourceId);
  const existing=await readRequired<Row>(
   "/rest/v1/social_publish_queue?automation_key=eq."+encodeURIComponent(automationKey)+"&select=id&limit=1",
  );
  if(existing[0]){slot++;continue;}
  const nowIso=new Date().toISOString();
  const scheduledAt=new Date(Date.now()+5*60*1000+slot*8*60*60*1000).toISOString();
  await supabaseServerAdminRequest("/rest/v1/social_publish_queue",{
   method:"POST",
   headers:{"Content-Type":"application/json",Prefer:"return=minimal"},
   body:JSON.stringify({
    content_type:"written_post",
    content_id:articleId,
    title,
    body,
    image_url:null,
    video_url:null,
    target_platforms:["facebook"],
    status:"queued",
    scheduled_at:scheduledAt,
    published_at:null,
    error_message:null,
    metadata:{
     contentType:"written_post",
     publicPath,
     source:{
      type:sourceType,
      id:sourceId,
      title:str(source.title)||title,
      reference:str(source.reference),
      verified:true,
     },
     generation:{
      provider:"gemini",
      version:"written-facebook-backfill-v1",
      importedFromArticleId:articleId,
      originalCreatedAt:str(article.created_at),
     },
    },
    automation_key:automationKey,
    created_at:nowIso,
    updated_at:nowIso,
   }),
  });
  created++;
  slot++;
 }
 return created;
}

export async function runWrittenContentAutomation(options:{category?:string;batchSize?:number}={}){
 if(process.env.WRITTEN_CONTENT_ENABLED?.toLowerCase()==="false")return {enabled:false,created:0,duplicates:0,skipped:0};
 const apiKey=process.env.GEMINI_API_KEY?.trim();if(!apiKey)throw new Error("GEMINI_API_KEY is required.");
 const facebookBackfilled=await enqueueExistingWrittenArticlesForFacebook();
 const dailyTarget=clamp(process.env.WRITTEN_CONTENT_DAILY_TARGET,3,1,10),batchSize=clamp(options.batchSize??process.env.WRITTEN_CONTENT_BATCH_SIZE,1,1,3);
 const today=new Date();today.setUTCHours(0,0,0,0);
 const todays=await readRequired<Row>(`/rest/v1/articles?metadata->>automation=eq.written-content-v2&created_at=gte.${encodeURIComponent(today.toISOString())}&select=id&limit=100`);
 const todaysSocial=await readRequired<Row>(`/rest/v1/social_publish_queue?automation_key=like.written-social-v1:*&created_at=gte.${encodeURIComponent(today.toISOString())}&select=id&limit=100`);
 const dailyUsed=Math.max(todays.length,todaysSocial.length);
 const remaining=Math.max(0,dailyTarget-dailyUsed);if(!remaining)return {enabled:true,created:0,duplicates:0,skipped:0,facebookBackfilled,dailyTarget,dailyUsed};
 const category=normalizeWrittenCategory(options.category||process.env.WRITTEN_CONTENT_CATEGORY||"auto"),all=await loadSources(),pool=category==="auto"?[...all]:category==="kids"?all.filter(x=>x.kind==="kids_story"):all.filter(x=>x.kind===category);
 if(!pool.length)throw new Error("No approved and published source for category "+category);

 const todaysKidsPosts = category === "auto"
  ? await readRequired<Row>(
   `/rest/v1/social_publish_queue?content_type=eq.written_post&status=in.(queued,published,partial)&metadata->>audience=eq.kids&created_at=gte.${encodeURIComponent(today.toISOString())}&select=id&limit=1`,
  )
  : [];
 let hasKidsPostToday = todaysKidsPosts.length > 0;
 const groups = new Map<WrittenContentSource["kind"], WrittenContentSource[]>();
 for (const item of pool) groups.set(item.kind, [...(groups.get(item.kind) ?? []), item]);
 const ids:string[]=[];let duplicates=0,skipped=0;
 while(ids.length<Math.min(batchSize,remaining)&&groups.size){
  const kinds=[...groups.keys()];
  const kind=chooseWrittenSourceKind(kinds,category,hasKidsPostToday,Math.floor(Math.random()*kinds.length));
  if(!kind)break;
  const candidates=groups.get(kind) ?? [];
  const source=pick(candidates);
  if(!source){groups.delete(kind);continue;}
  candidates.splice(candidates.indexOf(source),1);
  if(!candidates.length)groups.delete(kind);
  try{
   const draft=await makeDraft(source,apiKey),result=await enqueue(source,draft);
   if(result.status==="queued"){
    ids.push(result.id);
    if(kind==="kids_story")hasKidsPostToday=true;
   }else duplicates++;
  }catch(error){skipped++;console.warn("[written-content] quarantined",source.kind,source.id,error instanceof Error?error.message:String(error));}
 }
 return {enabled:true,created:ids.length,duplicates,skipped,facebookBackfilled,dailyTarget,dailyUsed:dailyUsed+ids.length,ids};
}
const args=process.argv.slice(2),c=args.indexOf("--category"),b=args.indexOf("--batch-size");
runWrittenContentAutomation({category:c>=0?args[c+1]:undefined,batchSize:b>=0?Number(args[b+1]):undefined}).then(result=>{console.log("[written-content]",JSON.stringify(result));if(result.enabled&&result.created===0&&result.duplicates===0&&result.skipped>0)process.exitCode=1;}).catch(error=>{console.error("[written-content] failed",error instanceof Error?error.message:error);process.exitCode=1;});
