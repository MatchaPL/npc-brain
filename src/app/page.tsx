"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import {
  COLLECTIONS,
  DOCUMENTS,
  ACTIVITY,
  OVERVIEW,
  POPULAR_QUESTIONS,
  CURRENT_USER,
} from "@/lib/demo";

const card = "rounded-[12px] border border-[#ececec] bg-white";

const STATUS: Record<string, { fg: string; dot: string }> = {
  Indexed: { fg: "#16803d", dot: "#22c55e" },
  Processing: { fg: "#92400e", dot: "#f59e0b" },
  "Needs review": { fg: "#b91c1c", dot: "#ef4444" },
};

const ACTIONS: { label: string; sub: string; icon: IconName; href: string }[] = [
  { label: "Find a document", sub: "Search files by name or content", icon: "documents", href: "/documents" },
  { label: "Ask a company policy", sub: "Leave, expenses, approvals", icon: "ask", href: "/ask?q=" + encodeURIComponent("What is the company leave policy?") },
  { label: "Explain a workflow", sub: "Step-by-step from your SOPs", icon: "knowledge", href: "/ask?q=" + encodeURIComponent("Explain the purchase request workflow") },
  { label: "Find a teammate", sub: "Who owns what", icon: "people", href: "/people" },
];

function collectionTint(name: string) {
  return COLLECTIONS.find((c) => c.name === name) ?? { tint: "#f4f4f6", fg: "#6b7280" };
}

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/ask?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div className="min-h-full">
      <header className="flex items-center justify-between border-b border-[#ececec] bg-white px-8 py-3.5">
        <span className="text-[14px] font-medium text-[#111827]">Home</span>
        <div className="flex items-center gap-2">
          <button className="press flex h-9 w-9 items-center justify-center rounded-[10px] text-[#6b7280] hover:bg-[#f1f1f3]">
            <Icon name="bell" className="h-[18px] w-[18px]" />
          </button>
          <Link
            href="/documents"
            className="press flex items-center gap-1.5 rounded-[10px] bg-[#2f5aff] px-3.5 py-2 text-[13px] font-medium text-white"
          >
            <Icon name="upload" className="h-4 w-4" />
            Add document
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-8 pb-16">
        {/* hero */}
        <section className="pt-10 pb-8">
          <h1 className="text-[28px] font-bold tracking-tight text-[#111827]">
            {greeting}, {CURRENT_USER.name}.
          </h1>
          <p className="mt-1 text-[15px] text-[#6b7280]">Welcome back.</p>

          <form onSubmit={search} className="mt-5 max-w-2xl">
            <div className="flex items-center gap-3 rounded-[12px] border border-[#e6e6e9] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(17,24,39,0.04)] focus-within:border-[#2f5aff] focus-within:ring-4 focus-within:ring-[#2f5aff]/10">
              <Icon name="search" className="h-5 w-5 shrink-0 text-[#9ca3af]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search company knowledge..."
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#9ca3af]"
              />
              <button
                type="submit"
                disabled={!q.trim()}
                className="press flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#2f5aff] text-white disabled:opacity-30"
              >
                <Icon name="arrowRight" className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>

        {/* suggested actions */}
        <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ACTIONS.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={`${card} hover-lift p-4 hover:border-[#d9d9dd] hover:shadow-[0_2px_8px_rgba(17,24,39,0.05)]`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#eef2ff] text-[#2f5aff]">
                <Icon name={a.icon} className="h-[18px] w-[18px]" />
              </div>
              <div className="mt-3 text-[14px] font-semibold text-[#111827]">{a.label}</div>
              <div className="mt-0.5 text-[12px] text-[#9ca3af]">{a.sub}</div>
            </Link>
          ))}
        </section>

        {/* workspace overview */}
        <SectionLabel>Workspace Overview</SectionLabel>
        <section className="mb-9 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {OVERVIEW.map((s) => (
            <div key={s.label} className={`${card} p-4`}>
              <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#f4f4f6] text-[#6b7280]">
                <Icon name={s.icon} className="h-[15px] w-[15px]" />
              </span>
              <div className="mt-3 text-[22px] font-bold tracking-tight text-[#111827]">{s.value}</div>
              <div className="text-[12px] text-[#6b7280]">{s.label}</div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* left */}
          <div className="space-y-6 lg:col-span-2">
            <Panel title="Recent Documents" href="/documents">
              <ul className="divide-y divide-[#f1f1f3]">
                {DOCUMENTS.slice(0, 5).map((d) => {
                  const cc = collectionTint(d.collection);
                  const st = STATUS[d.status];
                  return (
                    <li key={d.slug}>
                      <Link href={`/documents/${d.slug}`} className="flex items-center gap-3 py-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#f4f4f6] text-[#6b7280]">
                          <Icon name="fileText" className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#111827]">
                          {d.name}
                        </span>
                        <span
                          className="hidden shrink-0 rounded-full px-2 py-0.5 text-[12px] font-medium sm:inline"
                          style={{ background: cc.tint, color: cc.fg }}
                        >
                          {d.collection}
                        </span>
                        <span className="hidden w-20 shrink-0 text-right text-[12px] text-[#9ca3af] sm:inline">
                          {d.updated}
                        </span>
                        <span className="flex w-24 shrink-0 items-center justify-end gap-1.5 text-[12px] font-medium" style={{ color: st.fg }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} />
                          {d.status}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel title="Popular Questions">
              <ul className="divide-y divide-[#f1f1f3]">
                {POPULAR_QUESTIONS.map((question) => (
                  <li key={question}>
                    <Link
                      href={`/ask?q=${encodeURIComponent(question)}`}
                      className="group flex items-center gap-3 py-2.5"
                    >
                      <Icon name="ask" className="h-4 w-4 shrink-0 text-[#9ca3af]" />
                      <span className="flex-1 text-[13px] text-[#374151]">{question}</span>
                      <Icon
                        name="arrowRight"
                        className="h-4 w-4 shrink-0 text-[#c4c4c9] transition group-hover:text-[#2f5aff]"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          {/* right */}
          <div className="space-y-6">
            <div className={`${card} p-5`}>
              <h3 className="text-[14px] font-semibold text-[#111827]">Knowledge Health</h3>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-[30px] font-bold leading-none tracking-tight text-[#111827]">98%</span>
                <span className="mb-1 text-[13px] font-medium text-[#6b7280]">Indexed</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f1f1f3]">
                <div className="h-full rounded-full bg-[#22c55e]" style={{ width: "98%" }} />
              </div>
              <div className="mt-4 flex items-center gap-2 text-[13px] text-[#6b7280]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                2 documents processing
              </div>
              <div className="mt-3 border-t border-[#f1f1f3] pt-3 text-[12px] text-[#9ca3af]">
                Last synced 2 minutes ago
              </div>
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#6b7280]">
      {children}
    </h2>
  );
}

function Panel({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
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
