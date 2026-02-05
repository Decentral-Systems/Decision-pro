"use client";
import React, { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useAuth } from "@/lib/auth/auth-context";
import { hasAnyRole } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { menuItems, type MenuItem } from "@/lib/constants/menu-config";

const SIDEBAR_LOGO = "/logos/logo_only.jpeg";

// Skeleton component for SSR
function SidebarSkeleton() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/50 bg-card">
      <div className="flex h-full flex-col">
        <div className="flex h-20 items-center border-b border-border/50 px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-2 w-16 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            >
              <div className="h-5 w-5 animate-pulse rounded bg-muted" />
              <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

// Enhanced Menu Item Component
interface MenuItemComponentProps {
  item: MenuItem;
  isActive: boolean;
  isCollapsed: boolean;
  index: number;
}

function MenuItemComponent({
  item,
  isActive,
  isCollapsed,
  index,
}: MenuItemComponentProps) {
  const Icon = item.icon;
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If already on this page, don't navigate
    if (pathname === item.href) {
      e.preventDefault();
      return;
    }

    // Don't prevent default - let Link handle it first
    // But add a fallback in case router doesn't update the URL
    const currentPath = window.location.pathname;

    // Set a timeout to check if navigation occurred
    setTimeout(() => {
      // If URL hasn't changed after 200ms, force navigation
      if (
        window.location.pathname === currentPath &&
        currentPath !== item.href
      ) {
        console.warn(
          "[Sidebar] Link navigation may have failed, forcing router.push"
        );
        try {
          router.push(item.href);
          // Check again after another 100ms, if still not changed, use window.location
          setTimeout(() => {
            if (
              window.location.pathname === currentPath &&
              currentPath !== item.href
            ) {
              console.warn(
                "[Sidebar] Router.push also failed, using window.location"
              );
              window.location.href = item.href;
            }
          }, 100);
        } catch (err) {
          console.error(
            "[Sidebar] Router.push failed, using window.location:",
            err
          );
          window.location.href = item.href;
        }
      }
    }, 200);
  };

  return (
    <Link
      href={item.href}
      onClick={handleClick}
      scroll={true}
      prefetch={true}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "hover:shadow-sm",
        isActive
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
        isCollapsed && "justify-center"
      )}
      style={{
        animationDelay: `${index * 30}ms`,
      }}
      title={isCollapsed ? item.title : undefined}
    >
      <div
        className={cn(
          "flex items-center justify-center transition-transform group-hover:scale-110",
          isActive && "text-primary-foreground"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
      </div>

      {!isCollapsed && <span className="flex-1 truncate">{item.title}</span>}

      {!isCollapsed && item.badge && (
        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const { user } = useAuth();
  const userRoles = user?.roles || [];

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredMenuItems = menuItems.filter((item) =>
    hasAnyRole(userRoles, item.roles)
  );

  // Show skeleton on server-side to avoid hydration mismatch
  if (!mounted) {
    return <SidebarSkeleton />;
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border/50 bg-gradient-to-b from-card to-card/80 backdrop-blur-sm transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Enhanced Logo Header */}
        <div
          className={cn(
            "flex items-center border-b border-border/50 bg-primary/5 transition-all duration-300",
            sidebarOpen
              ? "h-20 justify-between px-6"
              : "h-20 justify-center px-3"
          )}
        >
          {sidebarOpen ? (
            <Link href="/dashboard" className="group flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white p-1 shadow-md transition-shadow group-hover:shadow-lg">
                <img
                  src={SIDEBAR_LOGO}
                  alt="Decision PRO"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold leading-tight text-foreground">
                  Decision PRO
                </h1>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  AIS Platform
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/dashboard" className="group">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-md transition-all group-hover:scale-105 group-hover:shadow-xl">
                <img
                  src={SIDEBAR_LOGO}
                  alt="Decision PRO"
                  className="h-full w-full object-contain"
                />
              </div>
            </Link>
          )}

          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "h-8 w-8 rounded-lg transition-colors hover:bg-primary/10",
              !sidebarOpen && "hidden"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent flex-1 space-y-1 overflow-y-auto p-3">
          {filteredMenuItems.map((item, index) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <MenuItemComponent
                key={item.href}
                item={item}
                isActive={isActive}
                isCollapsed={!sidebarOpen}
                index={index}
              />
            );
          })}
        </nav>

        {/* Footer with collapse button when sidebar is collapsed */}
        {!sidebarOpen && (
          <div className="border-t border-border/50 p-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-12 w-full rounded-xl transition-colors hover:bg-primary/10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* User info section when expanded */}
        {sidebarOpen && user && (
          <div className="border-t border-border/50 bg-muted/30 p-4">
            <div className="flex items-center gap-3 rounded-lg bg-background/50 px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-semibold text-primary">
                  {user?.name?.[0] || "U"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.roles?.[0] || "User"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
