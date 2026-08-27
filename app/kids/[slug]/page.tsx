"use client";
export const dynamic = "force-dynamic";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KidsShare } from "@/components/kids/kids-share";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { KidsWorldGameShell } from "@/components/kids/games/game-shell";
import { parseGameContentMetadata } from "@/lib/games/registry";
import {
  getKidsItemBySlug,
  normalizeKidsContentRow,
} from "@/lib/data/kids-content";

type QuizQuestion = {
  text: string;
  options: string[];
  correctAnswer: number;
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

function getQuizQuestions(quizData: unknown): QuizQuestion[] {
  if (!quizData || typeof quizData !== "object") return [];
  const d = quizData as Partial<QuizData>;
  if (!Array.isArray(d.questions)) return [];
  return d.questions.filter(isQuizQuestion);
}

function toDetailContent(row: unknown): KidsContent | null {
  const item = normalizeKidsContentRow(row as Parameters<typeof normalizeKidsContentRow>[0]);
  return item
    ? {
        id: item.id,
        title_ar: item.title_ar,
        title_en: item.title_en,
        content_ar: item.content_ar,
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
  const params = useParams();
  const rawSlug = params.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const contentSlug = slug ?? "";
  const [content, setContent] = useState<KidsContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const quizQuestions = useMemo(
    () => getQuizQuestions(content?.quiz_data),
    [content?.quiz_data]
  );
  const gameConfig = content?.type === "game" ? parseGameContentMetadata(content.metadata) : null;

  useEffect(() => {
    const fetchContent = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setContent(null);
        setQuizAnswers({});
        setQuizSubmitted(false);
        const supabase = createBrowserSupabaseClient();
        let result = await supabase
          .from("kids_content")
          .select("*")
          .eq("slug", slug)
          .eq("published", true)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (result.error) {
          result = await supabase
            .from("kids_content")
            .select("*")
            .eq("slug", slug)
            .eq("published", true)
            .limit(1)
            .maybeSingle();
        }

        const normalized = result.data ? toDetailContent(result.data) : null;
        if (normalized) {
          setContent(normalized);
        } else {
          // Fall back to the static content library
          const staticItem = getKidsItemBySlug(slug);
          setContent(staticItem ? toDetailContent(staticItem) : null);
        }
      } catch {
        const staticItem = getKidsItemBySlug(slug ?? "");
        setContent(staticItem ? toDetailContent(staticItem) : null);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [slug]);

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
        <p className="text-center text-brand-cream/70">جاري التحميل...</p>
      </Container>
    );
  }
  if (!slug || !content) {
    return (
      <Container className="py-12">
        <p className="text-center text-brand-cream/70">
          لم يتم العثور على المحتوى
        </p>
      </Container>
    );
  }

  return (
    <Container className="py-12 space-y-8 max-w-3xl">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">
          {content.title_ar}
        </h1>
        <div className="flex justify-center gap-3">
          <span className="px-3 py-1 bg-brand-gold/20 text-brand-gold rounded-full">
            {typeLabels[content.type] ?? "محتوى"}
          </span>
        </div>
      </div>

      {content.type === "game" && (
        gameConfig ? (
          <KidsWorldGameShell gameId={gameConfig.gameId} initialDifficulty={gameConfig.difficulty} />
        ) : (
          <Card className="border-red-400/30 bg-red-950/20 p-6 text-center" role="alert">
            <h2 className="text-xl font-bold text-brand-gold">اللعبة غير متاحة حاليًا</h2>
            <p className="mt-2 text-brand-cream/70">لم يتم العثور على إعداد صالح لهذه اللعبة. جرّب نشاطًا آخر من قسم الأطفال.</p>
          </Card>
        )
      )}

      {content.type !== "game" && content.featured_image_url && (
        <div className="w-full h-96 rounded-lg overflow-hidden">
          <Image
            src={content.featured_image_url}
            alt={content.title_ar}
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
            title={content.title_ar}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {content.type !== "game" && content.content_ar && (
        <Card className="p-8 bg-black/30 border-brand-gold/30">
          <p
            dir="rtl"
            className="whitespace-pre-wrap text-lg text-brand-cream leading-relaxed"
          >
            {content.content_ar}
          </p>
        </Card>
      )}

      {content.type !== "game" && content.metadata && (
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

      {content.type === "quiz" && (
        <Card className="p-8 space-y-6 bg-black/30 border-brand-gold/30">
          <h2 className="text-2xl font-bold text-brand-gold text-center">
            اختبر معلوماتك
          </h2>
          {quizQuestions.length === 0 ? (
            <p className="text-center text-brand-cream/60">
              لا توجد أسئلة صالحة لهذا الاختبار حاليًا.
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
                  تقديم الإجابات
                </Button>
              ) : (
                <div className="text-center space-y-3 p-4 bg-brand-gold/10 rounded-lg">
                  <p className="text-2xl font-bold text-brand-gold">
                    النتيجة: {calculateQuizScore()}%
                  </p>
                  <Button
                    onClick={() => {
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                    }}
                    variant="outline"
                  >
                    إعادة المحاولة
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
