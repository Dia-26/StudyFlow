import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { safeJsonParse } from "@/lib/safeJson";
import { pushAiLog } from "@/lib/aiResponseLog";

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function splitIntoSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 50);
}

function makeFallbackQuiz(contextText: string, quizNumber: number): QuizQuestion[] {
  const sentences = splitIntoSentences(contextText);
  const fallbackSentences = sentences.length > 0
    ? sentences
    : contextText
        .replace(/\s+/g, " ")
        .match(/.{80,220}(?:\s|$)/g)
        ?.map((chunk) => chunk.trim())
        .filter(Boolean) || [];

  const source = fallbackSentences.length > 0
    ? fallbackSentences
    : ["The uploaded material should be reviewed by identifying its main ideas, important terms, and supporting details."];

  return Array.from({ length: 5 }, (_, index) => {
    const sentence = source[(index + quizNumber - 1) % source.length];
    const trimmed = sentence.replace(/\s+/g, " ").trim();
    const answer = trimmed.length > 220 ? `${trimmed.slice(0, 217)}...` : trimmed;

    return {
      question: `Which statement is best supported by the uploaded study material?`,
      options: [
        answer,
        "The material says this topic is unrelated to the course objectives.",
        "The material recommends skipping this concept during revision.",
        "The material states that no supporting details are needed for this topic.",
      ],
      answer,
      explanation: "This option is taken directly from the uploaded material, so it is the best-supported answer.",
    };
  });
}

function isValidQuestion(question: Partial<QuizQuestion>): question is QuizQuestion {
  return (
    typeof question.question === "string" &&
    Array.isArray(question.options) &&
    question.options.length >= 2 &&
    typeof question.answer === "string" &&
    typeof question.explanation === "string" &&
    question.options.includes(question.answer)
  );
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const { contextText, quizNumber = 1 } = await req.json();

    if (!contextText) {
      return NextResponse.json({ error: "No document context provided." }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({
        questions: makeFallbackQuiz(contextText, quizNumber),
        source: "fallback",
      });
    }

    const prompt = `You are an expert examiner. STRICTLY RETURN VALID JSON ONLY. Do NOT include any explanatory text, no markdown, no code fences. Generate a 5-question multiple-choice quiz based on the document text.\n\nThis is quiz set number ${quizNumber}. ${quizNumber > 1 ? "IMPORTANT: Do NOT repeat questions from basic topics. Focus on completely different concepts, deeper details, or advanced applications from the document." : ""}\n\nReturn a JSON object with single key \"questions\" mapping to an array of objects. Each object must have keys: \"question\", \"options\" (exactly 4 strings), \"answer\" (one of the options), and \"explanation\".\n\nDocument Text:\n${contextText.substring(0, 15000)}\n\nExample response:\n{ "questions": [ { "question": "Q?", "options": ["A","B","C","D"], "answer": "A", "explanation": "..." } ] }`;

    try {
      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      const raw = completion.choices[0]?.message?.content || "";
      console.error("Quiz - raw AI response:", raw);

      const { data } = safeJsonParse(raw);
      let parsedQuestions: unknown[] = [];
      if (data) {
        if (Array.isArray(data)) parsedQuestions = data as unknown[];
        else if (typeof data === "object" && data !== null && "questions" in data && Array.isArray((data as any).questions)) {
          parsedQuestions = (data as any).questions as unknown[];
        } else if (typeof data === "object" && data !== null) {
          const arr = Object.values(data).find((v) => Array.isArray(v)) as any;
          if (arr) parsedQuestions = arr as unknown[];
        }
      }

      const validQuestions = parsedQuestions
        .map((q) => (isValidQuestion(q as Partial<QuizQuestion>) ? (q as QuizQuestion) : null))
        .filter(Boolean) as QuizQuestion[];

      // Log AI response for debugging
      try {
        pushAiLog({ route: 'quiz', raw, parsed: data ?? null, error: validQuestions.length === 0 ? 'no_valid_questions' : null });
      } catch (logErr) {
        console.warn('Failed to push AI log', logErr);
      }

      if (validQuestions.length > 0) {
        return NextResponse.json({ questions: validQuestions.slice(0, 5), source: "ai" });
      }

      console.error("Quiz AI response did not include valid questions", { raw, parsed: data });
    } catch (error: unknown) {
      console.error("Quiz AI generation failed, using fallback:", getErrorMessage(error, "Unknown error"));
    }

    return NextResponse.json({
      questions: makeFallbackQuiz(contextText, quizNumber),
      source: "fallback",
    });
  } catch (error: unknown) {
    console.error("Quiz API Error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "An error occurred.") }, { status: 500 });
  }
}
