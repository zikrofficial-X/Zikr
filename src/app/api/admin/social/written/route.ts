import { NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
type Item={id:string;title:string;body:string|null;status:string;created_at:string;published_at:string|null;error_message:string|null;metadata:Record<string,unknown>|null};
export async function GET(){
 const auth=await requireAdminApi("social.manage");
 if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status});
 try{const items=await supabaseServerAdminRequest<Item[]>("/rest/v1/social_publish_queue?content_type=eq.written_post&select=id,title,body,status,created_at,published_at,error_message,metadata&order=created_at.desc&limit=50");return NextResponse.json({items:items??[]},{headers:{"Cache-Control":"no-store"}});}
 catch(error){console.error("[admin/social/written] load failed",error);return NextResponse.json({error:"تعذر تحميل المنشورات المكتوبة."},{status:500});}
}
export async function POST() {
 const auth=await requireAdminApi("social.manage");
 if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status});
 return NextResponse.json(
  {error:"تم إيقاف توليد المنشورات الموجهة للمنصات الخارجية. سيتم استخدام مسارات المحتوى الداخلية في ZIKR فقط.",code:"EXTERNAL_WRITTEN_PUBLISHING_RETIRED"},
  {status:410,headers:{"Cache-Control":"no-store"}},
 );
}
