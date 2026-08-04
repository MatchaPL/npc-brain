"use client";

// Client-side workspace store for the MVP: LINE auth (mocked), organization,
// members, invitations, join requests, and notifications. Persisted to
// localStorage so the whole onboarding flow is demoable end-to-end in one
// browser. Swap these actions for the real API endpoints (see docs/AUTH.md).
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  liffEnabled,
  liffIsLoggedIn,
  liffLoginRedirect,
  liffGetIdToken,
  liffLogout,
  verifyLineIdToken,
} from "./line";

export type Role = "Owner" | "Admin" | "Member";
export type MemberStatus = "Active" | "Pending approval" | "Invited" | "Rejected" | "Suspended";
export type Department = "HR" | "Finance" | "Production" | "Engineering" | "Safety" | "Other" | "";

export const ROLES: Role[] = ["Owner", "Admin", "Member"];
export const DEPARTMENTS: Department[] = ["HR", "Finance", "Production", "Engineering", "Safety", "Other"];

export interface LineUser {
  id: string;
  displayName: string;
  pictureUrl: string; // we use initials + color, but keep the field for parity
}
export interface Org {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
}
export interface Member {
  id: string;
  userId: string;
  displayName: string;
  role: Role;
  department: Department;
  jobTitle: string;
  status: MemberStatus;
  joinedAt: number | null;
  questions: number;
}
export interface Invitation {
  id: string;
  token: string;
  defaultRole: Role;
  defaultDepartment: Department;
  defaultJobTitle: string;
  expiresAt: number;
  singleUse: boolean;
  useCount: number;
  revokedAt: number | null;
  createdBy: string;
  createdAt: number;
}
export interface JoinRequest {
  id: string;
  invitationId: string | null;
  userId: string;
  displayName: string;
  requestedDepartment: Department;
  requestedJobTitle: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: number;
  rejectionReason?: string;
  createdAt: number;
}
export interface Notif {
  id: string;
  type: "join_request" | "invite_accepted" | "member_role_updated" | "document";
  title: string;
  message: string;
  referenceId?: string;
  isRead: boolean;
  resolvedAt?: number;
  createdAt: number;
}

interface State {
  user: LineUser | null;
  org: Org | null;
  members: Member[];
  invitations: Invitation[];
  joinRequests: JoinRequest[];
  notifications: Notif[];
}

const EMPTY: State = {
  user: null,
  org: null,
  members: [],
  invitations: [],
  joinRequests: [],
  notifications: [],
};

const KEY = "npc.workspace.v1";
const uid = () => Math.random().toString(36).slice(2, 10);
const token = () =>
  (crypto?.randomUUID?.() ?? uid() + uid()).replace(/-/g, "") + uid();

// Fixed owner identity (this device's LINE login)
const OWNER: LineUser = { id: "line_owner_001", displayName: "Nitipoom P.", pictureUrl: "" };
// Pool of simulated visitors for the invite flow
const VISITORS: LineUser[] = [
  { id: "line_v_som", displayName: "Somchai K.", pictureUrl: "" },
  { id: "line_v_ploy", displayName: "Ploy S.", pictureUrl: "" },
  { id: "line_v_warin", displayName: "Warin T.", pictureUrl: "" },
];
export function randomVisitor(): LineUser {
  return VISITORS[Math.floor(Math.random() * VISITORS.length)];
}

const SEED_MEMBERS: Omit<Member, "id" | "userId">[] = [
  { displayName: "มนัสนันท์ ศรีวัฒน์", role: "Admin", department: "HR", jobTitle: "Head of People", status: "Active", joinedAt: Date.now() - 86400000 * 40, questions: 142 },
  { displayName: "ธีรพงษ์ อินทร", role: "Member", department: "Finance", jobTitle: "Finance Manager", status: "Active", joinedAt: Date.now() - 86400000 * 30, questions: 98 },
  { displayName: "อนุชา พัฒน์", role: "Admin", department: "Engineering", jobTitle: "Staff Engineer", status: "Active", joinedAt: Date.now() - 86400000 * 25, questions: 210 },
  { displayName: "สุภาวดี จันทร์", role: "Member", department: "Finance", jobTitle: "Procurement Lead", status: "Active", joinedAt: Date.now() - 86400000 * 20, questions: 76 },
  { displayName: "กิตติ วรกุล", role: "Member", department: "Production", jobTitle: "Production Manager", status: "Active", joinedAt: Date.now() - 86400000 * 15, questions: 65 },
];

interface Ctx extends State {
  ready: boolean;
  isAdmin: boolean;
  unread: number;
  // auth
  loginWithLine: (identity?: LineUser) => void;
  logout: () => void;
  // org
  createOrg: (name: string, description: string) => void;
  updateOrg: (patch: Partial<Pick<Org, "name" | "description">>) => void;
  // invitations
  createInvitation: (i: {
    role: Role;
    department: Department;
    jobTitle: string;
    expiresDays: number;
    singleUse: boolean;
  }) => Promise<Invitation>;
  regenerateInvitation: (id: string) => Promise<Invitation | undefined>;
  revokeInvitation: (id: string) => void;
  getInvitation: (tok: string) => Invitation | undefined;
  invitationState: (tok: string) => "valid" | "expired" | "revoked" | "used" | "notfound";
  // join requests
  requestToJoin: (visitor: LineUser, tok: string, req: { department: Department; jobTitle: string }) => void;
  approveRequest: (id: string, assign: { role: Role; department: Department; jobTitle: string }) => void;
  rejectRequest: (id: string, reason?: string) => void;
  // members
  updateMember: (id: string, patch: Partial<Member>) => void;
  removeMember: (id: string) => void;
  // notifications
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const WorkspaceContext = createContext<Ctx | null>(null);

// When Supabase is configured (server) the app runs against the real API; a public
// flag lets the client know to use it instead of the localStorage mock.
const PERSIST = typeof window !== "undefined" && process.env.NEXT_PUBLIC_PERSISTENCE === "supabase";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);

  function applyWorkspace(w?: Partial<State>) {
    if (!w) return;
    setState({
      user: w.user ?? null,
      org: w.org ?? null,
      members: w.members ?? [],
      invitations: w.invitations ?? [],
      joinRequests: w.joinRequests ?? [],
      notifications: w.notifications ?? [],
    });
  }
  async function refresh() {
    try {
      const r = await fetch("/api/workspace");
      if (r.ok) applyWorkspace(await r.json());
      else setState((s) => ({ ...s, user: null }));
    } catch {}
  }
  async function command(action: string, payload: Record<string, unknown> = {}) {
    const r = await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const d = (await r.json().catch(() => ({}))) as { workspace?: State; token?: string };
    if (d.workspace) applyWorkspace(d.workspace);
    return d;
  }

  useEffect(() => {
    if (PERSIST) {
      (async () => {
        if (liffEnabled() && (await liffIsLoggedIn())) {
          await verifyLineIdToken(await liffGetIdToken()); // sets the session cookie
        }
        await refresh();
        setReady(true);
      })();
      return;
    }
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setReady(true);
    // If LINE Login (LIFF) is configured, hydrate the real identity after redirect.
    if (liffEnabled()) {
      (async () => {
        if (await liffIsLoggedIn()) {
          const u = await verifyLineIdToken(await liffGetIdToken());
          if (u) setState((s) => ({ ...s, user: u }));
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready && !PERSIST) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const isAdmin = (() => {
    const me = state.members.find((m) => m.userId === state.user?.id);
    return me?.role === "Owner" || me?.role === "Admin";
  })();
  const unread = state.notifications.filter((n) => !n.isRead).length;

  const api: Ctx = {
    ...state,
    ready,
    isAdmin,
    unread,

    loginWithLine: (identity) => {
      // Explicit identity = the invite flow's simulated visitor (mock path).
      if (identity) return setState((s) => ({ ...s, user: identity }));
      if (liffEnabled()) {
        (async () => {
          if (!(await liffIsLoggedIn())) return liffLoginRedirect();
          const u = await verifyLineIdToken(await liffGetIdToken());
          if (u) setState((s) => ({ ...s, user: u }));
        })();
        return;
      }
      setState((s) => ({ ...s, user: OWNER })); // local dev mock
    },
    logout: () => {
      liffLogout();
      setState(EMPTY);
    },

    createOrg: (name, description) =>
      setState((s) => {
        if (!s.user) return s;
        const org: Org = {
          id: uid(),
          name,
          description,
          createdBy: s.user.id,
          createdAt: Date.now(),
        };
        const ownerMember: Member = {
          id: uid(),
          userId: s.user.id,
          displayName: s.user.displayName,
          role: "Owner",
          department: "",
          jobTitle: "Owner",
          status: "Active",
          joinedAt: Date.now(),
          questions: 0,
        };
        const seeded = SEED_MEMBERS.map((m) => ({ ...m, id: uid(), userId: uid() }));
        // one demo pending join request so approval + bell are immediately visible
        const reqUser = VISITORS[0];
        const jr: JoinRequest = {
          id: uid(),
          invitationId: null,
          userId: reqUser.id,
          displayName: reqUser.displayName,
          requestedDepartment: "Production",
          requestedJobTitle: "Production Engineer",
          status: "pending",
          createdAt: Date.now() - 1000 * 60 * 2,
        };
        const notif: Notif = {
          id: uid(),
          type: "join_request",
          title: "New join request",
          message: `${reqUser.displayName} requested to join ${name}`,
          referenceId: jr.id,
          isRead: false,
          createdAt: jr.createdAt,
        };
        return {
          ...s,
          org,
          members: [ownerMember, ...seeded],
          joinRequests: [jr],
          notifications: [notif],
          invitations: [],
        };
      }),

    updateOrg: (patch) => setState((s) => (s.org ? { ...s, org: { ...s.org, ...patch } } : s)),

    createInvitation: (i) => {
      const inv: Invitation = {
        id: uid(),
        token: token(),
        defaultRole: i.role,
        defaultDepartment: i.department,
        defaultJobTitle: i.jobTitle,
        expiresAt: Date.now() + i.expiresDays * 86400000,
        singleUse: i.singleUse,
        useCount: 0,
        revokedAt: null,
        createdBy: state.user?.id ?? "",
        createdAt: Date.now(),
      };
      setState((s) => ({ ...s, invitations: [inv, ...s.invitations] }));
      return Promise.resolve(inv);
    },

    regenerateInvitation: (id) => {
      let next: Invitation | undefined;
      setState((s) => ({
        ...s,
        invitations: s.invitations.map((inv) => {
          if (inv.id !== id) return inv;
          next = { ...inv, token: token(), useCount: 0, revokedAt: null, createdAt: Date.now() };
          return next;
        }),
      }));
      return Promise.resolve(next);
    },

    revokeInvitation: (id) =>
      setState((s) => ({
        ...s,
        invitations: s.invitations.map((inv) =>
          inv.id === id ? { ...inv, revokedAt: Date.now() } : inv,
        ),
      })),

    getInvitation: (tok) => state.invitations.find((i) => i.token === tok),

    invitationState: (tok) => {
      const inv = state.invitations.find((i) => i.token === tok);
      if (!inv) return "notfound";
      if (inv.revokedAt) return "revoked";
      if (Date.now() > inv.expiresAt) return "expired";
      if (inv.singleUse && inv.useCount >= 1) return "used";
      return "valid";
    },

    requestToJoin: (visitor, tok, req) =>
      setState((s) => {
        const inv = s.invitations.find((i) => i.token === tok);
        // prevent duplicate pending request from the same user
        if (s.joinRequests.some((j) => j.userId === visitor.id && j.status === "pending")) return s;
        const jr: JoinRequest = {
          id: uid(),
          invitationId: inv?.id ?? null,
          userId: visitor.id,
          displayName: visitor.displayName,
          requestedDepartment: req.department || inv?.defaultDepartment || "",
          requestedJobTitle: req.jobTitle || inv?.defaultJobTitle || "",
          status: "pending",
          createdAt: Date.now(),
        };
        const notif: Notif = {
          id: uid(),
          type: "join_request",
          title: "New join request",
          message: `${visitor.displayName} requested to join ${s.org?.name ?? "your workspace"}`,
          referenceId: jr.id,
          isRead: false,
          createdAt: Date.now(),
        };
        return {
          ...s,
          joinRequests: [jr, ...s.joinRequests],
          invitations: inv
            ? s.invitations.map((i) => (i.id === inv.id ? { ...i, useCount: i.useCount + 1 } : i))
            : s.invitations,
          notifications: [notif, ...s.notifications],
        };
      }),

    approveRequest: (id, assign) =>
      setState((s) => {
        const jr = s.joinRequests.find((j) => j.id === id);
        if (!jr) return s;
        const member: Member = {
          id: uid(),
          userId: jr.userId,
          displayName: jr.displayName,
          role: assign.role,
          department: assign.department,
          jobTitle: assign.jobTitle,
          status: "Active",
          joinedAt: Date.now(),
          questions: 0,
        };
        return {
          ...s,
          members: [...s.members, member],
          joinRequests: s.joinRequests.map((j) =>
            j.id === id ? { ...j, status: "approved", reviewedBy: s.user?.id, reviewedAt: Date.now() } : j,
          ),
          notifications: s.notifications.map((n) =>
            n.referenceId === id ? { ...n, isRead: true, resolvedAt: Date.now() } : n,
          ),
        };
      }),

    rejectRequest: (id, reason) =>
      setState((s) => ({
        ...s,
        joinRequests: s.joinRequests.map((j) =>
          j.id === id ? { ...j, status: "rejected", reviewedBy: s.user?.id, reviewedAt: Date.now(), rejectionReason: reason } : j,
        ),
        notifications: s.notifications.map((n) =>
          n.referenceId === id ? { ...n, isRead: true, resolvedAt: Date.now() } : n,
        ),
      })),

    updateMember: (id, patch) =>
      setState((s) => ({ ...s, members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

    removeMember: (id) => setState((s) => ({ ...s, members: s.members.filter((m) => m.id !== id) })),

    markRead: (id) =>
      setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)) })),

    markAllRead: () =>
      setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, isRead: true })) })),
  };

  // In persistence mode, route mutations through the API and reload from the server.
  const value: Ctx = PERSIST
    ? {
        ...api,
        loginWithLine: (identity) => {
          if (identity) return; // no simulated visitor in real mode
          if (!liffEnabled()) return;
          (async () => {
            if (!(await liffIsLoggedIn())) return liffLoginRedirect();
            await verifyLineIdToken(await liffGetIdToken());
            await refresh();
          })();
        },
        logout: () => {
          liffLogout();
          setState(EMPTY);
        },
        createOrg: (name, description) => {
          command("createOrg", { name, description });
        },
        updateOrg: (patch) => {
          command("updateOrg", patch as Record<string, unknown>);
        },
        createInvitation: async (i) => {
          const d = await command("createInvitation", i);
          const inv = d.workspace?.invitations?.[0];
          return inv ? { ...inv, token: d.token ?? "" } : ({} as Invitation);
        },
        regenerateInvitation: async (id) => {
          const d = await command("regenerateInvitation", { id });
          const inv = d.workspace?.invitations?.find((x) => x.id === id);
          return inv ? { ...inv, token: d.token ?? "" } : undefined;
        },
        revokeInvitation: (id) => {
          command("revokeInvitation", { id });
        },
        approveRequest: (id, assign) => {
          command("approve", { id, ...assign });
        },
        rejectRequest: (id, reason) => {
          command("reject", { id, reason });
        },
        updateMember: (id, patch) => {
          command("updateMember", { id, patch });
        },
        removeMember: (id) => {
          command("removeMember", { id });
        },
        markRead: (id) => {
          command("readNotif", { id });
        },
        markAllRead: () => {
          command("readAll");
        },
      }
    : api;

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}

export function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  return "this week";
}

export function avatarColor(name: string) {
  const hues = ["#2f5aff", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
  return hues[name.charCodeAt(0) % hues.length];
}
