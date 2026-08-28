export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/site";
import {
  ContentReferences,
  getContentReferences,
} from "@/components/content/content-references";

interface ProphetSection {
  id: string;
  title_ar: string;
  title_en?: string;
  content_ar: string;
  content_en?: string;
  section_type?: string;
  order_num?: number;
}

interface Prophet {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  bio_ar: string | null;
  bio_en: string | null;
  birth_place_ar: string | null;
  death_place_ar: string | null;
  featured_image_url: string | null;
  thumbnail_url: string | null;
  metadata: Record<string, string> | null;
  order_num: number | null;
}

const LEGACY_PROPHET_SLUG_REDIRECTS: Record<string, string> = {
  "dhul-kifl": "dhulkifl",
  zakariyya: "zakariya",
};

// Static full prophet stories — shown when DB has no data yet
const PROPHET_STORIES: Record<
  string,
  {
    name_ar: string;
    name_en: string;
    order_num: number;
    birth_place_ar: string;
    death_place_ar: string;
    quran_mentions: number;
    bio_ar: string;
    youtube_video_id?: string;
    sections: { title_ar: string; section_type: string; content_ar: string }[];
  }
> = {
  adam: {
    name_ar: "آدم عليه السلام",
    name_en: "Adam",
    order_num: 1,
    birth_place_ar: "الجنة",
    death_place_ar: "الأرض",
    quran_mentions: 25,
    bio_ar:
      "أبو البشر وأول الأنبياء والمرسلين، خلقه الله بيده من طين ونفخ فيه الروح وعلّمه الأسماء كلها.",
    sections: [
      {
        title_ar: "الخلق والتكريم",
        section_type: "story",
        content_ar:
          "قال الله تعالى: ﴿وَإِذْ قَالَ رَبُّكَ لِلْمَلَائِكَةِ إِنِّي جَاعِلٌ فِي الْأَرْضِ خَلِيفَةً﴾. خلق الله آدم عليه السلام من طين الأرض، ثم نفخ فيه من روحه، فأصبح إنساناً حياً. وأمر الله الملائكة بالسجود لآدم تكريماً له، فسجدوا جميعاً إلا إبليس الذي أبى واستكبر، فكان من الكافرين.\n\nوعلّم الله آدم الأسماء كلها، ثم عرضهم على الملائكة فقال: أنبئوني بأسماء هؤلاء إن كنتم صادقين. فقالوا: سبحانك لا علم لنا إلا ما علّمتنا إنك أنت العليم الحكيم. فأنبأهم آدم بأسمائهم، فقال الله: ألم أقل لكم إني أعلم غيب السماوات والأرض.",
      },
      {
        title_ar: "الجنة والابتلاء",
        section_type: "story",
        content_ar:
          "أسكن الله آدم وزوجته حواء في الجنة، وأباح لهما الأكل من كل شيء فيها إلا شجرة واحدة. قال الله تعالى: ﴿وَقُلْنَا يَا آدَمُ اسْكُنْ أَنتَ وَزَوْجُكَ الْجَنَّةَ وَكُلَا مِنْهَا رَغَدًا حَيْثُ شِئْتُمَا وَلَا تَقْرَبَا هَذِهِ الشَّجَرَةَ فَتَكُونَا مِنَ الظَّالِمِينَ﴾.\n\nلكن إبليس وسوس لهما وأقسم لهما أنه ناصح لهما، فأكلا من الشجرة المنهية، فتكشّفت عوراتهما، وبدأ طفقا يخصفان عليهما من ورق الجنة. وأهبطهما الله إلى الأرض.",
      },
      {
        title_ar: "التوبة والخلافة في الأرض",
        section_type: "story",
        content_ar:
          "لما أهبط الله آدم وحواء إلى الأرض، تاب آدم وأناب إلى ربه. قال الله تعالى: ﴿فَتَلَقَّى آدَمُ مِن رَّبِّهِ كَلِمَاتٍ فَتَابَ عَلَيْهِ إِنَّهُ هُوَ التَّوَّابُ الرَّحِيمُ﴾.\n\nوبدأت الحياة البشرية على الأرض. ولد لآدم وحواء أبناء وبنات، وبدأت البشرية تتكاثر وتنتشر في أرجاء الأرض. كان آدم عليه السلام يعلّم بنيه توحيد الله وعبادته وحده لا شريك له.\n\nعاش آدم عليه السلام مدة طويلة على الأرض قيل إنها بلغت ألف سنة، وكان يأمر بنيه بالتوحيد وينهاهم عن الشرك. وعند وفاته نزلت الملائكة لتحنيطه وتغسيله ودفنه، وقالت: هذه سنتكم يا بني آدم في موتاكم.",
      },
      {
        title_ar: "الدروس والعبر",
        section_type: "lesson",
        content_ar:
          "1. التوبة والرجوع إلى الله من أعظم الأعمال — فآدم الذي أخطأ ثم تاب غُفر له.\n2. إبليس نموذج الكبر والعصيان — أبى السجود استكباراً فكان من المطرودين.\n3. الإنسان خليفة الله في الأرض — مكلّف بعمارتها وإصلاحها.\n4. الفطرة الإنسانية تميل للمعصية، لكن التوبة تمحوها وترفع الدرجات.\n5. العلم شرف الإنسان — علّم الله آدم الأسماء كلها تمييزاً له عن سائر المخلوقات.",
      },
    ],
  },
  nuh: {
    name_ar: "نوح عليه السلام",
    name_en: "Noah",
    order_num: 3,
    birth_place_ar: "بلاد الرافدين",
    death_place_ar: "الأرض",
    quran_mentions: 43,
    bio_ar:
      "أُرسل إلى البشرية بعد انتشار الشرك. دعا قومه 950 سنة إلا خمسين عاماً، وبنى السفينة بأمر الله لإنجاء المؤمنين من الطوفان. يُلقَّب بشيخ الأنبياء.",
    sections: [
      {
        title_ar: "الدعوة والصبر الطويل",
        section_type: "story",
        content_ar:
          "بعث الله نوحاً عليه السلام إلى قومه بعد أن انتشر الشرك بعد آدم، حين عبدوا الأصنام: وداً وسواعاً ويغوث ويعوق ونسراً. دعاهم نوح إلى توحيد الله ليلاً ونهاراً، سراً وجهاراً، قرابة عشرة قرون من الزمان.\n\nقال تعالى حاكياً دعاءه: ﴿قَالَ رَبِّ إِنِّي دَعَوْتُ قَوْمِي لَيْلًا وَنَهَارًا • فَلَمْ يَزِدْهُمْ دُعَائِي إِلَّا فِرَارًا﴾. وكلما دعاهم جعلوا أصابعهم في آذانهم واستغشوا ثيابهم وأصرّوا واستكبروا استكباراً. لم يؤمن معه إلا قليل.",
      },
      {
        title_ar: "بناء السفينة",
        section_type: "story",
        content_ar:
          "لما يئس نوح من إيمان قومه دعا عليهم، فأوحى الله إليه أنه لن يؤمن من قومك إلا من قد آمن. وأمره الله ببناء سفينة عظيمة، قال تعالى: ﴿وَاصْنَعِ الْفُلْكَ بِأَعْيُنِنَا وَوَحْيِنَا﴾.\n\nراح نوح عليه السلام يبني السفينة في مكان بعيد عن الماء، وكان كلما مرّ به رؤساء قومه سخروا منه وضحكوا، فيقول لهم: إن تسخروا منا فإنا نسخر منكم كما تسخرون. واستغرق بناء السفينة سنوات طويلة حتى اكتملت.",
      },
      {
        title_ar: "الطوفان والنجاة",
        section_type: "story",
        content_ar:
          "جاء أمر الله وفار التنور علامة على بدء الطوفان. قال الله: ﴿حَتَّىٰ إِذَا جَاءَ أَمْرُنَا وَفَارَ التَّنُّورُ قُلْنَا احْمِلْ فِيهَا مِن كُلٍّ زَوْجَيْنِ اثْنَيْنِ وَأَهْلَكَ﴾. حمل نوح في السفينة زوجاً من كل حيوان، ومن آمن معه، وكانوا قلة.\n\nناشد نوح ابنه أن يركب معه فأبى، وقال سآوي إلى جبل يعصمني من الماء. فقال له نوح: لا عاصم اليوم من أمر الله إلا من رحم. وطغى الماء وغرق الجميع إلا من كان في السفينة.\n\nثم أمر الله السماء أن تُقلع عن المطر والأرض أن تبلع ماءها، فاستوت السفينة على الجودي — جبل في تركيا — وأنجى الله نوحاً والمؤمنين.",
      },
      {
        title_ar: "الدروس والعبر",
        section_type: "lesson",
        content_ar:
          "1. الصبر على الدعوة — نوح دعا 950 سنة ولم ييأس حتى أذن الله له.\n2. الثقة بوعد الله — الله ناصر المؤمنين مهما طال الزمان.\n3. رابطة الإيمان فوق رابطة الدم — ابن نوح غرق لأنه كفر.\n4. الاستعداد للبلاء — بنى السفينة وهو بعيد عن الماء ثقة بأمر الله.\n5. إجابة دعاء المظلوم — دعاء نوح على قومه كان محاطاً بالقبول.",
      },
    ],
  },
  ibrahim: {
    name_ar: "إبراهيم عليه السلام",
    name_en: "Ibrahim",
    order_num: 6,
    birth_place_ar: "أور — بلاد الرافدين (العراق)",
    death_place_ar: "فلسطين",
    quran_mentions: 69,
    bio_ar:
      "خليل الله ومحطّم الأصنام، بنى الكعبة مع ابنه إسماعيل. ألقاه قومه في النار فجعلها الله برداً وسلاماً. يُلقَّب بأبي الأنبياء وإمام الموحّدين.",
    sections: [
      {
        title_ar: "الطفولة والبحث عن الحق",
        section_type: "story",
        content_ar:
          "نشأ إبراهيم في بيئة تعبد الأصنام، وكان أبوه آزر يصنعها ويبيعها. لكن إبراهيم منذ صغره كان يتفكر في الكون ويبحث عن الخالق الحقيقي. رأى الكوكب فظنه ربه ثم أفل، ورأى القمر بازغاً فأُعجب به ثم أفل، ورأى الشمس أكبر فلما أفلت قال: ﴿إِنِّي وَجَّهْتُ وَجْهِيَ لِلَّذِي فَطَرَ السَّمَاوَاتِ وَالْأَرْضَ حَنِيفًا وَمَا أَنَا مِنَ الْمُشْرِكِينَ﴾.",
      },
      {
        title_ar: "تحطيم الأصنام",
        section_type: "story",
        content_ar:
          "لما خرج قوم إبراهيم إلى عيدهم، ذهب إبراهيم إلى معبد الأصنام وأخذ الفأس وكسر الأصنام كلها وترك الصنم الكبير سليماً وعلّق الفأس في رقبته. فلما رجع القوم ووجدوا الأصنام مكسّرة قالوا من فعل هذا بآلهتنا؟ قالوا سمعنا فتى يقال له إبراهيم. قال إبراهيم: بل فعله كبيرهم هذا فاسألوهم إن كانوا ينطقون. فرجعوا إلى أنفسهم وقالوا إنكم أنتم الظالمون.",
      },
      {
        title_ar: "النار التي لم تحرق",
        section_type: "miracle",
        content_ar:
          "قرّر الكافرون إحراق إبراهيم. جمعوا حطباً كثيراً وأشعلوا ناراً عظيمة، وبنوا منجنيقاً رموا به إبراهيم إلى النار. فلما وقع في النار قال: حسبي الله ونعم الوكيل. قال الله تعالى: ﴿قُلْنَا يَا نَارُ كُونِي بَرْدًا وَسَلَامًا عَلَىٰ إِبْرَاهِيمَ﴾. فلم تحرق النار إلا قيوده وخرج سالماً، فأدرك الذين أرادوا إحراقه أن لا حيلة لهم أمام قوة الله.",
      },
      {
        title_ar: "الهجرة وبناء الكعبة",
        section_type: "story",
        content_ar:
          "هاجر إبراهيم بزوجته سارة، ثم أنجبت هاجر منه إسماعيل. تركهما إبراهيم في وادٍ غير ذي زرع عند موضع الكعبة بأمر الله. لما كبر إسماعيل جاء إبراهيم ليرى ابنه، وأوحى إليه الله ببناء الكعبة فقاما يبنيانها معاً. قال الله: ﴿وَإِذْ يَرْفَعُ إِبْرَاهِيمُ الْقَوَاعِدَ مِنَ الْبَيْتِ وَإِسْمَاعِيلُ رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ﴾.",
      },
      {
        title_ar: "الفداء العظيم",
        section_type: "miracle",
        content_ar:
          "رأى إبراهيم في المنام أنه يذبح ابنه إسماعيل. فأخبر ابنه بما رأى، فقال إسماعيل: يا أبت افعل ما تُؤمر ستجدني إن شاء الله من الصابرين. فلما أسلما وتلّه للجبين، نادى الله إبراهيم: يا إبراهيم قد صدّقت الرؤيا إنا كذلك نجزي المحسنين. وفداه الله بكبش عظيم من الجنة. قال تعالى: ﴿وَفَدَيْنَاهُ بِذِبْحٍ عَظِيمٍ﴾.",
      },
      {
        title_ar: "الدروس والعبر",
        section_type: "lesson",
        content_ar:
          "1. التفكر والبحث عن الحق سمة المؤمن الحق — إبراهيم وصل إلى التوحيد بعقله أولاً.\n2. الشجاعة في مواجهة الباطل — تحطيم الأصنام وحده أمام آلاف الكافرين.\n3. التوكل على الله يُذهب الخوف — النار لم تحرقه لأنه قال حسبي الله.\n4. التضحية بأغلى ما نملك — فداء الابن اختبار للإيمان الحق.\n5. مفهوم الأسوة الحسنة — الله وصفه بـ﴿إِنَّ إِبْرَاهِيمَ كَانَ أُمَّةً﴾.",
      },
    ],
  },
  musa: {
    name_ar: "موسى عليه السلام",
    name_en: "Moses",
    order_num: 15,
    birth_place_ar: "مصر",
    death_place_ar: "أرض التيه — شبه جزيرة سيناء",
    quran_mentions: 136,
    bio_ar:
      "أكثر الأنبياء ذكراً في القرآن الكريم. كلّمه الله تكليماً مباشراً من وراء حجاب. أنقذ بني إسرائيل من فرعون وفلق البحر بعصاه بإذن الله. أُعطي التوراة وكان مرجعاً وقائداً لبني إسرائيل.",
    sections: [
      {
        title_ar: "الولادة والنشأة في قصر فرعون",
        section_type: "story",
        content_ar:
          "أمر فرعون بذبح كل مولود من بني إسرائيل خوفاً من ظهور من يزيل ملكه. فأوحى الله لأم موسى أن ترضعيه فإذا خفتِ عليه فألقيه في اليم. ألقته أمه في صندوق في نهر النيل، فجرى الصندوق حتى وصل إلى قصر فرعون نفسه. التقطته امرأة فرعون وأحبته، وقالت: لا تقتلوه عسى أن ينفعنا أو نتخذه ولداً.\n\nرفضت موسى أن يرضع من أي امرأة، فجاءت أخته بأمه فأرضعته، وعادت إليه أمه في قصر فرعون، قال تعالى: ﴿فَرَدَدْنَاهُ إِلَىٰ أُمِّهِ كَيْ تَقَرَّ عَيْنُهَا وَلَا تَحْزَنَ﴾.",
      },
      {
        title_ar: "الفرار إلى مدين والرسالة",
        section_type: "story",
        content_ar:
          "قتل موسى رجلاً من آل فرعون بلكمة خطأً دفاعاً عن رجل من بني إسرائيل، فخشي القصاص وفرّ إلى مدين. هناك سقى لبنتين وجدهما تذودان عن غنمهما، فزوّجه شعيب أحد بنتيه ومكث عنده عشر سنين.\n\nثم سار بأهله فرأى ناراً على جانب الطور، فذهب إليها فناداه الله: ﴿يَا مُوسَىٰ إِنَّهُ أَنَا ال��َّهُ رَبُّ الْعَالَمِينَ﴾. وأعطاه معجزة العصا التي تنقلب حية، ويده البيضاء كالقمر، وأرسله إلى فرعون.",
      },
      {
        title_ar: "مواجهة فرعون",
        section_type: "story",
        content_ar:
          "ذهب موسى وأخوه هارون إلى فرعون وقالا: إنا رسولا ربك فأرسل معنا بني إسرائيل ولا تعذبهم. فقال فرعون: ما ربكم يا موسى؟ فقال موسى: ﴿رَبُّنَا الَّذِي أَعْطَىٰ كُلَّ شَيْءٍ خَلْقَهُ ثُمَّ هَدَىٰ﴾.\n\nتحدّى فرعون موسى بالسحرة، فجاء السحرة بحبالهم وعصيّهم وقالوا هي حيّات في أعين الناس. فألقى موسى عصاه فابتلعت جميع ما صنعوا. فألقى السحرة ساجدين: آمنا برب موسى وهارون. فغضب فرعون وتوعد السحرة، فقالوا لا ضير إنا إلى ربنا منقلبون.",
      },
      {
        title_ar: "فلق البحر والنجاة",
        section_type: "miracle",
        content_ar:
          "خرج موسى ببني إسرائيل ليلاً بأمر الله. فأرسل فرعون في الأثر جيوشاً عظيمة. لما أدرك الجيش بني إسرائيل عند البحر، قال قوم موسى: إنا لمُدركون. قال موسى: كلا إن معي ربي سيهدين.\n\nأوحى الله إلى موسى أن اضرب بعصاك البحر، فانفلق البحر اثني عشر طريقاً يابساً بين جدران من الماء. عبر بنو إسرائيل جميعاً، ولما تتبّعهم فرعون وجنوده أمر الله البحر أن يلتطم عليهم فغرقوا جميعاً. قال تعالى: ﴿فَأَغْرَقْنَاهُمْ أَجْمَعِينَ﴾.",
      },
      {
        title_ar: "التوراة ولقاء الله",
        section_type: "story",
        content_ar:
          "أوحى الله إلى موسى أن يأتي للطور ليكلمه، فذهب موسى وترك قومه مع أخيه هارون. كلّمه الله تكليماً وأعطاه التوراة. ولما رجع وجد قومه يعبدون العجل الذي صنعه لهم السامري. فغضب موسى غضباً شديداً وألقى الألواح وأخذ بلحية أخيه، ثم استغفر الله وأعاد الألواح.",
      },
      {
        title_ar: "الدروس والعبر",
        section_type: "lesson",
        content_ar:
          "1. الثقة بنصر الله — في أحلك اللحظات قال موسى: إن معي ربي سيهدين.\n2. الصبر على الطغيان — واجه فرعون الذي ادّعى الألوهية بالحكمة والدليل.\n3. الدعاء والتوكل — كلما ضاق موسى دعا ربه فانفرج.\n4. المسؤولية القيادية — تحمّل مسؤولية بني إسرائيل وصبر على جهلهم.\n5. الكلام المباشر مع الله — تكريم عظيم لموسى الكليم.",
      },
    ],
  },
  yusuf: {
    name_ar: "يوسف عليه السلام",
    name_en: "Joseph",
    order_num: 11,
    birth_place_ar: "كنعان — فلسطين",
    death_place_ar: "مصر",
    quran_mentions: 27,
    bio_ar:
      "نبي الله صاحب أحسن القصص في القرآن. صبر على كيد إخوته وعزيز مصر والسجن حتى مكّنه الله في الأرض وجعله على خزائنها.",
    sections: [
      {
        title_ar: "الرؤيا والحسد",
        section_type: "story",
        content_ar:
          "رأى يوسف في المنام أحد عشر كوكباً والشمس والقمر ساجدين له. قصّ الرؤيا على أبيه يعقوب فقال له: يا بني لا تقصص رؤياك على إخوتك فيكيدوا لك كيداً. إن الشيطان للإنسان عدو مبين. وقد فضّل الله يوسف بالحسن والعلم والنبوة.",
      },
      {
        title_ar: "الجب والبيع",
        section_type: "story",
        content_ar:
          "اتفق إخوة يوسف على إلقائه في البئر. أخذوه من أبيه بحجة اللهو والرعي، وألقوه في جب بعيد، ثم جاؤوا أباهم ليلاً يبكون وقالوا: أكله الذئب، وألقوا قميصه بدم كذب. جلس يوسف في الجب ينتظر الفرج.\n\nجاءت قافلة تجارية فأنزلوا دلوهم فتعلق بها يوسف، وأخذوه وباعوه في مصر بثمن بخس.",
      },
      {
        title_ar: "الابتلاء في مصر",
        section_type: "story",
        content_ar:
          "اشترى يوسف عزيز مصر وأكرمه في بيته. لكن امرأة العزيز راودته عن نفسه، فاستعصم واستجار بالله. حين رأى العزيز قميص يوسف قُدّ من دُبر علم أن يوسف بريء. لكن النساء تحدثن في المدينة، فأرادت امرأة العزيز أن تسكتهن فأظهرت يوسف لهن، فلما رأينه أكبرنه وقطّعن أيديهن من جماله وقلن: حاش لله ما هذا بشراً إن هذا إلا ملك كريم.",
      },
      {
        title_ar: "السجن والخروج",
        section_type: "story",
        content_ar:
          "آثر يوسف السجن على الفاحشة. في السجن دعا رفاقه إلى التوحيد وفسّر رؤياهم. لما خرج ساقي الملك نسي يوسف سنوات. ثم رأى الملك رؤيا: سبع بقرات سمان يأكلهن سبع عجاف، وسبع سنبلات خضر وأخر يابسات. فسّر يوسف الرؤيا بسبع سنوات رخاء ثم سبع عجاف ثم عام يغاث فيه الناس، فأُخرج من السجن وعُيِّن على خزائن مصر.",
      },
      {
        title_ar: "لقاء الإخوة والعفو العظيم",
        section_type: "story",
        content_ar:
          "جاء إخوة يوسف إلى مصر يلتمسون الغذاء في سنوات القحط. عرفهم يوسف ولم يعرفوه. طلب أن يأتوا بأخيه الصغير بنيامين في المرة القادمة. لما اعتقلوا في فتنة الصاع قالوا: إن يسرق فقد سرق أخ له من قبل — يعنون يوسف. وقف يوسف لا يستطيع كتم نفسه أكثر، فقال: أنا يوسف وهذا أخي.\n\nقال يوسف: ﴿قَالَ لَا تَثْرِيبَ عَلَيْكُمُ الْيَوْمَ يَغْفِرُ اللَّهُ لَكُمْ وَهُوَ أَرْحَمُ الرَّاحِمِينَ﴾. وأحضر أباه وأمه ورأى رؤياه تتحقق: ﴿وَرَفَعَ أَبَوَيْهِ عَلَى الْعَرْشِ وَخَرُّوا لَهُ سُجَّدًا﴾.",
      },
      {
        title_ar: "الدروس والعبر",
        section_type: "lesson",
        content_ar:
          "1. الصبر الجميل — صبر يوسف على الجب والعبودية والسجن حتى جاء الفرج.\n2. العفة والاستعصام — أعظم منجزاته رفض الفاحشة وإن كلفه السجن.\n3. العفو عند المقدرة — أعظم مشهد في القرآن حين عفا عن إخوته.\n4. تأويل الأحلام نعمة من الله — استخدمها لإنقاذ مصر من المجاعة.\n5. ما قُدِّر كان — كل ما مرّ به كان طريقاً لتحقق رؤياه.",
      },
    ],
  },
  muhammad: {
    name_ar: "محمد صلى الله عليه وسلم",
    name_en: "Muhammad",
    order_num: 25,
    birth_place_ar: "مكة المكرمة — 571م عام الفيل",
    death_place_ar: "المدينة المنورة — 11هـ / 632م",
    quran_mentions: 4,
    bio_ar:
      "خاتم الأنبياء والمرسلين وأفضل خلق الله. بعثه الله رحمة للعالمين. أُسري به إلى السماوات السبع وعُرج به وكُلِّف بالصلوات الخمس. نشر الإسلام في 23 سنة وغيّر مسار البشرية.",
    sections: [
      {
        title_ar: "الولادة والنشأة",
        section_type: "story",
        content_ar:
          "وُلد النبي محمد ﷺ في مكة المكرمة عام 571م المعروف بعام الفيل، حين حاول أبرهة الحبشي هدم الكعبة فأهلكه الله بطير الأبابيل. وُلد يتيماً — مات أبوه عبدالله قبل ولادته — ثم ماتت أمه آمنة وهو في السادسة، فكفله جده عبدالمطلب ثم عمه أبو طالب.\n\nعُرف في مكة بالصادق الأمين، وقبل البعثة بسنوات كان يختلي بغار حراء للتفكر والتعبد.",
      },
      {
        title_ar: "البعثة والوحي الأول",
        section_type: "story",
        content_ar:
          "في رمضان من عام 610م، وهو في غار حراء، جاءه جبريل عليه السلام وقال: اقرأ. فقال: ما أنا بقارئ. فضمّه جبريل ضمات ثلاثاً ثم قال: ﴿اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ﴾. نزل النبي من الجبل مرتجفاً، فطمأنته زوجته خديجة وذهبت به إلى ابن عمها ورقة بن نوفل الذي أخبره أنه النبي المنتظر.",
      },
      {
        title_ar: "الدعوة السرية والجهر",
        section_type: "story",
        content_ar:
          "بدأت الدعوة سرية ثلاث سنوات، فأسلم خديجة وعلي وأبو بكر الصديق وزيد بن حارثة. ثم جاء الأمر الإلهي: ﴿فَاصْدَعْ بِمَا تُؤْمَرُ﴾. فصعد النبي الصفا ونادى قريشاً وأعلن الإسلام علناً.\n\nتعرّض المسلمون لأشد أنواع التعذيب — بلال الحبشي على الرمال الحارة، وآل ياسر يُعذَّبون حتى الموت. وصمد النبي وأصحابه صمود الجبال لسبع سنوات من الأذى.",
      },
      {
        title_ar: "الهجرة إلى المدينة",
        section_type: "story",
        content_ar:
          "لما اشتدت قريش في إيذاء المسلمين، أذن الله بالهجرة إلى المدينة المنورة — يثرب. خرج النبي وصاحبه أبو بكر ليلاً واختبأا في غار ثور ثلاثة أيام. وصل المشركون إلى باب الغار، فقال أبو بكر: يا رسول الله لو نظر أحدهم إلى قدميه لرآنا. فقال النبي: ﴿لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا﴾.\n\nوصل النبي إلى المدينة فاستقبله الأنصار استقبالاً لم يحظ به ملك، وبنى المسجد النبوي وآخى بين المهاجرين والأنصار.",
      },
      {
        title_ar: "الغزوات والانتصارات",
        section_type: "story",
        content_ar:
          'خاض النبي ﷺ غزوات كثيرة. في بدر الكبرى انتصر 313 مؤمناً على جيش قريش الكبير. في أُحد كانت الهزيمة الجزئية درساً عظيماً. في الخندق دافع المسلمون عن المدينة بحفر خندق عظيم. وفي فتح مكة عاد النبي إلى مكة التي أخرجته غازياً لا منتقماً، وقال لقريش: اذهبوا فأنتم الطلقاء.\n\nفي حجة الوداع ودّع النبي أمته بخطبة خالدة: "ألا هل بلّغت؟ اللهم فاشهد. فليبلّغ الشاهد الغائب."',
      },
      {
        title_ar: "الوفاة والميراث الأبدي",
        section_type: "story",
        content_ar:
          'في 12 ربيع الأول عام 11هـ انتقل النبي ﷺ إلى الرفيق الأعلى وهو في حجر زوجته عائشة. قالت: توفي رسول الله ﷺ ورأسه بين سحري ونحري وخالط ريقه ريقي. كانت آخر كلماته: "اللهم الرفيق الأعلى".\n\nترك للأمة القرآن الكريم والسنة النبوية، وخلّف أمة من 1.8 مليار مسلم تتبعه حتى اليوم. قال الله: ﴿وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ﴾.',
      },
      {
        title_ar: "الدروس والعبر",
        section_type: "lesson",
        content_ar:
          "1. الرحمة قبل القوة — فتح مكة عفواً لا انتقاماً هو درس حضاري خالد.\n2. الثبات على المبدأ — 13 سنة من الإيذاء لم تُزعزع إيمانه ذرة.\n3. الأسوة الحسنة — ﴿لَقَدْ كَانَ لَكُمْ فِي رَسُولِ اللَّهِ أُسْوَةٌ حَسَنَةٌ﴾.\n4. الوحدة والأخوة — آخى بين المهاجرين والأنصار مثالاً للتآزر الإنساني.\n5. الإرث الأبدي — القرآن معجزته الباقية إلى يوم القيامة.",
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const storyData = PROPHET_STORIES[slug];
  const name = storyData?.name_ar ?? "قصة النبي";
  return pageMetadata({
    title: `قصة ${name}`,
    description:
      storyData?.bio_ar?.slice(0, 160) ??
      "قصة النبي كاملة مع تفاصيل حياته ومعجزاته.",
    path: `/prophets/${slug}`,
  });
}

export default async function ProphetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canonicalSlug = LEGACY_PROPHET_SLUG_REDIRECTS[slug];
  if (canonicalSlug) redirect(`/prophets/${canonicalSlug}`);

  let prophet: Prophet | null = null;
  let sections: ProphetSection[] = [];
  let youtubeVideoId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: prophetData } = await supabase
      .from("prophets")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (prophetData) {
      prophet = prophetData;
      youtubeVideoId = prophetData.metadata?.youtube_video_id ?? null;

      const { data: sectionsData } = await supabase
        .from("prophet_sections")
        .select("*")
        .eq("prophet_id", prophetData.id)
        .order("order_num", { ascending: true });
      sections = sectionsData ?? [];
    }
  } catch {
    // fall through to static
  }

  // Use static data if DB has none
  const staticStory = PROPHET_STORIES[slug];
  const useStatic = !prophet && !!staticStory;

  if (!prophet && !staticStory) notFound();

  const displayName = prophet?.name_ar ?? staticStory?.name_ar ?? "";
  const displayNameEn = prophet?.name_en ?? staticStory?.name_en ?? "";
  const displayBio = prophet?.bio_ar ?? staticStory?.bio_ar ?? "";
  const displayOrderNum = prophet?.order_num ?? staticStory?.order_num ?? null;
  const displayBirthPlace =
    prophet?.birth_place_ar ?? staticStory?.birth_place_ar ?? null;
  const displayDeathPlace =
    prophet?.death_place_ar ?? staticStory?.death_place_ar ?? null;
  const databaseSectionChars = sections.reduce(
    (total, section) => total + section.content_ar.length,
    0
  );
  const staticSectionChars =
    staticStory?.sections.reduce(
      (total, section) => total + section.content_ar.length,
      0
    ) ?? 0;
  const displaySections =
    staticSectionChars > databaseSectionChars * 1.5
      ? (staticStory?.sections ?? sections)
      : sections.length > 0
        ? sections
        : (staticStory?.sections ?? []);
  const displayVideoId =
    youtubeVideoId ?? staticStory?.youtube_video_id ?? null;
  const quranMentions = staticStory?.quran_mentions;
  const references = getContentReferences(prophet?.metadata);
  const storyStatus = prophet?.metadata?.content_status ?? (sections.length > 0 ? "quran_primary" : "fallback");
  const storyCharCount = displaySections.reduce((total, section) => total + section.content_ar.length, 0);

  const sectionTypeLabel: Record<string, string> = {
    story: "القصة",
    miracle: "المعجزة",
    lesson: "الدروس والعبر",
    context: "السياق التاريخي",
  };

  return (
    <main className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[#0A2A1E] to-[#071A13] py-16">
        <Container className="max-w-4xl space-y-6">
          <Link
            href="/prophets"
            className="inline-flex items-center gap-2 text-sm text-brand-gold/60 hover:text-brand-gold transition-colors"
          >
            <span>←</span>
            <span>العودة إلى قصص الأنبياء</span>
          </Link>

          <div className="space-y-4">
            {displayOrderNum && (
              <span className="text-xs text-brand-gold/50 border border-brand-gold/20 rounded-full px-3 py-1">
                النبي رقم {displayOrderNum} من 25
              </span>
            )}
            <h1 className="text-5xl md:text-6xl font-bold text-brand-gold font-arabic leading-tight">
              {displayName}
            </h1>
            {displayNameEn && (
              <p className="text-xl text-brand-cream/50" dir="ltr">
                {displayNameEn}
              </p>
            )}
            {quranMentions && (
              <Badge
                variant="outline"
                className="border-brand-gold/30 text-brand-gold/80 text-sm"
              >
                ذُكر {quranMentions} مرة في القرآن الكريم
              </Badge>
            )}
          </div>

          {/* Info row */}
          <div className="flex flex-wrap gap-6 text-sm">
            {displayBirthPlace && (
              <div className="flex items-center gap-2 text-brand-cream/60">
                <span className="text-brand-gold/40 text-xs">مكان الميلاد</span>
                <span>{displayBirthPlace}</span>
              </div>
            )}
            {displayDeathPlace && (
              <div className="flex items-center gap-2 text-brand-cream/60">
                <span className="text-brand-gold/40 text-xs">مكان الوفاة</span>
                <span>{displayDeathPlace}</span>
              </div>
            )}
          </div>

          {/* The detail page intentionally does not present the story as a short bio. */}
          <section
            aria-labelledby="full-story-notice"
            className="max-w-3xl rounded-xl border border-brand-gold/20 bg-brand-gold/5 p-5"
          >
            <h2 id="full-story-notice" className="text-base font-bold text-brand-gold">
              القصة التفصيلية والمصادر
            </h2>
            <p className="mt-2 text-sm leading-8 text-brand-cream/75">
              تُعرض مواضع القصة كاملة من القرآن الكريم في الأقسام التالية، مع إحالات مباشرة إلى السور والآيات. لا تُستبدل القصة بملخص، ولا تُضاف رواية تاريخية غير موثقة إلى النص القرآني.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-brand-cream/65">
              <span className="rounded-full border border-brand-gold/25 px-3 py-1 text-brand-gold/85">
                {storyStatus === "quran_primary" ? "المصدر الأساسي: القرآن الكريم" : "المحتوى يحتاج مراجعة مصدرية"}
              </span>
              <span className="rounded-full border border-brand-gold/15 px-3 py-1">
                {displaySections.length} أقسام · {storyCharCount.toLocaleString("ar-EG")} حرفًا
              </span>
            </div>
            {references.length > 0 && (
              <p className="mt-2 text-xs text-brand-cream/55">
                عدد الإحالات الأساسية: {references.length}
              </p>
            )}
          </section>
        </Container>
      </section>

      <Container className="max-w-4xl py-10 space-y-8">
        {/* YouTube Video */}
        {displayVideoId && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-brand-gold">
              مشاهدة الفيديو
            </h2>
            <div
              className="relative w-full rounded-2xl overflow-hidden border border-brand-gold/20"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${displayVideoId}?rel=0&modestbranding=1`}
                title={`قصة ${displayName}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* Story Sections */}
        {displaySections.length > 0 && (
          <section className="space-y-6">
            {displaySections.map((section, i) => {
              const typeLabel = section.section_type
                ? sectionTypeLabel[section.section_type]
                : null;
              const isLesson = section.section_type === "lesson";
              return (
                <Card
                  key={(section as { id?: string }).id ?? i}
                  className={`p-8 space-y-4 ${isLesson ? "border-brand-gold/30 bg-brand-gold/5" : "border-brand-gold/10 bg-black/20"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-xs text-brand-gold font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-brand-gold">
                          {section.title_ar}
                        </h2>
                        {typeLabel && (
                          <span className="text-xs border border-brand-gold/20 rounded-full px-2 py-0.5 text-brand-gold/50">
                            {typeLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-base leading-9 text-brand-cream/85 whitespace-pre-wrap pr-11">
                    {section.content_ar}
                  </p>
                </Card>
              );
            })}
          </section>
        )}

        <ContentReferences references={references} />

        {/* Navigation to other prophets */}
        <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center space-y-4">
          <p
            className="text-xl font-arabic leading-loose text-brand-cream"
            dir="rtl"
          >
            ﴿ وَإِذْ أَخَذْنَا مِنَ النَّبِيِّينَ مِيثَاقَهُمْ وَمِنكَ وَمِن
            نُّوحٍ وَإِبْرَاهِيمَ وَمُوسَىٰ وَعِيسَى ابْنِ مَرْيَمَ ﴾
          </p>
          <p className="text-brand-gold/60 text-sm">سورة الأحزاب — الآية 7</p>
          <Link
            href="/prophets"
            className="inline-flex items-center gap-2 text-brand-gold hover:text-brand-gold/80 transition-colors text-sm font-medium"
          >
            <span>← عودة إلى جميع الأنبياء</span>
          </Link>
        </section>
      </Container>
    </main>
  );
}
