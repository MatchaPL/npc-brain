"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import {
  useWorkspace,
  relativeTime,
  avatarColor,
  DEPARTMENTS,
  ROLES,
  type JoinRequest,
  type Role,
  type Department,
} from "@/lib/workspace";

export default function NotificationBell() {
  const { notifications, unread, markRead, markAllRead, joinRequests } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState<JoinRequest | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="press relative flex h-9 w-9 items-center justify-center rounded-[10px] text-[#6b7280] hover:bg-[#f1f1f3]"
        title="Notifications"
      >
        <Icon name="bell" className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[360px] rounded-[12px] border border-[#ececec] bg-white shadow-[0_8px_28px_rgba(17,24,39,0.12)]">
          <div className="flex items-center justify-between border-b border-[#f1f1f3] px-4 py-3">
            <span className="text-[14px] font-semibold text-[#111827]">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[12px] font-medium text-[#2f5aff]">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-[#9ca3af]">You&apos;re all caught up.</p>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const jr = joinRequests.find((j) => j.id === n.referenceId);
                  const pending = jr?.status === "pending";
                  return (
                    <li
                      key={n.id}
                      className={`border-b border-[#f4f4f6] px-4 py-3 last:border-0 ${n.isRead ? "" : "bg-[#f7f9ff]"}`}
                    >
                      <div className="flex gap-2.5">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#2f5aff]">
                          <Icon name={n.type === "join_request" ? "people" : "bell"} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium text-[#111827]">{n.title}</div>
                          <div className="mt-0.5 text-[12px] leading-snug text-[#6b7280]">{n.message}</div>
                          <div className="mt-1 text-[11px] text-[#9ca3af]">{relativeTime(n.createdAt)}</div>
                          {n.type === "join_request" && pending && jr && (
                            <button
                              onClick={() => {
                                setReview(jr);
                                markRead(n.id);
                                setOpen(false);
                              }}
                              className="press mt-2 rounded-[8px] bg-[#2f5aff] px-3 py-1.5 text-[12px] font-medium text-white"
                            >
                              Review request
                            </button>
                          )}
                          {n.type === "join_request" && jr && !pending && (
                            <span className="mt-1 inline-block text-[11px] font-medium text-[#16a34a]">
                              {jr.status === "approved" ? "Approved" : "Rejected"}
                            </span>
                          )}
                        </div>
                        {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#2f5aff]" />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {review && <ApprovalModal request={review} onClose={() => setReview(null)} />}
    </div>
  );
}

export function ApprovalModal({ request, onClose }: { request: JoinRequest; onClose: () => void }) {
  const { approveRequest, rejectRequest, invitations } = useWorkspace();
  const [role, setRole] = useState<Role>("Member");
  const [dept, setDept] = useState<Department>(request.requestedDepartment || "");
  const [title, setTitle] = useState(request.requestedJobTitle);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const inv = invitations.find((i) => i.id === request.invitationId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onMouseDown={onClose}>
      <div
        className="w-full max-w-[440px] rounded-[14px] border border-[#ececec] bg-white shadow-[0_16px_48px_rgba(17,24,39,0.2)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#f1f1f3] px-5 py-4">
          <h3 className="text-[15px] font-semibold text-[#111827]">Member approval</h3>
          <button onClick={onClose} className="rounded-[8px] p-1 text-[#9ca3af] hover:bg-[#f1f1f3]">
            <Icon name="plus" className="h-4 w-4 rotate-45" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-[16px] font-medium text-white"
              style={{ background: avatarColor(request.displayName) }}
            >
              {request.displayName.charAt(0)}
            </span>
            <div>
              <div className="text-[15px] font-semibold text-[#111827]">{request.displayName}</div>
              <div className="text-[12px] text-[#6b7280]">via LINE Login</div>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-y-2.5 text-[13px]">
            <Meta label="Requested department" value={request.requestedDepartment || "—"} />
            <Meta label="Requested job title" value={request.requestedJobTitle || "—"} />
            <Meta label="Requested" value={relativeTime(request.createdAt)} />
            <Meta label="Invitation" value={inv ? (inv.revokedAt ? "Revoked" : "Active") : "Direct"} />
          </dl>

          {!rejecting ? (
            <>
              <div className="mt-4 space-y-3 rounded-[10px] bg-[#fafafb] p-3">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-[#9ca3af]">Assign</div>
                <Select label="Workspace role" value={role} onChange={(v) => setRole(v as Role)} options={ROLES} />
                <Select label="Department" value={dept} onChange={(v) => setDept(v as Department)} options={["", ...DEPARTMENTS]} />
                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-[#374151]">Job title</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Production Engineer"
                    className="w-full rounded-[8px] border border-[#e6e6e9] px-2.5 py-2 text-[13px] outline-none focus:border-[#2f5aff]"
                  />
                </label>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => {
                    approveRequest(request.id, { role, department: dept, jobTitle: title });
                    onClose();
                  }}
                  className="press flex-1 rounded-[10px] bg-[#2f5aff] px-4 py-2.5 text-[14px] font-medium text-white"
                >
                  Approve member
                </button>
                <button
                  onClick={() => setRejecting(true)}
                  className="press rounded-[10px] border border-[#f3d4d4] px-4 py-2.5 text-[14px] font-medium text-[#b91c1c] hover:bg-[#fef2f2]"
                >
                  Reject
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4">
              <label className="block">
                <span className="mb-1 block text-[13px] font-medium text-[#374151]">Reason (optional)</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-[8px] border border-[#e6e6e9] px-2.5 py-2 text-[13px] outline-none focus:border-[#2f5aff]"
                  placeholder="Not part of this organization"
                />
              </label>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    rejectRequest(request.id, reason);
                    onClose();
                  }}
                  className="press rounded-[10px] bg-[#b91c1c] px-4 py-2.5 text-[14px] font-medium text-white"
                >
                  Confirm reject
                </button>
                <button onClick={() => setRejecting(false)} className="px-3 py-2.5 text-[14px] text-[#6b7280]">
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-[#9ca3af]">{label}</dt>
      <dd className="mt-0.5 font-medium text-[#111827]">{value}</dd>
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-[#374151]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[8px] border border-[#e6e6e9] bg-white px-2.5 py-2 text-[13px] outline-none focus:border-[#2f5aff]"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "" ? "—" : o}
          </option>
        ))}
      </select>
    </label>
  );
}
