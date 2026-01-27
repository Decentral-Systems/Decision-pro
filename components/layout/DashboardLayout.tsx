"use client";
import React, { useEffect, useState } from "react";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Breadcrumbs } from "./Breadcrumbs";
import { useUIStore } from "@/lib/stores/ui-store";
import { useAuthReady } from "@/lib/api/hooks/useAuth";
import { SessionTimeoutWarning } from "@/components/auth/SessionTimeoutWarning";
import { SkipLink } from "@/components/common/SkipLink";
import { PageTransition } from "@/components/common/PageTransition";
import { KeyboardShortcutsProvider } from "./KeyboardShortcutsProvider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  
  // Ensure auth is ready (token syncing is handled by useAuthReady)
  useAuthReady();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <KeyboardShortcutsProvider>
        <div className="min-h-screen bg-background">
          <SkipLink href="#main-content" label="Skip to main content" />
          <Sidebar />
          <div className="ml-64">
            <Header />
            <main id="main-content" className="p-6" tabIndex={-1}>
              <Breadcrumbs />
              <PageTransition>
                {children}
              </PageTransition>
            </main>
          </div>
        </div>
      </KeyboardShortcutsProvider>
    );
  }

  return (
    <KeyboardShortcutsProvider>
      <div className="min-h-screen bg-background">
        <SkipLink href="#main-content" label="Skip to main content" />
        <Sidebar />
        <div
          className={`transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-16"
          }`}
        >
          <Header />
          <main id="main-content" className="p-6" tabIndex={-1}>
            <Breadcrumbs />
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
        <SessionTimeoutWarning />
      </div>
    </KeyboardShortcutsProvider>
  );
}
