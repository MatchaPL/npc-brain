import Link from "next/link";
import { Icon } from "@/components/icons";
import { COLLECTIONS } from "@/lib/demo";

export default function KnowledgePage() {
  return (
    <div className="min-h-full">
      <header className="flex items-center justify-between border-b border-[#ececec] bg-white px-8 py-3.5">
        <span className="text-[14px] font-medium text-[#111827]">Knowledge</span>
        <button className="press flex items-center gap-1.5 rounded-[10px] bg-[#2f5aff] px-3.5 py-2 text-[13px] font-medium text-white">
          <Icon name="plus" className="h-4 w-4" />
          New collection
        </button>
      </header>

      <div className="px-8 py-7">
        <div className="mb-5">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#111827]">
            Company Knowledge Library
          </h1>
          <p className="mt-1 text-[14px] text-[#6b7280]">
            Browse what your organization knows, by department. Open a collection to explore its knowledge.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((c) => (
            <Link
              key={c.slug}
              href={`/knowledge/${c.slug}`}
              className="hover-lift rounded-[12px] border border-[#ececec] bg-white p-5 hover:border-[#d9d9dd] hover:shadow-[0_2px_10px_rgba(17,24,39,0.06)]"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-[12px]"
                  style={{ background: c.tint, color: c.fg }}
                >
                  <Icon name={c.icon} className="h-[22px] w-[22px]" />
                </div>
                <Icon name="chevronRight" className="mt-1 h-4 w-4 text-[#c4c4c9]" />
              </div>

              <div className="mt-4 text-[17px] font-semibold text-[#111827]">{c.name}</div>

              <div className="mt-3 grid grid-cols-2 gap-y-2 text-[13px]">
                <Stat label="Documents" value={String(c.docs)} />
                <Stat label="Pages" value={c.pages.toLocaleString()} />
                <Stat label="Updated" value={c.updated} />
                <Stat label="Health" value={`${c.indexed}%`} accent={c.indexed >= 95} />
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#f1f1f3]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${c.indexed}%`, background: c.indexed >= 95 ? "#22c55e" : "#2f5aff" }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[12px] text-[#9ca3af]">{label}</div>
      <div className={`text-[14px] font-semibold ${accent ? "text-[#16a34a]" : "text-[#111827]"}`}>
        {value}
      </div>
    </div>
  );
}
