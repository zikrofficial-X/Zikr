import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { dispatchGitHubWorkflow } from "@/lib/github/dispatch-workflow";
export const dynamic="force-dynamic";
type Item={id:string;title:string;body:string|null;status:string;created_at:string;published_at:string|null;error_message:string|null;metadata:Record<string,unknown>|null};
export async function GET(){
 const auth=await requireAdminApi("social.manage");
 if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status});
 try{const items=await supabaseServerAdminRequest<Item[]>("/rest/v1/social_publish_queue?content_type=eq.written_post&select=id,title,body,status,created_at,published_at,error_message,metadata&order=created_at.desc&limit=50");return NextResponse.json({items:items??[]},{headers:{"Cache-Control":"no-store"}});}
 catch(error){console.error("[admin/social/written] load failed",error);return NextResponse.json({error:"تعذر تحميل المنشورات المكتوبة."},{status:500});}
}
export async function POST(request:NextRequest){
 const auth=await requireAdminApi("social.manage");
 if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status});
 // Generation queues posts that the existing publisher may publish automatically.
 // Require explicit publishing permission as well as social queue management.
 const publishAuth=await requireAdminApi("social.publish");
 if(!publishAuth.ok)return NextResponse.json({error:publishAuth.error},{status:publishAuth.status});
 try{
  const body=await request.json().catch(()=>({})) as {category?:unknown;batchSize?:unknown};
  const categories=new Set(["auto","quran","hadith","dua","adhkar","story","prophets","companions","knowledge"]);
  const category=typeof body.category==="string"&&categories.has(body.category)?body.category:"auto";
  const batchSize=Math.max(1,Math.min(3,Math.floor(Number(body.batchSize)||1)));
  const dispatch=await dispatchGitHubWorkflow("generate-written-content.yml",{category,batch_size:String(batchSize)});
  await recordAdminAuditEvent({action:"social.written_content.dispatch",permission:"social.publish",resourceType:"social_publish_queue",metadata:{category,batchSize,workflow:dispatch.workflowFile}});
  return NextResponse.json({ok:true,dispatch});
 }catch(error){console.error("[admin/social/written] dispatch failed",error);return NextResponse.json({error:error instanceof Error?error.message:"تعذر تشغيل مولد المنشورات."},{status:500});}
}
