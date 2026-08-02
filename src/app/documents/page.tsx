import Link from "next/link";
import { Icon } from "@/components/icons";
import { DOCUMENTS, COLLECTIONS } from "@/lib/demo";

const STATUS: Record<string, { bg: string; fg: string; dot: string }> = {
  Indexed: { bg: "#f0fdf4", fg: "#16803d", dot: "#22c55e" },
  Processing: { bg: "#fffbeb", fg: "#92400e", dot: "#f59e0b" },
  "Needs review": { bg: "#fef2f2", fg: "#b91c1c", dot: "#ef4444" },
};

function collectionColor(name: string) {
  return COLLECTIONS.find((c) => c.name === name) ?? { tint: "#f4f4f6", fg: "#6b7280" };
}

export default function DocumentsPage() {
  return (
    <div className="min-h-full">
      <header className="flex items-center justify-between border-b border-[#ececec] bg-white px-8 py-3.5">
        <span className="text-[14px] font-medium text-[#111827]">Documents</span>
        <button className="flex items-center gap-1.5 rounded-[10px] bg-[#2f5aff] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#2549e0]">
          <Icon name="upload" className="h-4 w-4" />
          Add document
        </button>
      </header>

      <div className="px-8 py-6">
        {/* toolbar */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-[10px] border border-[#e6e6e9] bg-white px-3 py-2">
            <Icon name="search" className="h-4 w-4 text-[#9ca3af]" />
            <input
              placeholder="Search documents..."
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9ca3af]"
            />
          </div>
          <button className="flex items-center gap-1.5 rounded-[10px] border border-[#e6e6e9] bg-white px-3 py-2 text-[13px] text-[#374151] hover:bg-[#f7f7f8]">
            <Icon name="filter" className="h-4 w-4" />
            Filter
          </button>
        </div>

        {/* table */}
        <div className="overflow-hidden rounded-[12px] border border-[#ececec] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#ececec] text-[12px] font-medium text-[#6b7280]">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Collection</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Pages</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {DOCUMENTS.map((d) => {
                  const cc = collectionColor(d.collection);
                  const st = STATUS[d.status];
                  return (
                    <tr key={d.name} className="border-b border-[#f4f4f6] last:border-0 hover:bg-[#fafafb]">
                      <td className="px-5 py-3">
                        <Link href={`/documents/${d.slug}`} className="flex items-center gap-2.5 group">
                          <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#f4f4f6] text-[#6b7280]">
                            <Icon name="fileText" className="h-4 w-4" />
                          </span>
                          <span className="font-medium text-[#111827] group-hover:text-[#2f5aff]">{d.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium"
                          style={{ background: cc.tint, color: cc.fg }}
                        >
                          {d.collection}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-[6px] bg-[#f4f4f6] px-1.5 py-0.5 text-[11px] font-medium text-[#6b7280]">
                          {d.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#6b7280]">{d.pages}</td>
                      <td className="px-4 py-3 text-[#374151]">{d.owner}</td>
                      <td className="px-4 py-3 text-[#9ca3af]">{d.updated}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium"
                          style={{ background: st.bg, color: st.fg }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} />
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="rounded-[8px] p-1.5 text-[#9ca3af] hover:bg-[#f1f1f3]">
                          <Icon name="more" className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
