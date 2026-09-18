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
  sources?: string[];
}

export const COMPANIONS: Companion[] = [
  {
    id: '1',
    name_ar: 'أبو بكر الصديق',
    name_en: 'Abu Bakr As-Siddiq',
    alias_ar: 'عبد الله بن عثمان',
    title_ar: 'الخليفة الراشدي الأول',
    biography_ar: 'أبو بكر الصديق رضي الله عنه من أقرب أصحاب رسول الله ﷺ إليه، وصحبه في الدعوة والهجرة، وكان معروفاً بالصدق والإنفاق ورجاحة العقل. كان من السابقين إلى الإسلام، وظل نصيراً للنبي ﷺ في المراحل المكية ثم في المدينة. ومن أعظم المواقف التي حفظتها السنة صحبته للنبي ﷺ في الهجرة، كما شهد المشاهد مع رسول الله ﷺ وأنفق من ماله في نصرة الدعوة. بعد وفاة النبي ﷺ واجه المسلمون صدمة عظيمة، فقام أبو بكر فذكّر الناس بحقيقة التوحيد وأن محمداً ﷺ رسول الله قد مضى إلى ربه وأن العبادة لله وحده. ثم تحمل مسؤولية الخلافة، وثبت في مواجهة الاضطراب والردة، وأدار المرحلة الأولى من الدولة الإسلامية بحزم وشورى. وتبرز سيرته في القدرة على الجمع بين الرحمة والثبات، وبين التواضع وتحمل المسؤولية، مع رجوع تفاصيل الفضائل والأحداث إلى كتب الحديث والسيرة المحققة.',
    biography_en: 'Abu Bakr As-Siddiq was among the closest companions of the Prophet ﷺ. He was known for truthfulness, generosity, sound judgment, and steadfast support of the early Muslim community. He accompanied the Prophet during the Hijrah and remained a major supporter throughout the Makkan and Madinan periods. After the Prophet’s death, Abu Bakr helped the community recover from the shock of loss, emphasizing worship of Allah alone and the continuation of the faith. As the first caliph, he faced severe political and religious instability and worked to preserve the unity of the Muslim community. His biography illustrates integrity under pressure, disciplined leadership, charity, and commitment to principle.',
    virtues: ['الصدق', 'الإخلاص', 'الشجاعة', 'السخاء', 'الحكمة', 'الثبات'],
    period: 'عهد النبي ﷺ والخلافة الراشدة',
    death_year: 13,
    notable_achievements: ['الإسلام المبكر', 'صحبة النبي ﷺ في الهجرة', 'الخلافة الراشدة', 'مواجهة حروب الردة', 'جمع القرآن في عهد الخلافة']
  },
  {
    id: '2',
    name_ar: 'عمر بن الخطاب',
    name_en: 'Umar ibn al-Khattab',
    alias_ar: 'عمر',
    title_ar: 'الخليفة الراشدي الثاني',
    biography_ar: 'عمر بن الخطاب رضي الله عنه ثاني الخلفاء الراشدين، ومن كبار أصحاب النبي ﷺ. عُرف بقوة الشخصية وشدة مراقبة الله والحرص على إقامة العدل. أسلم في مكة، وكان إسلامه سبباً في تقوية جماعة المسلمين، ثم لازم النبي ﷺ وشارك في أحداث العهد النبوي. تولى الخلافة بعد أبي بكر رضي الله عنه، فامتدت في عهده الدولة الإسلامية واتسعت الإدارة وتنظمت الدواوين، وبرزت عنايته بالقضاء والشورى ومحاسبة الولاة. وفي الروايات الصحيحة وردت فضائل كثيرة له، كما عُرف عنه الزهد والحرص على حقوق الرعية والخوف من التقصير. وتفيد دراسة سيرته في فهم معنى المسؤولية العامة، وكيف يمكن للقوة الشخصية أن تكون نافعة عندما تُضبط بالعدل والورع والمساءلة. وينبغي التفريق بين الأخبار الصحيحة وبين القصص الشعبية التي نسبت إليه عبر القرون.',
    biography_en: 'Umar ibn al-Khattab was the second Rightly Guided Caliph and one of the most prominent Companions. He was known for strength, justice, discipline, humility, and concern for accountability. His acceptance of Islam strengthened the Muslim community in Makkah. As caliph, he supervised a rapidly expanding state, organized administrative structures, emphasized consultation and judicial responsibility, and insisted that officials be accountable. Reports in the authentic Sunnah preserve many of his virtues and the Prophet’s praise for his character. His life is a useful study in principled leadership and public responsibility while historical details should be separated from later popular legends.',
    virtues: ['العدل', 'الشجاعة', 'الورع', 'القوة', 'الحكمة', 'المحاسبة'],
    period: 'عهد النبي ﷺ والخلافة الراشدة',
    death_year: 23,
    notable_achievements: ['إسلامه المبكر نسبياً', 'ملازمة النبي ﷺ', 'الخلافة الراشدة', 'تنظيم شؤون الدولة', 'العناية بالقضاء والشورى']
  },
  {
    id: '3',
    name_ar: 'علي بن أبي طالب',
    name_en: 'Ali ibn Abi Talib',
    alias_ar: 'أبو الحسن',
    title_ar: 'الخليفة الراشدي الرابع',
    biography_ar: 'علي بن أبي طالب رضي الله عنه ابن عم رسول الله ﷺ وزوج فاطمة رضي الله عنها، ومن السابقين إلى الإسلام. نشأ قريباً من النبي ﷺ، وشهد من مراحل الدعوة ما جعله من الشخصيات المركزية في التاريخ الإسلامي المبكر. عُرف بالشجاعة والعلم والفصاحة والوفاء، وشارك في عدد من المشاهد، ومن أشهر المواقف الثابتة فضله في خيبر. تولى الخلافة في مرحلة شديدة التعقيد بعد استشهاد عثمان رضي الله عنه، فواجه انقسامات داخلية وحروباً سياسية مؤلمة. وتحتاج دراسة عهده إلى قراءة هادئة للمصادر المبكرة، مع الابتعاد عن الروايات المتأخرة التي تضخم الخلافات أو تحولها إلى سرديات مذهبية. وتبقى منزلته عند أهل السنة مرتبطة بصحبته للنبي ﷺ، وفضله، وقرابته، وإسهامه في العلم والقضاء والشجاعة، مع احترام الصحابة جميعاً.',
    biography_en: 'Ali ibn Abi Talib was the Prophet’s cousin and the husband of Fatimah. He accepted Islam early, grew up close to the Prophet, and became known for courage, knowledge, eloquence, and loyalty. Authentic reports preserve notable virtues and his role in key events, including Khaybar. His caliphate began during a period of internal division and political conflict after the death of Uthman. Studying his life requires careful attention to early sources and caution around later sectarian narratives. His biography remains important for understanding the Prophet’s family, early Islamic leadership, scholarship, and the complexity of the first Muslim civil conflicts.',
    virtues: ['الشجاعة', 'العلم', 'العدل', 'الوفاء', 'الزهد', 'الفصاحة'],
    period: 'عهد النبي ﷺ والخلافة الراشدة',
    death_year: 40,
    notable_achievements: ['من السابقين إلى الإسلام', 'القرابة من النبي ﷺ', 'المشاركة في المشاهد', 'الخلافة الراشدة', 'رواية العلم والقضاء']
  },
  {
    id: '4',
    name_ar: 'عثمان بن عفان',
    name_en: 'Uthman ibn Affan',
    alias_ar: 'أبو عبد الله',
    title_ar: 'الخليفة الراشدي الثالث',
    biography_ar: 'عثمان بن عفان رضي الله عنه من السابقين إلى الإسلام، ومن أصحاب النبي ﷺ الذين عُرفوا بالحياء والكرم. تزوج ابنتي النبي ﷺ ولذلك لُقّب بذي النورين. هاجر هجرتين، وكان من أهل الشورى الذين اختار منهم عمر رضي الله عنه الخليفة من بعده. في خلافته توسعت الدولة وبرزت حاجات تنظيم المصاحف بسبب اتساع البلدان واختلاف وجوه القراءة بين الناس، فكان من عمله توحيد المصاحف الإمام وإرسال نسخ إلى الأمصار، وهو حدث مهم في تاريخ تدوين المصحف. كما عرف عثمان بكثرة الإنفاق في وجوه الخير. انتهت حياته في فتنة داخلية مؤلمة، ولذلك ينبغي عرض سيرته بعناية واحترام، مع التفريق بين الروايات الثابتة والأخبار التي أضيفت في مراحل لاحقة.',
    biography_en: 'Uthman ibn Affan was an early convert, a companion known for modesty and generosity, and the third Rightly Guided Caliph. He married two daughters of the Prophet, earning the title Dhun-Nurayn. He migrated and later became one of the members of the consultation council that selected the next caliph. During his rule, the rapidly expanding Muslim lands created a practical need to standardize written copies of the Quran, leading to the preparation and distribution of standardized codices. Uthman was also notable for charitable spending. His assassination became part of a painful period of internal conflict, making careful source criticism especially important when studying his biography.',
    virtues: ['الحياء', 'الكرم', 'الصبر', 'الإنفاق', 'الحلم', 'الثبات'],
    period: 'عهد النبي ﷺ والخلافة الراشدة',
    death_year: 35,
    notable_achievements: ['الهجرتان', 'ذي النورين', 'الشورى', 'توحيد المصاحف', 'الإنفاق في سبيل الله']
  },
  {
    id: '5',
    name_ar: 'خالد بن الوليد',
    name_en: 'Khalid ibn al-Walid',
    alias_ar: 'أبو سليمان',
    title_ar: 'سيف الله المسلول',
    biography_ar: 'خالد بن الوليد رضي الله عنه قائد عسكري بارز من الصحابة. أسلم قبل فتح مكة، ثم شارك بعد إسلامه في عدد من الوقائع، واشتهر بحسن التخطيط وسرعة تقدير الموقف والشجاعة. ارتبط اسمه بغزوة مؤتة، حيث تولى القيادة بعد استشهاد القادة الثلاثة المذكورين في الحديث، ثم شارك في جهاد الدولة الإسلامية في مراحل متعددة. وصفه النبي ﷺ بلقب سيف من سيوف الله في الحديث الصحيح، وهو تعبير عن أثره في نصرة المسلمين وليس مبرراً لتمجيد الحرب لذاتها. دراسة خالد مفيدة لفهم القيادة العسكرية في سياقها التاريخي، كما تذكّر بأهمية الطاعة والشورى وحفظ الأرواح وتقويم النتائج لا الاكتفاء بصورة البطولة الشعبية.',
    biography_en: 'Khalid ibn al-Walid was a prominent Companion and military commander. He accepted Islam before the conquest of Makkah and later played major roles in several campaigns. His leadership at Mu’tah followed the deaths of the appointed commanders, and authentic reports preserve the Prophet’s description of him among the swords of Allah. His biography offers a historical study of leadership, planning, courage, and adaptability while avoiding romanticizing warfare itself.',
    virtues: ['الشجاعة', 'القيادة', 'الحزم', 'سرعة البديهة', 'التواضع'],
    period: 'عهد النبي ﷺ والخلافة الراشدة',
    death_year: 21,
    notable_achievements: ['إسلامه قبل فتح مكة', 'القيادة في مؤتة', 'المشاركة في الفتوحات', 'القيادة العسكرية']
  },
  {
    id: '6',
    name_ar: 'بلال بن رباح',
    name_en: 'Bilal ibn Rabah',
    alias_ar: 'بلال الحبشي',
    title_ar: 'مؤذن رسول الله ﷺ',
    biography_ar: 'بلال بن رباح رضي الله عنه من أوائل من أسلم من المستضعفين، وعانى في مكة من التعذيب بسبب إيمانه. اشتراه أبو بكر الصديق رضي الله عنه وأعتقه، فصار بلال من أصحاب النبي ﷺ المقربين. عُرف بصبره وثباته، واشتهر بأنه كان مؤذن رسول الله ﷺ، فارتبط صوته بمشاهد العبادة في المدينة. شارك في عدد من الأحداث مع النبي ﷺ، وظل مثالاً على أن قيمة الإنسان في الإسلام لا تقوم على اللون أو الأصل أو المكانة الاجتماعية، وإنما على الإيمان والعمل الصالح. سيرته تصلح مادة تربوية مهمة للأطفال واليافعين حول الصبر والكرامة والعدل، مع التحقق من تفاصيل الأخبار المختلفة في كتب السيرة.',
    biography_en: 'Bilal ibn Rabah was among the early Muslims who endured severe persecution in Makkah. Abu Bakr freed him, and Bilal became a close companion of the Prophet and a famous mu’adhdhin. His life represents perseverance, dignity, equality, and faith under pressure. His biography is particularly useful for teaching young readers that social status, ethnicity, and wealth do not define a person’s worth in Islam.',
    virtues: ['الصبر', 'الثبات', 'الإخلاص', 'العبادة', 'الكرامة'],
    period: 'العهد المكي والمدني',
    death_year: 20,
    notable_achievements: ['الإسلام المبكر', 'العتق', 'الأذان للنبي ﷺ', 'المشاركة في المجتمع المدني']
  },
  {
    id: '7',
    name_ar: 'سلمان الفارسي',
    name_en: 'Salman al-Farisi',
    alias_ar: 'سلمان',
    title_ar: 'من أهل بيت النبي ﷺ في المحبة والفضل',
    biography_ar: 'سلمان الفارسي رضي الله عنه قصة طويلة من البحث عن الحق. نشأ في بلاد فارس، ومر بمراحل من الانتقال بين الأديان والمعلّمين حتى انتهى به الطريق إلى المدينة، وهناك لقي النبي ﷺ وأسلم. صار من أصحاب النبي ﷺ، واشتهر في غزوة الأحزاب بمشيرته بحفر الخندق حول المدينة، وهو تدبير عسكري ارتبط بظروف تلك المرحلة. كان سلمان معروفاً بالزهد والحكمة والبعد عن الترف، وعاش بعد النبي ﷺ زمناً ضمن المجتمع الإسلامي. قصته من أكثر السير مناسبة لعرض قيمة طلب العلم، والصبر على البحث، وعدم الاكتفاء بالموروث عند طلب اليقين. وتحتاج التفاصيل المتعلقة بمراحل حياته المبكرة إلى مراجعة المصادر الحديثية والسيرية وعدم مساواة جميع الروايات في القوة.',
    biography_en: 'Salman al-Farisi’s story centers on a long search for truth. Born in Persia, he passed through different teachers and religious communities before reaching Madinah and meeting the Prophet, then embracing Islam. He became known for wisdom and asceticism, and his suggestion to dig a trench around Madinah during the Confederates was a famous strategic contribution. His biography is especially valuable for teaching persistence, learning, humility, and sincere search for truth.',
    virtues: ['طلب الحق', 'الحكمة', 'الزهد', 'الصبر', 'التواضع'],
    period: 'العهد المدني وما بعده',
    death_year: 36,
    notable_achievements: ['البحث عن الحق', 'الإسلام في المدينة', 'المشورة في غزوة الأحزاب', 'الزهد والحكمة']
  },
  {
    id: '8',
    name_ar: 'عبد الله بن عباس',
    name_en: 'Abdullah ibn Abbas',
    alias_ar: 'ابن عباس',
    title_ar: 'ترجمان القرآن',
    biography_ar: 'عبد الله بن عباس رضي الله عنهما ابن عم النبي ﷺ، وكان من صغار الصحابة الذين عُرفوا بطلب العلم. دعا له النبي ﷺ بالفقه في الدين وبعلم الكتاب كما ورد في الأحاديث المشهورة، ثم نشأ علمه واتسعت روايته وتفسيره للقرآن. بعد وفاة النبي ﷺ ظل مرجعاً في العلم، فقصده الناس للسؤال في التفسير والفقه والحديث. تكشف سيرته أهمية ملازمة العلماء، والسؤال، والمراجعة، والجمع بين حفظ النص وفهمه. وعند دراسة تفسير ابن عباس ينبغي التمييز بين ما صح عنه في الرواية وما دخل كتب التفسير من أخبار لا تثبت، لأن نسبة الأقوال إلى الصحابة تحتاج إلى نقد للأسانيد. لذلك تقدم سيرته نموذجاً للعلم المبكر مع التأكيد على منهج التثبت.',
    biography_en: 'Abdullah ibn Abbas was the Prophet’s cousin and one of the younger Companions known for learning and transmission. Prophetic supplications for his understanding of religion and the Quran are recorded in hadith. He later became a major reference in tafsir, fiqh, and hadith. His biography emphasizes asking questions, disciplined learning, and verifying attributions, especially because many later tafsir reports are not equally authentic.',
    virtues: ['العلم', 'التعلم', 'الفهم', 'التواضع', 'حفظ السنة'],
    period: 'العهد المدني وما بعده',
    death_year: 68,
    notable_achievements: ['رواية الحديث', 'التفسير', 'الفقه', 'التعليم', 'المرجعية العلمية']
  },
  {
    id: '9',
    name_ar: 'أبو هريرة',
    name_en: 'Abu Hurayrah',
    alias_ar: 'عبد الرحمن بن صخر الدوسي',
    title_ar: 'راوية الحديث',
    biography_ar: 'أبو هريرة رضي الله عنه من أكثر الصحابة رواية للحديث. قدم إلى المدينة وأسلم في أواخر حياة النبي ﷺ، ولازم النبي ﷺ وحرص على الحفظ والتعلم، فكان من المكثرين في الرواية. لم تكن كثرة روايته تعني حفظ النصوص دون فهم؛ فقد نقلت عنه مسائل في العبادة والآداب والمعاملات، وأصبح من الشخصيات الرئيسة في نقل السنة إلى الأجيال اللاحقة. ومن المفيد تربوياً دراسة سيرته لفهم قيمة استثمار الوقت في طلب العلم، والحرص على الصحبة، وقوة الذاكرة مع المراجعة. كما ينبغي عند دراسة مروياته الرجوع إلى كتب الحديث وأحكام المحدثين، لا إلى القوائم غير الموثقة المنتشرة في الشبكات الاجتماعية.',
    biography_en: 'Abu Hurayrah is one of the most prolific narrators of Prophetic hadith. He embraced Islam late in the Prophet’s life, stayed close to him, and devoted himself to learning and preservation. His large body of transmitted reports became important for later generations. His biography illustrates the value of focused learning and careful transmission, while individual narrations should always be evaluated through the hadith collections and scholarly grading.',
    virtues: ['حفظ الحديث', 'الملازمة', 'التعلم', 'الحرص على السنة', 'العبادة'],
    period: 'العهد المدني وما بعده',
    death_year: 59,
    notable_achievements: ['رواية الحديث', 'ملازمة النبي ﷺ', 'التعليم', 'نقل السنة']
  },
  {
    id: '10',
    name_ar: 'سعد بن أبي وقاص',
    name_en: 'Saad ibn Abi Waqqas',
    alias_ar: 'سعد',
    title_ar: 'من السابقين وأحد قادة المسلمين',
    biography_ar: 'سعد بن أبي وقاص رضي الله عنه من السابقين إلى الإسلام، وكان من أصحاب النبي ﷺ المعروفين بالشجاعة والعبادة. شارك في المشاهد، وكان له حضور في فترات لاحقة من تاريخ الدولة الإسلامية، وتولى قيادة المسلمين في القادسية في عهد عمر بن الخطاب رضي الله عنه بحسب المصادر التاريخية المشهورة. ومع ذلك فإن عرض سيرته ينبغي أن يوازن بين الروايات الحديثية والأخبار التاريخية، وألا يحول الشخص إلى صورة عسكرية فقط؛ فقد كان من أهل العبادة والدعاء والاستقامة. دراسة سعد تعطي مثالاً على اجتماع الشجاعة مع التقوى، وعلى أثر الإنسان في مجاله دون اختزال حياته كلها في معركة أو منصب.',
    biography_en: 'Saad ibn Abi Waqqas was an early convert and a companion known for courage, worship, and steadfastness. He participated in major events during the Prophetic period and later held important leadership roles, including command at al-Qadisiyyah in historical accounts. His story should not be reduced to military history; it also reflects devotion, prayer, and responsibility. The distinction between hadith reports and later historical narratives is important when studying his life.',
    virtues: ['الشجاعة', 'العبادة', 'الدعاء', 'الثبات', 'المسؤولية'],
    period: 'العهد المكي والمدني والخلافة الراشدة',
    death_year: 55,
    notable_achievements: ['الإسلام المبكر', 'المشاركة في المشاهد', 'القيادة في القادسية', 'الشورى']
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
    description_ar: 'غزوة بدر من أهم الوقائع في السيرة النبوية، وقد وصف القرآن يومها بالفرقان وذكّر بنصر الله للمؤمنين. درستها كتب السيرة من جوانبها السياسية والعسكرية والتربوية، وتبقى تفاصيل الأعداد والحركة الميدانية محل رجوع إلى الروايات الحديثية والتاريخية المتعددة.',
    description_en: 'The Battle of Badr is a major event in the Prophetic biography. The Quran refers to the day as a decisive criterion and highlights divine support. Historical study benefits from comparing hadith and early sira accounts rather than relying on simplified numerical summaries.',
    outcome: 'victory',
    muslim_forces: 313,
    enemy_forces: 1000,
    significance: ['يوم الفرقان', 'تثبيت المؤمنين', 'دروس في الطاعة والشورى']
  },
  {
    id: '2',
    name_ar: 'غزوة أحد',
    name_en: 'Battle of Uhud',
    year_hijri: 3,
    year_gregorian: 625,
    location_ar: 'أحد (بالقرب من المدينة)',
    location_en: 'Uhud (near Medina)',
    description_ar: 'غزوة أحد من أكثر أحداث السيرة ارتباطاً بالتربية القرآنية. تناولت سورة آل عمران جوانب من أحداثها، ومنها أثر الطاعة والانضباط والرجوع إلى الله بعد الابتلاء. وهي مناسبة لدراسة القيادة والمشورة والنتائج غير المتوقعة في المعارك.',
    description_en: 'Uhud is deeply connected with Quranic moral instruction. Surah Al Imran discusses lessons from the event, including obedience, discipline, perseverance, and returning to Allah after hardship.',
    outcome: 'tactical_retreat',
    muslim_forces: 700,
    enemy_forces: 3000,
    significance: ['درس الطاعة', 'الابتلاء', 'الصبر', 'المراجعة بعد الخطأ']
  },
];
