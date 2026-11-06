"use client";
import {useCallback,useEffect,useState} from "react";
type Item={id:string;title:string;body:string|null;status:string;created_at:string;published_at:string|null;error_message:string|null;metadata:Record<string,unknown>|null};
const choices=[["auto","تنوع تلقائي"],["quran","القرآن الكريم"],["hadith","الحديث النبوي"],["dua","الأدعية"],["adhkar","الأذكار"],["story","القصص"],["prophets","قصص الأنبياء"],["companions","قصص الصحابة"],["knowledge","المقالات والمعرفة"]] as const;
export default function WrittenStudioClient(){
 const [category,setCategory]=useState("auto"),[batch,setBatch]=useState("1"),[items,setItems]=useState<Item[]>([]),[loading,setLoading]=useState(true),[sending,setSending]=useState(false),[message,setMessage]=useState("");
 const load=useCallback(async()=>{setLoading(true);try{const res=await fetch("/api/admin/social/written",{cache:"no-store"});const data=await res.json();if(!res.ok)throw new Error(data.error||"تعذر تحميل المنشورات");setItems(data.items||[]);}catch(e){setMessage(e instanceof Error?e.message:"تعذر تحميل المنشورات");}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();},[load]);
 async function generate(){setSending(true);setMessage("");try{const res=await fetch("/api/admin/social/written",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({category,batchSize:Number(batc���q�^