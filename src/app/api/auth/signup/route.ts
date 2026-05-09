import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { hashPassword, setSession } from "@/lib/server-auth";

type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const { name, email, password } = (await req.json()) as SignupBody;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail || !password || password.length < 6) {
      return NextResponse.json({ error: "Name, valid email, and a 6+ character password are required." }, { status: 400 });
    }

    const db = await getDb();
    const existingUser = await db.collection("users").findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const now = new Date();
    const result = await db.collection("users").insertOne({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      createdAt: now,
      updatedAt: now,
    });

    const user = {
      id: result.insertedId.toString(),
      name: name.trim(),
      email: normalizedEmail,
    };

    await db.collection("studyData").insertOne({
      userId: user.id,
      plannerTasks: [],
      quizResults: [],
      focusLogs: [],
      subjects: [],
      notes: [],
      createdAt: now,
      updatedAt: now,
    });
    await setSession(user);

    return NextResponse.json({ user });
  } catch (error: unknown) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Could not create your account." }, { status: 500 });
  }
}
