"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { navigateTo } from "@/lib/utils/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LogOut,
  Settings,
  Bell,
  Moon,
  Sun,
  Activity,
  HelpCircle,
} from "lucide-react";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { NetworkStatusIndicator } from "@/components/common/NetworkStatusIndicator";

export function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await logout();
    navigateTo("/login");
  };

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
            onClick={() => navigateTo("/system-status")}
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
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            </Button>
          )}

          {/* Help */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTo("/help")}
            title="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 hover:bg-accent"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-sm font-semibold text-primary-foreground">
                  {user?.name?.[0] || "U"}
                </div>
                <div className="hidden flex-col items-start md:flex">
                  <span className="text-sm font-medium">
                    {user?.name || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user?.roles?.[0] || "User"}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3 py-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 font-bold text-primary-foreground">
                    {user?.name?.[0] || "U"}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-semibold">
                      {user?.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                    <Badge
                      variant="secondary"
                      className="mt-1 w-fit text-[10px]"
                    >
                      {user?.roles?.[0]}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigateTo("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
