import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { setSession, verifyPassword } from "@/lib/server-auth";

type LoginBody = {
  email?: string;
  password?: string;
};

type UserRecord = {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
};

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as LoginBody;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const db = await getDb();
    const userRecord = await db.collection<UserRecord>("users").findOne({ email: normalizedEmail });
    if (!userRecord || !verifyPassword(password, userRecord.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const user = {
      id: userRecord._id.toString(),
      name: userRecord.name,
      email: userRecord.email,
    };

    await setSession(user);
    return NextResponse.json({ user });
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Could not log you in." }, { status: 500 });
  }
}
