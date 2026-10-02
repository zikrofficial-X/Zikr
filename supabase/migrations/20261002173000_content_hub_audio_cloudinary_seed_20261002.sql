-- Canonical data reconciliation for the ZIKR content hub, audio library and YouTube thumbnails.
-- Idempotent: safe to apply after the production reconciliation has already been performed.

insert into public.content_sources (name_ar,name_en,source_type,url,license,attribution,authority_level,notes,verified)
values ('المحرر الداخلي لذِكر','ZIKR Editorial Corpus','editorial','https://zikrmediaofficial.vercel.app/','Internal editorial corpus','ZIKR editorial team',3,'نسخة منظمة من المقالات المنشورة بالفعل داخل ذِكر.',true)
on conflict do nothing;

insert into public.content_library (kind,content_type,title_ar,title_en,slug,summary_ar,body_ar,body_en,category,tags,source_id,author_name,reviewer_name,review_status,published,featured,cover_url,metadata,views,published_at)
select 'article','article',coalesce(a.title_ar,a.title),a.title_en,a.slug,coalesce(a.summary_ar,a.summary),coalesce(a.content_ar,a.content),a.content_en,'articles',coalesce(a.tags,'{}'::text[]),(select id from public.content_sources where name_en='ZIKR Editorial Corpus' limit 1),a.author,'ZIKR editorial review','approved',coalesce(a.published,false),coalesce(a.featured,false),a.featured_image_url,coalesce(a.metadata,'{}'::jsonb),coalesce(a.views,0),case when coalesce(a.published,false) then coalesce(a.updated_at,now()) else null end
from public.articles a
where not exists (select 1 from public.content_library c where c.slug=a.slug);

insert into public.media_assets (title,name,asset_type,media_type,url,storage_path,mime_type,size_bytes,duration_seconds,license,attribution,verified_rights,rights_verified,metadata,published)
values
('الأذان — Beautiful Adhan','beautiful-adhan','audio','audio','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961161/zikr/audio/adhan/beautiful-adhan.ogg','zikr/audio/adhan/beautiful-adhan.ogg','audio/ogg',1229032,154,'CC0 1.0','Adam-synagda',true,true,'{"provider":"cloudinary","source":"Wikimedia Commons"}',true),
('الأذان — تسجيل بشري قصير','adhan-short','audio','audio','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961166/zikr/audio/adhan/adhan-short.ogg','zikr/audio/adhan/adhan-short.ogg','audio/ogg',338741,42,'CC0 1.0','Aishatu98',true,true,'{"provider":"cloudinary","source":"Wikimedia Commons"}',true),
('الأذان — تسجيل بشري كامل','adhan-full','audio','audio','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961172/zikr/audio/adhan/adhan-full.ogg','zikr/audio/adhan/adhan-full.ogg','audio/ogg',820174,102,'CC0 1.0','Aishatu98',true,true,'{"provider":"cloudinary","source":"Wikimedia Commons"}',true),
('الصلاة على النبي ﷺ — تسجيل بشري','muhammad-peace','audio','audio','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961177/zikr/audio/salawat/muhammad-peace.wav','zikr/audio/salawat/muhammad-peace.wav','audio/wav',462926,5,'ترخيص ملف المصدر على Wikimedia Commons',null,true,true,'{"provider":"cloudinary","source":"Wikimedia Commons"}',true),
('ذكر محمد ﷺ — تسجيل بشري','muhammad-name','audio','audio','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961182/zikr/audio/salawat/muhammad-name.wav','zikr/audio/salawat/muhammad-name.wav','audio/wav',239694,3,'ترخيص ملف المصدر على Wikimedia Commons',null,true,true,'{"provider":"cloudinary","source":"Wikimedia Commons"}',true),
('تسبيح — نطق بشري 1','tasbih-1','audio','audio','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961188/zikr/audio/dhikr/tasbih-1.wav','zikr/audio/dhikr/tasbih-1.wav','audio/wav',150316,2,'CC BY-SA 4.0','Spotless Mind1988',true,true,'{"provider":"cloudinary","source":"Lingua Libre"}',true),
('تسبيح — نطق بشري 2','tasbih-2','audio','audio','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961193/zikr/audio/dhikr/tasbih-2.wav','zikr/audio/dhikr/tasbih-2.wav','audio/wav',92972,1,'CC BY-SA 4.0','Zinou2go',true,true,'{"provider":"cloudinary","source":"Lingua Libre"}',true)
on conflict do nothing;

update public.youtube_feed_cache
set thumbnail_url = 'https://i.ytimg.com/vi/' || video_id || '/hqdefault.jpg'
where video_id is not null and video_id <> '';
