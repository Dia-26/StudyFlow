import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { safeJsonParse } from "@/lib/safeJson";
import { pushAiLog } from "@/lib/aiResponseLog";

type Subject = {
  name: string;
  progress: number;
  timeSpent: string;
  notes: string;
};

type PlannerTask = {
  title: string;
  due: string;
  done: boolean;
};

type QuizResult = {
  score: number;
  total: number;
  completedAt: string;
};

type FocusLog = {
  date: string;
  seconds: number;
};

type StudyPlanRequest = {
  subjects: Subject[];
  plannerTasks: PlannerTask[];
  quizResults: QuizResult[];
  focusLogs: FocusLog[];
};

function fallbackPlan(data: StudyPlanRequest) {
  const weakestSubject = [...data.subjects].sort((a, b) => a.progress - b.progress)[0];
  const pendingTasks = data.plannerTasks.filter((task) => !task.done);
  const latestQuiz = data.quizResults[0];
  const weeklyFocusSeconds = data.focusLogs.reduce((total, log) => total + log.seconds, 0);
  const weeklyFocusMinutes = Math.round(weeklyFocusSeconds / 60);
  const quizPercent = latestQuiz ? Math.round((latestQuiz.score / latestQuiz.total) * 100) : null;

  return {
    summary: weakestSubject
      ? `Your next best move is to spend focused time on ${weakestSubject.name}, because it has the lowest saved progress.`
      : "Add a few subjects and tasks so the coach can personalize your study plan.",
    priorities: [
      weakestSubject
        ? `Run a 25-minute focus block for ${weakestSubject.name}. Target the notes: ${weakestSubject.notes}`
        : "Create your first subject with progress and notes.",
      pendingTasks[0]
        ? `Finish planner task: ${pendingTasks[0].title}.`
        : "Add one concrete planner task for today.",
      quizPercent !== null && quizPercent < 80
        ? `Retake or review your last quiz because the latest score was ${quizPercent}%.`
        : "Generate a quiz from your active material to check recall.",
    ],
    focusPlan: weeklyFocusMinutes > 0
      ? `You have logged ${weeklyFocusMinutes} focus minutes recently. Add one more short review session today.`
      : "Start Pomodoro and complete one focus session to begin tracking study consistency.",
    source: "fallback",
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as StudyPlanRequest;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(fallbackPlan(data));
    }

    try {
      const groq = new Groq({ apiKey });
      const prompt = `You are StudyFlow's AI study coach. STRICTLY RETURN VALID JSON ONLY. Do NOT include explanations, no markdown, no code fences. Return only JSON adhering to this shape exactly:
    { "summary": "one sentence", "priorities": ["three concrete actions"], "focusPlan": "one short focus-time recommendation", "source": "ai" }
    \nData:\n${JSON.stringify(data).slice(0, 12000)}`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      const raw = completion.choices[0]?.message?.content || "";
      console.error("StudyPlan - raw AI response:", raw);

      const { data: parsed } = safeJsonParse(raw) as { data: any };

      // Log the AI response regardless of validity
      try {
        pushAiLog({ route: 'study-plan', raw, parsed: parsed ?? null, error: parsed ? null : 'invalid_json' });
      } catch (logErr) {
        console.warn('Failed to push AI log', logErr);
      }

      if (
        parsed &&
        typeof parsed.summary === "string" &&
        Array.isArray(parsed.priorities) &&
        parsed.priorities.every((item: unknown) => typeof item === "string") &&
        typeof parsed.focusPlan === "string"
      ) {
        return NextResponse.json({ ...parsed, source: "ai" });
      }

      console.error("Study plan AI returned invalid JSON", { raw, parsed });
    } catch (error: unknown) {
      console.error("Study plan AI failed, using fallback:", getErrorMessage(error));
    }

    return NextResponse.json(fallbackPlan(data));
  } catch (error: unknown) {
    console.error("Study plan API error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
