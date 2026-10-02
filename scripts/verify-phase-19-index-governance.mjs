#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const path="supabase/migrations/20261002133000_govern_retired_indexes_20261002.sql";
const failures=[];
if(!existsSync(path)) failures.push("Phase 19 index-governance migration missing");
const sql=existsSync(path)?readFileSync(path,"utf8"):"";
const expected=[
"hadith_explanations_hadith_id_idx",
"idx_recent_recitations_user",
"recent_recitations_played_at_idx",
"recent_recitations_reciter_id_idx",
"reciter_favorites_reciter_id_idx",
"idx_tawasheeh_favorites_user",
"tawasheeh_favorites_tawasheeh_id_idx",
"idx_tawasheeh_playlists_user",
"tawasheeh_playlist_items_tawasheeh_id_idx",
"idx_video_generation_requests_processing_heygen"
];
for(const index of expected) if(!sql.includes("DROP INDEX IF EXISTS public."+index)) failures.push("missing retirement index: "+index);
for(const protectedIndex of ["hadith_explanations_pkey","recent_recitations_pkey","reciter_favorites_pkey","reciter_favorites_unique","tawasheeh_favorites_pkey","tawasheeh_favorites_unique","playlist_items_unique","tawasheeh_playlist_items_pkey","tawasheeh_playlists_pkey"]) {
  if(sql.includes(protectedIndex)) failures.push("constraint-backed index must not be dropped: "+protectedIndex);
}
if(failures.length){
 console.error("PHASE_19_INDEX_CHECK_FAILED");
 for(const f of failures) console.error("❌ "+f);
 process.exit(1);
}
console.log("✅ Phase 19 index-governance migration contract passed.");
