import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { findDoc } from "@/lib/demo";

const STATUS: Record<string, { bg: string; fg: string; dot: string }> = {
  Indexed: { bg: "#f0fdf4", fg: "#16803d", dot: "#22c55e" },
  Processing: { bg: "#fffbeb", fg: "#92400e", dot: "#f59e0b" },
  "Needs review": { bg: "#fef2f2", fg: "#b91c1c", dot: "#ef4444" },
};

function preview(language: string) {
  if (language === "Thai") {
    return `เอกสารฉบับนี้เป็นนโยบายภายในของบริษัท NPC Co., Ltd. ใช้เป็นแนวปฏิบัติสำหรับพนักงานทุกคน

ขอบเขต: ครอบคลุมสิทธิ หน้าที่ และขั้นตอนที่เกี่ยวข้อง พนักงานควรอ่านและทำความเข้าใจก่อนดำเนินการ

1. คำนิยามและขอบเขตการบังคับใช้
2. สิทธิและเงื่อนไขที่เกี่ยวข้อง
3. ขั้นตอนการยื่นเรื่องและการอนุมัติ
4. ข้อยกเว้นและกรณีพิเศษ`;
  }
  return `This document defines internal guidelines for NPC Co., Ltd. and applies to all employees.

Scope: it covers the responsibilities, procedures, and standards relevant to this area. Employees should review it before taking action.

1. Definitions and scope of application
2. Roles and responsibilities
3. Step-by-step procedure
4. Exceptions and escalation`;
}

const RELATED = [
  "What does this policy require?",
  "Who is the approver for this process?",
  "What are the exceptions?",
];

const CITATIONS = [
  { who: "Somchai", page: 12, when: "2 hours ago" },
  { who: "Ploy", page: 3, when: "yesterday" },
  { who: "อนุชา", page: 8, when: "2 days ago" },
];

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = findDoc(slug);
  if (!d) notFound();

  const st = STATUS[d.status];
  const embedded = d.status === "Indexed" ? 100 : d.status === "Processing" ? 62 : 100;

  const overview = [
    { label: "Pages", value: String(d.pages) },
    { label: "Chunks", value: String(d.chunks) },
    { label: "Language", value: d.language },
    { label: "Department", value: d.collection },
    { label: "Uploaded by", value: d.uploadedBy },
    { label: "Last indexed", value: d.lastIndexed === "processing" ? "In progress" : d.lastIndexed },
  ];

  return (
    <div className="min-h-full">
      <header className="flex items-center gap-2 border-b border-[#ececec] bg-white px-8 py-3.5 text-[13px]">
        <Link href="/documents" className="text-[#6b7280] hover:text-[#111827]">
          Documents
        </Link>
        <Icon name="chevronRight" className="h-3.5 w-3.5 text-[#c4c4c9]" />
        <span className="truncate font-medium text-[#111827]">{d.name}</span>
      </header>

      <div className="mx-auto max-w-5xl px-8 py-7">
        {/* title + status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#f4f4f6] text-[#6b7280]">
              <Icon name="fileText" className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-[#111827]">{d.name}</h1>
              <div className="mt-1 flex items-center gap-2 text-[13px] text-[#6b7280]">
                <span>Version {d.version}</span>
                <span className="text-[#d1d5db]">·</span>
                <span>{d.type}</span>
                <span className="text-[#d1d5db]">·</span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium"
                  style={{ background: st.bg, color: st.fg }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} />
                  {d.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button className="press flex items-center gap-1.5 rounded-[10px] bg-[#2f5aff] px-3.5 py-2 text-[13px] font-medium text-white">
            <Icon name="fileText" className="h-4 w-4" />
            Open PDF
          </button>
          <Link
            href={`/ask?q=${encodeURIComponent(`Summarize "${d.name}"`)}`}
            className="press flex items-center gap-1.5 rounded-[10px] border border-[#e6e6e9] bg-white px-3.5 py-2 text-[13px] font-medium text-[#111827] hover:bg-[#f7f7f8]"
          >
            <Icon name="ask" className="h-4 w-4 text-[#2f5aff]" />
            Ask about this document
          </Link>
          <button className="press flex items-center gap-1.5 rounded-[10px] border border-[#e6e6e9] bg-white px-3.5 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#f7f7f8]">
            <Icon name="activity" className="h-4 w-4" />
            Re-index
          </button>
          <button className="press flex items-center gap-1.5 rounded-[10px] border border-[#f3d4d4] bg-white px-3.5 py-2 text-[13px] font-medium text-[#b91c1c] hover:bg-[#fef2f2]">
            Delete
          </button>
        </div>

        {/* overview */}
        <div className="mt-6 rounded-[12px] border border-[#ececec] bg-white p-5">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#6b7280]">Overview</h2>
          <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
            {overview.map((o) => (
              <div key={o.label}>
                <div className="text-[12px] text-[#9ca3af]">{o.label}</div>
                <div className="mt-0.5 text-[15px] font-semibold text-[#111827]">{o.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* two columns */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="Extracted Text Preview">
              <pre className="whitespace-pre-wrap rounded-[10px] bg-[#fafafb] p-4 text-[13px] leading-relaxed text-[#374151]">
                {preview(d.language)}
              </pre>
            </Card>

            <Card title="Related Questions">
              <ul className="divide-y divide-[#f1f1f3]">
                {RELATED.map((qq) => (
                  <li key={qq}>
                    <Link
                      href={`/ask?q=${encodeURIComponent(qq)}`}
                      className="group flex items-center gap-3 py-2.5"
                    >
                      <Icon name="ask" className="h-4 w-4 shrink-0 text-[#9ca3af]" />
                      <span className="flex-1 text-[13px] text-[#374151]">{qq}</span>
                      <Icon name="arrowRight" className="h-4 w-4 text-[#c4c4c9] group-hover:text-[#2f5aff]" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Recent AI Citations">
              <ul className="divide-y divide-[#f1f1f3]">
                {CITATIONS.map((cit, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef2ff] text-[12px] font-semibold text-[#2f5aff]">
                      {cit.who.charAt(0)}
                    </span>
                    <div className="flex-1 text-[13px] text-[#374151]">
                      <span className="font-medium text-[#111827]">{cit.who}</span> cited this document
                    </div>
                    <span className="text-[12px] text-[#9ca3af]">p.{cit.page} · {cit.when}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* chunk statistics */}
          <div>
            <Card title="Chunk Statistics">
              <div className="space-y-3 text-[13px]">
                <StatRow label="Total chunks" value={String(d.chunks)} />
                <StatRow label="Avg tokens / chunk" value="182" />
                <StatRow label="Embedding dimension" value="768" />
                <StatRow label="Embedded" value={`${embedded}%`} />
              </div>
              <div className="mt-4">
                <div className="mb-1 text-[12px] text-[#9ca3af]">Indexing progress</div>
                <div className="h-2 overflow-hidden rounded-full bg-[#f1f1f3]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${embedded}%`, background: embedded === 100 ? "#22c55e" : "#f59e0b" }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-[#ececec] bg-white p-5">
      <h3 className="mb-3 text-[14px] font-semibold text-[#111827]">{title}</h3>
      {children}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#6b7280]">{label}</span>
      <span className="font-semibold text-[#111827]">{value}</span>
    </div>
  );
}
