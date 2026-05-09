import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.name.endsWith(".pdf") || file.type === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const data = await pdfParse(buffer);
      
      return NextResponse.json({ 
        text: data.text,
        name: file.name
      });
    } else {
       return NextResponse.json({ error: "Only PDFs are supported for now." }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("Upload API Error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "An error occurred while parsing the document.") },
      { status: 500 }
    );
  }
}
