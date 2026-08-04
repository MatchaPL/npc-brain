"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { Select } from "@/components/NotificationBell";
import { Field } from "@/components/auth-screens";
import {
  useWorkspace,
  ROLES,
  DEPARTMENTS,
  type Role,
  type Department,
  type Invitation,
} from "@/lib/workspace";

const EXPIRY: { label: string; days: number }[] = [
  { label: "24 hours", days: 1 },
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
];

function inviteUrl(token: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://npc.app";
  return `${origin}/invite/${token}`;
}

export default function InviteModal({ onClose }: { onClose: () => void }) {
  const { createInvitation, regenerateInvitation, revokeInvitation } = useWorkspace();
  const [role, setRole] = useState<Role>("Member");
  const [dept, setDept] = useState<Department>("");
  const [title, setTitle] = useState("");
  const [expiry, setExpiry] = useState(2); // index into EXPIRY (7 days)
  const [singleUse, setSingleUse] = useState(false);
  const [invite, setInvite] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);

  const url = invite ? inviteUrl(invite.token) : "";

  async function create() {
    const inv = await createInvitation({
      role,
      department: dept,
      jobTitle: title,
      expiresDays: EXPIRY[expiry].days,
      singleUse,
    });
    setInvite(inv);
  }
  function copy() {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  function shareLine() {
    const text = `Join our NPC workspace: ${url}`;
    window.open(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onMouseDown={onClose}>
      <div
        className="w-full max-w-[440px] rounded-[14px] border border-[#ececec] bg-white shadow-[0_16px_48px_rgba(17,24,39,0.2)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#f1f1f3] px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-[#111827]">Invite members</h3>
            <p className="mt-0.5 text-[12px] text-[#6b7280]">Share this secure link through LINE.</p>
          </div>
          <button onClick={onClose} className="rounded-[8px] p-1 text-[#9ca3af] hover:bg-[#f1f1f3]">
            <Icon name="plus" className="h-4 w-4 rotate-45" />
          </button>
        </div>

        <div className="px-5 py-4">
          {!invite ? (
            <>
              <Select label="Default role" value={role} onChange={(v) => setRole(v as Role)} options={ROLES} />
              <div className="mt-3">
                <Select label="Department (optional)" value={dept} onChange={(v) => setDept(v as Department)} options={["", ...DEPARTMENTS]} />
              </div>
              <div className="mt-3">
                <Field label="Job title" hint="Optional">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Production Engineer"
                    className="w-full rounded-[8px] border border-[#e6e6e9] px-2.5 py-2 text-[13px] outline-none focus:border-[#2f5aff]"
                  />
                </Field>
              </div>

              <div className="mb-3">
                <span className="mb-1.5 block text-[12px] font-medium text-[#374151]">Invitation expiration</span>
                <div className="flex gap-2">
                  {EXPIRY.map((e, i) => (
                    <button
                      key={e.label}
                      onClick={() => setExpiry(i)}
                      className={`flex-1 rounded-[8px] border px-2 py-2 text-[13px] font-medium ${
                        expiry === i ? "border-[#2f5aff] bg-[#eef2ff] text-[#2f5aff]" : "border-[#e6e6e9] text-[#374151] hover:bg-[#f7f7f8]"
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mb-4 flex items-center gap-2 text-[13px] text-[#374151]">
                <input type="checkbox" checked={singleUse} onChange={(e) => setSingleUse(e.target.checked)} className="h-4 w-4 accent-[#2f5aff]" />
                Limit to a single use
              </label>

              <button onClick={create} className="press w-full rounded-[10px] bg-[#2f5aff] px-4 py-2.5 text-[14px] font-medium text-white">
                Create invite link
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-[10px] border border-[#e6e6e9] bg-[#fafafb] px-3 py-2.5">
                <Icon name="knowledge" className="h-4 w-4 shrink-0 text-[#9ca3af]" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-[#374151]">{url}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={copy} className="press flex items-center justify-center gap-1.5 rounded-[10px] border border-[#e6e6e9] bg-white px-3 py-2 text-[13px] font-medium text-[#111827] hover:bg-[#f7f7f8]">
                  <Icon name={copied ? "check" : "documents"} className="h-4 w-4" />
                  {copied ? "Copied" : "Copy link"}
                </button>
                <button onClick={shareLine} className="press flex items-center justify-center gap-1.5 rounded-[10px] bg-[#06c755] px-3 py-2 text-[13px] font-medium text-white">
                  Share via LINE
                </button>
                <button
                  onClick={async () => {
                    const next = await regenerateInvitation(invite.id);
                    if (next) setInvite(next);
                  }}
                  className="press flex items-center justify-center gap-1.5 rounded-[10px] border border-[#e6e6e9] bg-white px-3 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#f7f7f8]"
                >
                  <Icon name="activity" className="h-4 w-4" />
                  Regenerate
                </button>
                <button
                  onClick={() => {
                    revokeInvitation(invite.id);
                    onClose();
                  }}
                  className="press flex items-center justify-center gap-1.5 rounded-[10px] border border-[#f3d4d4] bg-white px-3 py-2 text-[13px] font-medium text-[#b91c1c] hover:bg-[#fef2f2]"
                >
                  Revoke link
                </button>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-[#9ca3af]">
                Default role: <span className="font-medium text-[#6b7280]">{invite.defaultRole}</span> · Expires in{" "}
                {EXPIRY[expiry].label}
                {singleUse ? " · single use" : ""}. Recipients must request to join and be approved.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
