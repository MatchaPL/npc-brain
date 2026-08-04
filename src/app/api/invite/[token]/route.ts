import { NextRequest, NextResponse } from "next/server";
import { db, persistenceOn, getSession, hashToken, type Session } from "@/lib/db";

function stateOf(inv: Record<string, unknown> | null): "valid" | "expired" | "revoked" | "used" | "notfound" {
  if (!inv) return "notfound";
  if (inv.revoked_at) return "revoked";
  if (Date.now() > Date.parse(inv.expires_at as string)) return "expired";
  if (inv.max_uses === 1 && (inv.use_count as number) >= 1) return "used";
  return "valid";
}

async function loadInvite(token: string) {
  const { data: inv } = await db()
    .from("organization_invitations")
    .select("*")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  return inv;
}

// Public preview — organization name + inviter, without exposing IDs.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!persistenceOn()) return NextResponse.json({ error: "persistence off" }, { status: 501 });
  const { token } = await params;
  const inv = await loadInvite(token);
  const state = stateOf(inv);
  if (state !== "valid" || !inv) return NextResponse.json({ valid: false, state });

  const [{ data: org }, { data: inviter }] = await Promise.all([
    db().from("organizations").select("name").eq("id", inv.organization_id).single(),
    db().from("users").select("display_name").eq("id", inv.created_by).single(),
  ]);
  return NextResponse.json({
    valid: true,
    state,
    orgName: org?.name ?? "this organization",
    inviter: inviter?.display_name ?? "an administrator",
  });
}

// Request to join — the recipient must be authenticated via LINE (session cookie).
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!persistenceOn()) return NextResponse.json({ error: "persistence off" }, { status: 501 });
  const session = getSession(req) as Session | null;
  if (!session) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { token } = await params;
  const inv = await loadInvite(token);
  const state = stateOf(inv);
  if (state !== "valid" || !inv) return NextResponse.json({ error: "invitation " + state }, { status: 400 });

  const orgId = inv.organization_id;
  const body = await req.json().catch(() => ({}));

  // already a member?
  const { data: existingMember } = await db()
    .from("organization_members").select("id").eq("organization_id", orgId).eq("user_id", session.uid).maybeSingle();
  if (existingMember) return NextResponse.json({ ok: true, alreadyMember: true });

  // prevent duplicate pending
  const { data: dup } = await db()
    .from("join_requests").select("id").eq("organization_id", orgId).eq("user_id", session.uid).eq("status", "pending").maybeSingle();
  if (dup) return NextResponse.json({ ok: true, duplicate: true });

  const { data: jr } = await db().from("join_requests").insert({
    organization_id: orgId, invitation_id: inv.id, user_id: session.uid,
    requested_department: body.department || inv.default_department || null,
    requested_job_title: body.jobTitle || inv.default_job_title || null,
    status: "pending",
  }).select("id").single();

  await db().from("organization_invitations").update({ use_count: (inv.use_count as number) + 1 }).eq("id", inv.id);

  const [{ data: org }, { data: admins }] = await Promise.all([
    db().from("organizations").select("name").eq("id", orgId).single(),
    db().from("organization_members").select("user_id").eq("organization_id", orgId).in("role", ["Owner", "Admin"]).eq("status", "Active"),
  ]);

  if (jr && admins?.length) {
    await db().from("notifications").insert(
      admins.map((a: { user_id: string }) => ({
        organization_id: orgId, recipient_user_id: a.user_id, type: "join_request",
        title: "New join request", message: `${session.name} requested to join ${org?.name ?? "your workspace"}`,
        reference_type: "join_request", reference_id: jr.id,
      })),
    );
  }

  return NextResponse.json({ ok: true });
}
