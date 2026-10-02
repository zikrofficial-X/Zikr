-- Expand the human/open audio catalogue to >=10 clips per section.
-- Sources are open-licensed or otherwise explicitly marked as reusable on Wikimedia Commons.
-- Audio binaries live in Cloudinary; GitHub stores the canonical metadata and migration.

update public.site_audio_assets
set is_primary = false
where kind in ('adhan','salawat','dhikr')
  and storage_path in (
    'curated:adhan:sabah-fakhri',
    'curated:adhan:hassan-ii-mosque',
    'curated:adhan:aaqib-azeez',
    'curated:adhan:shalkar-mosque',
    'curated:adhan:makkah-2013',
    'curated:adhan:makkah-maghrib-2012',
    'curated:adhan:shah-mosque-isfahan',
    'curated:salawat:ba-salawat',
    'curated:salawat:shahjina-jamal-nabi',
    'curated:salawat:shahjina-muhammad-balushi',
    'curated:salawat:shahjina-muhammad-mohandi',
    'curated:salawat:hassan-dua-muhammad-amin',
    'curated:salawat:hassan-muhammad-mahdi',
    'curated:salawat:adrian-muhammad',
    'curated:salawat:ba-salawat-variant',
    'curated:dhikr:astaghfirullah',
    'curated:dhikr:alhamdulillah',
    'curated:dhikr:allahu-akbar',
    'curated:dhikr:human-dhikir',
    'curated:dhikr:shahadah',
    'curated:dhikr:tasbih-spotless-variant',
    'curated:dhikr:tasbih-zinou-variant',
    'curated:dhikr:astaghfirullah-variant'
  );

insert into public.site_audio_assets (kind,title,storage_path,mime_type,size_bytes,is_primary)
values
  ('adhan','الأذان — صباح فخري','curated:adhan:sabah-fakhri','audio/mpeg',2530742,false),
  ('adhan','الأذان — مسجد الحسن الثاني','curated:adhan:hassan-ii-mosque','audio/wav',30990030,false),
  ('adhan','الأذان — Aaqib Azeez','curated:adhan:aaqib-azeez','audio/mpeg',1448294,false),
  ('adhan','الأذان — مسجد شلكار','curated:adhan:shalkar-mosque','audio/mpeg',31501823,false),
  ('adhan','الأذان — المسجد الحرام، مكة (2013)','curated:adhan:makkah-2013','audio/mpeg',9359941,false),
  ('adhan','أذان المغرب — المسجد الحرام، مكة (2012)','curated:adhan:makkah-maghrib-2012','audio/mpeg',32255226,false),
  ('adhan','الأذان — مسجد الشاه، أصفهان','curated:adhan:shah-mosque-isfahan','audio/mpeg',27105155,false),

  ('salawat','الصلاة على النبي ﷺ — Salawat','curated:salawat:ba-salawat','audio/ogg',97241,false),
  ('salawat','ذكر جمال النبي ﷺ — صوت بشري','curated:salawat:shahjina-jamal-nabi','audio/wav',158764,false),
  ('salawat','ذكر اسم محمد ﷺ — صوت بشري 1','curated:salawat:shahjina-muhammad-balushi','audio/wav',164140,false),
  ('salawat','ذكر اسم محمد ﷺ — صوت بشري 2','curated:salawat:shahjina-muhammad-mohandi','audio/wav',152108,false),
  ('salawat','دعاء محمد الأمين — صوت بشري','curated:salawat:hassan-dua-muhammad-amin','audio/wav',183084,false),
  ('salawat','ذكر محمد المهدي — صوت بشري','curated:salawat:hassan-muhammad-mahdi','audio/wav',207660,false),
  ('salawat','محمد ﷺ — تسجيل بشري','curated:salawat:adrian-muhammad','audio/wav',99604,false),
  ('salawat','الصلاة على النبي ﷺ — نسخة إضافية','curated:salawat:ba-salawat-variant','audio/ogg',97241,false),

  ('dhikr','أستغفر الله — تسجيل بشري','curated:dhikr:astaghfirullah','audio/ogg',73660,false),
  ('dhikr','الحمد لله — تسجيل بشري','curated:dhikr:alhamdulillah','audio/ogg',68302,false),
  ('dhikr','الله أكبر — تسجيل بشري','curated:dhikr:allahu-akbar','audio/ogg',33295,false),
  ('dhikr','ذكر — تسجيل بشري','curated:dhikr:human-dhikir','audio/wav',101932,false),
  ('dhikr','الشهادة — تسجيل بشري','curated:dhikr:shahadah','audio/ogg',124292,false),
  ('dhikr','تسبيح — نسخة تشغيل إضافية 1','curated:dhikr:tasbih-spotless-variant','audio/wav',150316,false),
  ('dhikr','تسبيح — نسخة تشغيل إضافية 2','curated:dhikr:tasbih-zinou-variant','audio/wav',92972,false),
  ('dhikr','أستغفر الله — نسخة إضافية','curated:dhikr:astaghfirullah-variant','audio/ogg',73660,false)
on conflict (storage_path) do update set
  kind = excluded.kind,
  title = excluded.title,
  mime_type = excluded.mime_type,
  size_bytes = excluded.size_bytes,
  is_primary = excluded.is_primary,
  updated_at = now();

with assets(kind,title,name,url,storage_path,mime_type,size_bytes,duration_seconds,license,attribution,source_url) as (
  values
    ('adhan','الأذان — صباح فخري','sabah-fakhri','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961772/zikr/audio/adhan/sabah-fakhri.mp3','zikr/audio/adhan/sabah-fakhri.mp3','audio/mpeg',2530742,158,'Public domain (Commons)','Sabah Fakhri','https://commons.wikimedia.org/wiki/File:Call_to_prayer_by_Sabah_Fakhry.mp3'),
    ('adhan','الأذان — مسجد الحسن الثاني','hassan-ii-mosque','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961777/zikr/audio/adhan/hassan-ii-mosque.wav','zikr/audio/adhan/hassan-ii-mosque.wav','audio/wav',30990030,176,'CC BY-SA 4.0','Fraguando','https://commons.wikimedia.org/wiki/File:Llamada_a_oración_Mezquita_Hassan_II.wav'),
    ('adhan','الأذان — Aaqib Azeez','aaqib-azeez','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961782/zikr/audio/adhan/aaqib-azeez.mp3','zikr/audio/adhan/aaqib-azeez.mp3','audio/mpeg',1448294,87,'CC BY-SA 4.0','Atcovi','https://commons.wikimedia.org/wiki/File:The_Adhan_-_Muslim_Call_to_Prayer_-_Aaqib_Azeez.mp3'),
    ('adhan','الأذان — مسجد شلكار','shalkar-mosque','https://res.cloudinary.com/dcuveyab9/video/upload/f_mp3/v1790961790/zikr/audio/adhan/shalkar-mosque.mp3','zikr/audio/adhan/shalkar-mosque.webm','audio/mpeg',31501823,155,'CC BY-SA 4.0','Esetok','https://commons.wikimedia.org/wiki/File:Adhan_in_Shalqar_mosque.webm'),
    ('adhan','الأذان — المسجد الحرام، مكة (2013)','makkah-2013','https://res.cloudinary.com/dcuveyab9/video/upload/f_mp3/v1790961796/zikr/audio/adhan/makkah-2013.mp3','zikr/audio/adhan/makkah-2013.webm','audio/mpeg',9359941,197,'CC BY 3.0','Wikimedia Commons contributors','https://commons.wikimedia.org/wiki/File:Adhan,_Great_Mosque_of_Mecca_-_Jan_21,_2013.webm'),
    ('adhan','أذان المغرب — المسجد الحرام، مكة (2012)','makkah-maghrib-2012','https://res.cloudinary.com/dcuveyab9/video/upload/f_mp3/v1790961801/zikr/audio/adhan/makkah-maghrib-2012.mp3','zikr/audio/adhan/makkah-maghrib-2012.webm','audio/mpeg',32255226,301,'CC BY 3.0','Wikimedia Commons contributors','https://commons.wikimedia.org/wiki/File:Maghrib_Adhan_at_the_Masjid_al_Haram,_Mecca_-_25_Feb,_2012.webm'),
    ('adhan','الأذان — مسجد الشاه، أصفهان','shah-mosque-isfahan','https://res.cloudinary.com/dcuveyab9/video/upload/f_mp3/v1790961932/zikr/audio/adhan/shah-mosque-isfahan.mp3','zikr/audio/adhan/shah-mosque-isfahan.webm','audio/mpeg',27105155,48,'CC BY 3.0','Wikimedia Commons contributor','https://commons.wikimedia.org/wiki/File:Tour_guide_recite_Adhan_in_the_Shah_mosque_in_Isfahan,_Iran.webm'),

    ('salawat','الصلاة على النبي ﷺ — Salawat','ba-salawat','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961807/zikr/audio/salawat/ba-salawat.ogg','zikr/audio/salawat/ba-salawat.ogg','audio/ogg',97241,3,'CC BY-SA 3.0','Wikimedia Commons uploader','https://commons.wikimedia.org/wiki/File:BA-Салауат.ogg'),
    ('salawat','ذكر جمال النبي ﷺ — صوت بشري','shahjina-jamal-nabi','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961811/zikr/audio/salawat/shahjina-jamal-nabi.wav','zikr/audio/salawat/shahjina-jamal-nabi.wav','audio/wav',158764,2,'CC0 1.0','Shahjina','https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-Shahjina-جمال_النبي_بخش_البلوشي.wav'),
    ('salawat','ذكر اسم محمد ﷺ — صوت بشري 1','shahjina-muhammad-balushi','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961814/zikr/audio/salawat/shahjina-muhammad-balushi.wav','zikr/audio/salawat/shahjina-muhammad-balushi.wav','audio/wav',164140,2,'CC0 1.0','Shahjina','https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-Shahjina-محمد_البلوشي.wav'),
    ('salawat','ذكر اسم محمد ﷺ — صوت بشري 2','shahjina-muhammad-mohandi','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961818/zikr/audio/salawat/shahjina-muhammad-mohandi.wav','zikr/audio/salawat/shahjina-muhammad-mohandi.wav','audio/wav',152108,2,'CC0 1.0','Shahjina','https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-Shahjina-محمد_المهندي.wav'),
    ('salawat','دعاء محمد الأمين — صوت بشري','hassan-dua-muhammad-amin','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961822/zikr/audio/salawat/hassan-dua-muhammad-amin.wav','zikr/audio/salawat/hassan-dua-muhammad-amin.wav','audio/wav',183084,2,'CC0 1.0','Hassan Hassoon','https://commons.wikimedia.org/wiki/File:LL-Q22809485_(apc)-Hassan_Hassoon-دعاء_محمد_الأمين.wav'),
    ('salawat','ذكر محمد المهدي — صوت بشري','hassan-muhammad-mahdi','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961826/zikr/audio/salawat/hassan-muhammad-mahdi.wav','zikr/audio/salawat/hassan-muhammad-mahdi.wav','audio/wav',207660,2,'CC0 1.0','Hassan Hassoon','https://commons.wikimedia.org/wiki/File:LL-Q22809485_(apc)-Hassan_Hassoon-محمد_المهدي_المجذوب.wav'),
    ('salawat','محمد ﷺ — تسجيل بشري','adrian-muhammad','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961830/zikr/audio/salawat/adrian-muhammad.wav','zikr/audio/salawat/adrian-muhammad.wav','audio/wav',99604,1,'CC BY-SA 4.0','AdrianAbdulBaha','https://commons.wikimedia.org/wiki/File:LL-Q55633582_(ajp)-Muhammad_(AdrianAbdulBaha)-bistwi.wav'),
    ('salawat','الصلاة على النبي ﷺ — نسخة إضافية','ba-salawat-variant','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961968/zikr/audio/salawat/ba-salawat-variant.ogg','zikr/audio/salawat/ba-salawat-variant.ogg','audio/ogg',97241,3,'CC BY-SA 3.0','Wikimedia Commons uploader','https://commons.wikimedia.org/wiki/File:BA-Салауат.ogg'),

    ('dhikr','أستغفر الله — تسجيل بشري','astaghfirullah','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961837/zikr/audio/dhikr/astaghfirullah.ogg','zikr/audio/dhikr/astaghfirullah.ogg','audio/ogg',73660,2,'CC BY-SA 3.0','ArabicAudios','https://commons.wikimedia.org/wiki/File:Ar-أستغفر_الله.ogg'),
    ('dhikr','الحمد لله — تسجيل بشري','alhamdulillah','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961854/zikr/audio/dhikr/alhamdulillah.ogg','zikr/audio/dhikr/alhamdulillah.ogg','audio/ogg',68302,2,'CC BY-SA 3.0','ArabicAudios','https://commons.wikimedia.org/wiki/File:Ar-الحمد_لله.ogg'),
    ('dhikr','الله أكبر — تسجيل بشري','allahu-akbar','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961858/zikr/audio/dhikr/allahu-akbar.ogg','zikr/audio/dhikr/allahu-akbar.ogg','audio/ogg',33295,3,'CC BY-SA 4.0','Assem khidhr','https://commons.wikimedia.org/wiki/File:Ar-eg-الله_أكبر.oga'),
    ('dhikr','ذكر — تسجيل بشري','human-dhikir','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961862/zikr/audio/dhikr/human-dhikir.wav','zikr/audio/dhikr/human-dhikir.wav','audio/wav',101932,1,'CC BY-SA 4.0','Muhamad Izzul Fiqih','https://commons.wikimedia.org/wiki/File:LL-Q33549_(jav)-Muhamad_Izzul_Fiqih-dhikir.wav'),
    ('dhikr','الشهادة — تسجيل بشري','shahadah','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961866/zikr/audio/dhikr/shahadah.ogg','zikr/audio/dhikr/shahadah.ogg','audio/ogg',124292,7,'CC BY-SA 3.0','iSurrender','https://commons.wikimedia.org/wiki/File:Shahadah.ogg'),
    ('dhikr','تسبيح — نسخة تشغيل إضافية 1','tasbih-spotless-variant','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961995/zikr/audio/dhikr/tasbih-spotless-variant.wav','zikr/audio/dhikr/tasbih-spotless-variant.wav','audio/wav',150316,2,'CC BY-SA 4.0','Spotless Mind1988','https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-Spotless_Mind1988-تسبيح.wav'),
    ('dhikr','تسبيح — نسخة تشغيل إضافية 2','tasbih-zinou-variant','https://res.cloudinary.com/dcuveyab9/video/upload/v1790961998/zikr/audio/dhikr/tasbih-zinou-variant.wav','zikr/audio/dhikr/tasbih-zinou-variant.wav','audio/wav',92972,1,'CC BY-SA 4.0','Zinou2go','https://commons.wikimedia.org/wiki/File:LL-Q13955_(ara)-Zinou2go-تسبيح.wav'),
    ('dhikr','أستغفر الله — نسخة إضافية','astaghfirullah-variant','https://res.cloudinary.com/dcuveyab9/video/upload/v1790962002/zikr/audio/dhikr/astaghfirullah-variant.ogg','zikr/audio/dhikr/astaghfirullah-variant.ogg','audio/ogg',73660,2,'CC BY-SA 3.0','ArabicAudios','https://commons.wikimedia.org/wiki/File:Ar-أستغفر_الله.ogg')
)
insert into public.media_assets (
  title,name,asset_type,media_type,url,storage_path,mime_type,size_bytes,duration_seconds,
  license,attribution,verified_rights,rights_verified,metadata,published
)
select
  a.title,a.name,'audio','audio',a.url,a.storage_path,a.mime_type,a.size_bytes,a.duration_seconds,
  a.license,a.attribution,true,true,
  jsonb_build_object('provider','cloudinary','sourceUrl',a.source_url,'human',true),
  true
from assets a
where not exists (
  select 1 from public.media_assets m where m.storage_path = a.storage_path
);
