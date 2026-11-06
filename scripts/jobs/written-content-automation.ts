import { createHash } from "node:crypto";
import { supabaseServerAdminRequest } from "../../src/lib/supabase/admin-rest";
import { buildWrittenPost, createWrittenAutomationKey, normalizeWrittenCategory, validateWrittenPostDraft, type WrittenContentSource, type WrittenPostDraft } from "../../src/features/social/services/written-content";

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
 const [ayahs,surahs,hadiths,books,duas,stories,sections,prophets,library,articles,companionStories,companions]=await Promise.all([
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
 const policy=source.quoteRequired?"النص المصدر ديني موثق: لا تعيد صياغته أو تغير حرفًا منه. لا تضف حديثًا أو آية أو حكمًا أو فضلًا غير وارد بالمصدر. اكتب تأملًا عامًا وليس تفسيرًا متخصصًا أو فتوى.":"لخص المصدر كما هو دون اختراع أحداث أو أقوال أو أحكام أو اقتباسات. إذا لم يكف المصدر أعد eligible=false.";
 const prompt=["أنت محرر محتوى عربي لمنصة إسلامية موثوقة اسمها ZIKR.","أنشئ منشور Facebook واحدًا بالعربية الفصحى السهلة، جذابًا دون مبالغة أو تفاعل مضلل.",policy,"أعد JSON فقط بالمفاتيح eligible boolean, title, hook, reflection, question.","العنوان 8-90 حرفًا، المقدمة 12-260، reflection 70-900. لا تنسب كلامًا لله أو النبي أو العلماء.","لا تضع نص المصدر داخل reflection؛ سيضاف كما هو في موضع مستقل.","التصنيف: "+source.categoryLabel,"العنوان: "+source.title,"المرجع: "+source.reference,"النص المعتمد:\n"+source.sourceText].join("\n\n");
 const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:0.45,responseMimeType:"application/json"}}),signal:AbortSignal.timeout(60000)});
 if(!res.ok)throw new Error("Gemini HTTP "+res.status+": "+(await res.text().catch(()=>"")).slice(0,350));
 const payload=await res.json() as {candidates?:Array<{content?:{parts?:Array<{text?:string}>}}>} ;
 const text=payload.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("\n").trim()||"";
 if(!text)throw new Error("Gemini returned empty text.");
 const draft=JSON.parse(text.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"")) as WrittenPostDraft;
 const valid=validateWrittenPostDraft(draft);if(!valid.ok)throw new Error("Quality gate: "+valid.reason);
 return draft;
}
async function enqueue(source:WrittenContentSource,draft:WrittenPostDraft){
 const automationKey=createWrittenAutomationKey(source.kind,source.id);
 const duplicate=await readRequired<Row>(`/rest/v1/social_publish_queue?automation_key=eq.${encodeURIComponent(automationKey)}&select=id&limit=1`);
 if(duplicate[0])return {status:"duplicate",id:String(duplicate[0].id)};
 const post=buildWrittenPost(source,draft),now=new Date().toISOString(),contentHash=createHash("sha256").update(post.body).digest("hex");
 const saved=await supabaseServerAdminRequest<Array<{id:string}>>("/rest/v1/social_publish_queue",{method:"POST",headers:{"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({
  content_type:"written_post",content_id:source.id,title:post.title,body:post.body,image_url:null,video_url:null,target_platforms:["facebook"],status:"queued",scheduled_at:now,
  metadata:{contentKind:"written_post",category:source.kind,categoryLabel:source.categoryLabel,source:{type:source.kind,id:source.id,title:source.title,reference:source.reference,verified:source.sourceVerified},publicPath:source.publicPath,generation:{provider:"gemini",model:process.env.GEMINI_MODEL||"gemini-3.1-flash-lite",version:"written-v1",generatedAt:now,contentHash},quality:{passed:true,checks:["reviewed_source","arabic_text","bounded_length","no_unattributed_religious_quote"]}},
  automation_key:automationKey,created_at:now,updated_at:now
 })});
 if(!Array.isArray(saved)||!saved[0]?.id)throw new Error("Queue insert returned no record.");
 return {status:"queued",id:saved[0].id};
}
export async function runWrittenContentAutomation(options:{category?:string;batchSize?:number}={}){
 if(process.env.WRITTEN_CONTENT_ENABLED?.toLowerCase()==="false")return {enabled:false,created:0,duplicates:0,skipped:0};
 const apiKey=process.env.GEMINI_API_KEY?.trim();if(!apiKey)throw new Error("GEMINI_API_KEY is required.");
 const dailyTarget=clamp(process.env.WRITTEN_CONTENT_DAILY_TARGET,3,1,10),batchSize=clamp(options.batchSize??process.env.WRITTEN_CONTENT_BATCH_SIZE,1,1,3);
 const today=new Date();today.setUTCHours(0,0,0,0);
 const todays=await readRequired<Row>(`/rest/v1/social_publish_queue?content_type=eq.written_post&created_at=gte.${encodeURIComponent(today.toISOString())}&select=id&limit=100`);
 const remaining=Math.max(0,dailyTarget-todays.length);if(!remaining)return {enabled:true,created:0,duplicates:0,skipped:0,dailyTarget,dailyUsed:todays.length};
 const category=normalizeWrittenCategory(options.category||process.env.WRITTEN_CONTENT_CATEGORY||"auto"),all=await loadSources(),pool=category==="auto"?[...all]:all.filter(x=>x.kind===category);
 if(!pool.length)throw new Error("No approved and published source for category "+category);

 const groups = new Map<WrittenContentSource["kind"], WrittenContentSource[]>();
 for (const item of pool) groups.set(item.kind, [...(groups.get(item.kind) ?? []), item]);
 const ids:string[]=[];let duplicates=0,skipped=0;
 while(ids.length<Math.min(batchSize,remaining)&&groups.size){
  const kinds=[...groups.keys()];
  const kind=kinds[Math.floor(Math.random()*kinds.length)];
  const candidates=groups.get(kind) ?? [];
  const source=pick(candidates);
  if(!source){groups.delete(kind);continue;}
  candidates.splice(candidates.indexOf(source),1);
  if(!candidates.length)groups.delete(kind);
  try{const draft=await makeDraft(source,apiKey),result=await enqueue(source,draft);if(result.status==="queued")ids.push(result.id);else duplicates++;}
  catch(error){skipped++;console.warn("[written-content] quarantined",source.kind,source.id,error instanceof Error?error.message:String(error));}
 }
 return {enabled:true,created:ids.length,duplicates,skipped,dailyTarget,dailyUsed:todays.length+ids.length,ids};
}
const args=process.argv.slice(2),c=args.indexOf("--category"),b=args.indexOf("--batch-size");
runWrittenContentAutomation({category:c>=0?args[c+1]:undefined,batchSize:b>=0?Number(args[b+1]):undefined}).then(result=>{console.log("[written-content]",JSON.stringify(result));if(result.enabled&&result.created===0&&result.duplicates===0&&result.skipped>0)process.exitCode=1;}).catch(error=>{console.error("[written-content] failed",error instanceof Error?error.message:error);process.exitCode=1;});
