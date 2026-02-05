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
  const router = useRouter();
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
      <div className="flex h-16 items-center justify-between px-6 gap-4">
        {/* Left Section: Page Title or Breadcrumb */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex flex-col min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">
              Dashboard
            </h2>
            <p className="text-xs text-muted-foreground">
              Welcome back, {user?.name?.split(" ")[0] || "User"}
            </p>
          </div>
        </div>

        {/* Center Section: Enhanced Search */}
        <div className="flex-1 max-w-xl">
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
            className="relative group"
            onClick={() => navigateTo("/system-status")}
            title="System Status"
          >
            <Activity className="h-5 w-5" />
            <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-success animate-pulse-slow"></span>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
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
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  {user?.name?.[0] || "U"}
                </div>
                <div className="hidden md:flex flex-col items-start">
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
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold">
                    {user?.name?.[0] || "U"}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
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
