"use client";

import { useEffect, useState } from "react";
import { useWorkspace, relativeTime } from "@/lib/workspace";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f4f4f6] py-3.5 last:border-0">
      <span className="text-[13px] text-[#6b7280]">{label}</span>
      <span className="text-[13px] font-medium text-[#111827]">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { org, members, invitations, updateOrg, revokeInvitation, isAdmin } = useWorkspace();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (org) {
      setName(org.name);
      setDesc(org.description);
    }
  }, [org]);

  if (!org) return null;

  const owner = members.find((m) => m.role === "Owner");
  const activeInvites = invitations.filter((i) => !i.revokedAt && Date.now() < i.expiresAt);

  return (
    <div className="min-h-full">
      <header className="flex items-center border-b border-[#ececec] bg-white px-8 py-3.5">
        <span className="text-[14px] font-medium text-[#111827]">Settings</span>
      </header>

      <div className="mx-auto max-w-2xl px-8 py-6">
        <div className="space-y-6">
          {/* Organization */}
          <section className="rounded-[12px] border border-[#ececec] bg-white p-6">
            <h2 className="text-[15px] font-semibold text-[#111827]">Organization</h2>

            <div className="mt-4 space-y-3.5">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-[#374151]">Organization name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full rounded-[10px] border border-[#e6e6e9] px-3 py-2.5 text-[14px] outline-none focus:border-[#2f5aff] disabled:bg-[#fafafb]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-[#374151]">Description</span>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={2}
                  disabled={!isAdmin}
                  className="w-full resize-none rounded-[10px] border border-[#e6e6e9] px-3 py-2.5 text-[14px] outline-none focus:border-[#2f5aff] disabled:bg-[#fafafb]"
                />
              </label>
              {isAdmin && (
                <button
                  onClick={() => {
                    updateOrg({ name: name.trim() || org.name, description: desc.trim() });
                    setSaved(true);
                    setTimeout(() => setSaved(false), 1500);
                  }}
                  className="press rounded-[10px] bg-[#2f5aff] px-4 py-2 text-[13px] font-medium text-white"
                >
                  {saved ? "Saved" : "Save changes"}
                </button>
              )}
            </div>

            <div className="mt-5 border-t border-[#f1f1f3] pt-2">
              <Row label="Workspace ID" value={`ws_${org.id}`} />
              <Row label="Created" value={relativeTime(org.createdAt)} />
              <Row label="Owner" value={owner?.displayName ?? "—"} />
              <Row label="Members" value={String(members.filter((m) => m.status === "Active").length)} />
            </div>
          </section>

          {/* Invitations */}
          <section className="rounded-[12px] border border-[#ececec] bg-white p-6">
            <h2 className="text-[15px] font-semibold text-[#111827]">Invitations</h2>
            <div className="mt-2">
              <Row label="Default member role" value="Member" />
              <Row label="Active invitation links" value={String(activeInvites.length)} />
            </div>
            {isAdmin && activeInvites.length > 0 && (
              <button
                onClick={() => activeInvites.forEach((i) => revokeInvitation(i.id))}
                className="press mt-3 rounded-[10px] border border-[#f3d4d4] px-4 py-2 text-[13px] font-medium text-[#b91c1c] hover:bg-[#fef2f2]"
              >
                Disable all active links
              </button>
            )}
          </section>

          {/* Answering */}
          <section className="rounded-[12px] border border-[#ececec] bg-white p-6">
            <h2 className="text-[15px] font-semibold text-[#111827]">Answering</h2>
            <div className="mt-2">
              <Row label="Answer model" value="Configurable (OpenRouter)" />
              <Row label="Require citations" value="On" />
              <Row label="Answer only from company documents" value="On" />
              <Row label="Decline when no source is found" value="On" />
            </div>
          </section>

          {/* Security */}
          <section className="rounded-[12px] border border-[#ececec] bg-white p-6">
            <h2 className="text-[15px] font-semibold text-[#111827]">Security</h2>
            <div className="mt-2">
              <Row label="Authentication" value="LINE Login" />
              <Row label="Access control" value="By collection" />
              <Row label="Audit log" value="Enabled" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
