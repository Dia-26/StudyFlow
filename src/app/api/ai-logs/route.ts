import { NextResponse } from "next/server";
import { getAiLogs, clearAiLogs } from "@/lib/aiResponseLog";

export async function GET(req: Request) {
  // Require ADMIN_API_KEY header for access
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return NextResponse.json({ error: "AI logs are disabled (ADMIN_API_KEY is not set)." }, { status: 403 });
  }

  const provided = req.headers.get("x-admin-key") || "";
  if (provided !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Number(new URL(req.url).searchParams.get("limit") || "100");
  const logs = getAiLogs(limit);
  return NextResponse.json({ logs });
}

export async function DELETE(req: Request) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return NextResponse.json({ error: "AI logs are disabled (ADMIN_API_KEY is not set)." }, { status: 403 });
  }
  const provided = req.headers.get("x-admin-key") || "";
  if (provided !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  clearAiLogs();
  return NextResponse.json({ ok: true });
}
