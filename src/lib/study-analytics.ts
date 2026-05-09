"use client";

export const ANALYTICS_UPDATED_EVENT = "studyflow:analytics-updated";

export type PlannerTask = {
  title: string;
  due: string;
  dueDate: string;
  done: boolean;
};

export type QuizResult = {
  id: string;
  score: number;
  total: number;
  completedAt: string;
};

export type FocusLog = {
  date: string;
  seconds: number;
};

export type StudySubject = {
  id: string;
  name: string;
  progress: number;
  timeSpent: string;
  notes: string;
  updatedAt: string;
};

export type StudyNote = {
  id: string;
  title: string;
  subject: string;
  body: string;
  starred: boolean;
  updatedAt: string;
};

const STORAGE_KEYS = {
  plannerTasks: "studyflow:planner-tasks",
  quizResults: "studyflow:quiz-results",
  focusLogs: "studyflow:focus-logs",
  subjects: "studyflow:subjects",
  notes: "studyflow:notes",
};

const storageKeyToBackendKey: Record<string, string> = {
  [STORAGE_KEYS.plannerTasks]: "plannerTasks",
  [STORAGE_KEYS.quizResults]: "quizResults",
  [STORAGE_KEYS.focusLogs]: "focusLogs",
  [STORAGE_KEYS.subjects]: "subjects",
  [STORAGE_KEYS.notes]: "notes",
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(key, JSON.stringify(value));
  const backendKey = storageKeyToBackendKey[key];
  if (backendKey) {
    fetch("/api/study-data", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: backendKey, value }),
    }).catch(() => {
      // Keep local data available if the network or MongoDB is temporarily unavailable.
    });
  }
  window.dispatchEvent(new Event(ANALYTICS_UPDATED_EVENT));
}

export function hydrateStudyData(data: Partial<{
  plannerTasks: PlannerTask[];
  quizResults: QuizResult[];
  focusLogs: FocusLog[];
  subjects: StudySubject[];
  notes: StudyNote[];
}>) {
  if (typeof window === "undefined") return;

  const entries = [
    [STORAGE_KEYS.plannerTasks, data.plannerTasks],
    [STORAGE_KEYS.quizResults, data.quizResults],
    [STORAGE_KEYS.focusLogs, data.focusLogs],
    [STORAGE_KEYS.subjects, data.subjects],
    [STORAGE_KEYS.notes, data.notes],
  ] as const;

  entries.forEach(([key, value]) => {
    if (value) window.localStorage.setItem(key, JSON.stringify(value));
  });

  window.dispatchEvent(new Event(ANALYTICS_UPDATED_EVENT));
}

export function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function readPlannerTasks(fallback: PlannerTask[] = []) {
  return readJson<PlannerTask[]>(STORAGE_KEYS.plannerTasks, fallback);
}

export function savePlannerTasks(tasks: PlannerTask[]) {
  writeJson(STORAGE_KEYS.plannerTasks, tasks);
}

export function readQuizResults() {
  return readJson<QuizResult[]>(STORAGE_KEYS.quizResults, []);
}

export function recordQuizResult(score: number, total: number) {
  const results = readQuizResults();

  writeJson(STORAGE_KEYS.quizResults, [
    {
      id: crypto.randomUUID(),
      score,
      total,
      completedAt: new Date().toISOString(),
    },
    ...results,
  ].slice(0, 50));
}

export function readFocusLogs() {
  return readJson<FocusLog[]>(STORAGE_KEYS.focusLogs, []);
}

export function recordFocusSeconds(seconds: number) {
  if (seconds <= 0) return;

  const todayKey = toDateKey(new Date());
  const logs = readFocusLogs();
  const existingLog = logs.find((log) => log.date === todayKey);
  const nextLogs = existingLog
    ? logs.map((log) => log.date === todayKey ? { ...log, seconds: log.seconds + seconds } : log)
    : [{ date: todayKey, seconds }, ...logs];

  writeJson(STORAGE_KEYS.focusLogs, nextLogs.slice(0, 90));
}

export function readStudySubjects(fallback: StudySubject[] = []) {
  return readJson<StudySubject[]>(STORAGE_KEYS.subjects, fallback);
}

export function saveStudySubjects(subjects: StudySubject[]) {
  writeJson(STORAGE_KEYS.subjects, subjects);
}

export function readStudyNotes(fallback: StudyNote[] = []) {
  return readJson<StudyNote[]>(STORAGE_KEYS.notes, fallback);
}

export function saveStudyNotes(notes: StudyNote[]) {
  writeJson(STORAGE_KEYS.notes, notes);
}
