"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/icons";

interface Source {
  source: string;
  title: string | null;
  url: string | null;
}
interface Msg {
  role: "user" | "assistant";
  text: string;
  answered?: boolean;
  sources?: Source[];
  error?: string;
  loading?: boolean;
}

const HISTORY = [
  "Sick-leave certificate rules",
  "Domestic travel per-diem",
  "Quotation template location",
  "Purchase request approval limits",
  "Machine safety incident steps",
];

// deterministic pseudo page number per source (demo data has no real PDF pages)
function pageFor(src: string) {
  let h = 0;
  for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) >>> 0;
  return (h % 22) + 1;
}
function renderRich(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
  );
}

export default function AskPage() {
  return (
    <Suspense fallback={null}>
      <Ask />
    </Suspense>
  );
}

function Ask() {
  const params = useSearchParams();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const convRef = useRef<HTMLDivElement>(null);
  const didInit = useRef(false);

  const lastAnswer = [...messages].reverse().find((m) => m.role === "assistant" && !m.loading);
  const sources = lastAnswer?.sources ?? [];

  useEffect(() => {
    convRef.current?.scrollTo({ top: convRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const q = params.get("q");
    if (q && !didInit.current) {
      didInit.current = true;
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", text: q },
      { role: "assistant", text: "", loading: true },
    ]);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, mode: "company" }),
      });
      const data = await r.json();
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          role: "assistant",
          text: data.answer || "",
          answered: data.answered,
          sources: data.sources,
          error: data.error,
        };
        return next;
      });
    } catch (e) {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          role: "assistant",
          text: "",
          error: e instanceof Error ? e.message : "request failed",
        };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full">
      {/* LEFT — conversation history */}
      <div className="hidden w-[248px] shrink-0 flex-col border-r border-[#ececec] bg-[#fafafb] lg:flex">
        <div className="px-4 py-4">
          <button
            onClick={() => setMessages([])}
            className="flex w-full items-center gap-2 rounded-[10px] border border-[#e6e6e9] bg-white px-3 py-2 text-[13px] font-medium text-[#111827] hover:border-[#d9d9dd]"
          >
            <Icon name="plus" className="h-4 w-4 text-[#2f5aff]" />
            New conversation
          </button>
        </div>
        <div className="px-2">
          <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
            History
          </div>
          <ul className="space-y-0.5">
            {HISTORY.map((h, i) => (
              <li key={h}>
                <button
                  className={`flex w-full items-center gap-2 truncate rounded-[8px] px-2.5 py-2 text-left text-[13px] ${
                    i === 0 && messages.length > 0
                      ? "bg-[#eef2ff] text-[#2f5aff]"
                      : "text-[#374151] hover:bg-[#f1f1f3]"
                  }`}
                >
                  <Icon name="clock" className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{h}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CENTER — conversation */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-[#ececec] bg-white px-6 py-3.5">
          <Icon name="ask" className="h-[18px] w-[18px] text-[#2f5aff]" />
          <span className="text-[14px] font-medium text-[#111827]">Ask</span>
          <span className="ml-2 rounded-full bg-[#f4f4f6] px-2 py-0.5 text-[11px] font-medium text-[#6b7280]">
            Company knowledge
          </span>
        </header>

        <div ref={convRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {messages.length === 0 ? (
            <EmptyState onPick={send} />
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((m, i) => (
                <Bubble key={i} m={m} />
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="mx-auto flex max-w-3xl items-center gap-2 rounded-[12px] border border-[#e6e6e9] bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] focus-within:border-[#2f5aff] focus-within:ring-4 focus-within:ring-[#2f5aff]/10"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your company..."
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#9ca3af]"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#2f5aff] text-white transition disabled:opacity-30"
            >
              <Icon name="arrowUp" className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT — sources & citations */}
      <div className="hidden w-[320px] shrink-0 flex-col border-l border-[#ececec] bg-white xl:flex">
        <header className="border-b border-[#ececec] px-5 py-3.5">
          <span className="text-[14px] font-medium text-[#111827]">Sources &amp; Citations</span>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {sources.length === 0 ? (
            <p className="mt-8 text-center text-[13px] text-[#9ca3af]">
              Citations from the answer will appear here, with document name and page.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {sources.map((s, i) => (
                <li key={s.source} className="rounded-[10px] border border-[#ececec] p-3">
                  <div className="flex items-start gap-2">
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-[6px] bg-[#eef2ff] px-1 text-[11px] font-semibold text-[#2f5aff]">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium leading-snug text-[#111827]">
                        {s.title || s.source}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[#6b7280]">
                        <Icon name="fileText" className="h-3.5 w-3.5" />
                        Page {pageFor(s.source)}
                      </div>
                    </div>
                  </div>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 flex items-center gap-1 text-[12px] font-medium text-[#2f5aff]"
                    >
                      Open document
                      <Icon name="external" className="h-3.5 w-3.5" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Bubble({ m }: { m: Msg }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-[12px] bg-[#eef2ff] px-4 py-2.5 text-[15px] text-[#111827]">
          {m.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2f5aff] text-[12px] font-semibold text-white">
        N
      </span>
      <div className="min-w-0 flex-1">
        {m.loading ? (
          <div className="flex items-center gap-2 text-[14px] text-[#9ca3af]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#c7d0ff]" />
            Searching your documents…
          </div>
        ) : m.error ? (
          <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
            {m.error}
          </div>
        ) : m.answered === false ? (
          <div className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13px] text-[#92400e]">
            No answer found in your knowledge base. NPC will not guess — try rephrasing, or add a document
            that covers this.
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#111827]">
              {renderRich(m.text)}
            </p>
            {m.sources && m.sources.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] text-[#9ca3af]">Cited:</span>
                {m.sources.map((s, i) => (
                  <span
                    key={s.source}
                    title={`${s.title || s.source} · p. ${pageFor(s.source)}`}
                    className="inline-flex items-center gap-1 rounded-full border border-[#ececec] bg-[#fafafb] px-2 py-0.5 text-[12px] text-[#374151]"
                  >
                    <span className="font-semibold text-[#2f5aff]">{i + 1}</span>
                    <span className="max-w-[160px] truncate">{s.title || s.source}</span>
                    <span className="text-[#9ca3af]">p.{pageFor(s.source)}</span>
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  const examples = [
    "How many sick-leave days require a medical certificate?",
    "What is the per-diem for domestic business travel?",
    "Where is the latest quotation template?",
    "What is the approval limit for a purchase request?",
  ];
  return (
    <div className="mx-auto max-w-2xl pt-16 text-center">
      <h2 className="text-[20px] font-semibold text-[#111827]">Ask anything about your company</h2>
      <p className="mt-2 text-[14px] text-[#6b7280]">
        Answers are drawn from your documents, with citations you can verify.
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => onPick(ex)}
            className="rounded-[10px] border border-[#ececec] bg-white px-4 py-3 text-left text-[13px] text-[#374151] transition hover:border-[#d9d9dd] hover:shadow-[0_1px_3px_rgba(17,24,39,0.05)]"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
