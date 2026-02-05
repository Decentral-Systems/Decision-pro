"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { TablerIcon } from "@tabler/icons-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { SIDEBAR_ITEMS } from "@/constants";

export type NavMainItem = {
  title: string;
  url: string;
  icon?: TablerIcon;
  isActive?: boolean;
  items?: { title: string; url: string }[];
};

export function NavMain() {
  const pathname = usePathname();

  const items: NavMainItem[] = SIDEBAR_ITEMS.map((item) => ({
    title: item.label,
    url: item.url,
    icon: item.icon,
    isActive:
      pathname === item.url ||
      (item.url !== "/dashboard" && pathname?.startsWith(item.url + "/")),
    items: undefined,
  }));

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.items && item.items.length > 0;

            if (hasSubItems) {
              return (
                <Collapsible
                  key={item.url}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={cn(
                          "gap-3 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                          "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
                          "[&>svg]:h-5 [&>svg]:w-5 [&>svg]:shrink-0"
                        )}
                      >
                        {Icon && <Icon className="h-5 w-5 shrink-0" />}
                        <span className="flex-1 truncate">{item.title}</span>
                        <ChevronRight className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.url}>
                            <SidebarMenuSubButton asChild>
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={item.isActive}
                  className={cn(
                    "gap-3 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                    "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
                    "[&>svg]:h-5 [&>svg]:w-5 [&>svg]:shrink-0"
                  )}
                >
                  <Link href={item.url}>
                    {Icon && <Icon className="h-5 w-5 shrink-0" />}
                    <span className="flex-1 truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
