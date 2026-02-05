"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SessionTimeoutWarning } from "@/components/auth/SessionTimeoutWarning";
import { PageTransition } from "@/components/common/PageTransition";
import { SkipLink } from "@/components/common/SkipLink";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Header } from "@/components/layout/Header";
import { KeyboardShortcutsProvider } from "@/components/layout/KeyboardShortcutsProvider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthReady } from "@/lib/api/hooks/useAuth";
import React, { useEffect, useState } from "react";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      <SkipLink href="#main-content" label="Skip to main content" />
      <div className="flex min-h-screen flex-col">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b px-2">
          {isCollapsed && <SidebarTrigger />}
          <div className="min-w-0 flex-1">
            <Header />
          </div>
        </div>
        <main id="main-content" className="flex-1 p-6" tabIndex={-1}>
          <Breadcrumbs />
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useAuthReady();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <KeyboardShortcutsProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <DashboardContent>{children}</DashboardContent>
          </SidebarInset>
        </SidebarProvider>
      </KeyboardShortcutsProvider>
    );
  }

  return (
    <KeyboardShortcutsProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardContent>{children}</DashboardContent>
        </SidebarInset>
        <SessionTimeoutWarning />
      </SidebarProvider>
    </KeyboardShortcutsProvider>
  );
}
