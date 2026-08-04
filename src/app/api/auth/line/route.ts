import { NextRequest, NextResponse } from "next/server";

// Verifies a LINE Login ID token server-side against LINE's verify endpoint.
// Never trust identity sent from the client — this checks the token's signature,
// audience (channel ID), and expiry, and returns the trusted profile.
//
// Channel ID is the numeric prefix of the LIFF ID (e.g. 2010371902-XXXX -> 2010371902),
// or set LINE_LOGIN_CHANNEL_ID explicitly.
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

  const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken, client_id }),
  });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: data.error_description || data.error || "token verification failed" },
      { status: 401 },
    );
  }

  // data: { iss, sub, aud, exp, iat, name, picture, ... }
  return NextResponse.json({
    ok: true,
    user: {
      id: data.sub as string,
      displayName: (data.name as string) || "LINE user",
      pictureUrl: (data.picture as string) || "",
    },
  });
}
