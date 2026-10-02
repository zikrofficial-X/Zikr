#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root=process.cwd();
const manifestPath="docs/finalization/DATA_LIFECYCLE_MANIFEST_2026-10-02.json";
const failures=[];
if(!existsSync(join(root,manifestPath))){
  console.error("DATA_LIFECYCLE_CHECK_FAILED");
  console.error("❌ lifecycle manifest is missing");
  process.exit(1);
}
const manifest=JSON.parse(readFileSync(join(root,manifestPath),"utf8"));
const expected=[
  "hadith_explanations",
  "recent_recitations",
  "reciter_favorites",
  "tawasheeh_favorites",
  "tawasheeh_playlists",
  "tawasheeh_playlist_items",
];
const entries=new Map((manifest.entries||[]).map(e=>[e.table,e]));
for(const table of expected){
  const e=entries.get(table);
  if(!e) failures.push("missing lifecycle entry: "+table);
  else if(e.state!=="RETIRED") failures.push("lifecycle state must be RETIRED: "+table);
}

function walk(dir,out=[]){
  if(!existsSync(dir)) return out;
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    const path=join(dir,entry.name);
    if(entry.name==="node_modules" || entry.name===".next" || entry.name===".git") continue;
    if(entry.isDirectory()) walk(path,out);
    else if(/\.(ts|tsx|js|mjs)$/.test(entry.name)) out.push(path);
  }
  return out;
}
const sourceFiles=walk(join(root,"src")).filter(p=>!p.endsWith("src/lib/types/supabase.ts"));
for(const table of expected){
  const directPatterns=[
    ".from(\""+table+"\")",
    ".from('"+table+"')",
    "from \""+table+"\"",
    "from '"+table+"'",
  ];
  for(const file of sourceFiles){
    let text="";
    try{text=readFileSync(file,"utf8")}catch{continue}
    if(directPatterns.some(token=>text.includes(token))){
      const rel=file.slice(root.length+1).replaceAll("\\","/");
      failures.push("active src reference remains for retired table "+table+": "+rel);
      break;
    }
  }
}
if(failures.length){
  console.error("DATA_LIFECYCLE_CHECK_FAILED");
  for(const f of failures) console.error("❌ "+f);
  process.exit(1);
}
console.log("✅ Phase 17 data lifecycle contract passed: 6 runtime-optional tables classified RETIRED with no active src consumer.");
