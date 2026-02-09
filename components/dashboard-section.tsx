"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { DashboardSectionHeader } from "./dashboard/DashboardSectionHeader";
import type { LucideIcon } from "lucide-react";

interface DashboardSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: {
    label: string;
    variant?:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "success"
      | "warning"
      | "info";
  };
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  variant?: "default" | "compact" | "large";
  showSeparator?: boolean;
  errorBoundary?: boolean;
  errorFallback?: React.ReactNode;
}

export function DashboardSection({
  title,
  description,
  icon,
  badge,
  actions,
  children,
  className,
  headerClassName,
  collapsible = false,
  defaultOpen = true,
  variant = "default",
  showSeparator = true,
  errorBoundary = false,
  errorFallback,
}: DashboardSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const content = <div className={cn("space-y-4", className)}>{children}</div>;

  const header = (
    <DashboardSectionHeader
      title={title}
      description={description}
      icon={icon}
      badge={badge}
      actions={
        collapsible ? (
          <>
            {actions}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="h-8 w-8"
              aria-label={isOpen ? "Collapse section" : "Expand section"}
            >
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </>
        ) : (
          actions
        )
      }
      variant={variant}
      showSeparator={showSeparator}
      className={headerClassName}
    />
  );

  if (collapsible) {
    return (
      <div
        className="space-y-0"
        data-dashboard-section
        data-section-title={title}
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer" data-section-header>
              {header}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            {errorBoundary ? (
              <div className="pt-4">
                {errorFallback ? (
                  <div className="relative">
                    {content}
                    {errorFallback}
                  </div>
                ) : (
                  content
                )}
              </div>
            ) : (
              <div className="pt-4">{content}</div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  return (
    <section
      className="section-fade-in space-y-0"
      aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
      data-dashboard-section
      data-section-title={title}
    >
      <div data-section-header>{header}</div>
      {errorBoundary ? (
        <div className="pt-4">
          {errorFallback ? (
            <div className="relative">
              {content}
              {errorFallback}
            </div>
          ) : (
            content
          )}
        </div>
      ) : (
        <div className="pt-4">{content}</div>
      )}
    </section>
  );
}
