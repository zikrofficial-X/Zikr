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
];

export const KIDS_ACTIVITIES: Array<{id: string; title_ar: string; type: string}> = [
  { id: '1', title_ar: 'تلوين صور إسلامية', type: 'coloring' },
  { id: '2', title_ar: 'ألغاز دينية', type: 'puzzle' },
  { id: '3', title_ar: 'أسئلة مسابقات', type: 'quiz' },
  { id: '4', title_ar: 'أنشطة يدوية', type: 'craft' },
  { id: '5', title_ar: 'ألعاب تعليمية', type: 'educational-games' },
];
