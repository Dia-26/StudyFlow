import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

const SESSION_COOKIE = "studyflow_session";
const SESSION_SECRET = process.env.AUTH_SECRET || "studyflow-dev-secret-change-me";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedPassword: string) {
  const [salt, storedHash] = storedPassword.split(":");
  if (!salt || !storedHash) return false;

  const hash = scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHash, "hex");
  return stored.length === hash.length && timingSafeEqual(stored, hash);
}

function signPayload(payload: string) {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

function createSessionValue(user: AuthUser) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

function readSessionValue(value?: string): AuthUser | null {
  if (!value) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature || signPayload(payload) !== signature) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthUser;
  } catch {
    return null;
  }
}

export async function setSession(user: AuthUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionValue(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  return readSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function getRequiredUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function ensureUserExists(userId: string) {
  const db = await getDb();
  return db.collection("users").findOne({ _id: new ObjectId(userId) });
}
