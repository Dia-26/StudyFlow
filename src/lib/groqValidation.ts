type Flashcard = {
  front: string;
  back: string;
};

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type StudyPlan = {
  summary?: unknown;
  priorities?: unknown;
  focusPlan?: unknown;
  source?: unknown;
};

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeFlashcards(value: unknown, limit = 10): Flashcard[] {
  const candidate = Array.isArray(value)
    ? value
    : value && typeof value === "object" && "flashcards" in value && Array.isArray((value as any).flashcards)
      ? (value as any).flashcards
      : [];

  return candidate
    .filter((item: any) => isNonEmptyString(item?.front) && isNonEmptyString(item?.back))
    .map((item: any) => ({ front: item.front.trim(), back: item.back.trim() }))
    .slice(0, limit);
}

export function normalizeQuizQuestions(value: unknown, limit = 5): QuizQuestion[] {
  const candidate = Array.isArray(value)
    ? value
    : value && typeof value === "object" && "questions" in value && Array.isArray((value as any).questions)
      ? (value as any).questions
      : [];

  return candidate
    .filter((item: any) =>
      isNonEmptyString(item?.question) &&
      Array.isArray(item?.options) &&
      item.options.length >= 2 &&
      item.options.every((option: unknown) => isNonEmptyString(option)) &&
      isNonEmptyString(item?.answer) &&
      isNonEmptyString(item?.explanation) &&
      item.options.includes(item.answer),
    )
    .map((item: any) => ({
      question: item.question.trim(),
      options: item.options.map((option: string) => option.trim()).slice(0, 4),
      answer: item.answer.trim(),
      explanation: item.explanation.trim(),
    }))
    .slice(0, limit);
}

export function normalizeStudyPlan(value: unknown) {
  const candidate = value && typeof value === "object" ? (value as StudyPlan) : {};

  const summary = isNonEmptyString(candidate.summary) ? candidate.summary.trim() : "";
  const focusPlan = isNonEmptyString(candidate.focusPlan) ? candidate.focusPlan.trim() : "";
  const priorities = Array.isArray(candidate.priorities)
    ? candidate.priorities.filter(isNonEmptyString).map((item) => item.trim()).slice(0, 3)
    : [];

  if (!summary || !focusPlan || priorities.length === 0) {
    return null;
  }

  return {
    summary,
    priorities,
    focusPlan,
    source: candidate.source === "ai" ? "ai" : "fallback",
  };
}
