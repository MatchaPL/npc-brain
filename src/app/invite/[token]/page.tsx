"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { useWorkspace, randomVisitor, avatarColor, type LineUser } from "@/lib/workspace";
import { liffEnabled, liffIsLoggedIn, liffLoginRedirect, liffGetIdToken, verifyLineIdToken } from "@/lib/line";

function Brand() {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2f5aff] text-[13px] font-semibold text-white">N</span>
      <span className="text-[16px] font-semibold tracking-tight text-[#111827]">NPC</span>
    </div>
  );
}

function LineGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 3C6.9 3 3 6.3 3 10.4c0 3.7 3.2 6.8 7.5 7.4.3.06.7.2.8.45.07.23.05.58.02.8l-.13.8c-.04.24-.2.94.83.51 1.03-.43 5.5-3.24 7.5-5.55 1.38-1.5 2.05-3 2.05-4.86C21.6 6.3 17.1 3 12 3Z" />
    </svg>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafb] px-6">
      <div className="w-full max-w-[400px]">{children}</div>
    </div>
  );
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params.token ?? "");
  const { org, invitationState, getInvitation, members, requestToJoin } = useWorkspace();

  const [visitor, setVisitor] = useState<LineUser | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // With LIFF configured, hydrate the recipient's real LINE identity after redirect.
  useEffect(() => {
    if (!liffEnabled() || visitor) return;
    (async () => {
      if (await liffIsLoggedIn()) {
        const u = await verifyLineIdToken(await liffGetIdToken());
        if (u) setVisitor(u);
      }
    })();
  }, [visitor]);

  function continueWithLine() {
    if (liffEnabled()) {
      (async () => {
        if (!(await liffIsLoggedIn())) return liffLoginRedirect();
        const u = await verifyLineIdToken(await liffGetIdToken());
        if (u) setVisitor(u);
      })();
      return;
    }
    setVisitor(randomVisitor()); // local dev mock
  }

  const state = invitationState(token);
  const inv = getInvitation(token);
  const inviter = members.find((m) => m.userId === inv?.createdBy)?.displayName ?? "an administrator";

  // invalid / expired / revoked / used
  if (state !== "valid" || !org) {
    const copy: Record<string, { title: string; msg: string }> = {
      expired: { title: "Invitation expired", msg: "This invitation link is no longer active. Please request a new link from the organization administrator." },
      revoked: { title: "Invitation revoked", msg: "This invitation link has been revoked. Please request a new link from the organization administrator." },
      used: { title: "Invitation already used", msg: "This single-use invitation has already been claimed. Please request a new link." },
      notfound: { title: "Invalid invitation", msg: "This invitation link is not valid. Please check the link or request a new one." },
    };
    const c = copy[state] ?? copy.notfound;
    return (
      <Shell>
        <div className="rounded-[14px] border border-[#ececec] bg-white p-7 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#fef2f2] text-[#ef4444]">
            <Icon name="alert" className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-[18px] font-semibold text-[#111827]">{c.title}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6b7280]">{c.msg}</p>
        </div>
      </Shell>
    );
  }

  // submitted
  if (submitted) {
    return (
      <Shell>
        <div className="rounded-[14px] border border-[#ececec] bg-white p-7 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#f0fdf4] text-[#16a34a]">
            <Icon name="check" className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-[18px] font-semibold text-[#111827]">Request submitted</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6b7280]">
            An administrator will review your request. You will receive access to{" "}
            <span className="font-medium text-[#374151]">{org.name}</span> after approval.
          </p>
          <button
            onClick={() => router.push("/")}
            className="press mt-6 rounded-[10px] border border-[#e6e6e9] bg-white px-4 py-2.5 text-[14px] font-medium text-[#111827] hover:bg-[#f7f7f8]"
          >
            Back to workspace
          </button>
        </div>
      </Shell>
    );
  }

  // confirm (after LINE login)
  if (visitor) {
    return (
      <Shell>
        <div className="rounded-[14px] border border-[#ececec] bg-white p-7 text-center">
          <Brand />
          <h1 className="mt-6 text-[20px] font-bold tracking-tight text-[#111827]">Join {org.name}</h1>
          <p className="mt-1 text-[13px] text-[#6b7280]">Invited by {inviter}</p>

          <div className="mt-6 flex items-center gap-3 rounded-[12px] border border-[#ececec] bg-[#fafafb] p-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-medium text-white" style={{ background: avatarColor(visitor.displayName) }}>
              {visitor.displayName.charAt(0)}
            </span>
            <div>
              <div className="text-[14px] font-semibold text-[#111827]">{visitor.displayName}</div>
              <div className="text-[12px] text-[#6b7280]">Your LINE identity will create your workspace profile.</div>
            </div>
          </div>

          <button
            onClick={() => {
              requestToJoin(visitor, token, {
                department: inv?.defaultDepartment ?? "",
                jobTitle: inv?.defaultJobTitle ?? "",
              });
              setSubmitted(true);
            }}
            className="press mt-6 w-full rounded-[10px] bg-[#2f5aff] px-4 py-3 text-[15px] font-medium text-white"
          >
            Request to join
          </button>
          <p className="mt-3 text-[12px] text-[#9ca3af]">You won&apos;t get access until an administrator approves your request.</p>
        </div>
      </Shell>
    );
  }

  // landing
  return (
    <Shell>
      <div className="rounded-[14px] border border-[#ececec] bg-white p-7 text-center">
        <Brand />
        <h1 className="mt-6 text-[20px] font-bold tracking-tight text-[#111827]">Join {org.name}</h1>
        <p className="mt-1 text-[13px] text-[#6b7280]">Invited by {inviter}</p>
        <p className="mt-4 text-[14px] leading-relaxed text-[#6b7280]">
          Continue with LINE to request access to this organization&apos;s knowledge workspace.
        </p>
        <button
          onClick={continueWithLine}
          className="press mt-6 flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-[#06c755] px-4 py-3 text-[15px] font-medium text-white"
        >
          <LineGlyph className="h-5 w-5" />
          Continue with LINE
        </button>
        <p className="mt-4 text-[12px] leading-relaxed text-[#9ca3af]">
          By continuing, you agree to the workspace&apos;s access and privacy policies.
        </p>
      </div>
    </Shell>
  );
}
