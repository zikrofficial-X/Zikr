export type WrittenCategory = "auto" | "quran" | "hadith" | "dua" | "adhkar" | "story" | "prophets" | "companions" | "knowledge";
export type WrittenContentSource = { kind: Exclude<WrittenCategory,"auto">; id:string; title:string; sourceText:string; reference:string; publicPath:string; categoryLabel:string; sourceVerified:boolean; quoteRequired:boolean };
export type WrittenPostDraft = { eligible?:boolean; title:string; hook:string; reflection:string; question?:string };
export function normalizeWrittenCategory(value:string):WrittenCategory { const v=value.trim().toLowerCase(); return (["auto","quran","hadith","dua","adhkar","story","prophets","companions","knowledge"] as string[]).includes(v)?v as WrittenCategory:"auto"; }
export function createWrittenAutomationKey(kind:string,id:string){return `written-v1:${kind}:${id}`;}
export function validateWrittenPostDraft(d:WrittenPostDraft):{ok:boolean;reason?:string}{
 if(d.eligible===false)return {ok:false,reason:"source_insufficient"};
 const title=typeof d.title==="string"?d.title.trim():"",hook=typeof d.hook==="string"?d.hook.trim():"",reflection=typeof d.reflection==="string"?d.reflection.trim():"";
 if(title.length<8||title.length>90)return {ok:false,reason:"title_length"};
 if(hook.length<12||hook.length>260)return {ok:false,reason:"hook_length"};
 if(reflection.length<70||reflection.length>900)return {ok:false,reason:"reflection_length"};
 if(!/[\u0600-\u06FF]/u.test(title+hook+reflection))return {ok:false,reason:"arabic_re¶»§q«^