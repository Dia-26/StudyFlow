import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getRequiredUser } from "@/lib/server-auth";

const allowedKeys = new Set(["plannerTasks", "quizResults", "focusLogs", "subjects", "notes"]);

const defaultStudyData = {
  plannerTasks: [],
  quizResults: [],
  focusLogs: [],
  subjects: [],
  notes: [],
};

export async function GET() {
  try {
    const user = await getRequiredUser();
    const db = await getDb();
    const data = await db.collection("studyData").findOne({ userId: user.id });

    return NextResponse.json({
      ...defaultStudyData,
      ...(data || {}),
      _id: undefined,
      userId: undefined,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getRequiredUser();
    const { key, value } = (await req.json()) as { key?: string; value?: unknown };

    if (!key || !allowedKeys.has(key)) {
      return NextResponse.json({ error: "Invalid study data key." }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("studyData").updateOne(
      { userId: user.id },
      {
        $set: {
          [key]: value,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          userId: user.id,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Study data save error:", error);
    return NextResponse.json({ error: "Could not save study data." }, { status: 500 });
  }
}
