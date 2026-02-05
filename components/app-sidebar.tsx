"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "./ui/sidebar";
import { cn } from "@/lib/utils";

const SIDEBAR_LOGO = "/logos/logo_only.jpeg";

export const AppSidebar = () => {
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  return (
    <Sidebar>
      <SidebarHeader
        className={cn(
          "h-20 flex-row items-center border-b border-border/50 bg-primary/5 transition-all duration-300",
          isExpanded ? "justify-between px-6" : "justify-center px-2"
        )}
      >
        {isExpanded ? (
          <Link href="/dashboard" className="group flex items-center gap-2">
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
        ) : null}
        {isExpanded && (
          <SidebarTrigger className="h-8 w-8 rounded-lg transition-colors hover:bg-primary/10">
            <ChevronLeft className="h-4 w-4" />
          </SidebarTrigger>
        )}
        {!isExpanded ? (
          <Link href="/dashboard" className="group">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-md transition-all group-hover:scale-105 group-hover:shadow-xl">
              <Image
                src={SIDEBAR_LOGO}
                alt="Decision PRO"
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </div>
          </Link>
        ) : null}
      </SidebarHeader>
    </Sidebar>
  );
};
