import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { safeJsonParse, ensureArray } from "@/lib/safeJson";
import { pushAiLog } from "@/lib/aiResponseLog";
import { normalizeFlashcards } from "@/lib/groqValidation";

type Flashcard = {
  front: string;
  back: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY is missing." }, { status: 400 });
    }

    const { contextText, deckNumber = 1 } = await req.json();

    if (!contextText) {
      return NextResponse.json({ error: "No document context provided." }, { status: 400 });
    }

    const groq = new Groq({ apiKey });

    const prompt = `You are an expert study assistant. STRICTLY RETURN VALID JSON ONLY. Do NOT include any explanatory text, no markdown, no code fences. Generate exactly 10 high-quality flashcards based on the provided document text.\n\nThis is deck number ${deckNumber}. ${deckNumber > 1 ? "IMPORTANT: Focus on completely different, deeper, or more niche topics than the most obvious main ideas to ensure the student learns new material." : ""}\n\nReturn a JSON object with the single key \"flashcards\" mapping to an array of objects. Each object must have exactly two keys: \"front\" and \"back\".\n\nDocument Text:\n${contextText.substring(0, 15000)}\n\nExample response:\n{ "flashcards": [ { "front": "Question?", "back": "Answer." } ] }`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const raw = completion.choices[0]?.message?.content || "";
    console.error("Flashcards - raw AI response:", raw);

    const { data } = safeJsonParse(raw);

    const normalizedFlashcards = normalizeFlashcards(data);

    // Log the raw and parsed result for debugging
    try {
      pushAiLog({ route: 'flashcards', raw, parsed: data ?? null, error: normalizedFlashcards.length === 0 ? 'no_valid_flashcards' : null });
    } catch (logErr) {
      console.warn('Failed to push AI log', logErr);
    }

    if (normalizedFlashcards.length === 0) {
      console.error("Flashcards: AI returned no valid flashcards", { raw, parsed: data });
      return NextResponse.json({ error: "AI returned malformed flashcards. Try again." }, { status: 502 });
    }

    return NextResponse.json({ flashcards: normalizedFlashcards });
  } catch (error: unknown) {
    console.error("Flashcards API Error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "An error occurred.") }, { status: 500 });
  }
}
