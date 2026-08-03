"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useWorkspace } from "@/lib/workspace";

// Simple LINE glyph for the auth button
function LineGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 3C6.9 3 3 6.3 3 10.4c0 3.7 3.2 6.8 7.5 7.4.3.06.7.2.8.45.07.23.05.58.02.8l-.13.8c-.04.24-.2.94.83.51 1.03-.43 5.5-3.24 7.5-5.55 1.38-1.5 2.05-3 2.05-4.86C21.6 6.3 17.1 3 12 3Z" />
    </svg>
  );
}

function Brand() {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2f5aff] text-[13px] font-semibold text-white">
        N
      </span>
      <span className="text-[16px] font-semibold tracking-tight text-[#111827]">NPC</span>
    </div>
  );
}

export function LoginScreen() {
  const { loginWithLine } = useWorkspace();
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafb] px-6">
      <div className="w-full max-w-[400px] text-center">
        <Brand />
        <h1 className="mt-8 text-[26px] font-bold tracking-tight text-[#111827]">
          The AI that knows your company.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[#6b7280]">
          Access your organization&apos;s knowledge, documents, and trusted answers in one secure
          workspace.
        </p>

        <button
          onClick={() => loginWithLine()}
          className="press mt-8 flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-[#06c755] px-4 py-3 text-[15px] font-medium text-white"
        >
          <LineGlyph className="h-5 w-5" />
          Continue with LINE
        </button>

        <p className="mt-5 text-[12px] leading-relaxed text-[#9ca3af]">
          By continuing, you agree to the workspace&apos;s access and privacy policies.
        </p>
      </div>
    </div>
  );
}

export function Onboarding() {
  const { createOrg } = useWorkspace();
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [link, setLink] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafb] px-6">
      <div className="w-full max-w-[460px]">
        <div className="mb-7 text-center">
          <Brand />
          <h1 className="mt-6 text-[24px] font-bold tracking-tight text-[#111827]">Welcome to NPC</h1>
          <p className="mt-1.5 text-[14px] text-[#6b7280]">
            {mode === "choose"
              ? "How would you like to get started?"
              : mode === "create"
                ? "Start a new workspace for your company."
                : "Use an invitation link from your administrator."}
          </p>
        </div>

        {mode === "choose" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("create")}
              className="hover-lift flex w-full items-start gap-3 rounded-[12px] border border-[#ececec] bg-white p-4 text-left hover:border-[#d9d9dd] hover:shadow-[0_2px_8px_rgba(17,24,39,0.05)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#eef2ff] text-[#2f5aff]">
                <Icon name="plus" className="h-[18px] w-[18px]" />
              </span>
              <span>
                <span className="block text-[14px] font-semibold text-[#111827]">Create an organization</span>
                <span className="mt-0.5 block text-[12px] text-[#6b7280]">Start a new workspace for your company.</span>
              </span>
            </button>
            <button
              onClick={() => setMode("join")}
              className="hover-lift flex w-full items-start gap-3 rounded-[12px] border border-[#ececec] bg-white p-4 text-left hover:border-[#d9d9dd] hover:shadow-[0_2px_8px_rgba(17,24,39,0.05)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#eef2ff] text-[#2f5aff]">
                <Icon name="people" className="h-[18px] w-[18px]" />
              </span>
              <span>
                <span className="block text-[14px] font-semibold text-[#111827]">Join an organization</span>
                <span className="mt-0.5 block text-[12px] text-[#6b7280]">Use an invitation link from your administrator.</span>
              </span>
            </button>
          </div>
        )}

        {mode === "create" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              createOrg(name.trim(), desc.trim());
            }}
            className="rounded-[12px] border border-[#ececec] bg-white p-5"
          >
            <Field label="Organization name" required>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="NPC Manufacturing Co., Ltd."
                className="w-full rounded-[10px] border border-[#e6e6e9] px-3 py-2.5 text-[14px] outline-none focus:border-[#2f5aff] focus:ring-4 focus:ring-[#2f5aff]/10"
              />
            </Field>
            <Field label="Company description" hint="Optional">
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                placeholder="Industrial automation and manufacturing solutions."
                className="w-full resize-none rounded-[10px] border border-[#e6e6e9] px-3 py-2.5 text-[14px] outline-none focus:border-[#2f5aff] focus:ring-4 focus:ring-[#2f5aff]/10"
              />
            </Field>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={!name.trim()}
                className="press rounded-[10px] bg-[#2f5aff] px-4 py-2.5 text-[14px] font-medium text-white disabled:opacity-40"
              >
                Create organization
              </button>
              <button type="button" onClick={() => setMode("choose")} className="px-3 py-2.5 text-[14px] text-[#6b7280]">
                Back
              </button>
            </div>
          </form>
        )}

        {mode === "join" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const t = link.trim().split("/invite/")[1] ?? link.trim();
              if (t) router.push(`/invite/${t}`);
            }}
            className="rounded-[12px] border border-[#ececec] bg-white p-5"
          >
            <Field label="Invitation link">
              <input
                autoFocus
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://npc.app/invite/…"
                className="w-full rounded-[10px] border border-[#e6e6e9] px-3 py-2.5 text-[14px] outline-none focus:border-[#2f5aff] focus:ring-4 focus:ring-[#2f5aff]/10"
              />
            </Field>
            <p className="mb-3 text-[12px] text-[#9ca3af]">
              Paste the invitation link your administrator shared with you on LINE.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!link.trim()}
                className="press rounded-[10px] bg-[#2f5aff] px-4 py-2.5 text-[14px] font-medium text-white disabled:opacity-40"
              >
                Continue
              </button>
              <button type="button" onClick={() => setMode("choose")} className="px-3 py-2.5 text-[14px] text-[#6b7280]">
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-3.5 block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-[#374151]">
        {label}
        {required && <span className="text-[#ef4444]">*</span>}
        {hint && <span className="font-normal text-[#9ca3af]">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}
