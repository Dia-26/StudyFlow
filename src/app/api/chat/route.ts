import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import pdfParse from "pdf-parse";

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
    const formData = await req.formData();
    const prompt = formData.get("prompt") as string;
    const file = formData.get("file") as File | null;
    let contextText = "";

    if (file) {
      if (file.name.endsWith(".pdf") || file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const data = await pdfParse(buffer);
        contextText = `\n\n[Context from attached PDF '${file.name}':\n${data.text.substring(0, 15000)}]\n\n`;
      } else {
        contextText = `\n\n[User attached a file: ${file.name}, but the system currently only parses PDFs.]\n\n`;
      }
    }

    const fullPrompt = `You are StudyFlow AI Tutor, an expert, encouraging, and highly intelligent academic assistant.
Your goal is to answer the user's question accurately. If they provided a PDF context, use it to answer the question. Format your response in clean Markdown.
Context: ${contextText}
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

    return NextResponse.json({ text: chatCompletion.choices[0]?.message?.content || "" });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "An error occurred while generating the AI response.") },
      { status: 500 }
    );
  }
}
