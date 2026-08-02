import { Icon } from "@/components/icons";
import { PEOPLE } from "@/lib/demo";

const AV = ["#2f5aff", "#16a34a", "#7c3aed", "#0891b2", "#ea580c"];

export default function PeoplePage() {
  return (
    <div className="min-h-full">
      <header className="flex items-center justify-between border-b border-[#ececec] bg-white px-8 py-3.5">
        <span className="text-[14px] font-medium text-[#111827]">People</span>
        <button className="flex items-center gap-1.5 rounded-[10px] bg-[#2f5aff] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#2549e0]">
          <Icon name="plus" className="h-4 w-4" />
          Invite member
        </button>
      </header>

      <div className="px-8 py-6">
        <div className="overflow-hidden rounded-[12px] border border-[#ececec] bg-white">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#ececec] text-[12px] font-medium text-[#6b7280]">
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Questions asked</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {PEOPLE.map((p, i) => (
                <tr key={p.name} className="border-b border-[#f4f4f6] last:border-0 hover:bg-[#fafafb]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-medium text-white"
                        style={{ background: AV[i % AV.length] }}
                      >
                        {p.name.trim().charAt(0)}
                      </span>
                      <span className="font-medium text-[#111827]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#374151]">{p.role}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#f4f4f6] px-2 py-0.5 text-[12px] font-medium text-[#6b7280]">
                      {p.dept}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#111827]">{p.questions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
