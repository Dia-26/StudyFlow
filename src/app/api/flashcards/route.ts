import { NextResponse } from "next/server";
import Groq from "groq-sdk";

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

    const prompt = `You are an expert study assistant. Generate exactly 10 high-quality flashcards based on the provided document text. 
This is deck number ${deckNumber}. ${deckNumber > 1 ? "IMPORTANT: Focus on completely different, deeper, or more niche topics than the most obvious main ideas to ensure the student learns new material." : ""}
Return a JSON object containing a single key "flashcards" which maps to an array of objects.
Each object must have exactly two keys: "front" (a question or concept) and "back" (the answer or definition).

Document Text:
${contextText.substring(0, 15000)}

Output Format Example:
{
  "flashcards": [
    { "front": "What is Mitochondria?", "back": "The powerhouse of the cell." }
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    // Wait, Groq JSON mode requires the prompt to contain the word "JSON" and response_format type json_object.
    // Actually, Llama 3 sometimes returns { "flashcards": [...] } if we enforce json_object. Let's just parse the text.
    
    let rawContent = completion.choices[0]?.message?.content || "[]";
    
    // In case it's wrapped in { "flashcards": [...] } or markdown blocks
    rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let flashcards: Flashcard[] = [];
    try {
      const parsed = JSON.parse(rawContent) as unknown;
      // Handle { "flashcards": [...] } or [...]
      if (Array.isArray(parsed)) {
        flashcards = parsed as Flashcard[];
      } else if (parsed && typeof parsed === "object" && "flashcards" in parsed && Array.isArray(parsed.flashcards)) {
        flashcards = parsed.flashcards as Flashcard[];
      } else if (parsed && typeof parsed === "object") {
        // Find the first array value in the object
        const arrVal = Object.values(parsed).find(v => Array.isArray(v));
        if (arrVal) flashcards = arrVal as Flashcard[];
      }
    } catch {
      console.error("Failed to parse JSON:", rawContent);
      throw new Error("Failed to parse flashcards from AI response.");
    }

    return NextResponse.json({ flashcards });
  } catch (error: unknown) {
    console.error("Flashcards API Error:", error);
    return NextResponse.json({ error: getErrorMessage(error, "An error occurred.") }, { status: 500 });
  }
}
