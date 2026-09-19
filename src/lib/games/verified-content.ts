import { kidsContent, type KidsQuizQuestion } from "@/features/kids/data/content";

export type VerifiedQuizQuestion = KidsQuizQuestion & {
  category: string;
  sourceSlug: string;
};

export type WuduStep = {
  order: number;
  text: string;
};

function isQuestion(value: unknown): value is KidsQuizQuestion {
  if (!value || typeof value !== "object") return false;
  const question = value as Partial<KidsQuizQuestion>;
  const options = question.options;
  const correctAnswer = question.correctAnswer;
  return typeof question.text === "string" && question.text.length > 0 && Array.isArray(options)
    && options.length >= 2 && options.every(option => typeof option === "string")
    && typeof correctAnswer === "number" && Number.isInteger(correctAnswer)
    && correctAnswer >= 0 && correctAnswer < options.length;
}

export function getVerifiedKidsQuizQuestions(): VerifiedQuizQuestion[] {
  return kidsContent.flatMap(item => {
    const questions = item.quiz_data?.questions?.filter(isQuestion) ?? [];
    if (questions.length === 0) return [];
    return questions.map(question => ({
      ...question,
      category: item.metadata?.category ?? item.title_ar,
      sourceSlug: item.slug,
    }));
  });
}

export function getVerifiedWuduSteps(): WuduStep[] {
  const source = kidsContent.find(item => item.slug === "wudu-steps");
  if (!source?.content_ar) return [];
  return source.content_ar
    .split("\n")
    .map(line => line.trim())
    .map(line => {
      const match = line.match(/^(\d+)\.\s+(.+)$/);
      return match ? { order: Number(match[1]), text: match[2] } : null;
    })
    .filter((step): step is WuduStep => Boolean(step))
    .filter(step => step.order >= 1 && step.order <= 9);
}

export function getApprovedScenarioQuestions(): VerifiedQuizQuestion[] {
  const source = kidsContent.find(item => item.slug === "quiz-akhlaq-adventure" || item.slug === "game-scenario-smart-choice");
  const questions = source?.quiz_data?.questions?.filter(isQuestion) ?? [];
  return questions.map(question => ({
    ...question,
    category: source?.metadata?.category ?? "الأخلاق والمهارات",
    sourceSlug: source?.slug ?? "quiz-akhlaq-adventure",
  }));
}
