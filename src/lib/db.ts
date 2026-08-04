// Server-only data + session layer for the org/auth tables (supabase-auth-schema.sql).
// Used only by route handlers. Activates when Supabase is configured; otherwise the
// client store keeps its localStorage mock (see workspace.tsx).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";
import type { NextRequest } from "next/server";

export function persistenceOn() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let admin: SupabaseClient | null = null;
export function db(): SupabaseClient {
  if (!admin) {
    admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
  }
  return admin;
}

// ── signed session cookie (HTTP-only, set on the server) ──
const SECRET = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev-secret";
export const SESSION_COOKIE = "npc_session";

export interface Session {
  uid: string; // users.id
  line: string; // line_user_id
  name: string;
  pic: string;
}

export function signSession(s: Session): string {
  const payload = Buffer.from(JSON.stringify(s)).toString("base64url");
  const mac = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function readSession(token?: string | null): Session | null {
  if (!token) return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
  } catch {
    return null;
  }
}

export function getSession(req: NextRequest): Session | null {
  return readSession(req.cookies.get(SESSION_COOKIE)?.value);
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function randomToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

// The membership row for a user in an org, or null.
export async function membershipOf(userId: string) {
  const { data } = await db()
    .from("organization_members")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export function isAdminRole(role?: string) {
  return role === "Owner" || role === "Admin";
}
