'use client';

import { useState } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Video, Globe, Send, CheckCircle } from 'lucide-react';

const contactChannels = [
  { icon: Mail, label: 'البريد الإلكتروني', value: 'zikrmediaofficial@gmail.com', href: 'mailto:zikrmediaofficial@gmail.com', color: 'text-sky-400' },
  { icon: Video, label: 'قناة يوتيوب', value: 'ZIKR | ذِكرٌ', href: 'https://www.youtube.com/@ZikrMediaOfficial', color: 'text-red-400' },
  { icon: Globe, label: 'فيسبوك', value: 'Zikr Media Official', href: 'https://www.facebook.com/zikrmediaofficial1', color: 'text-blue-400' },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('الاسم والبريد الإلكتروني والرسالة مطلوبة.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError('حدث خطأ أثناء الإرسال، حاول مرة أخرى.');
      }
    } catch {
      setError('تعذّر الاتصال بالخادم، حاول لاحقاً.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-[#071A13] to-transparent">
        <Container className="max-w-3xl text-center space-y-4">
          <h1 className="text-5xl font-bold text-brand-gold">تواصل معنا</h1>
          <p className="text-lg leading-8 text-brand-cream/70">
            نسعد باستقبال استفساراتك واقتراحاتك — فريقنا يردّ خلال 24 ساعة.
          </p>
        </Container>
      </section>

      <Container className="max-w-5xl py-12 space-y-12">
        {/* Contact channels */}
        <section>
          <h2 className="text-xl font-bold text-brand-gold mb-6">قنوات التواصل</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contactChannels.map((ch) => (
              <a
                key={ch.label}
                href={ch.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-brand-gold/15 bg-black/20 p-5 text-center space-y-3 hover:border-brand-gold/35 hover:bg-black/30 transition-all"
              >
                <ch.icon className={`w-8 h-8 mx-auto ${ch.color} group-hover:scale-110 transition-transform`} />
                <p className="text-xs font-semibold text-brand-cream/50">{ch.label}</p>
                <p className="text-xs text-brand-gold/70 break-all">{ch.value}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Contact form */}
        <section className="grid md:grid-cols-5 gap-8">
          {/* Info panel */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-brand-gold">متى نردّ؟</h3>
              <ul className="space-y-3 text-sm text-brand-cream/60">
                <li className="flex items-start gap-2">
                  <span className="text-brand-gold shrink-0">◆</span>
                  الاستفسارات التقنية: خلال 24 ساعة
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-gold shrink-0">◆</span>
                  اقتراحات المحتوى: خلال 48 ساعة
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-gold shrink-0">◆</span>
                  الشراكات والإعلانات: خلال أسبوع
                </li>
              </ul>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-brand-gold">أسئلة شائعة</h3>
              <ul className="space-y-3 text-sm text-brand-cream/60">
                <li className="flex items-start gap-2">
                  <span className="text-brand-gold shrink-0">◆</span>
                  المنصة مجانية تماماً
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-gold shrink-0">◆</span>
                  المحتوى موثّق من مصادر معتمدة
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-gold shrink-0">◆</span>
                  ندعم كل الأجهزة والمتصفحات
                </li>
              </ul>
            </Card>
          </div>

          {/* Form */}
          <div className="md:col-span-3">
            <Card className="p-8 space-y-5">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
                  <h3 className="text-xl font-bold text-brand-gold">تم الإرسال بنجاح!</h3>
                  <p className="text-brand-cream/60">شكراً لك، سنردّ عليك في أقرب وقت ممكن.</p>
                  <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                    إرسال رسالة أخرى
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold text-brand-gold">أرسل رسالة</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block space-y-1.5">
                      <span className="text-sm text-brand-cream/60">الاسم *</span>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="اسمك الكريم"
                        className="w-full rounded-xl border border-brand-gold/20 bg-black/30 px-4 py-2.5 text-sm text-brand-cream placeholder:text-brand-cream/30 focus:border-brand-gold/50 focus:outline-none focus:ring-2 focus:ring-brand-gold/10 transition-colors"
                        dir="rtl"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-sm text-brand-cream/60">البريد الإلكتروني *</span>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="email@example.com"
                        className="w-full rounded-xl border border-brand-gold/20 bg-black/30 px-4 py-2.5 text-sm text-brand-cream placeholder:text-brand-cream/30 focus:border-brand-gold/50 focus:outline-none focus:ring-2 focus:ring-brand-gold/10 transition-colors"
                        dir="ltr"
                      />
                    </label>
                  </div>

                  <label className="block space-y-1.5">
                    <span className="text-sm text-brand-cream/60">الموضوع</span>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                      placeholder="موضوع رسالتك"
                      className="w-full rounded-xl border border-brand-gold/20 bg-black/30 px-4 py-2.5 text-sm text-brand-cream placeholder:text-brand-cream/30 focus:border-brand-gold/50 focus:outline-none focus:ring-2 focus:ring-brand-gold/10 transition-colors"
                      dir="rtl"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-sm text-brand-cream/60">الرسالة *</span>
                    <textarea
                      rows={6}
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      placeholder="اكتب رسالتك هنا..."
                      className="w-full rounded-xl border border-brand-gold/20 bg-black/30 px-4 py-2.5 text-sm text-brand-cream placeholder:text-brand-cream/30 focus:border-brand-gold/50 focus:outline-none focus:ring-2 focus:ring-brand-gold/10 resize-none transition-colors"
                      dir="rtl"
                    />
                  </label>

                  {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}

                  <Button type="submit" disabled={loading} className="w-full gap-2">
                    <Send className="w-4 h-4" />
                    {loading ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </section>

        {/* Quran verse */}
        <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center space-y-3">
          <p className="text-xl font-arabic leading-loose text-brand-cream">
            ﴿ وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ ﴾
          </p>
          <p className="text-brand-gold/50 text-sm">سورة المائدة — الآية 2</p>
        </section>
      </Container>
    </main>
  );
}
