"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "./ui/sidebar";
import { NavMain } from "./nav-main";

const SIDEBAR_LOGO = "/logos/logo_only.jpeg";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader
        className={cn(
          "h-20 flex-row items-center border-b border-border/50 bg-primary/5 transition-all duration-300",
          isExpanded ? "justify-between px-6" : "justify-center px-2"
        )}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            {isExpanded ? (
              <SidebarMenuButton
                asChild
                className="h-auto p-0 hover:bg-transparent data-[active=true]:bg-transparent"
              >
                <Link
                  href="/dashboard"
                  className="group flex items-center gap-3"
                >
                  <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg bg-white p-1 shadow-md transition-shadow group-hover:shadow-lg">
                    <Image
                      src={SIDEBAR_LOGO}
                      alt="Decision PRO"
                      width={36}
                      height={36}
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
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                asChild
                className="size-10 p-0 hover:bg-transparent data-[active=true]:bg-transparent group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0"
              >
                <Link
                  href="/dashboard"
                  className="group flex size-10 items-center justify-center"
                >
                  <div className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-md transition-all group-hover:shadow-lg">
                    <Image
                      src={SIDEBAR_LOGO}
                      alt="Decision PRO"
                      width={36}
                      height={36}
                      className="h-full w-full object-contain"
                    />
                  </div>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
        {isExpanded && (
          <SidebarTrigger className="h-8 w-8 rounded-lg transition-colors hover:bg-primary/10">
            <ChevronLeft className="h-4 w-4" />
          </SidebarTrigger>
        )}
      </SidebarHeader>
      <SidebarContent className="scrollbar-thin overflow-y-auto">
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: "Super Administrator",
            email: "superadmin@decisionpro.com",
            avatar: "/avatars/superadmin.png",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
