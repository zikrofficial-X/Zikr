export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { mergePublishedBySlug } from '@/lib/data/content-merge';

export const metadata: Metadata = pageMetadata({
  title: 'الأدعية الإسلامية',
  description: 'مجموعة شاملة من الأدعية القرآنية والنبوية والمأثورة من منصة ذِكر.',
  path: '/dua',
});

export const revalidate = 3600;

interface Dua {
  id: string;
  title_ar: string;
  slug: string;
  text_ar: string;
  occasion_ar?: string | null;
  source_ar?: string | null;
  category_id?: string | null;
}

interface DuaCategory {
  id: string;
  name_ar: string;
  slug: string;
  icon?: string | null;
}

const staticDuas: Dua[] = [
  {
    id: '1',
    title_ar: 'دعاء الاستفتاح',
    slug: 'dua-al-istiftah',
    text_ar: 'اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ كَمَا بَاعَدْتَ بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ، اللَّهُمَّ نَقِّنِي مِنْ خَطَايَايَ كَمَا يُنَقَّى الثَّوْبُ الْأَبْيَضُ مِنَ الدَّنَسِ',
    occasion_ar: 'قبل الصلاة',
    source_ar: 'البخاري ومسلم',
  },
  {
    id: '2',
    title_ar: 'دعاء القنوت',
    slug: 'dua-al-qunut',
    text_ar: 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ، وَقِنِي شَرَّ مَا قَضَيْتَ، فَإِنَّكَ تَقْضِي وَلَا يُقْضَى عَلَيْكَ',
    occasion_ar: 'صلاة الوتر',
    source_ar: 'أبو داود والترمذي والنسائي',
  },
  {
    id: '3',
    title_ar: 'دعاء السفر',
    slug: 'dua-al-safar',
    text_ar: 'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ',
    occasion_ar: 'عند الركوب',
    source_ar: 'أبو داود والترمذي',
  },
  {
    id: '4',
    title_ar: 'دعاء دخول المنزل',
    slug: 'dua-entering-home',
    text_ar: 'بِسْمِ اللهِ وَلَجْنَا، وَبِسْمِ اللهِ خَرَجْنَا، وَعَلَى اللهِ رَبِّنَا تَوَكَّلْنَا',
    occasion_ar: 'عند الدخول إلى المنزل',
    source_ar: 'أبو داود',
  },
  {
    id: '5',
    title_ar: 'دعاء الكرب',
    slug: 'dua-al-karb',
    text_ar: 'لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ',
    occasion_ar: 'عند الكرب والهم',
    source_ar: 'البخاري ومسلم',
  },
  {
    id: '6',
    title_ar: 'دعاء الاستخارة',
    slug: 'dua-al-istikhara',
    text_ar: 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ، وَتَعْلَمُ وَلَا أَعْلَمُ، وَأَنْتَ عَلَّامُ الْغُيُوبِ',
    occasion_ar: 'صلاة الاستخارة',
    source_ar: 'البخاري',
  },
  {
    id: '7',
    title_ar: 'دعاء الصباح',
    slug: 'dua-al-sabah',
    text_ar: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    occasion_ar: 'أذكار الصباح',
    source_ar: 'أبو داود',
  },
  {
    id: '8',
    title_ar: 'دعاء المساء',
    slug: 'dua-al-masaa',
    text_ar: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    occasion_ar: 'أذكار المساء',
    source_ar: 'أبو داود',
  },
];

const staticCategories: DuaCategory[] = [
  { id: '1', name_ar: 'أذكار الصباح والمساء', slug: 'morning-evening', icon: null },
  { id: '2', name_ar: 'أدعية الصلاة', slug: 'prayer', icon: null },
  { id: '3', name_ar: 'أدعية السفر', slug: 'travel', icon: null },
  { id: '4', name_ar: 'أدعية المنزل', slug: 'home', icon: null },
  { id: '5', name_ar: 'أدعية الكرب والهم', slug: 'distress', icon: null },
];

export default async function DuaPage() {
  let duas: Dua[] = [];
  let categories: DuaCategory[] = [];

  try {
    const supabase = await createClient();
    const [duasRes, categoriesRes] = await Promise.all([
      supabase
        .from('duas')
        .select('id, title_ar, slug, text_ar, occasion_ar, source_ar, category_id')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('dua_categories')
        .select('id, name_ar, slug, icon')
        .eq('published', true),
    ]);
    duas = duasRes.data ?? [];
    categories = categoriesRes.data ?? [];
  } catch {
    // Fall through to static content
  }

  const databaseDuaSlugs = new Set(duas.map(dua => dua.slug));
  const displayDuas = mergePublishedBySlug(duas, staticDuas);
  const displayCategories = mergePublishedBySlug(categories, staticCategories);

  return (
    <Container className="py-12 space-y-10">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold text-balance">الأدعية الإسلامية</h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted text-pretty">
          مجموعة شاملة من الأدعية القرآنية والنبوية والمأثورة لمختلف المناسبات
        </p>
      </section>

      {/* Categories */}
      {displayCategories.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="تصنيفات الأدعية" />
          <div className="flex flex-wrap justify-center gap-3">
            {displayCategories.map((cat) => (
              <span
                key={cat.id}
                className="rounded-full border border-brand-gold/30 px-4 py-1.5 text-sm text-brand-cream/70 hover:border-brand-gold hover:text-brand-gold transition-colors cursor-pointer"
              >
                {cat.name_ar}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Duas List */}
      <section className="space-y-6">
        <SectionHeader
          title="الأدعية المأثورة"
          subtitle={`${displayDuas.length} دعاء`}
        />

        <div className="grid gap-5">
          {displayDuas.map((dua) => (
            <Link
              key={`${dua.id}-${dua.slug}`}
              href={databaseDuaSlugs.has(dua.slug) ? `/dua/${dua.slug}` : '/dua'}
            >
              <Card className="p-6 space-y-4 hover:border-brand-gold/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-bold text-brand-gold">{dua.title_ar}</h3>
                  {dua.source_ar && (
                    <Badge variant="outline" className="shrink-0 text-xs">{dua.source_ar}</Badge>
                  )}
                </div>
                <p
                  className="text-brand-cream/90 text-lg leading-loose font-arabic"
                  dir="rtl"
                >
                  {dua.text_ar}
                </p>
                {dua.occasion_ar && (
                  <p className="text-sm text-brand-gold/70 border-t border-brand-gold/15 pt-3">
                    <span className="font-semibold">المناسبة: </span>
                    {dua.occasion_ar}
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Quran verse about dua */}
      <section>
        <Card className="p-8 text-center space-y-4 bg-brand-gold/10 border-brand-gold/30">
          <h3 className="text-xl font-bold text-brand-gold">فضل الدعاء</h3>
          <p className="text-brand-cream/90 font-arabic text-xl leading-loose" dir="rtl">
            &quot;وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ&quot;
          </p>
          <p className="text-brand-gold/70 text-sm">سورة غافر - الآية 60</p>
          <div className="border-t border-brand-gold/20 pt-4">
            <p className="text-brand-cream/70 text-sm leading-relaxed">
              قال صلى الله عليه وسلم: &quot;الدُّعَاءُ هُوَ الْعِبَادَةُ&quot; — رواه الترمذي
            </p>
          </div>
        </Card>
      </section>
    </Container>
  );
}
