"use client";

import { NetworkStatusIndicator } from "@/components/common/NetworkStatusIndicator";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { Activity, Bell, HelpCircle, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { UserMenu } from "../user-menu";

export function Header() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between gap-4 px-6">
        {/* Left Section: Page Title or Breadcrumb */}
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex min-w-0 flex-col">
            <h2 className="truncate text-lg font-semibold text-foreground">
              Dashboard
            </h2>
            <p className="text-xs text-muted-foreground">
              Welcome back, {user?.name?.split(" ")[0] || "User"}
            </p>
          </div>
        </div>

        {/* Center Section: Enhanced Search */}
        <div className="max-w-xl flex-1">
          <GlobalSearchBar
            placeholder="Search customers, loans, users..."
            className="w-full"
          />
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2">
          {/* Network Status Indicator */}
          <NetworkStatusIndicator compact />

          {/* System Status Indicator */}
          <Button
            variant="ghost"
            size="icon"
            className="group relative"
            onClick={() => router.push("/system-status")}
            title="System Status"
          >
            <Activity className="h-5 w-5" />
            <span className="absolute bottom-1 right-1 h-2 w-2 animate-pulse-slow rounded-full bg-success"></span>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-[10px]">
              3
            </Badge>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Help */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/help")}
            title="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
