export interface Companion {
  id: string;
  name_ar: string;
  name_en: string;
  alias_ar: string;
  title_ar: string;
  biography_ar: string;
  biography_en: string;
  virtues: string[];
  period: string;
  death_year: number;
  notable_achievements: string[];
}

export const COMPANIONS: Companion[] = [
  {
    id: '1',
    name_ar: 'أبو بكر الصديق',
    name_en: 'Abu Bakr As-Siddiq',
    alias_ar: 'عبد الله بن عثمان',
    title_ar: 'الخليفة الراشدي الأول',
    biography_ar: 'أول الخلفاء الراشدين وأقرب الناس إلى رسول الله صلى الله عليه وسلم. آمن به في بداية دعوته وساعده بماله وجهده. أطلق عليه النبي لقب "الصديق".',
    biography_en: 'First of the Rightly Guided Caliphs and the closest to the Prophet Muhammad. He believed in him from the beginning and helped him with his wealth and effort.',
    virtues: ['الصدق', 'الإخلاص', 'الشجاعة', 'السخاء', 'الحكمة'],
    period: 'عهد النبي والخلافة',
    death_year: 13,
    notable_achievements: ['إسلامه مبكراً', 'الهجرة مع النبي', 'الخلافة الراشدة']
  },
  {
    id: '2',
    name_ar: 'عمر بن الخطاب',
    name_en: 'Umar ibn al-Khattab',
    alias_ar: 'عمر',
    title_ar: 'الخليفة الراشدي الثاني',
    biography_ar: 'الخليفة الثاني وملقب بـ "الفاروق" لأنه يفرق بين الحق والباطل. اسلم في السنة السادسة من البعثة. اشتهر بعدله وقوته.',
    biography_en: 'Second Caliph known as "Al-Farooq" (the Criterion) for distinguishing between truth and falsehood. He converted to Islam and became famous for his justice and strength.',
    virtues: ['العدل', 'الشجاعة', 'الحنكة السياسية', 'الورع', 'القوة'],
    period: 'عهد النبي والخلافة',
    death_year: 23,
    notable_achievements: ['الفتوحات الإسلامية الكبرى', 'العدل في الخلافة']
  },
  {
    id: '3',
    name_ar: 'علي بن أبي طالب',
    name_en: 'Ali ibn Abi Talib',
    alias_ar: 'علي',
    title_ar: 'الخليفة الراشدي الرابع',
    biography_ar: 'من أوائل من أسلموا وكاتب الوحي. اشتهر بشجاعته وعلمه. كان من أعظم المحاربين في الإسلام.',
    biography_en: 'One of the first converts and the scribe of the revelation. He is famous for his courage, knowledge and military prowess.',
    virtues: ['الشجاعة', 'العلم', 'العدل', 'الوفاء', 'الزهد'],
    period: 'عهد النبي والخلافة',
    death_year: 40,
    notable_achievements: ['كاتب الوحي', 'فاتح خيبر', 'الخليفة الراشدي']
  },
];

export interface Battle {
  id: string;
  name_ar: string;
  name_en: string;
  year_hijri: number;
  year_gregorian: number;
  location_ar: string;
  location_en: string;
  description_ar: string;
  description_en: string;
  outcome: 'victory' | 'tactical_retreat' | 'draw';
  muslim_forces: number;
  enemy_forces: number;
  significance: string[];
}

export const ISLAMIC_BATTLES: Battle[] = [
  {
    id: '1',
    name_ar: 'غزوة بدر',
    name_en: 'Battle of Badr',
    year_hijri: 2,
    year_gregorian: 624,
    location_ar: 'بدر (بين المدينة ومكة)',
    location_en: 'Badr (between Medina and Mecca)',
    description_ar: 'أول معركة كبرى في الإسلام بين المسلمين والمشركين. انتصر المسلمون رغم قلة عددهم. سميت "يوم الفرقان" لأنها فرقت بين الحق والباطل.',
    description_en: 'First major battle in Islam between Muslims and Meccan idolaters. Muslims won despite being outnumbered. Called "Day of the Criterion" as it distinguished truth from falsehood.',
    outcome: 'victory',
    muslim_forces: 313,
    enemy_forces: 1000,
    significance: ['أول انتصار إسلامي', 'تثبيت المؤمنين', 'رفع معنويات المسلمين']
  },
  {
    id: '2',
    name_ar: 'غزوة أحد',
    name_en: 'Battle of Uhud',
    year_hijri: 3,
    year_gregorian: 625,
    location_ar: 'أحد (بالقرب من المدينة)',
    location_en: 'Uhud (near Medina)',
    description_ar: 'معركة وقعت بعد بدر. حدثت خسارة للمسلمين بسبب معصية بعض الرماة. لكنها كانت درساً مهماً للمسلمين عن أهمية الطاعة والانضباط.',
    description_en: 'Battle that occurred after Badr. Muslims faced defeat due to disobedience of some archers. It was an important lesson about obedience and discipline.',
    outcome: 'tactical_retreat',
    muslim_forces: 700,
    enemy_forces: 3000,
    significance: ['درس الطاعة', 'شهادة أصحاب بدر', 'اختبار الإيمان']
  },
];
