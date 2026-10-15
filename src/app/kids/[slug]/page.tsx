"use client";
export const dynamic = "force-dynamic";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KidsShare } from "@/features/kids/components/kids-share";
import { KidsWorldGameShell } from "@/features/kids/components/games/game-shell";
import { parseGameContentMetadata } from "@/lib/games/registry";
import { useLanguage } from "@/components/layout/language-provider";
import {
  getKidsItemBySlug,
  normalizeKidsContentRow,
} from "@/features/kids/data/content";

type QuizQuestion = {
  text: string;
  options: string[];
  correctAnswer: number;
  textEn?: string;
  optionsEn?: string[];
};

type QuizData = {
  questions: QuizQuestion[];
};

interface KidsContent {
  id: string;
  title_ar: string;
  title_en: string;
  content_ar?: string;
  content_en?: string;
  type: string;
  age_group: string;
  featured_image_url?: string;
  video_url?: string;
  quiz_data?: unknown;
  metadata?: {
    reward?: string;
    memorizationTarget?: string;
    durationDays?: number;
    dailyPlan?: string[];
    reviewPlan?: string[];
    activitySteps?: string[];
    familyPrompt?: string;
    value?: string;
    gameType?: string;
    category?: string;
    summary_ar?: string;
    safetyNote?: string;
    objective?: string;
    gameId?: string;
    version?: number;
    difficulty?: "easy" | "normal" | "hard";
  } | null;
}

const typeLabels: Record<string, string> = {
  story: "قصة",
  prayer: "دعاء",
  wudu: "الوضوء",
  quiz: "اختبار",
  game: "لعبة",
  video: "فيديو",
  memorize: "حفظ",
  puzzle: "لغز",
  coloring: "تلوين",
  matching: "توصيل",
};

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (!value || typeof value !== "object") return false;
  const q = value as Partial<QuizQuestion>;
  return (
    typeof q.text === "string" &&
    Array.isArray(q.options) &&
    q.options.every(o => typeof o === "string") &&
    typeof q.correctAnswer === "number"
  );
}

function getQuizQuestions(quizData: unknown, isEnglish: boolean): QuizQuestion[] {
  if (!quizData || typeof quizData !== "object") return [];
  const d = quizData as Partial<QuizData>;
  if (!Array.isArray(d.questions)) return [];
  if (!isEnglish) return d.questions.filter(isQuizQuestion);
  return d.questions
    .filter(isQuizQuestion)
    .filter((q) => typeof q.textEn === "string" && Array.isArray(q.optionsEn) && q.optionsEn.every((option) => typeof option === "string"))
    .map((q) => ({ ...q, text: q.textEn as string, options: q.optionsEn as string[] }));
}

function toDetailContent(row: unknown): KidsContent | null {
  const item = normalizeKidsContentRow(row as Parameters<typeof normalizeKidsContentRow>[0]);
  return item
    ? {
        id: item.id,
        title_ar: item.title_ar,
        title_en: item.title_en,
        content_ar: item.content_ar,
        content_en: item.content_en,
        type: item.type,
        age_group: item.age_group,
        featured_image_url: item.featured_image_url,
        video_url: item.video_url,
        quiz_data: item.quiz_data,
        metadata: item.metadata,
      }
    : null;
}

export default function KidsDetailPage() {
  const { isEnglish } = useLanguage();
  const params = useParams();
  const rawSlug = params.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const contentSlug = slug ?? "";
  const [content, setContent] = useState<KidsContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const quizQuestions = useMemo(
    () => getQuizQuestions(content?.quiz_data, isEnglish),
    [content?.quiz_data, isEnglish]
  );
  const gameConfig = content?.type === "game" ? parseGameContentMetadata(content.metadata) : null;
  const isLegacyGameActivity = content?.type === "game" && !gameConfig;

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    const fetchContent = async () => {
      try {
        setLoading(true);
        setContent(null);
        setQuizAnswers({});
        setQuizSubmitted(false);

        const response = await fetch(
          `/api/kids/content/${encodeURIComponent(slug)}`,
          {
            signal: controller.signal,
            headers: { Accept: "application/json" },
            cache: "no-store",
          },
        );

        if (response.ok) {
          const payload = await response.json();
          const normalized = toDetailContent(payload);
          if (normalized && active) {
            setContent(normalized);
            return;
          }
        }

        const staticItem = getKidsItemBySlug(slug);
        if (active) setContent(staticItem ? toDetailContent(staticItem) : null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const staticItem = getKidsItemBySlug(slug);
        if (active) setContent(staticItem ? toDetailContent(staticItem) : null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchContent();

    return () => {
      active = false;
      controller.abort();
    };
  }, [slug, isEnglish]);

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    if (!quizSubmitted) {
      setQuizAnswers(cur => ({ ...cur, [questionIndex]: answerIndex }));
    }
  };

  const calculateQuizScore = () => {
    if (quizQuestions.length === 0) return 0;
    const correct = quizQuestions.filter(
      (q, i) => quizAnswers[i] === q.correctAnswer
    ).length;
    return Math.round((correct / quizQuestions.length) * 100);
  };

  if (loading) {
    return (
      <Container className="py-12">
        <p className="text-center text-brand-cream/70">{isEnglish ? "Loading..." : "جاري التحميل..."}</p>
      </Container>
    );
  }
  if (!slug || !content) {
    return (
      <Container className="py-12">
        <p className="text-center text-brand-cream/70">
          {isEnglish ? "This content is not available in English yet." : "لم يتم العثور على المحتوى"}
        </p>
      </Container>
    );
  }

  return (
    <Container className="py-12 space-y-8 max-w-3xl" dir={isEnglish ? "ltr" : "rtl"}>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">
          {isEnglish ? content.title_en : content.title_ar}
        </h1>
        <div className="flex justify-center gap-3">
          <span className="px-3 py-1 bg-brand-gold/20 text-brand-gold rounded-full">
            {isEnglish ? ({
              story: "Story", prayer: "Dua", wudu: "Wudu", quiz: "Quiz", game: "Game", video: "Video",
              memorize: "Memorization", puzzle: "Puzzle", coloring: "Coloring", matching: "Matching",
            }[content.type] ?? "Content") : (typeLabels[content.type] ?? "محتوى")}
          </span>
        </div>
      </div>

      {content.type === "game" && (
        gameConfig ? (
          <KidsWorldGameShell gameId={gameConfig.gameId} initialDifficulty={gameConfig.difficulty} />
        ) : (
          <Card className="space-y-4 border-brand-gold/25 bg-brand-gold/5 p-6">
            <h2 className="text-xl font-bold text-brand-gold">
              {isEnglish ? "Learning activity" : "نشاط تعليمي"}
            </h2>
            <p className="text-sm leading-7 text-brand-cream/75">
              {isEnglish
                ? "This activity uses the original learning instructions. Follow the steps below with a parent or trusted adult when needed."
                : "هذا النشاط من المحتوى التعليمي الأصلي. اتبع الخطوات التالية، واستعن بولي الأمر عند الحاجة."}
            </p>
            {!isEnglish && content.metadata?.objective && (
              <p className="leading-7 text-brand-cream/85">
                <strong className="text-brand-gold">الهدف: </strong>
                {content.metadata.objective}
              </p>
            )}
            {!isEnglish && (content.metadata?.category || content.metadata?.value || content.metadata?.reward) && (
              <div className="flex flex-wrap gap-2 text-xs text-brand-cream/75">
                {content.metadata.category && <span className="rounded-full border border-brand-gold/20 px-3 py-1">{content.metadata.category}</span>}
                {content.metadata.value && <span className="rounded-full border border-brand-emerald/20 px-3 py-1">{content.metadata.value}</span>}
                {content.metadata.reward && <span className="rounded-full border border-brand-gold/20 px-3 py-1">المكافأة: {content.metadata.reward}</span>}
              </div>
            )}
            {!isEnglish && content.metadata?.safetyNote && (
              <p className="text-sm leading-7 text-amber-200/80">تنبيه السلامة: {content.metadata.safetyNote}</p>
            )}
            {!isEnglish && content.metadata?.memorizationTarget && (
              <p className="text-sm leading-7 text-brand-cream/85">
                <strong className="text-brand-gold">هدف الحفظ: </strong>
                {content.metadata.memorizationTarget}
              </p>
            )}
            {!isEnglish && content.metadata?.durationDays && (
              <p className="text-sm text-brand-cream/70">المدة المقترحة: {content.metadata.durationDays} يومًا</p>
            )}
            {!isEnglish && Array.isArray(content.metadata?.dailyPlan) && content.metadata.dailyPlan.length > 0 && (
              <div>
                <h3 className="mb-2 font-bold text-brand-gold">خطة النشاط اليومية</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm leading-7 text-brand-cream/85">
                  {content.metadata.dailyPlan.map((step, index) => (
                    <li key={String(index)}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {!isEnglish && Array.isArray(content.metadata?.reviewPlan) && content.metadata.reviewPlan.length > 0 && (
              <div>
                <h3 className="mb-2 font-bold text-brand-gold">خطة المراجعة</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm leading-7 text-brand-cream/85">
                  {content.metadata.reviewPlan.map((step, index) => (
                    <li key={String(index)}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {!isEnglish && Array.isArray(content.metadata?.activitySteps) && content.metadata.activitySteps.length > 0 && (
              <ol className="list-decimal list-inside space-y-2 text-sm leading-7 text-brand-cream/85">
                {content.metadata.activitySteps.map((step, index) => (
                  <li key={String(index)}>{step}</li>
                ))}
              </ol>
            )}
            {!isEnglish && content.metadata?.familyPrompt && (
              <p className="rounded-xl border border-brand-emerald/25 bg-brand-emerald/5 p-3 text-sm leading-7 text-brand-cream/80">
                <strong className="text-brand-emerald">{isEnglish ? "Family prompt: " : "سؤال للأسرة: "}</strong>
                {content.metadata.familyPrompt}
              </p>
            )}
          </Card>
        )
      )}

      {(content.type !== "game" || isLegacyGameActivity) && content.featured_image_url && (
        <div className="w-full h-96 rounded-lg overflow-hidden">
          <Image
            src={content.featured_image_url}
            alt={isEnglish ? content.title_en : content.title_ar}
            width={800}
            height={600}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {content.type === "video" && content.video_url && (
        <div className="w-full aspect-video rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={content.video_url}
            title={isEnglish ? content.title_en : content.title_ar}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {(content.type !== "game" || isLegacyGameActivity) && (isEnglish ? content.content_en : content.content_ar) && (
        <Card className="p-8 bg-black/30 border-brand-gold/30">
          <p
            dir={isEnglish ? "ltr" : "rtl"}
            className="whitespace-pre-wrap text-lg text-brand-cream leading-relaxed"
          >
            {isEnglish ? content.content_en : content.content_ar}
          </p>
        </Card>
      )}

      {!isEnglish && content.type !== "game" && content.metadata && (
          <Card className="p-6 space-y-5 bg-brand-gold/10 border-brand-gold/30">
            <h2 className="text-2xl font-bold text-brand-gold text-center">
              بطاقة التعلم والتشجيع
            </h2>
            <div className="grid gap-4 md:grid-cols-2" dir="rtl">
              {content.metadata.category && (
                <div className="rounded-lg border border-brand-gold/20 p-4">
                  <p className="text-sm text-brand-cream/60">المجال</p>
                  <strong className="text-brand-gold">{content.metadata.category}</strong>
                </div>
              )}
              {content.metadata.value && (
                <div className="rounded-lg border border-brand-gold/20 p-4">
                  <p className="text-sm text-brand-cream/60">القيمة التي نتدرب عليها</p>
                  <strong className="text-brand-gold">{content.metadata.value}</strong>
                </div>
              )}
              {content.metadata.memorizationTarget && (
                <div className="rounded-lg border border-brand-gold/20 p-4">
                  <p className="text-sm text-brand-cream/60">هدف الحفظ</p>
                  <strong className="text-brand-gold">
                    {content.metadata.memorizationTarget}
                  </strong>
                </div>
              )}
              {content.metadata.reward && (
                <div className="rounded-lg border border-brand-gold/20 p-4">
                  <p className="text-sm text-brand-cream/60">المكافأة</p>
                  <strong className="text-brand-gold">{content.metadata.reward}</strong>
                </div>
              )}
              {content.metadata.objective && (
                <div className="rounded-lg border border-brand-gold/20 p-4">
                  <p className="text-sm text-brand-cream/60">هدف النشاط</p>
                  <strong className="text-brand-gold">{content.metadata.objective}</strong>
                </div>
              )}
            </div>
            {Array.isArray(content.metadata.activitySteps) && content.metadata.activitySteps.length > 0 && (
              <div dir="rtl">
                <h3 className="font-bold text-brand-gold mb-2">خطوات النشاط</h3>
                <ol className="list-decimal list-inside text-brand-cream/80 space-y-1">
                  {content.metadata.activitySteps.map(step => <li key={step}>{step}</li>)}
                </ol>
              </div>
            )}
            {content.metadata.familyPrompt && (
              <div dir="rtl" className="rounded-lg border border-brand-emerald/30 bg-brand-emerald/10 p-4 text-brand-cream/80">
                <h3 className="font-bold text-brand-emerald mb-1">سؤال للعائلة</h3>
                <p>{content.metadata.familyPrompt}</p>
              </div>
            )}
            {content.metadata.safetyNote && (
              <p dir="rtl" className="text-sm leading-relaxed text-amber-200/80">تنبيه السلامة: {content.metadata.safetyNote}</p>
            )}
            {Array.isArray(content.metadata.dailyPlan) &&
              content.metadata.dailyPlan.length > 0 && (
                <div dir="rtl">
                  <h3 className="font-bold text-brand-gold mb-2">
                    خطوات اليوم
                  </h3>
                  <ul className="list-disc list-inside text-brand-cream/80 space-y-1">
                    {content.metadata.dailyPlan.map(step => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            {Array.isArray(content.metadata.reviewPlan) &&
              content.metadata.reviewPlan.length > 0 && (
                <div dir="rtl">
                  <h3 className="font-bold text-brand-gold mb-2">
                    خطة المراجعة
                  </h3>
                  <ul className="list-disc list-inside text-brand-cream/80 space-y-1">
                    {content.metadata.reviewPlan.map(step => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
          </Card>
        )}

      {(content.type === "quiz" || (isLegacyGameActivity && quizQuestions.length > 0)) && (
        <Card className="p-8 space-y-6 bg-black/30 border-brand-gold/30">
          <h2 className="text-2xl font-bold text-brand-gold text-center">{isEnglish ? "Test your knowledge" : "اختبر معلوماتك"}</h2>
          {quizQuestions.length === 0 ? (
            <p className="text-center text-brand-cream/60">
              {isEnglish ? "No English questions are available for this quiz yet." : "لا توجد أسئلة صالحة لهذا الاختبار حاليًا."}
            </p>
          ) : (
            <>
              <div className="space-y-6">
                {quizQuestions.map((question, qIdx) => (
                  <div
                    key={qIdx}
                    className="space-y-3 p-4 border border-brand-gold/20 rounded-lg"
                  >
                    <p className="font-bold text-brand-gold text-lg">
                      {qIdx + 1}. {question.text}
                    </p>
                    <div className="space-y-2">
                      {question.options.map((option, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() => handleQuizAnswer(qIdx, oIdx)}
                          disabled={quizSubmitted}
                          className={`w-full p-3 text-right rounded-lg border transition-colors ${
                            quizSubmitted && oIdx === question.correctAnswer
                              ? "bg-green-500/30 border-green-500"
                              : quizSubmitted && quizAnswers[qIdx] === oIdx
                                ? "bg-red-500/30 border-red-500"
                                : quizAnswers[qIdx] === oIdx
                                  ? "bg-brand-gold/30 border-brand-gold"
                                  : "bg-black/30 border-brand-gold/20 hover:border-brand-gold/50"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {!quizSubmitted ? (
                <Button
                  onClick={() => setQuizSubmitted(true)}
                  className="w-full"
                  variant="primary"
                >
                  {isEnglish ? "Submit answers" : "تقديم الإجابات"}
                </Button>
              ) : (
                <div className="text-center space-y-3 p-4 bg-brand-gold/10 rounded-lg">
                  <p className="text-2xl font-bold text-brand-gold">
                    {isEnglish ? "Score: " : "النتيجة: "}{calculateQuizScore()}%
                  </p>
                  <Button
                    onClick={() => {
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                    }}
                    variant="outline"
                  >
                    {isEnglish ? "Try again" : "إعادة المحاولة"}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      <KidsShare
        title={content.title_ar}
        description={content.content_ar?.substring(0, 100)}
        slug={contentSlug}
        type={content.type}
        imageUrl={content.featured_image_url}
      />

      <Card className="p-6 text-center space-y-3 bg-brand-gold/10">
        <h3 className="text-xl font-bold text-brand-gold">تعلم بسهولة</h3>
        <p className="text-brand-cream/90">
          هذا المحتوى مصمم خصيصاً لمساعدتك على تعلم أساسيات الإسلام بطريقة ممتعة
          وسهلة
        </p>
      </Card>
    </Container>
  );
}
