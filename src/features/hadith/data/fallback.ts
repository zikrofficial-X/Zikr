// Hadith-only fallback book registry.\nexport type HadithFallbackBook = {\n  id: string;\n  slug: string;\n  nameAr: string;\n  nameEn: string;\n  source: string;\n};\n\nexport const hadithBooks:HadithFallbackBook[]=[
  {id:'bukhari',slug:'bukhari',nameAr:'صحيح البخاري',nameEn:'Sahih al-Bukhari',source:'sunnah.com'},
  {id:'muslim',slug:'muslim',nameAr:'صحيح مسلم',nameEn:'Sahih Muslim',source:'sunnah.com'},
  {id:'tirmidhi',slug:'tirmidhi',nameAr:'سنن الترمذي',nameEn:'Jami at-Tirmidhi',source:'sunnah.com'},
  {id:'abudawud',slug:'abudawud',nameAr:'سنن أبي داود',nameEn:'Sunan Abu Dawud',source:'sunnah.com'},
];\n