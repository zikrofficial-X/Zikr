export type KidsSectionLinkId =
  | "home"
  | "activities"
  | "learn"
  | "audio"
  | "games"
  | "create"
  | "progress"
  | "achievements"
  | "family";

export type KidsSectionLink = {
  id: KidsSectionLinkId;
  href: string;
  icon: string;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

/**
 * One canonical list keeps navigation labels and destinations consistent
 * across the Kids landing page, activity pages, game catalog, and details.
 */
export const KIDS_SECTION_LINKS: readonly KidsSectionLink[] = [
  {
    id: "home",
    href: "/kids",
    icon: "⌂",
    labelAr: "الرئيسية",
    labelEn: "Home",
    descriptionAr: "العودة إلى عالم الأطفال",
    descriptionEn: "Return to Kids World",
  },
  {
    id: "activities",
    href: "/kids/adventures",
    icon: "📖",
    labelAr: "القصص والأنشطة",
    labelEn: "Stories & activities",
    descriptionAr: "قصص وأنشطة تعليمية قصيرة",
    descriptionEn: "Short stories and learning activities",
  },
  {
    id: "learn",
    href: "/kids/wudu-steps",
    icon: "💧",
    labelAr: "التعلّم",
    labelEn: "Learning",
    descriptionAr: "خطوات تعلّم واضحة",
    descriptionEn: "Clear learning steps",
  },
  {
    id: "audio",
    href: "/kids/audio",
    icon: "♫",
    labelAr: "الصوتيات",
    labelEn: "Audio",
    descriptionAr: "استمع للمحتوى الصوتي المتاح",
    descriptionEn: "Listen to available audio content",
  },
  {
    id: "games",
    href: "/kids/games",
    icon: "🎮",
    labelAr: "الألعاب",
    labelEn: "Games",
    descriptionAr: "ابحث حسب العمر والمهارة والوقت",
    descriptionEn: "Browse by age, skill, and time",
  },
  {
    id: "create",
    href: "/kids/zikr-coloring",
    icon: "✎",
    labelAr: "الإبداع والتلوين",
    labelEn: "Create & color",
    descriptionAr: "لوّن رسومات واحتفظ بها على جهازك",
    descriptionEn: "Color artwork and keep it on this device",
  },
  {
    id: "progress",
    href: "/kids/progress",
    icon: "↗",
    labelAr: "التقدّم",
    labelEn: "Progress",
    descriptionAr: "تابع خطواتك أنت",
    descriptionEn: "Review your own progress",
  },
  {
    id: "achievements",
    href: "/kids/achievements",
    icon: "★",
    labelAr: "الشارات",
    labelEn: "Achievements",
    descriptionAr: "راجع الشارات والإنجازات",
    descriptionEn: "Review badges and achievements",
  },
  {
    id: "family",
    href: "/kids/parent-dashboard",
    icon: "⌂",
    labelAr: "دليل الأسرة",
    labelEn: "Family guide",
    descriptionAr: "معلومات وإرشادات لولي الأمر",
    descriptionEn: "Guidance for parents and caregivers",
  },
] as const;
