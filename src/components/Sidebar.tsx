"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { WORKSPACE } from "@/lib/demo";
import { useWorkspace } from "@/lib/workspace";

const NAV: { label: string; href: string; icon: IconName }[] = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Ask", href: "/ask", icon: "ask" },
  { label: "Knowledge", href: "/knowledge", icon: "knowledge" },
  { label: "Documents", href: "/documents", icon: "documents" },
  { label: "People", href: "/people", icon: "people" },
  { label: "Activity", href: "/activity", icon: "activity" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { org, user, members, logout } = useWorkspace();
  const me = members.find((m) => m.userId === user?.id);

  return (
    <aside className="flex w-[236px] shrink-0 flex-col border-r border-[#ececec] bg-[#fafafb]">
      {/* logo / workspace */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2f5aff] text-[13px] font-semibold text-white">
          N
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold leading-tight tracking-tight text-[#111827]">
            NPC
          </div>
          <div className="truncate text-[11px] text-[#6b7280]">{org?.name ?? WORKSPACE.name}</div>
        </div>
      </div>

      {/* nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[14px] transition ${
                active
                  ? "bg-[#eef2ff] font-medium text-[#2f5aff]"
                  : "text-[#374151] hover:bg-[#f1f1f3]"
              }`}
            >
              <Icon name={item.icon} className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* user */}
      <div className="border-t border-[#ececec] px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111827] text-[13px] font-medium text-white">
            {(user?.displayName ?? "N").charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-[#111827]">
              {user?.displayName ?? "Member"}
            </div>
            <div className="truncate text-[11px] text-[#6b7280]">{me?.role ?? "Member"}</div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="rounded-[8px] p-1.5 text-[#9ca3af] hover:bg-[#f1f1f3] hover:text-[#374151]"
          >
            <Icon name="external" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
