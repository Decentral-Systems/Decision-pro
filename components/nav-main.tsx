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
import { SIDEBAR_NAV } from "@/constants";

export type NavMainItem = {
  title: string;
  url: string;
  icon?: TablerIcon;
  isActive?: boolean;
  items?: { title: string; url: string; icon?: TablerIcon }[];
};

function isPathActive(pathname: string | null, url: string): boolean {
  if (!pathname) return false;
  if (pathname === url) return true;
  if (url === "/dashboard") return false;
  return pathname.startsWith(url + "/");
}

export function NavMain() {
  const pathname = usePathname();

  const items: NavMainItem[] = SIDEBAR_NAV.map((entry) => {
    if (entry.type === "item") {
      const { item } = entry;
      return {
        title: item.label,
        url: item.url,
        icon: item.icon,
        isActive: isPathActive(pathname, item.url),
        items: undefined,
      };
    }
    const { group } = entry;
    const subItems = group.items.map((sub) => ({
      title: sub.label,
      url: sub.url,
      icon: sub.icon,
    }));
    const groupActive = subItems.some(
      (sub) =>
        pathname === sub.url || (pathname?.startsWith(sub.url + "/") ?? false)
    );
    return {
      title: group.label,
      url: `group-${group.label}`,
      icon: group.icon,
      isActive: groupActive,
      items: subItems,
    };
  });

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
                        {Icon && <Icon className="size-5 shrink-0" />}
                        <span className="flex-1 truncate">{item.title}</span>
                        <ChevronRight className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = isPathActive(
                            pathname,
                            subItem.url
                          );

                          return (
                            <SidebarMenuSubItem key={subItem.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                className={cn(
                                  "gap-2 text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                                  "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:[&>svg]:!text-white",
                                  "[&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground"
                                )}
                              >
                                <Link href={subItem.url}>
                                  {SubIcon && (
                                    <SubIcon
                                      className={cn(
                                        "size-4 shrink-0",
                                        isSubActive && "!text-white"
                                      )}
                                    />
                                  )}
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
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
