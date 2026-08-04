import { NextRequest, NextResponse } from "next/server";
import { db, persistenceOn, signSession, SESSION_COOKIE } from "@/lib/db";

// Verifies a LINE Login ID token server-side, upserts the user (when Supabase is
// configured), and sets an HTTP-only session cookie. Never trust client identity.
function channelId() {
  return (
    process.env.LINE_LOGIN_CHANNEL_ID ||
    (process.env.NEXT_PUBLIC_LIFF_ID || "").split("-")[0] ||
    ""
  );
}

export async function POST(req: NextRequest) {
  let idToken = "";
  try {
    idToken = (await req.json()).idToken || "";
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  if (!idToken) return NextResponse.json({ ok: false, error: "missing idToken" }, { status: 400 });

  const client_id = channelId();
  if (!client_id) {
    return NextResponse.json({ ok: false, error: "LINE channel not configured" }, { status: 500 });
  }

  const verify = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken, client_id }),
  });
  const data = await verify.json();
  if (!verify.ok) {
    return NextResponse.json(
      { ok: false, error: data.error_description || data.error || "token verification failed" },
      { status: 401 },
    );
  }

  const line = data.sub as string;
  const name = (data.name as string) || "LINE user";
  const pic = (data.picture as string) || "";

  // Upsert the user and use the DB id as the stable identity.
  let uid = line;
  if (persistenceOn()) {
    const { data: u } = await db()
      .from("users")
      .upsert(
        { line_user_id: line, display_name: name, profile_image_url: pic, updated_at: new Date().toISOString() },
        { onConflict: "line_user_id" },
      )
      .select("id")
      .single();
    if (u) uid = u.id;
  }

  const res = NextResponse.json({ ok: true, user: { id: uid, displayName: name, pictureUrl: pic } });
  res.cookies.set(SESSION_COOKIE, signSession({ uid, line, name, pic }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
