import type { KidsQuizQuestion } from "../data/content";

export type KidsQuizData = { questions: KidsQuizQuestion[] };

function invalidQuiz(): never {
  throw new Error(
    "بيانات اللعبة / الاختبار يجب أن تحتوي على سؤال صحيح وخيارين على الأقل وإجابة صحيحة ضمن الاختيارات.",
  );
}

export function parseKidsQuizData(raw: string | null): KidsQuizData | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return invalidQuiz();
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return invalidQuiz();
  }

  const questions = (parsed as { questions?: unknown }).questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    return invalidQuiz();
  }

  const normalized: KidsQuizQuestion[] = [];
  for (const value of questions) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return invalidQuiz();
    }
    const question = value as Record<string, unknown>;
    const text = typeof question.text === "string" ? question.text.trim() : "";
    const options = Array.isArray(question.options)
      ? question.options.map((option) => typeof option === "string" ? option.trim() : "")
      : [];
    const correctAnswer = question.correctAnswer;

    if (
      !text ||
      options.length < 2 ||
      options.some((option) => !option) ||
      typeof correctAnswer !== "number" ||
      !Number.isInteger(correctAnswer) ||
      correctAnswer < 0 ||
      correctAnswer >= options.length
    ) {
      return invalidQuiz();
    }

    const textEn = question.textEn;
    const optionsEn = question.optionsEn;
    if (
      (textEn !== undefined || optionsEn !== undefined) &&
      (typeof textEn !== "string" ||
        !textEn.trim() ||
        !Array.isArray(optionsEn) ||
        optionsEn.length !== options.length ||
        optionsEn.some((option) => typeof option !== "string" || !option.trim()))
    ) {
      return invalidQuiz();
    }

    normalized.push({
      text,
      options,
      correctAnswer,
      ...(typeof textEn === "string" ? { textEn: textEn.trim() } : {}),
      ...(Array.isArray(optionsEn)
        ? { optionsEn: optionsEn.map((option) => String(option).trim()) }
        : {}),
    });
  }

  return { questions: normalized };
}
/**
 * Normalize legacy and database quiz rows for the public player. Older rows may
 * predate the admin parser, so the renderer must independently reject empty or
 * mismatched English translations instead of showing a blank question.
 */
export function getKidsQuizQuestions(quizData: unknown, isEnglish: boolean): KidsQuizQuestion[] {
  if (!quizData || typeof quizData !== "object" || Array.isArray(quizData)) return [];
  const questions = (quizData as { questions?: unknown }).questions;
  if (!Array.isArray(questions)) return [];

  return questions.flatMap((value): KidsQuizQuestion[] => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const question = value as Record<string, unknown>;
    const text = typeof question.text === "string" ? question.text.trim() : "";
    const options = Array.isArray(question.options)
      ? question.options.map((option) => typeof option === "string" ? option.trim() : "")
      : [];
    const correctAnswer = question.correctAnswer;

    if (
      !text ||
      options.length < 2 ||
      options.some((option) => !option) ||
      typeof correctAnswer !== "number" ||
      !Number.isInteger(correctAnswer) ||
      correctAnswer < 0 ||
      correctAnswer >= options.length
    ) return [];

    if (!isEnglish) return [{ text, options, correctAnswer }];

    const textEn = typeof question.textEn === "string" ? question.textEn.trim() : "";
    const optionsEn = Array.isArray(question.optionsEn)
      ? question.optionsEn.map((option) => typeof option === "string" ? option.trim() : "")
      : [];
    if (!textEn || optionsEn.length !== options.length || optionsEn.some((option) => !option)) return [];

    return [{ text: textEn, options: optionsEn, correctAnswer }];
  });
}
