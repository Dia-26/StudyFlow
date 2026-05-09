import { NextResponse } from "next/server";
import Groq from "groq-sdk";

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

    const prompt = `You are an expert examiner. Generate a 5-question multiple-choice quiz based on the document text.
This is quiz set number ${quizNumber}. ${quizNumber > 1 ? "IMPORTANT: Do NOT repeat questions from basic topics. Focus on completely different concepts, deeper details, or advanced applications from the document." : ""}
Return a JSON object containing a single key "questions" which maps to an array of objects.
Each object must have these exact keys:
- "question": string (the question text)
- "options": string array (exactly 4 options)
- "answer": string (the exact correct option from the options array)
- "explanation": string (why this is correct)

Document Text:
${contextText.substring(0, 15000)}

Output Format Example:
{
  "questions": [
    {
      "question": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Rome"],
      "answer": "Paris",
      "explanation": "Paris is the capital and most populous city of France."
    }
  ]
}`;

    try {
      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      let rawContent = completion.choices[0]?.message?.content || "{}";
      rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

      let questions: QuizQuestion[] = [];
      const parsed = JSON.parse(rawContent) as unknown;
      if (parsed && typeof parsed === "object" && "questions" in parsed && Array.isArray(parsed.questions)) {
        questions = parsed.questions as QuizQuestion[];
      } else if (parsed && typeof parsed === "object") {
        const arrVal = Object.values(parsed).find(v => Array.isArray(v));
        if (arrVal) questions = arrVal as QuizQuestion[];
      }

      const validQuestions = questions.filter(isValidQuestion).slice(0, 5);
      if (validQuestions.length > 0) {
        return NextResponse.json({ questions: validQuestions, source: "ai" });
      }

      console.error("Quiz AI response did not include valid questions:", rawContent);
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
