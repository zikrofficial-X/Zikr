#!/usr/bin/env node
import { existsSync, statSync, readFileSync } from "node:fs";
const failures=[];
const required=[
 "public/audio/adhan.wav",
 "android/app/src/main/res/raw/adhan.wav",
 "ios/App/App/Resources/adhan.wav",
 "public/audio/adhan.mp3",
 "public/quran/mushaf-hafs.json",
 "public/offline-content/v1/ayahs.json",
 "public/offline-content/v1/hadith.json",
 "public/quran/manifest.json",
 "public/offline-content/v1/manifest.json"
];
for(const path of required) if(!existsSync(path)) failures.push("missing required asset: "+path);
for(const path of [
 "public/audio/adhan.wav",
 "android/app/src/main/res/raw/adhan.wav",
 "ios/App/App/Resources/adhan.wav"
]){
 if(existsSync(path) && statSync(path).size !== 4709958) failures.push("unexpected adhan.wav size: "+path);
}
if(existsSync("public/offline-content/v1/manifest.json")){
 const manifest=JSON.parse(readFileSync("public/offline-content/v1/manifest.json","utf8"));
 for(const dataset of ["ayahs","hadith"]) if(!manifest.datasets?.[dataset]) failures.push("offline manifest missing dataset: "+dataset);
}
if(failures.length){
 console.error("PHASE_20_ASSET_CHECK_FAILED");
 for(const f of failures) console.error("❌ "+f);
 process.exit(1);
}
console.log("✅ Phase 20 asset hygiene checks passed: native/web audio copies and offline dataset contracts are present.");
