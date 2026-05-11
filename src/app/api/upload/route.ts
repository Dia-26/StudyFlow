import { NextResponse } from "next/server";

/**
 * PDF Upload Route - DEPRECATED
 * 
 * This route is no longer used. All PDF processing happens client-side.
 * 
 * Why client-side processing?
 * 1. Vercel serverless environment has no persistent filesystem
 * 2. Reduces backend load - no server-side PDF parsing needed
 * 3. Faster processing - parallel page extraction possible
 * 4. Lower costs - no backend compute for parsing
 * 5. Better UX - instant feedback in browser
 * 
 * Implementation:
 * - Frontend: src/app/dashboard/page.tsx
 * - Parser: pdfjs-dist (4.1.378+)
 * - Worker: /public/pdf.worker.min.mjs
 * - Storage: In-memory via Zustand (useStudyStore)
 * - APIs used: /api/flashcards, /api/quiz, /api/chat (with extracted text only)
 * 
 * If you need server-side functionality:
 * - Use external service: S3 + AWS Lambda, Cloudinary, or UploadThing
 * - Or: Use a dedicated server (not Vercel serverless)
 */

export async function POST(req: Request) {
  return NextResponse.json(
    {
      error: "Server-side PDF upload is disabled",
      message: "All PDF processing happens client-side. See route documentation.",
      clientImplementation: "src/app/dashboard/page.tsx (handleUpload function)",
      workerPath: "/public/pdf.worker.min.mjs",
    },
    { status: 501 }
  );
}
