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
  read¶»§q«^