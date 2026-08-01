"use client";

import { useEffect, useRef, useState } from "react";

// ── types ──
interface Source {
  source: string;
  title: string | null;
  url: string | null;
}
interface AskResponse {
  mode?: string;
  provider?: string;
  answered?: boolean;
  answer?: string;
  sources?: Source[];
  error?: string;
}
interface Message {
  role: "user" | "assistant";
  text: string;
  mode?: "company" | "world";
  answered?: boolean;
  sources?: Source[];
  error?: string;
  loading?: boolean;
}
type Mode = "company" | "world";

// ── demo prompt cards ──
const PROMPTS = [
  { title: "ลาป่วยเกิน 3 วันต้องทำยังไง", author: "มนัสนันท์ (HR)", uses: 89 },
  { title: "เบิกค่าเดินทางไปต่างจังหวัดได้เท่าไหร่", author: "ธีรพงษ์ (Finance)", uses: 64 },
  { title: "ขอ template ใบเสนอราคาอยู่ที่ไหน", author: "สุภาวดี (Sales)", uses: 51 },
  { title: "wifi ออฟฟิศรหัสอะไร เข้าอีเมลบริษัทยังไง", author: "อนุชา (IT)", uses: 47 },
  { title: "ขั้นตอนขอซื้อของ (purchase request)", author: "สุภาวดี (Procurement)", uses: 33 },
  { title: "โปรเจกต์ Alpha มีปัญหาอะไรบ้าง", author: "กิตติ (PM)", uses: 21 },
];

// ── tiny inline icons ──
function Icon({ path, className = "" }: { path: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {path.split("|").map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
const I = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z|m21 21-4.3-4.3",
  chat: "M12 3c5 0 9 3.6 9 8s-4 8-9 8a10 10 0 0 1-3-.5L3 21l1.5-4A7.4 7.4 0 0 1 3 11c0-4.4 4-8 9-8Z",
  people: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8|M22 21v-2a4 4 0 0 0-3-3.9|M16 3.1a4 4 0 0 1 0 7.8",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20|M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z",
  menu: "M3 12h18|M3 6h18|M3 18h18",
  compose: "M12 20h9|M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
  sliders: "M4 21v-7|M4 10V3|M12 21v-9|M12 8V3|M20 21v-5|M20 12V3|M1 14h6|M9 8h6|M17 16h6",
  sparkles: "M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3Z",
  plus: "M12 5v14|M5 12h14",
  arrowUp: "M12 19V5|M5 12l7-7 7 7",
  check: "M20 6 9 17l-5-5",
  chevron: "m6 9 6 6 6-6",
};

function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase();
  const hues = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
  const hue = hues[name.charCodeAt(0) % hues.length];
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-medium text-white"
      style={{ width: size, height: size, background: hue, fontSize: size * 0.45 }}
    >
      {initial}
    </span>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("company");
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<"Recommended" | "Favorites" | "Created by me">(
    "Recommended",
  );
  const [uploads, setUploads] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const started = messages.length > 0;

  async function handleUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (data.ok) {
        setUploads((u) => [...u, data.name]);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            mode: "company",
            answered: true,
            text: `จำไฟล์ “${data.name}” ไว้แล้ว (${Number(
              data.chars,
            ).toLocaleString()} ตัวอักษร)\nถามเกี่ยวกับไฟล์นี้ได้เลยในโหมด Company knowledge`,
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", mode: "company", text: "", error: data.error || "อัปโหลดไม่สำเร็จ" },
        ]);
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "", error: e instanceof Error ? e.message : "upload failed" },
      ]);
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ⌘. to switch knowledge mode
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey && e.key === ".") {
        e.preventDefault();
        setMode((m) => (m === "company" ? "world" : "company"));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function send(question: string) {
    const q = question.trim();
    if (!q) return;
    const currentMode = mode;
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", text: q, mode: currentMode },
      { role: "assistant", text: "", mode: currentMode, loading: true },
    ]);

    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, mode: currentMode }),
      });
      const data: AskResponse = await r.json();
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          role: "assistant",
          mode: currentMode,
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
          mode: currentMode,
          text: "",
          error: e instanceof Error ? e.message : "request failed",
        };
        return next;
      });
    }
  }

  function reset() {
    setMessages([]);
    setInput("");
  }

  return (
    <div className="flex h-screen w-full bg-white text-[#1a1a1f]">
      {/* ── Sidebar ── */}
      <aside className="flex w-[68px] shrink-0 flex-col items-center gap-6 border-r border-[#ececef] bg-[#f7f7f8] py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4f46e5] text-lg font-bold text-white">
          g
        </div>
        <nav className="flex flex-col items-center gap-5">
          <SideItem icon={I.search} label="Home" onClick={reset} />
          <SideItem icon={I.chat} label="Chat" active onClick={reset} />
          <SideItem icon={I.people} label="People" />
          <SideItem icon={I.book} label="Knowledge" />
        </nav>
        <div className="mt-auto">
          <Avatar name="You" size={32} />
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3 text-[#6b6b76]">
            <button className="rounded-md p-1.5 hover:bg-[#f2f2f4]" title="Menu">
              <Icon path={I.menu} className="h-5 w-5" />
            </button>
            <button
              onClick={reset}
              className="rounded-md p-1.5 hover:bg-[#f2f2f4]"
              title="New chat"
            >
              <Icon path={I.compose} className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-md p-1.5 text-[#6b6b76] hover:bg-[#f2f2f4]">
              <Icon path={I.sliders} className="h-5 w-5" />
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-[#ececef] px-3 py-1.5 text-sm font-medium hover:bg-[#f7f7f8]">
              <Icon path={I.sparkles} className="h-4 w-4 text-[#4f46e5]" />
              Create Prompt
            </button>
          </div>
        </header>

        {/* body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {!started ? (
            <div className="mx-auto max-w-3xl px-6 pt-16">
              <h1 className="text-[30px] font-bold tracking-tight">
                Ask Assistant about your work
              </h1>
              <p className="mt-3 text-[#6b6b76]">Try a prompt below to get started.</p>

              {/* tabs */}
              <div className="mt-7 flex gap-2">
                {(["Recommended", "Favorites", "Created by me"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition ${
                      tab === t
                        ? "border-[#c7c9f7] bg-[#eef0fe] text-[#4f46e5]"
                        : "border-transparent bg-[#f2f2f4] text-[#4a4a52] hover:bg-[#ececef]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* cards */}
              {tab === "Recommended" ? (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {PROMPTS.map((p) => (
                    <button
                      key={p.title}
                      onClick={() => send(p.title)}
                      className="group flex h-36 flex-col justify-between rounded-2xl bg-[#f7f7f8] p-5 text-left transition hover:bg-[#f0f0f3]"
                    >
                      <span className="text-[16px] font-semibold leading-snug">
                        {p.title}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-[#6b6b76]">
                        <Avatar name={p.author} size={20} />
                        <span className="truncate">{p.author}</span>
                        <span className="ml-auto flex items-center gap-1">
                          <Icon path="M3 3v18h18|M7 14l3-3 3 3 4-5" className="h-3.5 w-3.5" />
                          {p.uses}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-8 rounded-2xl border border-dashed border-[#ececef] p-10 text-center text-sm text-[#6b6b76]">
                  {tab === "Favorites"
                    ? "ยังไม่มี prompt ที่บันทึกเป็นรายการโปรด"
                    : "คุณยังไม่ได้สร้าง prompt — กด “Create Prompt” เพื่อเริ่ม"}
                </div>
              )}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
              {messages.map((m, i) => (
                <MessageBubble key={i} m={m} />
              ))}
            </div>
          )}
        </div>

        {/* ── input bar ── */}
        <div className="px-6 pb-6">
          <div className="mx-auto max-w-3xl">
            <div className="relative" ref={menuRef}>
              {menuOpen && (
                <div className="absolute bottom-[calc(100%+10px)] left-0 w-80 rounded-2xl border border-[#ececef] bg-white p-2 shadow-xl">
                  <MenuOption
                    active={mode === "world"}
                    title="World knowledge"
                    desc="ช่วยเขียนและค้นคว้าด้วยข้อมูลสาธารณะ (ถาม LLM ตรง ๆ)"
                    onClick={() => {
                      setMode("world");
                      setMenuOpen(false);
                    }}
                  />
                  <MenuOption
                    active={mode === "company"}
                    title="Company knowledge"
                    desc="ค้นทุกเอกสารภายในบริษัท พร้อมอ้างอิงแหล่งที่มา"
                    hint="⌘ . switch"
                    onClick={() => {
                      setMode("company");
                      setMenuOpen(false);
                    }}
                  />
                </div>
              )}

              {uploads.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {uploads.map((n, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 rounded-full bg-[#eef0fe] px-2.5 py-1 text-xs text-[#4f46e5]"
                    >
                      {n}
                      <Icon path={I.check} className="h-3 w-3" />
                    </span>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="rounded-[22px] border border-[#e2e2e6] bg-white px-4 py-3 shadow-sm focus-within:border-[#c7c9f7]"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    mode === "company"
                      ? "ถามอะไรก็ได้เกี่ยวกับ NPC…"
                      : "ถาม AI ด้วยความรู้ทั่วไป…"
                  }
                  className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#9a9aa4]"
                />
                <div className="mt-3 flex items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.md,.csv,.json,.log,text/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2e2e6] text-[#6b6b76] hover:bg-[#f7f7f8] disabled:opacity-50"
                    title="อัปโหลดไฟล์ให้ NPC Brain จำ"
                  >
                    {uploading ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#c7c9f7] border-t-transparent" />
                    ) : (
                      <Icon path={I.plus} className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((o) => !o)}
                    className="flex items-center gap-1 rounded-full bg-[#f2f2f4] px-3 py-1.5 text-sm font-medium text-[#3a3a42] hover:bg-[#ececef]"
                  >
                    {mode === "company" ? "Company" : "World"}
                    <Icon path={I.chevron} className="h-4 w-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#4f46e5] text-white transition disabled:opacity-30"
                    title="Send"
                  >
                    <Icon path={I.arrowUp} className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
            <p className="mt-2 text-center text-xs text-[#9a9aa4]">
              โหมด{" "}
              <span className="font-medium text-[#4f46e5]">
                {mode === "company" ? "Company knowledge" : "World knowledge"}
              </span>{" "}
              · กด ⌘. เพื่อสลับ
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── sub-components ──
function SideItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1"
      title={label}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          active ? "bg-[#eef0fe] text-[#4f46e5]" : "text-[#6b6b76] hover:bg-[#f0f0f3]"
        }`}
      >
        <Icon path={icon} className="h-[22px] w-[22px]" />
      </div>
      <span className={`text-[10px] ${active ? "text-[#4f46e5]" : "text-[#6b6b76]"}`}>
        {label}
      </span>
    </button>
  );
}

function MenuOption({
  active,
  title,
  desc,
  hint,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#f7f7f8]"
    >
      <div className="min-w-0 flex-1">
        <div
          className={`flex items-center gap-1.5 text-sm font-semibold ${
            active ? "text-[#4f46e5]" : "text-[#1a1a1f]"
          }`}
        >
          {title}
          {active && <Icon path={I.check} className="h-4 w-4" />}
        </div>
        <div className="mt-0.5 text-xs leading-snug text-[#6b6b76]">{desc}</div>
        {hint && <div className="mt-1 text-[11px] text-[#9a9aa4]">{hint}</div>}
      </div>
    </button>
  );
}

// Minimal rich text: render **bold** segments; newlines handled by whitespace-pre-wrap.
function renderRich(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function MessageBubble({ m }: { m: Message }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-[#eef0fe] px-4 py-2.5 text-[15px] text-[#1a1a1f]">
          {m.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#4f46e5] text-white">
        <Icon path={I.sparkles} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        {m.loading ? (
          <div className="flex items-center gap-2 text-sm text-[#9a9aa4]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#c7c9f7]" />
            {m.mode === "world"
              ? "กำลังเรียบเรียงคำตอบ…"
              : "กำลังค้นเอกสารและเรียบเรียงคำตอบ…"}
          </div>
        ) : m.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {m.error}
          </div>
        ) : m.mode === "company" && m.answered === false ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            ไม่พบข้อมูลนี้ในระบบ — บอตจะไม่เดาคำตอบ ลองถามด้วยคำที่เฉพาะเจาะจงขึ้น
            หรือสลับไปโหมด World knowledge
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {renderRich(m.text)}
            </p>
            {m.sources && m.sources.length > 0 && (
              <div className="mt-4 rounded-xl border border-[#ececef] bg-[#fafafb] p-3">
                <div className="mb-1.5 text-xs font-medium text-[#6b6b76]">
                  อ้างอิงจาก
                </div>
                <ul className="space-y-1">
                  {m.sources.map((s) => (
                    <li key={s.source} className="text-sm text-[#3a3a42]">
                      • {s.title || s.source}
                      {s.url && (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-1.5 text-[#4f46e5] underline"
                        >
                          เปิดไฟล์
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
