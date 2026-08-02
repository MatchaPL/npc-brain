import { Icon } from "@/components/icons";
import { COLLECTIONS } from "@/lib/demo";

const META: Record<string, { indexed: number; updated: string }> = {
  HR: { indexed: 96, updated: "2 days ago" },
  Production: { indexed: 100, updated: "1 day ago" },
  Safety: { indexed: 88, updated: "3 hours ago" },
  Engineering: { indexed: 94, updated: "6 hours ago" },
  Finance: { indexed: 90, updated: "1 week ago" },
};

export default function KnowledgePage() {
  return (
    <div className="min-h-full">
      <header className="flex items-center justify-between border-b border-[#ececec] bg-white px-8 py-3.5">
        <span className="text-[14px] font-medium text-[#111827]">Knowledge</span>
        <button className="flex items-center gap-1.5 rounded-[10px] bg-[#2f5aff] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#2549e0]">
          <Icon name="plus" className="h-4 w-4" />
          New collection
        </button>
      </header>

      <div className="px-8 py-6">
        <div className="mb-4">
          <h1 className="text-[20px] font-semibold text-[#111827]">Knowledge Collections</h1>
          <p className="mt-1 text-[14px] text-[#6b7280]">
            Organize documents into collections so answers stay accurate and easy to govern.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((c) => {
            const m = META[c.name];
            return (
              <div
                key={c.name}
                className="rounded-[12px] border border-[#ececec] bg-white p-5 transition hover:border-[#d9d9dd] hover:shadow-[0_2px_8px_rgba(17,24,39,0.05)]"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                    style={{ background: c.tint, color: c.fg }}
                  >
                    <Icon name={c.icon} className="h-5 w-5" />
                  </div>
                  <button className="rounded-[8px] p-1.5 text-[#9ca3af] hover:bg-[#f1f1f3]">
                    <Icon name="more" className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 text-[16px] font-semibold text-[#111827]">{c.name}</div>
                <div className="text-[13px] text-[#6b7280]">{c.docs} documents</div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="text-[#6b7280]">Indexed</span>
                    <span className="font-medium text-[#111827]">{m.indexed}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#f1f1f3]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${m.indexed}%`, background: m.indexed >= 95 ? "#22c55e" : "#2f5aff" }}
                    />
                  </div>
                </div>
                <div className="mt-3 text-[12px] text-[#9ca3af]">Updated {m.updated}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
