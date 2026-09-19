'use client';

import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState, useTransition } from 'react';
import { sendChatMessage, type ChatResult } from './actions';

const QUICK_PROMPTS = [
  'أشعر بالحزن والضيق هذه الأيام ولا أعرف ماذا أفعل',
  'ما حكم الإسلام في الربا والقروض البنكية بالفائدة؟',
  'عندي قلق شديد من المستقبل وأفكاري لا تهدأ',
  'أذنبت كثيرًا وأريد التوبة، كيف أبدأ؟',
  'أحتاج أدعية وأذكار لتيسير الرزق',
  'ما حكم الغيبة والنميمة في الإسلام؟',
  'أريد شرحًا مبسطًا لحديث أو آية مع مصدرها',
  'ما قصة غزوة بدر وما أهم دروسها؟',
];

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  fatwa:    { label: 'فتوى شرعية',      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  spiritual:{ label: 'إرشاد روحاني',    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  dhikr:    { label: 'أذكار ودعاء',     color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  general:  { label: 'معلومة إسلامية',  color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
  result?: ChatResult;
};

export default function SpiritualAIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isPending]);

  const handleSend = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || isPending) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: value };
    setMessages((prev) => [...prev, userMsg]);

    startTransition(async () => {
      const history = [...messages, userMsg]
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));
      try {
        const result = await sendChatMessage(value, history);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: result.message, result },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'تعذر الوصول إلى خدمة الإجابة الآن. حاول مرة أخرى، ويمكنك تصفح مصادر القرآن والحديث في مكتبة ZIKR مباشرة.',
          },
        ]);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>

      {/* ── Header ── */}
      <div className="border-b border-brand-gold/20 bg-black/40 backdrop-blur-sm sticky top-0 z-10">
        <Container className="py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold font-bold text-lg select-none">
            ر
          </div>
          <div>
            <h1 className="text-lg font-bold text-brand-gold">الرفيق الروحاني</h1>
            <p className="text-xs text-brand-cream/50">مساعدك الإسلامي — فتاوى · إرشاد روحاني · أذكار</p>
          </div>
        </Container>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 overflow-y-auto">
        <Container className="py-6 space-y-5">

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="space-y-8">
              <p className="text-center text-brand-cream/60 leading-8 pt-6 max-w-lg mx-auto">
                اسألني في القرآن والتفسير والحديث والسيرة والفقه والأخلاق والأذكار وقصص الأنبياء والغزوات والفتوحات، وسأبحث أولًا في مكتبة ZIKR وأعرض المصادر المتاحة بوضوح.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSend(p)}
                    className="text-right p-4 rounded-xl border border-brand-gold/20 bg-white/[0.03] hover:border-brand-gold/50 hover:bg-brand-gold/5 transition-all text-brand-cream/75 hover:text-brand-cream text-sm leading-7"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              {msg.role === 'user' ? (
                /* User bubble */
                <div className="max-w-[80%] bg-brand-gold/15 border border-brand-gold/25 rounded-2xl rounded-tr-sm px-5 py-3">
                  <p className="text-brand-cream leading-7">{msg.content}</p>
                </div>
              ) : (
                /* Assistant bubble */
                <div className="max-w-[88%] w-full space-y-3">
                  {msg.result?.type && TYPE_BADGE[msg.result.type] && (
                    <div className="flex justify-end">
                      <span className={`text-xs px-3 py-0.5 rounded-full border ${TYPE_BADGE[msg.result.type].color}`}>
                        {TYPE_BADGE[msg.result.type].label}
                      </span>
                    </div>
                  )}

                  <div className="bg-white/[0.05] border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4">
                    <p className="leading-8 text-brand-cream whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Quran verses */}
                  {msg.result?.verses && msg.result.verses.length > 0 && (
                    <div className="space-y-2">
                      {msg.result.verses.map((v, vi) => (
                        <div key={vi} className="border border-brand-gold/25 bg-brand-gold/5 rounded-xl px-4 py-3">
                          <p className="text-brand-gold/90 leading-9 text-lg font-arabic">{v.text}</p>
                          <p className="text-xs text-brand-cream/40 mt-1">{v.reference}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dhikr suggestions */}
                  {msg.result?.dhikr && msg.result.dhikr.length > 0 && (
                    <div className="border border-emerald-500/20 bg-emerald-950/20 rounded-xl px-4 py-3 space-y-2">
                      <p className="text-xs text-emerald-400/70">أذكار مقترحة</p>
                      {msg.result.dhikr.map((d, di) => (
                        <p key={di} className="text-emerald-300/80 leading-7 text-sm">{d}</p>
                      ))}
                    </div>
                  )}

                  {/* Trust and citation metadata */}
                  {(msg.result?.citations?.length || msg.result?.scholarNotice) && (
                    <div className="rounded-xl border border-brand-gold/15 bg-black/25 px-4 py-3 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-brand-gold/80">المراجع والثقة</p>
                        {msg.result?.confidence && (
                          <span className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-0.5 text-[11px] text-brand-cream/70">
                            الثقة: {msg.result.confidence === 'medium' ? 'متوسطة' : msg.result.confidence === 'high' ? 'عالية' : 'منخفضة'}
                          </span>
                        )}
                      </div>
                      {msg.result?.citations && msg.result.citations.length > 0 && (
                        <ul className="space-y-2">
                          {msg.result.citations.map((citation, ci) => (
                            <li key={`${citation.reference}-${ci}`} className="text-xs leading-6 text-brand-cream/55">
                              <span className="text-brand-gold/80">{citation.label}</span> — {citation.url ? (
                                <a href={citation.url} className="text-brand-cream/75 underline decoration-brand-gold/30 underline-offset-2 hover:text-brand-gold">
                                  {citation.reference}
                                </a>
                              ) : citation.reference}
                              <span className="block text-brand-cream/35 line-clamp-2">{citation.source}</span>
                              <span className="block text-[10px] text-brand-cream/25">
                                {citation.authority === 'primary' ? 'مصدر أصلي/نصي' : citation.authority === 'site' ? 'محتوى ZIKR' : 'مصدر مساعد'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {msg.result?.scholarNotice && (
                        <p className="border-t border-white/10 pt-2 text-xs leading-6 text-brand-cream/45">
                          {msg.result.scholarNotice}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isPending && (
            <div className="flex justify-end">
              <div className="bg-white/[0.05] border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4">
                <span className="inline-flex items-center gap-1.5 text-brand-cream/40">
                  <span className="w-1.5 h-1.5 bg-brand-gold/50 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-brand-gold/50 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-brand-gold/50 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </Container>
      </div>

      {/* ── Input bar ── */}
      <div className="sticky bottom-0 border-t border-brand-gold/20 bg-black/80 backdrop-blur-sm">
        <Container className="py-3 space-y-2">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-xs text-brand-cream/30 hover:text-brand-cream/60 transition-colors"
            >
              بدء محادثة جديدة
            </button>
          )}
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك أو ما تشعر به..."
              rows={1}
              disabled={isPending}
              aria-label="رسالتك للرفيق الروحاني"
              className="flex-1 resize-none rounded-xl border border-brand-gold/25 bg-white/5 px-4 py-3 text-brand-cream placeholder:text-brand-cream/30 focus:outline-none focus:border-brand-gold/60 leading-7 max-h-36 overflow-y-auto"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isPending}
              className="shrink-0"
              aria-label="إرسال الرسالة"
            >
              {isPending ? '...' : 'إرسال'}
            </Button>
          </div>
          <p className="text-xs text-brand-cream/20 text-center">
            الإجابات مبنية على المصادر المسترجعة من ZIKR وليست بديلًا عن الفتوى الرسمية أو العالم المتخصص
          </p>
        </Container>
      </div>

    </div>
  );
}
