-- Reconcile duplicate companion rows and remove unsupported absolute claims.
-- The duplicate rows are archived, not deleted, so historical data remains recoverable.

update public.companions
set published = false,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'content_status', 'archived_duplicate',
      'canonical_slug', case slug
        when 'bilal' then 'bilal-ibn-rabah'
        when 'khalid' then 'khalid-ibn-walid'
        when 'uthman' then 'uthman-ibn-affan'
        when 'ali' then 'ali-ibn-abi-talib'
        when 'umar' then 'umar-ibn-khattab'
      end
    )
where slug in ('bilal', 'khalid', 'uthman', 'ali', 'umar');

update public.companions
set bio_ar = case slug
  when 'bilal-ibn-rabah' then 'بلال بن رباح رضي الله عنه من السابقين إلى الإسلام، ثبت على التوحيد حين لقي الأذى في مكة، ثم صار من مؤذني رسول الله ﷺ. تعرض سيرته معنى الثبات مع حفظ الدليل، ولا يصح اختزالها في عبارات شعبية غير موثقة. يذكره هذا المدخل بوصفه صحابيًا ومؤذنًا، مع إحالة كل رواية تفصيلية إلى مصدرها المحدد.'
  when 'khalid-ibn-walid' then 'خالد بن الوليد رضي الله عنه صحابي وقائد من قادة المسلمين، أسلم بعد الحديبية، وبرز دوره في مؤتة وغيرها. وصفه النبي ﷺ في رواية صحيحة بأنه سيف من سيوف الله، وهو وصف لمكانته في الجهاد لا ترخيص في الغلو أو نسبة تفاصيل عسكرية بلا مصدر. تعرض سيرته التحول من الخصومة إلى الإسلام، وحسن القيادة، والالتزام بضوابط الرواية.'
  when 'uthman-ibn-affan' then 'عثمان بن عفان رضي الله عنه من السابقين إلى الإسلام، وثالث الخلفاء الراشدين، وزوج ابنتي النبي ﷺ ولذلك لُقّب بذي النورين. عُرف بالحياء والإنفاق، وكان له دور في نسخ المصاحف على قراءة جامعة في خلافته. تُعرض سيرته مع التفريق بين ما ثبت في الحديث وما يروى في كتب الأخبار دون إسناد محدد.'
  when 'ali-ibn-abi-talib' then 'علي بن أبي طالب رضي الله عنه ابن عم النبي ﷺ وزوج فاطمة رضي الله عنها، ومن أوائل من أسلم، ورابع الخلفاء الراشدين. عُرف بالعلم والشجاعة والقضاء، وشهد عددًا من المشاهد مع رسول الله ﷺ. تعرض سيرته مكانته بين أهل البيت والصحابة مع تجنب الغلو والعبارات التي لا يثبت معناها بمصدر.'
  when 'umar-ibn-khattab' then 'عمر بن الخطاب رضي الله عنه من كبار أصحاب النبي ﷺ وثاني الخلفاء الراشدين. أسلم فكان إسلامه قوة للمؤمنين، ثم تولى الخلافة فاشتهر بالعدل ومحاسبة الولاة وتنظيم شؤون الدولة. تُذكر مواقفه الإدارية والتربوية بقدر ما تثبته الروايات، ولا تُنسب إليه قصة أو عبارة إلا بإحالة قابلة للتحقق.'
  else bio_ar
end,
metadata = case slug
  when 'bilal-ibn-rabah' then jsonb_build_object('content_status','primary_indexed','references',jsonb_build_array(jsonb_build_object('url','https://sunnah.com/bukhari:3754','title_ar','صحيح البخاري — فضائل بلال رضي الله عنه','locator_ar','حديث بلال','source_type','hadith')))
  when 'khalid-ibn-walid' then jsonb_build_object('content_status','primary_indexed','references',jsonb_build_array(jsonb_build_object('url','https://sunnah.com/bukhari:3757','title_ar','صحيح البخاري — سيف من سيوف الله','locator_ar','حديث خالد بن الوليد','source_type','hadith')))
  when 'uthman-ibn-affan' then jsonb_build_object('content_status','primary_indexed','references',jsonb_build_array(jsonb_build_object('url','https://sunnah.com/bukhari:4987','title_ar','صحيح البخاري — جمع المصاحف','locator_ar','رواية نسخ المصاحف في عهد عثمان','source_type','hadith'),jsonb_build_object('url','https://sunnah.com/bukhari/62','title_ar','صحيح البخاري — فضائل أصحاب النبي ﷺ','locator_ar','كتاب المناقب؛ يحدد الحديث قبل الاقتباس','source_type','hadith')))
  when 'ali-ibn-abi-talib' then jsonb_build_object('content_status','primary_indexed','references',jsonb_build_array(jsonb_build_object('url','https://sunnah.com/bukhari:3701','title_ar','صحيح البخاري — فضائل علي رضي الله عنه','locator_ar','حديث المنزلة','source_type','hadith'),jsonb_build_object('url','https://sunnah.com/bukhari:4210','title_ar','صحيح البخاري — راية خيبر','locator_ar','حديث خيبر؛ يحدد الحديث قبل الاقتباس','source_type','hadith')))
  when 'umar-ibn-khattab' then jsonb_build_object('content_status','primary_indexed','references',jsonb_build_array(jsonb_build_object('url','https://sunnah.com/bukhari:3683','title_ar','صحيح البخاري — فضائل عمر رضي الله عنه','locator_ar','كتاب فضائل أصحاب النبي ﷺ','source_type','hadith'),jsonb_build_object('url','https://sunnah.com/bukhari/62','title_ar','صحيح البخاري — فضائل أصحاب النبي ﷺ','locator_ar','فهرس عام؛ يحدد الحديث قبل الاقتباس','source_type','hadith')))
  else metadata
end
where slug in ('bilal-ibn-rabah','khalid-ibn-walid','uthman-ibn-affan','ali-ibn-abi-talib','umar-ibn-khattab');
