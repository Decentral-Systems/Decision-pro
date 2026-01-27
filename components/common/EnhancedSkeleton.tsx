"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export interface EnhancedSkeletonProps {
  variant?: "card" | "table" | "form" | "list" | "chart" | "metrics" | "section";
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
  animated?: boolean;
}

/**
 * Enhanced Skeleton Component with multiple variants
 * Provides consistent loading states across all dashboard sections
 */
export function EnhancedSkeleton({
  variant = "card",
  rows = 3,
  columns = 1,
  showHeader = true,
  className,
  animated = true,
}: EnhancedSkeletonProps) {
  const baseClasses = animated ? "animate-pulse" : "";

  switch (variant) {
    case "card":
      return (
        <Card className={cn(baseClasses, className)}>
          {showHeader && (
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
          )}
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );

    case "table":
      return (
        <Card className={cn(baseClasses, className)}>
          {showHeader && (
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
          )}
          <CardContent>
            <div className="space-y-3">
              {/* Table header */}
              <div className="flex gap-4 pb-2 border-b">
                {Array.from({ length: columns }).map((_, i) => (
                  <Skeleton key={i} className="h-4 flex-1" />
                ))}
              </div>
              {/* Table rows */}
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  {Array.from({ length: columns }).map((_, j) => (
                    <Skeleton key={j} className="h-12 flex-1" />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );

    case "form":
      return (
        <Card className={cn(baseClasses, className)}>
          {showHeader && (
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
          )}
          <CardContent className="space-y-6">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <div className="flex gap-2 pt-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      );

    case "list":
      return (
        <div className={cn("space-y-3", className)}>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      );

    case "chart":
      return (
        <Card className={cn(baseClasses, className)}>
          {showHeader && (
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
          )}
          <CardContent>
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="flex justify-center gap-4 mt-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </CardContent>
        </Card>
      );

    case "metrics":
      return (
        <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
          {Array.from({ length: columns || 4 }).map((_, i) => (
            <Card key={i} className={baseClasses}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      );

    case "section":
      return (
        <div className={cn("space-y-4", className)}>
          {showHeader && (
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          )}
          <Card className={baseClasses}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Array.from({ length: rows }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );

    default:
      return (
        <div className={cn("space-y-4", className)}>
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
  }
}

/**
 * Section-specific skeleton loader
 */
export function SectionSkeleton({ 
  showHeader = true,
  rows = 3 
}: { 
  showHeader?: boolean; 
  rows?: number;
}) {
  return <EnhancedSkeleton variant="section" showHeader={showHeader} rows={rows} />;
}

/**
 * Table skeleton loader
 */
export function TableSkeleton({ 
  columns = 5,
  rows = 5 
}: { 
  columns?: number;
  rows?: number;
}) {
  return <EnhancedSkeleton variant="table" columns={columns} rows={rows} />;
}

/**
 * Metrics skeleton loader
 */
export function MetricsSkeleton({ 
  count = 4 
}: { 
  count?: number;
}) {
  return <EnhancedSkeleton variant="metrics" columns={count} />;
}
