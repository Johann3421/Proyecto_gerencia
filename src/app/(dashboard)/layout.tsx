"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { NotificationDrawer } from "@/components/layout/NotificationDrawer";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-200",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-[220px]"
        )}
      >
        <Topbar />
        <main style={{ flex: 1, padding: "16px 20px 80px", maxWidth: 1100 }}>
          {children}
        </main>
      </div>
      <BottomNav />
      <NotificationDrawer />
    </div>
  );
}
