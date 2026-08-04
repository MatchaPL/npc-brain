// LINE Login via LIFF (client side). Activates only when NEXT_PUBLIC_LIFF_ID is set;
// otherwise the app falls back to the local mock identity (see workspace.tsx).
// The ID token is always verified on the server (src/app/api/auth/line/route.ts).
import type { Liff } from "@line/liff";

export const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";
export const liffEnabled = () => Boolean(LIFF_ID) && typeof window !== "undefined";

let cached: Liff | null = null;
let initPromise: Promise<Liff> | null = null;

async function getLiff(): Promise<Liff> {
  if (cached) return cached;
  if (!initPromise) {
    initPromise = import("@line/liff").then(async (m) => {
      const liff = m.default;
      await liff.init({ liffId: LIFF_ID });
      cached = liff;
      return liff;
    });
  }
  return initPromise;
}

export async function liffIsLoggedIn(): Promise<boolean> {
  try {
    const liff = await getLiff();
    return liff.isLoggedIn();
  } catch {
    return false;
  }
}

export async function liffLoginRedirect() {
  const liff = await getLiff();
  liff.login({ redirectUri: window.location.href });
}

export async function liffGetIdToken(): Promise<string | null> {
  const liff = await getLiff();
  return liff.getIDToken();
}

export async function liffLogout() {
  if (!liffEnabled()) return;
  try {
    const liff = await getLiff();
    if (liff.isLoggedIn()) liff.logout();
  } catch {
    /* ignore */
  }
}

export interface VerifiedUser {
  id: string;
  displayName: string;
  pictureUrl: string;
}

// Verify the ID token on our server and return the trusted identity.
export async function verifyLineIdToken(idToken: string | null): Promise<VerifiedUser | null> {
  if (!idToken) return null;
  try {
    const res = await fetch("/api/auth/line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    return data.ok ? (data.user as VerifiedUser) : null;
  } catch {
    return null;
  }
}
