import { pushAiLog } from "@/lib/aiResponseLog";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

/**
 * Chat API Route
 * 
 * IMPORTANT: PDF parsing is now CLIENT-SIDE only.
 * This endpoint expects:
 * - prompt: user question
 * - documentText: extracted text from PDF (parsed on client-side)
 * 
 * No file uploads to this endpoint.
 * The frontend handles PDF extraction and sends text only.
 */

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is missing in the .env file." },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });
    const contentType = req.headers.get("content-type") || "";

    let body: { prompt?: string; documentText?: string } = {};
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body.prompt = typeof formData.get("prompt") === "string" ? (formData.get("prompt") as string) : undefined;
      body.documentText = typeof formData.get("documentText") === "string" ? (formData.get("documentText") as string) : undefined;
    } else {
      try {
        body = await req.json();
      } catch (error) {
        console.error("Chat API body parse error:", error);
        return NextResponse.json(
          { error: "Invalid request body. Send JSON with prompt and documentText, or legacy form-data with prompt/documentText fields." },
          { status: 400 }
        );
      }
    }

    const prompt = body.prompt as string;
    const documentText = body.documentText as string | undefined;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 }
      );
    }

    // Use extracted text from client, or use context from study store
    const contextText = documentText 
      ? `\n\n[Context from active document:\n${documentText.substring(0, 15000)}]\n\n`
      : "";

    const fullPrompt = `You are StudyFlow AI Tutor, an expert, encouraging, and highly intelligent academic assistant.
Your goal is to answer the user's question accurately. If document context is provided, use it to answer the question. Format your response in clean Markdown.
${contextText}
Question: ${prompt}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    const raw = chatCompletion.choices?.[0]?.message?.content ?? "";
    console.error("Chat - raw AI response:", raw);

    try {
      pushAiLog({ route: 'chat', raw, parsed: null, error: null });
    } catch (logErr) {
      console.warn('Failed to push AI log', logErr);
    }

    return NextResponse.json({ text: typeof raw === "string" ? raw : String(raw) });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "An error occurred while generating the AI response.") },
      { status: 500 }
    );
  }
}
