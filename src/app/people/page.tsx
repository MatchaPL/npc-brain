"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import InviteModal from "@/components/InviteModal";
import { ApprovalModal } from "@/components/NotificationBell";
import {
  useWorkspace,
  relativeTime,
  avatarColor,
  type Member,
  type JoinRequest,
  type MemberStatus,
} from "@/lib/workspace";

const STATUS_STYLE: Record<MemberStatus, { fg: string; dot: string }> = {
  Active: { fg: "#16803d", dot: "#22c55e" },
  "Pending approval": { fg: "#92400e", dot: "#f59e0b" },
  Invited: { fg: "#3730a3", dot: "#6366f1" },
  Rejected: { fg: "#b91c1c", dot: "#ef4444" },
  Suspended: { fg: "#6b7280", dot: "#9ca3af" },
};

type Filter = "all" | "active" | "pending" | "admins";

export default function PeoplePage() {
  const { members, joinRequests, isAdmin } = useWorkspace();
  const [filter, setFilter] = useState<Filter>("all");
  const [dept, setDept] = useState("");
  const [invite, setInvite] = useState(false);
  const [review, setReview] = useState<JoinRequest | null>(null);

  const pending = joinRequests.filter((j) => j.status === "pending");

  const memberRows = members.filter((m) => {
    if (dept && m.department !== dept) return false;
    if (filter === "active") return m.status === "Active";
    if (filter === "admins") return m.role === "Owner" || m.role === "Admin";
    if (filter === "pending") return false;
    return true;
  });
  const showPending = filter === "all" || filter === "pending";

  return (
    <div className="min-h-full">
      <header className="flex items-center justify-between border-b border-[#ececec] bg-white px-8 py-3.5">
        <span className="text-[14px] font-medium text-[#111827]">People</span>
        {isAdmin && (
          <button
            onClick={() => setInvite(true)}
            className="press flex items-center gap-1.5 rounded-[10px] bg-[#2f5aff] px-3.5 py-2 text-[13px] font-medium text-white"
          >
            <Icon name="plus" className="h-4 w-4" />
            Invite member
          </button>
        )}
      </header>

      <div className="px-8 py-6">
        {/* filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {([
            ["all", "All members"],
            ["active", "Active"],
            ["pending", `Pending${pending.length ? ` (${pending.length})` : ""}`],
            ["admins", "Admins"],
          ] as [Filter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] transition ${
                filter === key
                  ? "border-[#c7d0ff] bg-[#eef2ff] text-[#2f5aff]"
                  : "border-transparent bg-[#f2f2f4] text-[#4a4a52] hover:bg-[#ececef]"
              }`}
            >
              {label}
            </button>
          ))}
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="ml-auto rounded-[10px] border border-[#e6e6e9] bg-white px-3 py-1.5 text-[13px] outline-none focus:border-[#2f5aff]"
          >
            <option value="">All departments</option>
            {["HR", "Finance", "Production", "Engineering", "Safety", "Other"].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-[#ececec] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#ececec] text-[12px] font-medium text-[#6b7280]">
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Job title</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Questions</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {showPending &&
                  pending.map((r) => (
                    <tr key={r.id} className="border-b border-[#f4f4f6] bg-[#fffdf7]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.displayName} />
                          <span className="font-medium text-[#111827]">{r.displayName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#9ca3af]">—</td>
                      <td className="px-4 py-3 text-[#374151]">{r.requestedJobTitle || "—"}</td>
                      <td className="px-4 py-3 text-[#374151]">{r.requestedDepartment || "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status="Pending approval" />
                      </td>
                      <td className="px-4 py-3 text-[#9ca3af]">—</td>
                      <td className="px-4 py-3 text-[#9ca3af]">—</td>
                      <td className="px-4 py-3 text-right">
                        {isAdmin && (
                          <button
                            onClick={() => setReview(r)}
                            className="press rounded-[8px] bg-[#2f5aff] px-3 py-1.5 text-[12px] font-medium text-white"
                          >
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                {memberRows.map((m) => (
                  <MemberRow key={m.id} m={m} canManage={isAdmin} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {invite && <InviteModal onClose={() => setInvite(false)} />}
      {review && <ApprovalModal request={review} onClose={() => setReview(null)} />}
    </div>
  );
}

function MemberRow({ m, canManage }: { m: Member; canManage: boolean }) {
  const { updateMember, removeMember } = useWorkspace();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <tr className="border-b border-[#f4f4f6] last:border-0 hover:bg-[#fafafb]">
      <td className="px-5 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={m.displayName} />
          <span className="font-medium text-[#111827]">{m.displayName}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-[#f4f4f6] px-2 py-0.5 text-[12px] font-medium text-[#374151]">{m.role}</span>
      </td>
      <td className="px-4 py-3 text-[#374151]">{m.jobTitle || "—"}</td>
      <td className="px-4 py-3 text-[#374151]">{m.department || "—"}</td>
      <td className="px-4 py-3">
        <StatusBadge status={m.status} />
      </td>
      <td className="px-4 py-3 text-[#9ca3af]">{m.joinedAt ? relativeTime(m.joinedAt) : "—"}</td>
      <td className="px-4 py-3 text-[#111827]">{m.questions}</td>
      <td className="relative px-4 py-3 text-right" ref={ref}>
        {canManage && m.role !== "Owner" && (
          <button onClick={() => setOpen((o) => !o)} className="rounded-[8px] p-1.5 text-[#9ca3af] hover:bg-[#f1f1f3]">
            <Icon name="more" className="h-4 w-4" />
          </button>
        )}
        {open && (
          <div className="absolute right-4 top-[calc(100%-4px)] z-20 w-48 rounded-[10px] border border-[#ececec] bg-white py-1 text-left shadow-[0_8px_24px_rgba(17,24,39,0.12)]">
            <MenuItem
              label={m.role === "Admin" ? "Change to Member" : "Change to Admin"}
              onClick={() => {
                updateMember(m.id, { role: m.role === "Admin" ? "Member" : "Admin" });
                setOpen(false);
              }}
            />
            {m.status !== "Suspended" ? (
              <MenuItem label="Suspend access" onClick={() => { updateMember(m.id, { status: "Suspended" }); setOpen(false); }} />
            ) : (
              <MenuItem label="Reactivate" onClick={() => { updateMember(m.id, { status: "Active" }); setOpen(false); }} />
            )}
            <div className="my-1 border-t border-[#f1f1f3]" />
            <MenuItem label="Remove member" danger onClick={() => { removeMember(m.id); setOpen(false); }} />
          </div>
        )}
      </td>
    </tr>
  );
}

function MenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f7f7f8] ${danger ? "text-[#b91c1c]" : "text-[#374151]"}`}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: s.fg }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-medium text-white"
      style={{ background: avatarColor(name) }}
    >
      {name.trim().charAt(0)}
    </span>
  );
}
