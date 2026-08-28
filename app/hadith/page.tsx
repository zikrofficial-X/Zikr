import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/section-header';
import { hadithBooks } from '@/lib/data/content';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'الأحاديث النبوية',
  description: 'تصفح كتب الحديث الشريف: صحيح البخاري، صحيح مسلم، وغيرها من كتب السنة النبوية المعتمدة.',
  path: '/hadith',
});

const hadithCollections = [
  {
    id: 'bukhari',
    nameAr: 'صحيح البخاري',
    nameEn: 'Sahih al-Bukhari',
    description: 'أصح كتب الحديث، جمعه الإمام محمد بن إسماعيل البخاري',
    hadithCount: 7275,
    compiler: 'الإمام البخاري',
    year: '256 هـ',
  },
  {
    id: 'muslim',
    nameAr: 'صحيح مسلم',
    nameEn: 'Sahih Muslim',
    description: 'ثاني أصح كتب الحديث بعد البخاري، جمعه الإمام مسلم بن الحجاج',
    hadithCount: 7500,
    compiler: 'الإمام مسلم',
    year: '261 هـ',
  },
  {
    id: 'tirmidhi',
    nameAr: 'سنن الترمذي',
    nameEn: 'Jami at-Tirmidhi',
    description: 'من الكتب الستة المعتمدة في الحديث النبوي',
    hadithCount: 3956,
    compiler: 'الإمام الترمذي',
    year: '279 هـ',
  },
  {
    id: 'abudawud',
    nameAr: 'سنن أبي داود',
    nameEn: 'Sunan Abu Dawud',
    description: 'من أهم كتب السنن المعتمدة عند أهل العلم',
    hadithCount: 5274,
    compiler: 'الإمام أبو داود',
    year: '275 هـ',
  },
  {
    id: 'nasai',
    nameAr: 'سنن النسائي',
    nameEn: 'Sunan an-Nasai',
    description: 'من الكتب الستة في الحديث النبوي الشريف',
    hadithCount: 5761,
    compiler: 'الإمام النسائي',
    year: '303 هـ',
  },
  {
    id: 'ibnmajah',
    nameAr: 'سنن ابن ماجه',
    nameEn: 'Sunan Ibn Majah',
    description: 'آخر الكتب الستة المعتمدة في الحديث',
    hadithCount: 4341,
    compiler: 'الإمام ابن ماجه',
    year: '273 هـ',
  },
];

const featuredHadiths = [
  {
    text: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا، أَوْ إِلَى امْرَأَةٍ يَنْكِحُهَا، فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ.',
    narrator: 'عمر بن الخطاب رضي الله عنه',
    source: 'صحيح البخاري',
    reference: 'الحديث رقم 1',
  },
  {
    text: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ، وَالْمُهَاجِرُ مَنْ هَجَرَ مَا نَهَى اللَّهُ عَنْهُ.',
    narrator: 'عبد الله بن عمرو رضي الله عنهما',
    source: 'صحيح البخاري',
    reference: 'الحديث رقم 10',
  },
  {
    text: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ.',
    narrator: 'أنس بن مالك رضي الله عنه',
    source: 'صحيح البخاري',
    reference: 'الحديث رقم 13',
  },
  {
    text: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ جَارَهُ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ ضَيْفَهُ.',
    narrator: 'أبو هريرة رضي الله عنه',
    source: 'صحيح البخاري',
    reference: 'الحديث رقم 6018',
  },
];

export default function HadithPage() {
  return (
    <Container className='py-12 space-y-12'>
      {/* Hero Section */}
      <section className='text-center space-y-4'>
        <h1 className='text-4xl font-bold text-brand-gold'>الأحاديث النبوية الشريفة</h1>
        <p className='max-w-2xl mx-auto text-lg leading-8 arabic-muted'>
          استكشف أحاديث النبي صلى الله عليه وسلم من أصح الكتب والمصادر المعتمدة
        </p>
      </section>

      {/* Featured Hadiths */}
      <section className='space-y-6'>
        <SectionHeader 
          title='أحاديث مختارة' 
          subtitle='من أشهر الأحاديث النبوية الشريفة'
        />
        
        <div className='grid gap-4 md:grid-cols-2'>
          {featuredHadiths.map((hadith, idx) => (
            <Card key={idx} className='space-y-4'>
              <p className='text-xl font-arabic leading-loose text-brand-cream' dir='rtl'>
                &quot;{hadith.text}&quot;
              </p>
              <div className='border-t border-brand-gold/20 pt-3 space-y-1'>
                <p className='text-sm text-brand-gold'>الراوي: {hadith.narrator}</p>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline'>{hadith.source}</Badge>
                  <span className='text-xs arabic-muted'>{hadith.reference}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Hadith Collections */}
      <section className='space-y-6'>
        <SectionHeader 
          title='كتب الحديث الستة' 
          subtitle='المصادر الأساسية المعتمدة في الحديث النبوي'
        />
        
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {hadithCollections.map((collection) => (
            <Card key={collection.id} className='space-y-3 hover:border-brand-gold/50 transition-colors'>
              <h3 className='text-xl font-semibold text-brand-gold'>{collection.nameAr}</h3>
              <p className='text-sm text-brand-cream/60'>{collection.nameEn}</p>
              <p className='text-sm leading-7 arabic-muted'>{collection.description}</p>
              <div className='flex flex-wrap gap-2'>
                <Badge variant='secondary'>{collection.hadithCount.toLocaleString('ar-EG')} حديث</Badge>
                <Badge variant='outline'>{collection.compiler}</Badge>
              </div>
              <p className='text-xs arabic-muted'>توفي سنة {collection.year}</p>
              <Button variant='ghost' href={`/hadith/${collection.id}`} className='w-full'>
                تصفح الأحاديث
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Search Section */}
      <section className='text-center space-y-4'>
        <Card className='py-8 space-y-4 bg-brand-gold/5'>
          <h2 className='text-2xl text-brand-gold'>ابحث في الأحاديث</h2>
          <p className='arabic-muted max-w-xl mx-auto leading-7'>
            استخدم صفحة البحث للعثور على أحاديث محددة بالكلمات المفتاحية أو الموضوع
          </p>
          <Button href='/search' variant='secondary'>
            الذهاب للبحث
          </Button>
        </Card>
      </section>

      {/* Legacy Books from Data */}
      {hadithBooks.length > 0 && (
        <section className='space-y-4'>
          <SectionHeader title='مصادر إضافية' />
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {hadithBooks.map((book) => (
              <Card key={book.id} className='hover:border-brand-gold/40 transition-colors'>
                <Link href={`/hadith/${book.slug}`} className='block'>
                  <h3 className='text-lg text-brand-cream'>{book.nameAr}</h3>
                  <p className='text-sm arabic-muted'>{book.nameEn}</p>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
