/**
 * Field Data Source Badge Component
 * Shows data source and freshness for form fields
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Database, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type DataSource = "crm" | "credit_bureau" | "bank" | "manual" | "calculated" | "unknown";

export interface FieldDataSource {
  source: DataSource;
  timestamp?: Date;
  confidence?: number; // 0-1
  freshness?: "fresh" | "stale" | "outdated";
}

interface FieldDataSourceBadgeProps {
  dataSource: FieldDataSource;
  className?: string;
  showTooltip?: boolean;
}

const sourceLabels: Record<DataSource, string> = {
  crm: "CRM",
  credit_bureau: "Credit Bureau",
  bank: "Bank Records",
  manual: "Manual Entry",
  calculated: "Calculated",
  unknown: "Unknown",
};

const sourceColors: Record<DataSource, string> = {
  crm: "bg-blue-100 text-blue-800 border-blue-300",
  credit_bureau: "bg-purple-100 text-purple-800 border-purple-300",
  bank: "bg-green-100 text-green-800 border-green-300",
  manual: "bg-gray-100 text-gray-800 border-gray-300",
  calculated: "bg-orange-100 text-orange-800 border-orange-300",
  unknown: "bg-gray-100 text-gray-600 border-gray-300",
};

export function FieldDataSourceBadge({
  dataSource,
  className,
  showTooltip = true,
}: FieldDataSourceBadgeProps) {
  const badge = (
    <Badge
      variant="outline"
      className={`text-xs ${sourceColors[dataSource.source]} ${className}`}
    >
      <Database className="h-3 w-3 mr-1" />
      {sourceLabels[dataSource.source]}
      {dataSource.confidence !== undefined && dataSource.confidence < 0.8 && (
        <AlertCircle className="h-3 w-3 ml-1" />
      )}
    </Badge>
  );

  if (!showTooltip) return badge;

  const tooltipContent = (
    <div className="space-y-1 text-xs">
      <div className="font-semibold">Data Source: {sourceLabels[dataSource.source]}</div>
      {dataSource.timestamp && (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(dataSource.timestamp, { addSuffix: true })}
        </div>
      )}
      {dataSource.confidence !== undefined && (
        <div className="flex items-center gap-1">
          {dataSource.confidence >= 0.8 ? (
            <CheckCircle2 className="h-3 w-3 text-green-500" />
          ) : (
            <AlertCircle className="h-3 w-3 text-yellow-500" />
          )}
          Confidence: {(dataSource.confidence * 100).toFixed(0)}%
        </div>
      )}
      {dataSource.freshness && (
        <div className="text-muted-foreground">
          Status: {dataSource.freshness.charAt(0).toUpperCase() + dataSource.freshness.slice(1)}
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
