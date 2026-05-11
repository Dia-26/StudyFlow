import { NextResponse } from "next/server";

// Server-side PDF parsing is disabled to avoid worker/module bundling issues
// in Vercel/Serverless/Turbopack environments. Client-side parsing is used
// instead (see src/app/dashboard/page.tsx). This route remains as a fallback
// that returns a clear message.

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  return NextResponse.json(
    { error: "Server-side PDF parsing disabled. Parse PDFs client-side instead." },
    { status: 501 }
  );
}
