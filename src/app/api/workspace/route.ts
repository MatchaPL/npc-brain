import { NextRequest, NextResponse } from "next/server";
import {
  db,
  persistenceOn,
  getSession,
  membershipOf,
  isAdminRole,
  hashToken,
  randomToken,
  type Session,
} from "@/lib/db";

const ms = (iso: string | null) => (iso ? Date.parse(iso) : null);
const dep = (d?: string) => (d && d !== "" ? d : null);

async function loadWorkspace(session: Session) {
  const user = { id: session.uid, displayName: session.name, pictureUrl: session.pic };
  const membership = await membershipOf(session.uid);
  if (!membership) {
    return { user, org: null, members: [], invitations: [], joinRequests: [], notifications: [] };
  }
  const orgId = membership.organization_id;

  const [{ data: orgRow }, { data: memberRows }, { data: inviteRows }, { data: reqRows }, { data: notifRows }] =
    await Promise.all([
      db().from("organizations").select("*").eq("id", orgId).single(),
      db().from("organization_members").select("*, users(display_name)").eq("organization_id", orgId),
      db().from("organization_invitations").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }),
      db().from("join_requests").select("*, users(display_name)").eq("organization_id", orgId).order("created_at", { ascending: false }),
      db().from("notifications").select("*").eq("recipient_user_id", session.uid).order("created_at", { ascending: false }),
    ]);

  return {
    user,
    org: orgRow
      ? { id: orgRow.id, name: orgRow.name, description: orgRow.description ?? "", createdBy: orgRow.created_by, createdAt: ms(orgRow.created_at) }
      : null,
    members: (memberRows ?? []).map((m: Record<string, unknown> & { users?: { display_name?: string } }) => ({
      id: m.id, userId: m.user_id, displayName: m.users?.display_name ?? "Member",
      role: m.role, department: m.department ?? "", jobTitle: m.job_title ?? "",
      status: m.status, joinedAt: ms(m.joined_at as string | null), questions: 0,
    })),
    invitations: (inviteRows ?? []).map((i: Record<string, unknown>) => ({
      id: i.id, token: "", defaultRole: i.default_role, defaultDepartment: i.default_department ?? "",
      defaultJobTitle: i.default_job_title ?? "", expiresAt: ms(i.expires_at as string) ?? 0,
      singleUse: i.max_uses === 1, useCount: i.use_count ?? 0, revokedAt: ms(i.revoked_at as string | null),
      createdBy: i.created_by, createdAt: ms(i.created_at as string) ?? 0,
    })),
    joinRequests: (reqRows ?? []).map((r: Record<string, unknown> & { users?: { display_name?: string } }) => ({
      id: r.id, invitationId: r.invitation_id ?? null, userId: r.user_id, displayName: r.users?.display_name ?? "Member",
      requestedDepartment: r.requested_department ?? "", requestedJobTitle: r.requested_job_title ?? "",
      status: r.status, reviewedBy: r.reviewed_by, reviewedAt: ms(r.reviewed_at as string | null) ?? undefined,
      rejectionReason: r.rejection_reason, createdAt: ms(r.created_at as string) ?? 0,
    })),
    notifications: (notifRows ?? []).map((n: Record<string, unknown>) => ({
      id: n.id, type: n.type, title: n.title, message: n.message ?? "", referenceId: n.reference_id ?? undefined,
      isRead: n.is_read, resolvedAt: ms(n.resolved_at as string | null) ?? undefined, createdAt: ms(n.created_at as string) ?? 0,
    })),
  };
}

function guard(req: NextRequest): { error?: NextResponse; session?: Session } {
  if (!persistenceOn()) return { error: NextResponse.json({ error: "persistence off" }, { status: 501 }) };
  const session = getSession(req);
  if (!session) return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  return { session };
}

export async function GET(req: NextRequest) {
  const g = guard(req);
  if (g.error || !g.session) return g.error ?? NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json(await loadWorkspace(g.session));
}

export async function POST(req: NextRequest) {
  const g = guard(req);
  if (g.error || !g.session) return g.error ?? NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const session = g.session;
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  const membership = await membershipOf(session.uid);
  const admin = isAdminRole(membership?.role);
  const orgId = membership?.organization_id;
  let token: string | undefined;

  switch (action) {
    case "createOrg": {
      if (membership) return NextResponse.json({ error: "already in an organization" }, { status: 409 });
      const { data: org } = await db()
        .from("organizations")
        .insert({ name: body.name, description: body.description ?? "", created_by: session.uid })
        .select("id").single();
      if (org) {
        await db().from("organization_members").insert({
          organization_id: org.id, user_id: session.uid, role: "Owner", status: "Active",
          job_title: "Owner", joined_at: new Date().toISOString(),
        });
      }
      break;
    }
    case "createInvitation": {
      if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      const raw = randomToken();
      await db().from("organization_invitations").insert({
        organization_id: orgId, token_hash: hashToken(raw), created_by: session.uid,
        default_role: body.role, default_department: dep(body.department), default_job_title: body.jobTitle || null,
        expires_at: new Date(Date.now() + (body.expiresDays ?? 7) * 86400000).toISOString(),
        max_uses: body.singleUse ? 1 : null,
      });
      token = raw;
      break;
    }
    case "revokeInvitation": {
      if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      await db().from("organization_invitations").update({ revoked_at: new Date().toISOString() })
        .eq("id", body.id).eq("organization_id", orgId);
      break;
    }
    case "regenerateInvitation": {
      if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      const raw = randomToken();
      await db().from("organization_invitations")
        .update({ token_hash: hashToken(raw), use_count: 0, revoked_at: null })
        .eq("id", body.id).eq("organization_id", orgId);
      token = raw;
      break;
    }
    case "updateOrg": {
      if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.name) patch.name = body.name;
      if (body.description !== undefined) patch.description = body.description;
      await db().from("organizations").update(patch).eq("id", orgId);
      break;
    }
    case "approve": {
      if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      const { data: jr } = await db().from("join_requests").select("*").eq("id", body.id).eq("organization_id", orgId).single();
      if (!jr) return NextResponse.json({ error: "not found" }, { status: 404 });
      if (jr.user_id === session.uid) return NextResponse.json({ error: "cannot self-approve" }, { status: 400 });
      await db().from("organization_members").upsert({
        organization_id: orgId, user_id: jr.user_id, role: body.role, department: dep(body.department),
        job_title: body.jobTitle || null, status: "Active", approved_by: session.uid,
        approved_at: new Date().toISOString(), joined_at: new Date().toISOString(),
      }, { onConflict: "organization_id,user_id" });
      await db().from("join_requests").update({ status: "approved", reviewed_by: session.uid, reviewed_at: new Date().toISOString() }).eq("id", body.id);
      await db().from("notifications").update({ is_read: true, resolved_at: new Date().toISOString() }).eq("reference_id", body.id);
      break;
    }
    case "reject": {
      if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      await db().from("join_requests").update({ status: "rejected", reviewed_by: session.uid, reviewed_at: new Date().toISOString(), rejection_reason: body.reason || null })
        .eq("id", body.id).eq("organization_id", orgId);
      await db().from("notifications").update({ is_read: true, resolved_at: new Date().toISOString() }).eq("reference_id", body.id);
      break;
    }
    case "updateMember": {
      if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      const patch: Record<string, unknown> = {};
      if (body.patch?.role) patch.role = body.patch.role;
      if (body.patch?.status) patch.status = body.patch.status;
      if (body.patch?.department !== undefined) patch.department = dep(body.patch.department);
      if (body.patch?.jobTitle !== undefined) patch.job_title = body.patch.jobTitle || null;
      await db().from("organization_members").update(patch).eq("id", body.id).eq("organization_id", orgId).neq("role", "Owner");
      break;
    }
    case "removeMember": {
      if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      await db().from("organization_members").delete().eq("id", body.id).eq("organization_id", orgId).neq("role", "Owner");
      break;
    }
    case "readNotif": {
      await db().from("notifications").update({ is_read: true }).eq("id", body.id).eq("recipient_user_id", session.uid);
      break;
    }
    case "readAll": {
      await db().from("notifications").update({ is_read: true }).eq("recipient_user_id", session.uid);
      break;
    }
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  const workspace = await loadWorkspace(session);
  return NextResponse.json({ workspace, token });
}
