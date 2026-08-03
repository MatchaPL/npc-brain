"use client";

import { usePathname } from "next/navigation";
import { useWorkspace } from "@/lib/workspace";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import { LoginScreen, Onboarding } from "@/components/auth-screens";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, user, org } = useWorkspace();
  const pathname = usePathname();

  // The invitation link is a public entry point — it runs its own flow (no shell).
  if (pathname.startsWith("/invite")) return <>{children}</>;

  if (!ready) return <div className="min-h-screen bg-[#fafafb]" />;
  if (!user) return <LoginScreen />;
  if (!org) return <Onboarding />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center justify-end border-b border-[#ececec] bg-white px-4">
          <NotificationBell />
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
