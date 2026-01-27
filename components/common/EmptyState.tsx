/**
 * Empty State Component
 * Displays explicit empty states instead of silent skeletons
 */

"use client";

import { AlertCircle, RefreshCw, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "empty" | "error";
  className?: string;
}

export function EmptyState({
  title = "No data available",
  description = "There is no data to display at this time.",
  icon,
  action,
  variant = "empty",
  className,
}: EmptyStateProps) {
  const defaultIcon =
    variant === "error" ? (
      <AlertCircle className="h-8 w-8 text-destructive" />
    ) : (
      <Inbox className="h-8 w-8 text-muted-foreground" />
    );

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-4">
        <div className="mb-4">{icon || defaultIcon}</div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          {description}
        </p>
        {action && (
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label === "Retry" && <RefreshCw className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
