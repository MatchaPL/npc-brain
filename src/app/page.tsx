"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import {
  COLLECTIONS,
  DOCUMENTS,
  RECENT_QUESTIONS,
  ACTIVITY,
  STATS,
} from "@/lib/demo";

const card = "rounded-[12px] border border-[#ececec] bg-white";

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/ask?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div className="min-h-full">
      {/* top bar */}
      <header className="flex items-center justify-between border-b border-[#ececec] bg-white/70 px-8 py-3.5 backdrop-blur">
        <span className="text-[14px] font-medium text-[#111827]">Home</span>
        <div className="flex items-center gap-2">
          <button className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[#6b7280] hover:bg-[#f1f1f3]">
            <Icon name="bell" className="h-[18px] w-[18px]" />
          </button>
          <Link
            href="/documents"
            className="flex items-center gap-1.5 rounded-[10px] bg-[#2f5aff] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#2549e0]"
          >
            <Icon name="upload" className="h-4 w-4" />
            Add document
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-8 pb-16">
        {/* hero */}
        <section className="pt-16 pb-10 text-center">
          <div className="mb-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#2f5aff]">
            NPC
          </div>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight text-[#111827]">
            The AI that knows your company.
          </h1>
          <p className="mt-3 text-[16px] text-[#6b7280]">
            What would you like to accomplish today?
          </p>

          <form onSubmit={ask} className="mx-auto mt-7 max-w-2xl">
            <div className="flex items-center gap-3 rounded-[14px] border border-[#e6e6e9] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(17,24,39,0.04)] focus-within:border-[#2f5aff] focus-within:ring-4 focus-within:ring-[#2f5aff]/10">
              <Icon name="search" className="h-5 w-5 shrink-0 text-[#9ca3af]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ask anything about your company..."
                className="w-full bg-transparent text-[15px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
              />
              <button
                type="submit"
                disabled={!q.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#2f5aff] text-white transition disabled:opacity-30"
              >
                <Icon name="arrowUp" className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>

        {/* knowledge collections */}
        <section className="mb-12">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#6b7280]">
              Knowledge Collections
            </h2>
            <Link href="/knowledge" className="text-[13px] font-medium text-[#2f5aff]">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {COLLECTIONS.map((c) => (
              <Link
                key={c.name}
                href="/knowledge"
                className={`${card} group p-4 transition hover:border-[#d9d9dd] hover:shadow-[0_2px_8px_rgba(17,24,39,0.05)]`}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-[10px]"
                  style={{ background: c.tint, color: c.fg }}
                >
                  <Icon name={c.icon} className="h-[18px] w-[18px]" />
                </div>
                <div className="mt-3 text-[14px] font-semibold text-[#111827]">{c.name}</div>
                <div className="mt-0.5 text-[12px] text-[#6b7280]">{c.docs} documents</div>
              </Link>
            ))}
          </div>
        </section>

        {/* workspace overview */}
        <section className="mb-6">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#6b7280]">
            Workspace Overview
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className={`${card} p-4`}>
                <div className="text-[12px] text-[#6b7280]">{s.label}</div>
                <div className="mt-1 text-[26px] font-bold tracking-tight text-[#111827]">
                  {s.value}
                </div>
                <div className="mt-0.5 text-[12px] text-[#9ca3af]">{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* two-column dashboard */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* left: recent docs + questions */}
          <div className="space-y-6 lg:col-span-2">
            <Panel title="Recent Documents" href="/documents">
              <ul className="divide-y divide-[#f1f1f3]">
                {DOCUMENTS.slice(0, 5).map((d) => (
                  <li key={d.name} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#f4f4f6] text-[#6b7280]">
                      <Icon name="fileText" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-[#111827]">{d.name}</div>
                      <div className="text-[12px] text-[#9ca3af]">
                        {d.collection} · {d.type} · {d.pages} pages
                      </div>
                    </div>
                    <span className="shrink-0 text-[12px] text-[#9ca3af]">{d.updated}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Recent Questions" href="/activity">
              <ul className="divide-y divide-[#f1f1f3]">
                {RECENT_QUESTIONS.map((r) => (
                  <li key={r.q} className="py-2.5">
                    <div className="text-[13px] font-medium text-[#111827]">{r.q}</div>
                    <div className="mt-0.5 text-[12px] text-[#9ca3af]">
                      {r.asker} · {r.when} · {r.sources} sources cited
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          {/* right: knowledge health + activity */}
          <div className="space-y-6">
            <div className={`${card} p-5`}>
              <h3 className="text-[14px] font-semibold text-[#111827]">Knowledge Health</h3>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-[32px] font-bold leading-none tracking-tight text-[#111827]">94%</span>
                <span className="mb-1 text-[12px] font-medium text-[#22c55e]">Healthy</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f1f1f3]">
                <div className="h-full rounded-full bg-[#22c55e]" style={{ width: "94%" }} />
              </div>
              <ul className="mt-4 space-y-2 text-[13px]">
                <HealthRow color="#22c55e" label="Indexed" value="150" />
                <HealthRow color="#f59e0b" label="Processing" value="6" />
                <HealthRow color="#ef4444" label="Needs review" value="3" />
              </ul>
            </div>

            <Panel title="Recent Activity" href="/activity">
              <ul className="space-y-3">
                {ACTIVITY.map((a, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d1d5db]" />
                    <div className="text-[13px] leading-snug">
                      <span className="font-medium text-[#111827]">{a.actor}</span>{" "}
                      <span className="text-[#6b7280]">{a.action}</span>{" "}
                      <span className="font-medium text-[#111827]">{a.target}</span>
                      <div className="text-[12px] text-[#9ca3af]">{a.when}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${card} p-5`}>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[#111827]">{title}</h3>
        {href && (
          <Link href={href} className="text-[12px] font-medium text-[#2f5aff]">
            View all
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function HealthRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-[#6b7280]">{label}</span>
      <span className="ml-auto font-medium text-[#111827]">{value}</span>
    </li>
  );
}
