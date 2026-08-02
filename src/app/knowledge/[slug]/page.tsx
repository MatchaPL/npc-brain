import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { findCollection, docsInCollection } from "@/lib/demo";

const STATUS: Record<string, { fg: string; dot: string }> = {
  Indexed: { fg: "#16803d", dot: "#22c55e" },
  Processing: { fg: "#92400e", dot: "#f59e0b" },
  "Needs review": { fg: "#b91c1c", dot: "#ef4444" },
};

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = findCollection(slug);
  if (!c) notFound();

  const docs = docsInCollection(c.name);

  return (
    <div className="min-h-full">
      <header className="flex items-center gap-2 border-b border-[#ececec] bg-white px-8 py-3.5 text-[13px]">
        <Link href="/knowledge" className="text-[#6b7280] hover:text-[#111827]">
          Knowledge
        </Link>
        <Icon name="chevronRight" className="h-3.5 w-3.5 text-[#c4c4c9]" />
        <span className="font-medium text-[#111827]">{c.name}</span>
      </header>

      <div className="px-8 py-7">
        {/* collection header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-[14px]"
              style={{ background: c.tint, color: c.fg }}
            >
              <Icon name={c.icon} className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-[#111827]">{c.name}</h1>
              <p className="mt-0.5 text-[13px] text-[#6b7280]">
                {c.docs} documents · {c.pages.toLocaleString()} pages · {c.indexed}% indexed · updated {c.updated}
              </p>
            </div>
          </div>
          <Link
            href={`/ask?q=${encodeURIComponent(`Tell me about ${c.name}`)}`}
            className="press flex items-center gap-1.5 rounded-[10px] border border-[#e6e6e9] bg-white px-3.5 py-2 text-[13px] font-medium text-[#111827] hover:bg-[#f7f7f8]"
          >
            <Icon name="ask" className="h-4 w-4 text-[#2f5aff]" />
            Ask about {c.name}
          </Link>
        </div>

        {/* documents in this collection */}
        <h2 className="mb-3 mt-8 text-[13px] font-semibold uppercase tracking-wide text-[#6b7280]">
          Documents in this collection
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {docs.map((d) => {
            const st = STATUS[d.status];
            return (
              <Link
                key={d.slug}
                href={`/documents/${d.slug}`}
                className="hover-lift flex items-start gap-3 rounded-[12px] border border-[#ececec] bg-white p-4 hover:border-[#d9d9dd] hover:shadow-[0_2px_8px_rgba(17,24,39,0.05)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#f4f4f6] text-[#6b7280]">
                  <Icon name="fileText" className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-[#111827]">{d.name}</div>
                  <div className="mt-0.5 text-[12px] text-[#9ca3af]">
                    {d.type} · {d.pages} pages · v{d.version}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[12px] font-medium" style={{ color: st.fg }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} />
                    {d.status}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
