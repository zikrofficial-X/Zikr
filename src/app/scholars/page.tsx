'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/section-header';

const scholars = [
  {
    id: 'ibn-taymiyyah',
    nameAr: 'شيخ الإسلام ابن تيمية',
    nameEn: 'Ibn Taymiyyah',
    era: '661-728 هـ',
    specialty: 'الفقه والعقيدة',
    bio: 'أحد أعظم علماء الإسلام، برع في الفقه والحديث والعقيدة والتفسير. له مؤلفات كثيرة أشهرها مجموع الفتاوى.',
    works: ['مجموع الفتاوى', 'العقيدة الواسطية', 'منهاج السنة النبوية'],
    category: 'متقدمين',
  },
  {
    id: 'ibn-qayyim',
    nameAr: 'ابن القيم الجوزية',
    nameEn: 'Ibn Qayyim Al-Jawziyyah',
    era: '691-751 هـ',
    specialty: 'الفقه والتزكية',
    bio: 'تلميذ ابن تيمية النجيب، من أعظم علماء الإسلام في التزكية والسلوك والفقه.',
    works: ['مدارج السالكين', 'زاد المعاد', 'إغاثة اللهفان'],
    category: 'متقدمين',
  },
  {
    id: 'nawawi',
    nameAr: 'الإمام النووي',
    nameEn: 'Imam An-Nawawi',
    era: '631-676 هـ',
    specialty: 'الحديث والفقه الشافعي',
    bio: 'من أشهر علماء الحديث والفقه الشافعي، صاحب الأربعين النووية وشرح صحيح مسلم.',
    works: ['الأربعين النووية', 'رياض الصالحين', 'المنهاج شرح صحيح مسلم'],
    category: 'متقدمين',
  },
  {
    id: 'ibn-baz',
    nameAr: 'الشيخ عبد العزيز بن باز',
    nameEn: 'Sheikh Ibn Baz',
    era: '1330-1420 هـ',
    specialty: 'الفتوى والعقيدة',
    bio: 'المفتي العام للمملكة العربية السعودية، من أبرز علماء العصر الحديث.',
    works: ['مجموع فتاوى ابن باز', 'العقيدة الصحيحة', 'فتاوى نور على الدرب'],
    category: 'معاصرين',
  },
  {
    id: 'uthaymin',
    nameAr: 'الشيخ محمد بن صالح العثيمين',
    nameEn: 'Sheikh Ibn Uthaymin',
    era: '1347-1421 هـ',
    specialty: 'الفقه والتفسير',
    bio: 'من أبرز علماء المملكة العربية السعودية، له شروحات قيمة في الفقه والعقيدة.',
    works: ['الشرح الممتع', 'رياض الصالحين بشرحه', 'شرح العقيدة الواسطية'],
    category: 'معاصرين',
  },
  {
    id: 'albani',
    nameAr: 'الشيخ محمد ناصر الدين الألباني',
    nameEn: 'Sheikh Al-Albani',
    era: '1333-1420 هـ',
    specialty: 'علم الحديث',
    bio: 'محدث العصر، صحح وضعف آلاف الأحاديث وله جهود عظيمة في خدمة السنة النبوية.',
    works: ['السلسلة الصحيحة', 'السلسلة الضعيفة', 'صحيح الترغيب والترهيب'],
    category: 'معاصرين',
  },
  {
    id: 'shaarawi',
    nameAr: 'الشيخ محمد متولي الشعراوي',
    nameEn: 'Sheikh Al-Shaarawi',
    era: '1329-1418 هـ',
    specialty: 'التفسير',
    bio: 'من أشهر المفسرين المعاصرين، له خواطر في تفسير القرآن الكريم انتشرت في العالم العربي.',
    works: ['خواطر الشعراوي', 'تفسير الشعراوي', 'معجزة القرآن'],
    category: 'معاصرين',
  },
  {
    id: 'qaradawi',
    nameAr: 'الشيخ يوسف القرضاوي',
    nameEn: 'Sheikh Al-Qaradawi',
    era: '1344-1444 هـ',
    specialty: 'الفقه المعاصر',
    bio: 'من أبرز علماء الفقه المعاصر، له اجتهادات كثيرة في القضايا المعاصرة.',
    works: ['فقه الزكاة', 'الحلال والحرام في الإسلام', 'فقه الأولويات'],
    category: 'معاصرين',
  },
];

const categories = ['الكل', 'متقدمين', 'معاصرين'];

export default function ScholarsPage() {
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredScholars = scholars.filter((scholar) => {
    const matchesCategory = selectedCategory === 'الكل' || scholar.category === selectedCategory;
    const matchesSearch = 
      scholar.nameAr.includes(searchQuery) ||
      scholar.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scholar.specialty.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <Container className="py-12 space-y-10">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">العلماء والدعاة</h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted">
          تعرف على أبرز علماء الإسلام من المتقدمين والمعاصرين، ومؤلفاتهم وإسهاماتهم في خدمة الدين
        </p>
      </section>

      {/* Filters */}
      <section className="space-y-4">
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'primary' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder="ابحث عن عالم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream placeholder:text-brand-cream/40 focus:border-brand-gold focus:outline-none"
            dir="rtl"
          />
        </div>
      </section>

      {/* Scholars Grid */}
      <section className="space-y-6">
        <SectionHeader 
          title={`علماء ${selectedCategory === 'الكل' ? 'الإسلام' : selectedCategory}`}
          subtitle={`عدد النتائج: ${filteredScholars.length}`}
        />

        {filteredScholars.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="arabic-muted">لا توجد نتائج للبحث</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredScholars.map((scholar) => (
              <Link key={scholar.id} href={`/scholars/${scholar.id}`}>
              <Card className="space-y-4 hover:border-brand-gold/50 transition-colors cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-brand-gold">{scholar.nameAr}</h3>
                    <p className="text-sm text-brand-cream/60">{scholar.nameEn}</p>
                  </div>
                  <Badge variant="outline">{scholar.category}</Badge>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{scholar.era}</Badge>
                  <Badge>{scholar.specialty}</Badge>
                </div>

                <p className="text-sm leading-7 arabic-muted">{scholar.bio}</p>

                <div className="space-y-2 border-t border-brand-gold/20 pt-3">
                  <p className="text-sm text-brand-gold">أشهر المؤلفات:</p>
                  <ul className="text-sm arabic-muted space-y-1">
                    {scholar.works.map((work, idx) => (
                      <li key={idx}>- {work}</li>
                    ))}
                  </ul>
                </div>
              </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Note */}
      <Card className="text-center py-6 bg-brand-gold/5">
        <p className="arabic-muted leading-7">
          هذه القائمة تضم بعض العلماء الأفاضل، ولا يعني ترتيبهم أي تفضيل. رحم الله من توفي منهم وحفظ الأحياء.
        </p>
      </Card>
    </Container>
  );
}
