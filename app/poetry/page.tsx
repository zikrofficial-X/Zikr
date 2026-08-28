'use client';

import { useState, useCallback } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ─── Static poems ────────────────────────────────────────────────────────────

const islamicPoems = [
  {
    id: 1,
    title: 'البردة',
    poet: 'الإمام البوصيري',
    verses: [
      { first: 'أَمِنْ تَذَكُّرِ جِيرَانٍ بِذِي سَلَمِ', second: 'مَزَجْتَ دَمْعاً جَرَى مِنْ مُقْلَةٍ بِدَمِ' },
      { first: 'أَمْ هَبَّتِ الرِّيحُ مِنْ تِلْقَاءِ كَاظِمَةٍ', second: 'وَأَوْمَضَ البَرْقُ فِي الظَّلْمَاءِ مِنْ إِضَمِ' },
      { first: 'مُحَمَّدٌ سَيِّدُ الكَوْنَيْنِ وَالثَّقَلَيْنِ', second: 'وَالفَرِيقَيْنِ مِنْ عُرْبٍ وَمِنْ عَجَمِ' },
    ],
    category: 'مدائح نبوية',
  },
  {
    id: 2,
    title: 'نهج البردة',
    poet: 'أحمد شوقي',
    verses: [
      { first: 'رِيمٌ عَلى القاعِ بَينَ البانِ وَالعَلَمِ', second: 'أَحَلَّ سَفكَ دَمي في الأَشهُرِ الحُرُمِ' },
      { first: 'لَمّا رَنا حَدَّثَتني النَفسُ قائِلَةً', second: 'يا وَيحَ جَنبِكَ بِالسَهمِ المُصيبِ رُمي' },
    ],
    category: 'مدائح نبوية',
  },
  {
    id: 3,
    title: 'يا رب',
    poet: 'الإمام الشافعي',
    verses: [
      { first: 'يَا رَبِّ إِنْ عَظُمَتْ ذُنُوبِي كَثْرَةً', second: 'فَلَقَدْ عَلِمْتُ بِأَنَّ عَفْوَكَ أَعْظَمُ' },
      { first: 'إِنْ كَانَ لاَ يَرْجُوكَ إِلاَّ مُحْسِنٌ', second: 'فَبِمَنْ يَلُوذُ وَيَسْتَجِيرُ الْمُجْرِمُ' },
      { first: 'أَدْعُوكَ رَبِّ كَمَا أَمَرْتَ تَضَرُّعاً', second: 'فَإِذَا رَدَدْتَ يَدِي فَمَنْ ذَا يَرْحَمُ' },
    ],
    category: 'مناجاة',
  },
  {
    id: 4,
    title: 'دع الأيام',
    poet: 'الإمام الشافعي',
    verses: [
      { first: 'دَعِ الأَيَّامَ تَفْعَل مَا تَشَاءُ', second: 'وَطِبْ نَفْساً إِذَا حَكَمَ القَضَاءُ' },
      { first: 'وَلاَ تَجْزَعْ لِنَازِلَةِ اللَّيَالِي', second: 'فَمَا لِحَوَادِثِ الدُّنْيَا بَقَاءُ' },
      { first: 'وَكُنْ رَجُلاً عَلَى الأَهْوَالِ جَلْداً', second: 'وَشِيمَتُكَ السَّمَاحَةُ وَالوَفَاءُ' },
    ],
    category: 'حكمة',
  },
  {
    id: 5,
    title: 'إلهي',
    poet: 'رابعة العدوية',
    verses: [
      { first: 'إِلَهِي أَنَا مَنْ يَطْمَعُ فِي فَضْلِكَ', second: 'وَأَنْتَ الَّذِي أَوْلَيْتَهُ كُلَّ نِعْمَةٍ' },
      { first: 'أُحِبُّكَ حُبَّيْنِ حُبَّ الهَوَى', second: 'وَحُبّاً لِأَنَّكَ أَهْلٌ لِذَاكَا' },
    ],
    category: 'تصوف',
  },
];

const CATEGORIES = ['الكل', 'مدائح نبوية', 'مناجاة', 'حكمة', 'تصوف'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserPoem {
  id: string;
  title: string;
  poet: string;
  content: string;
  likes: number;
  liked: boolean;
  createdAt: Date;
}

type Tab = 'browse' | 'community' | 'write';

// ─── Sub-components ──────────────────────────────────────────────────────────

function StaticPoemCard({ poem }: { poem: (typeof islamicPoems)[0] }) {
  // Deterministic seed based on poem index to avoid SSR/client hydration mismatch
  const baseLikes = (poem.title.charCodeAt(0) % 70) + 10;
  const [likes, setLikes] = useState(baseLikes);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  function toggleLike() {
    setLiked((v) => {
      setLikes((l) => (v ? l - 1 : l + 1));
      return !v;
    });
  }

  function share() {
    const text = poem.verses.map((v) => `${v.first} | ${v.second}`).join('\n');
    navigator.clipboard.writeText(`${poem.title} — ${poem.poet}\n\n${text}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-brand-gold">{poem.title}</h3>
          <p className="text-sm text-brand-cream/60">{poem.poet}</p>
        </div>
        <span className="text-xs bg-brand-gold/20 text-brand-gold px-3 py-1 rounded-full shrink-0">
          {poem.category}
        </span>
      </div>

      <div className="space-y-3 border-t border-brand-gold/20 pt-4">
        {poem.verses.map((verse, idx) => (
          <div key={idx} className="grid grid-cols-2 gap-4 text-center font-arabic text-lg leading-relaxed">
            <p className="text-brand-cream">{verse.first}</p>
            <p className="text-brand-cream/80">{verse.second}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-brand-gold/10">
        <button
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label={liked ? 'إلغاء الإعجاب' : 'إعجاب'}
          className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-rose-400' : 'text-brand-cream/40 hover:text-rose-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          {likes}
        </button>

        <button
          onClick={share}
          aria-label="نسخ القصيدة"
          className="flex items-center gap-1.5 text-sm text-brand-cream/40 hover:text-brand-gold transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          {copied ? 'تم النسخ' : 'مشاركة'}
        </button>
      </div>
    </Card>
  );
}

function UserPoemCard({ poem, onLike, onDelete }: { poem: UserPoem; onLike: (id: string) => void; onDelete: (id: string) => void }) {
  const [copied, setCopied] = useState(false);

  function share() {
    navigator.clipboard.writeText(`${poem.title} — ${poem.poet}\n\n${poem.content}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card className="space-y-4 border-brand-gold/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-gold/20 flex items-center justify-center shrink-0">
            <span className="text-brand-gold text-sm font-bold">{poem.poet[0]}</span>
          </div>
          <div>
            <p className="font-semibold text-brand-cream text-sm">{poem.poet}</p>
            <p className="text-xs text-brand-cream/40">
              {poem.createdAt.toLocaleDateString('ar-SA')}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDelete(poem.id)}
          aria-label="حذف القصيدة"
          className="text-brand-cream/20 hover:text-red-400 transition-colors text-xs"
        >
          حذف
        </button>
      </div>

      <div>
        <h3 className="text-lg font-bold text-brand-gold mb-2">{poem.title}</h3>
        <p className="whitespace-pre-wrap text-brand-cream/90 font-arabic leading-relaxed text-sm">
          {poem.content}
        </p>
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-brand-gold/10">
        <button
          onClick={() => onLike(poem.id)}
          aria-pressed={poem.liked}
          aria-label={poem.liked ? 'إلغاء الإعجاب' : 'إعجاب'}
          className={`flex items-center gap-1.5 text-sm transition-colors ${poem.liked ? 'text-rose-400' : 'text-brand-cream/40 hover:text-rose-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill={poem.liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          {poem.likes}
        </button>
        <button
          onClick={share}
          aria-label="مشاركة"
          className="flex items-center gap-1.5 text-sm text-brand-cream/40 hover:text-brand-gold transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          {copied ? 'تم النسخ' : 'مشاركة'}
        </button>
      </div>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PoetryPage() {
  const [tab, setTab] = useState<Tab>('browse');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [userPoems, setUserPoems] = useState<UserPoem[]>([]);
  const [poemTitle, setPoemTitle] = useState('');
  const [poetName, setPoetName] = useState('');
  const [poemContent, setPoemContent] = useState('');
  const [submitError, setSubmitError] = useState('');

  const filteredPoems = selectedCategory === 'الكل'
    ? islamicPoems
    : islamicPoems.filter((p) => p.category === selectedCategory);

  const handlePublish = useCallback(() => {
    if (!poemTitle.trim() || !poemContent.trim()) {
      setSubmitError('يرجى إدخال العنوان والنص');
      return;
    }
    setSubmitError('');
    const newPoem: UserPoem = {
      id: Date.now().toString(),
      title: poemTitle.trim(),
      poet: poetName.trim() || 'مجهول',
      content: poemContent.trim(),
      likes: 0,
      liked: false,
      createdAt: new Date(),
    };
    setUserPoems((prev) => [newPoem, ...prev]);
    setPoemTitle('');
    setPoetName('');
    setPoemContent('');
    setTab('community');
  }, [poemTitle, poetName, poemContent]);

  function toggleLike(id: string) {
    setUserPoems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p,
      ),
    );
  }

  function deletePoem(id: string) {
    setUserPoems((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <Container className="py-12 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">الشعر الإسلامي</h1>
        <p className="text-brand-cream/70 max-w-2xl mx-auto leading-relaxed">
          استمتع بروائع ال��عر الإسلامي، وشارك قصائدك مع المجتمع
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-black/20 rounded-xl p-1 max-w-sm mx-auto">
        {([
          { key: 'browse', label: 'تصفح' },
          { key: 'community', label: `المجتمع${userPoems.length > 0 ? ` (${userPoems.length})` : ''}` },
          { key: 'write', label: 'اكتب' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-brand-gold text-black' : 'text-brand-cream/60 hover:text-brand-cream'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Browse tab */}
      {tab === 'browse' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'primary' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="space-y-6">
            {filteredPoems.map((poem) => (
              <StaticPoemCard key={poem.id} poem={poem} />
            ))}
          </div>
        </div>
      )}

      {/* Community tab */}
      {tab === 'community' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-brand-gold">قصائد المجتمع</h2>
            <Button onClick={() => setTab('write')}>+ نشر قصيدة</Button>
          </div>

          {userPoems.length === 0 ? (
            <Card className="text-center py-12 space-y-4">
              <p className="text-brand-cream/50 text-lg">لا توجد قصائد بعد</p>
              <p className="text-brand-cream/30 text-sm">كن أول من ينشر قصيدة في مجتمع ذِكر</p>
              <Button onClick={() => setTab('write')}>اكتب أول قصيدة</Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {userPoems.map((poem) => (
                <UserPoemCard
                  key={poem.id}
                  poem={poem}
                  onLike={toggleLike}
                  onDelete={deletePoem}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Write tab */}
      {tab === 'write' && (
        <Card className="max-w-2xl mx-auto space-y-5 border-brand-gold/30">
          <h2 className="text-2xl font-bold text-brand-gold text-center">انشر قصيدتك</h2>
          <p className="text-sm text-center text-brand-cream/50">شارك إبداعك مع مجتمع ذِكر</p>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm text-brand-cream/70" htmlFor="poemTitle">عنوان القصيدة *</label>
              <input
                id="poemTitle"
                value={poemTitle}
                onChange={(e) => setPoemTitle(e.target.value)}
                placeholder="أدخل عنوان قصيدتك..."
                className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream placeholder:text-brand-cream/30 focus:border-brand-gold focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm text-brand-cream/70" htmlFor="poetName">اسم الشاعر (اختياري)</label>
              <input
                id="poetName"
                value={poetName}
                onChange={(e) => setPoetName(e.target.value)}
                placeholder="اسمك أو 'مجهول'"
                className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream placeholder:text-brand-cream/30 focus:border-brand-gold focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm text-brand-cream/70" htmlFor="poemContent">
                نص القصيدة *
                <span className="mr-2 text-brand-cream/30">{poemContent.length}/1000</span>
              </label>
              <textarea
                id="poemContent"
                value={poemContent}
                onChange={(e) => setPoemContent(e.target.value.slice(0, 1000))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault();
                }}
                placeholder="اكتب أبياتك هنا..."
                rows={10}
                dir="rtl"
                className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-4 text-brand-cream placeholder:text-brand-cream/30 focus:border-brand-gold focus:outline-none resize-none font-arabic text-lg leading-relaxed"
              />
            </div>

            {submitError && (
              <p className="text-sm text-red-400">{submitError}</p>
            )}

            <div className="flex gap-3">
              <Button onClick={handlePublish} className="flex-1">
                نشر القصيدة
              </Button>
              <Button variant="ghost" onClick={() => { setPoemTitle(''); setPoetName(''); setPoemContent(''); setSubmitError(''); }}>
                مسح
              </Button>
            </div>
          </div>
        </Card>
      )}
    </Container>
  );
}
