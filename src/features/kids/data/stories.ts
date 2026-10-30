export interface KidsStory {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  category: 'stories' | 'lessons' | 'activities' | 'games';
  age_group: 'toddler' | 'preschool' | 'school';
  content_ar: string;
  content_en: string;
  moral_ar: string;
  moral_en: string;
  illustrations: string[];
  duration_minutes: number;
}

export const KIDS_STORIES: KidsStory[] = [
  {
    id: '1',
    title_ar: 'قصة النملة والصرصور',
    title_en: 'The Ant and the Grasshopper',
    slug: 'ant-and-grasshopper',
    category: 'stories',
    age_group: 'school',
    content_ar: 'في يوم حار من أيام الصيف، كانت النملة تعمل بجد لجمع الطعام والحبوب لفصل الشتاء. أما الصرصور فكان يقضي وقته في اللعب والغناء، ولم يهتم بجمع الطعام. عندما حل فصل الشتاء، وجدت النملة مخزناً كاملاً من الطعام لتعيش بارتياح، بينما الصرصور جوعان يطلب المساعدة. تعلم الصرصور حينها أهمية العمل والاجتهاد.',
    content_en: 'On a hot summer day, the ant worked hard gathering food and grains for winter. The grasshopper, however, spent his time playing and singing, not caring about storing food. When winter came, the ant had a full store of food to live comfortably, while the hungry grasshopper asked for help. The grasshopper learned the importance of hard work and diligence.',
    moral_ar: 'العمل والاجتهاد يؤديان إلى النجاح والراحة في المستقبل',
    moral_en: 'Hard work and diligence lead to success and comfort in the future',
    illustrations: [],
    duration_minutes: 10
  },
  {
    id: '2',
    title_ar: 'قصة الحمامة والنملة',
    title_en: 'The Dove and the Ant',
    slug: 'dove-and-ant',
    category: 'stories',
    age_group: 'school',
    content_ar: 'كانت نملة تشرب من جدول الماء عندما انزلقت وسقطت فيه. حاولت النملة الخروج لكنها كانت تغرق. جاءت حمامة رحيمة وألقت عصا صغيرة فتسلقتها النملة وخرجت آمنة. بعد أيام، جاء صياد يريد اصطياد الحمامة. لكن النملة التي أنقذتها الحمامة عضت الصياد فهرب. بهذه الطريقة أنقذت النملة حياة الحمامة كما أنقذتها الحمامة سابقاً.',
    content_en: 'An ant was drinking from a stream when she slipped and fell into it. She tried to get out but was drowning. A kind dove came and threw a small stick, which the ant climbed and was saved. Days later, a hunter came to catch the dove. But the ant, grateful for being saved, bit the hunter who fled. Thus the ant saved the dove\'s life as the dove had saved hers.',
    moral_ar: 'الرحمة والتعاون تخلق سلسلة من الخير والعطاء',
    moral_en: 'Mercy and cooperation create a chain of goodness and giving',
    illustrations: [],
    duration_minutes: 12
  },
  {
    id: '3',
    title_ar: 'قصة الأسد والفأر',
    title_en: 'The Lion and the Mouse',
    slug: 'lion-and-mouse',
    category: 'stories',
    age_group: 'preschool',
    content_ar: 'كان هناك أسد ملك الغابة ينام تحت شجرة. مرّ بجانبه فأر صغير فوطئ عليه الأسد بخطأ. استيقظ الأسد وأراد أن يلتقم الفأر، لكن الفأر طلب الرحمة وقال: يا ملك الغابة، اعفُ عني وسأعينك يوماً. ضحك الأسد من كلام الفأر لكن تركه. بعد أيام، وقع الأسد في شبكة صياد. جاء الفأر وقرض الشبكة بأسنانه حتى حررّ الأسد. عندها أدرك الأسد أن الصغير يمكن أن يساعد الكبير.',
    content_en: 'A lion, king of the forest, was sleeping under a tree. A small mouse passed by and the lion stepped on it by mistake. The lion woke and wanted to devour the mouse, but the mouse begged for mercy saying he would help one day. The lion laughed but let him go. Days later, the lion fell into a hunter\'s net. The mouse came and gnawed the net until the lion was free. The lion learned that the small can help the big.',
    moral_ar: 'لا تحتقر الصغير فقد تحتاج إلى مساعدته يوماً',
    moral_en: 'Never despise the small, for you may need their help one day',
    illustrations: [],
    duration_minutes: 15
  },
  {
    id: '4',
    title_ar: 'الكلمة الطيبة في ساحة المدرسة',
    title_en: 'A Kind Word at School',
    slug: 'kind-word-at-school',
    category: 'stories',
    age_group: 'school',
    content_ar: 'في ساحة المدرسة لاحظت ليلى أن زميلتها تجلس وحدها. اقتربت منها وسألتها إن كانت تريد المشاركة في اللعب. لم تضحك ليلى على ارتباك صديقتها، بل شرحت لها قواعد اللعبة بهدوء. بعد قليل شاركت المجموعة كلها، وتعلم الأطفال أن الترحيب البسيط قد يغير يوم شخص آخر.',
    content_en: 'When Laila noticed a classmate sitting alone, she invited her to join the game and explained the rules patiently. The children learned that a small act of kindness can make someone feel welcome.',
    moral_ar: 'التعاطف والترحيب وإشراك الآخرين.',
    moral_en: 'Empathy, welcome and inclusion.',
    illustrations: [],
    duration_minutes: 5
  },
  {
    id: '5',
    title_ar: 'الكتاب الذي عاد إلى مكتبته',
    title_en: 'The Book Returned to Its Shelf',
    slug: 'book-returned-to-shelf',
    category: 'lessons',
    age_group: 'preschool',
    content_ar: 'انتهى سامي من قراءة كتاب الصور، لكنه وضعه على الأرض وذهب ليلعب. تذكر أن لكل شيء مكانًا، فعاد وحمل الكتاب ووضعه على الرف. ساعدته أخته في ترتيب الأقلام، ثم اختارا قصة جديدة للقراءة معًا.',
    content_en: 'After reading a picture book, Sami remembered to put it back on the shelf. His sister helped tidy the pencils, and they chose another story to read together.',
    moral_ar: 'المحافظة على الأشياء والنظام.',
    moral_en: 'Taking care of belongings and keeping things tidy.',
    illustrations: [],
    duration_minutes: 4
  },
  {
    id: '6',
    title_ar: 'زجاجة الماء المشتركة',
    title_en: 'Sharing Water Kindly',
    slug: 'sharing-water-kindly',
    category: 'stories',
    age_group: 'school',
    content_ar: 'في يوم النشاط أحضرت مريم زجاجة ماء إضافية. لاحظت أن صديقتها نسيت زجاجتها، فسألت المعلمة أولًا عن الطريقة المناسبة للمشاركة. اتفق الجميع على استخدام أكواب نظيفة، وشكروا مريم على تذكر الآخرين. تعلمت المجموعة أن المساعدة تكون مع مراعاة النظافة والاستئذان.',
    content_en: 'During a school activity, Maryam noticed a friend had forgotten her water bottle. She asked the teacher how to help safely, and the group used clean cups. They learned to combine kindness with care.',
    moral_ar: 'المساعدة مع النظافة والاستئذان.',
    moral_en: 'Helping others while respecting hygiene and permission.',
    illustrations: [],
    duration_minutes: 5
  },
  {
    id: '7',
    title_ar: 'الخطأ الذي أصلحته نور',
    title_en: 'Noor Fixes a Mistake',
    slug: 'noor-fixes-a-mistake',
    category: 'lessons',
    age_group: 'school',
    content_ar: 'أثناء إعداد لوحة الفصل، كتبت نور اسم زميلتها بطريقة غير صحيحة. شعرت بالحرج، لكنها لم تخفِ الخطأ. أخبرت زميلتها واعتذرت، ثم أعادت طباعة البطاقة وراجعت الأسماء مع المجموعة. أدركت أن الاعتذار يصبح أقوى عندما يتبعه إصلاح عملي.',
    content_en: 'While making a class display, Noor misspelled a classmate’s name. She admitted the mistake, apologized, corrected the card and checked the other names with the group.',
    moral_ar: 'الاعتراف بالخطأ وإصلاح أثره.',
    moral_en: 'Admitting mistakes and repairing their effects.',
    illustrations: [],
    duration_minutes: 6
  },
  {
    id: '8',
    title_ar: 'حديقة الجيران الصغيرة',
    title_en: 'The Neighbours’ Little Garden',
    slug: 'neighbours-little-garden',
    category: 'activities',
    age_group: 'school',
    content_ar: 'اجتمع أطفال الحي لتنظيف مساحة صغيرة بجوار البيوت. أحضر كل طفل أداة آمنة بإشراف الكبار، وجمعوا الأوراق في أكياس مناسبة. لم يقتربوا من الأدوات الحادة أو الأسلاك، وطلبوا مساعدة البالغين عند الحاجة. أصبحت المساحة أنظف وتعلموا العمل الجماعي.',
    content_en: 'Children worked with adult supervision to tidy a small shared space. They used safe tools, avoided hazards and asked adults for help whenever needed.',
    moral_ar: 'التعاون والسلامة والمسؤولية.',
    moral_en: 'Cooperation, safety and responsibility.',
    illustrations: [],
    duration_minutes: 7
  },
  {
    id: '9',
    title_ar: 'صديق يحتاج إلى من يسمعه',
    title_en: 'A Friend Who Needs Listening',
    slug: 'friend-who-needs-listening',
    category: 'lessons',
    age_group: 'school',
    content_ar: 'عاد عمر من المدرسة صامتًا. سأله صديقه ياسين إن كان يريد الحديث أم يفضل بعض الوقت. لم يضغط عليه ياسين ولم ينشر ما سمعه، بل أصغى باهتمام ثم شجعه على التحدث إلى شخص بالغ يثق به إذا استمر الضيق. تعلم الصديقان أن الاستماع والخصوصية وطلب المساعدة أمور مهمة.',
    content_en: 'Omar came home quiet. Yassin asked whether he wanted to talk or needed time. He listened without sharing private details and encouraged Omar to speak with a trusted adult if the problem continued.',
    moral_ar: 'الاستماع واحترام الخصوصية وطلب المساعدة.',
    moral_en: 'Listening, privacy and seeking help.',
    illustrations: [],
    duration_minutes: 6
  },
];

export const KIDS_ACTIVITIES: Array<{id: string; title_ar: string; type: string}> = [
  { id: '1', title_ar: 'تلوين صور إسلامية', type: 'coloring' },
  { id: '2', title_ar: 'ألغاز دينية', type: 'puzzle' },
  { id: '3', title_ar: 'أسئلة مسابقات', type: 'quiz' },
  { id: '4', title_ar: 'أنشطة يدوية', type: 'craft' },
  { id: '5', title_ar: 'ألعاب تعليمية', type: 'educational-games' },
];
