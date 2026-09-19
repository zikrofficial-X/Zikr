// Prophet fallback data for offline/search-safe UI.
export type ProphetFallback = {id:string;nameAr:string;nameEn:string;slug:string;order:number;bioAr:string;bioEn?:string};

export const prophets:ProphetFallback[]=[
  {id:'1',nameAr:'آدم عليه السلام',nameEn:'Adam',slug:'adam',order:1,bioAr:'أول الأنبياء والمرسلين، خليفة الله في الأرض'},
  {id:'2',nameAr:'نوح عليه السلام',nameEn:'Noah',slug:'noah',order:2,bioAr:'دعا قومه ألف سنة إلا خمسين سنة'},
  {id:'3',nameAr:'إبراهيم عليه السلام',nameEn:'Abraham',slug:'abraham',order:3,bioAr:'خليل الله، بنى الكعبة مع ابنه إسماعيل'},
  {id:'4',nameAr:'موسى عليه السلام',nameEn:'Moses',slug:'moses',order:4,bioAr:'كليم الله، أنقذ بني إسرائيل من فرعون'},
  {id:'5',nameAr:'عيسى عليه السلام',nameEn:'Jesus',slug:'jesus',order:5,bioAr:'روح الله وكلمته، أرسل إلى بني إسرائيل'},
  {id:'6',nameAr:'يوسف عليه السلام',nameEn:'Yusuf',slug:'yusuf',order:6,bioAr:'صاحب قصة الصبر والعفة، ملك مصر'},
  {id:'7',nameAr:'أيوب عليه السلام',nameEn:'Ayyub',slug:'ayyub',order:7,bioAr:'ضرب به المثل في الصبر على البلاء'},
  {id:'8',nameAr:'محمد صلى الله عليه وسلم',nameEn:'Muhammad',slug:'muhammad',order:8,bioAr:'خاتم الأنبياء والمرسلين، أرسل رحمة للعالمين'},
];
