// Hadith fallback data for offline/search-safe UI.
export type HadithFallback = {id:string;bookId:string;hadithNumber:string;textAr:string;narrator:string;grade:string;chapter:string;ref:string};
export type HadithFallbackBook = { id:string; slug:string; nameAr:string; nameEn:string; source:string };

export const hadithBooks: HadithFallbackBook[] = [
  {id:'bukhari',slug:'bukhari',nameAr:'صحيح البخاري',nameEn:'Sahih al-Bukhari',source:'sunnah.com'},
  {id:'muslim',slug:'muslim',nameAr:'صحيح مسلم',nameEn:'Sahih Muslim',source:'sunnah.com'},
  {id:'tirmidhi',slug:'tirmidhi',nameAr:'سنن الترمذي',nameEn:'Jami at-Tirmidhi',source:'sunnah.com'},
  {id:'abudawud',slug:'abudawud',nameAr:'سنن أبي داود',nameEn:'Sunan Abu Dawud',source:'sunnah.com'},
];

export const hadiths:HadithFallback[]=[
  {id:'b1',bookId:'bukhari',hadithNumber:'1',textAr:'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى...',narrator:'عمر بن الخطاب رضي الله عنه',grade:'صحيح',chapter:'بدء الوحي',ref:'bukhari:1'},
  {id:'b2',bookId:'bukhari',hadithNumber:'13',textAr:'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِب������ّ لِنَفْسِهِ.',narrator:'أنس بن مالك رضي الله عنه',grade:'صحيح',chapter:'الإيمان',ref:'bukhari:13'},
  {id:'b3',bookId:'bukhari',hadithNumber:'3',textAr:'من سلك طريقا يلتمس فيه علما سهل الله له به طريقا إلى الجنة',narrator:'أبو هريرة رضي الله عنه',grade:'صحيح',chapter:'العلم',ref:'bukhari:3'},
  {id:'b4',bookId:'bukhari',hadithNumber:'4',textAr:'خيركم من تعلم القرآن وعلمه',narrator:'عثمان بن عفان رضي الله عنه',grade:'صحيح',chapter:'فضائل القرآن',ref:'bukhari:4'},
  {id:'m1',bookId:'muslim',hadithNumber:'1',textAr:'الدين النصيحة، قلنا: لمن؟ قال: لله ولكتابه ولرسوله ولأئمة المسلمين وعامتهم',narrator:'تميم الداري رضي الله عنه',grade:'صحيح',chapter:'الإيمان',ref:'muslim:1'},
];
