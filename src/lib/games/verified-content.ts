import { kidsContent, type KidsQuizQuestion } from "@/features/kids/data/content";

export type VerifiedQuizQuestion = KidsQuizQuestion & {
  category: string;
  sourceSlug: string;
};

function isQuestion(value: unknown): value is KidsQuizQuestion {
  if (!value || typeof value !== "object") return false;
  const question = value as Partial<KidsQuizQuestion>;
  const options = question.options;
  const correctAnswer = question.correctAnswer;
  return (
    typeof question.text === "string" &&
    question.text.length > 0 &&
    Array.isArray(options) &&
    options.length >= 2 &&
    options.every(option => typeof option === "string") &&
    typeof correctAnswer === "number" &&
    Number.isInteger(correctAnswer) &&
    correctAnswer >= 0 &&
    correctAnswer < options.length
  );
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

export type VerifiedWuduStep = {
  order: number;
  text: string;
};

export type WuduStep = VerifiedWuduStep;

export type VerifiedWuduContent = {
  steps: VerifiedWuduStep[];
  afterDhikr: string;
};

export function getVerifiedWuduContent(): VerifiedWuduContent {
  const source = kidsContent.find(item => item.slug === "wudu-steps");
  const steps = source?.wudu_steps?.filter(
    step =>
      Number.isInteger(step.order) &&
      step.order >= 1 &&
      typeof step.text === "string" &&
      step.text.trim().length > 0
  ) ?? [];

  return {
    steps,
    afterDhikr:
      typeof source?.wudu_after_dhikr === "string" ? source.wudu_after_dhikr : "",
  };
}

export function getVerifiedWuduSteps(): VerifiedWuduStep[] {
  return getVerifiedWuduContent().steps;
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


export function getApprovedRoadQuestions(): VerifiedQuizQuestion[] {
  const sourceSlugs = ["game-scenario-smart-choice", "quiz-akhlaq-adventure", "quiz-akhlaq-daily-life"] as const;
  return sourceSlugs.flatMap(sourceSlug => {
    const source = kidsContent.find(item => item.slug === sourceSlug);
    const questions = source?.quiz_data?.questions?.filter(isQuestion) ?? [];
    return questions.map(question => ({
      ...question,
      category: source?.metadata?.category ?? "الأخلاق والمهارات",
      sourceSlug,
    }));
  });
}


export type VerifiedMemoryPair = {
  id: string;
  situation: string;
  dhikr: string;
};

export function getVerifiedMemoryPairs(): VerifiedMemoryPair[] {
  const source = kidsContent.find(item => item.slug === "game-memory-dhikr-cards");
  return source?.memory_pairs?.filter(
    pair =>
      typeof pair.id === "string" &&
      typeof pair.situation === "string" &&
      pair.situation.trim().length > 0 &&
      typeof pair.dhikr === "string" &&
      pair.dhikr.trim().length > 0
  ) ?? [];
}
