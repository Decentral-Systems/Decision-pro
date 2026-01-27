/**
 * Data Source Display Component
 * Shows data freshness, confidence scores, and source information
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Database, Clock, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { FieldDataSource, DataSource } from "./FieldDataSourceBadge";

interface DataSourceDisplayProps {
  sources: Record<string, FieldDataSource>;
  overallConfidence?: number;
  lastUpdated?: Date;
  onRefresh?: () => void;
  className?: string;
}

export function DataSourceDisplay({
  sources,
  overallConfidence,
  lastUpdated,
  onRefresh,
  className,
}: DataSourceDisplayProps) {
  const sourceCounts = Object.values(sources).reduce(
    (acc, source) => {
      acc[source.source] = (acc[source.source] || 0) + 1;
      return acc;
    },
    {} as Record<DataSource, number>
  );

  const averageConfidence =
    Object.values(sources)
      .map((s) => s.confidence || 1)
      .reduce((a, b) => a + b, 0) / Object.values(sources).length || 1;

  const freshnessStatus = lastUpdated
    ? formatDistanceToNow(lastUpdated, { addSuffix: true })
    : "Unknown";

  const isStale = lastUpdated
    ? Date.now() - lastUpdated.getTime() > 7 * 24 * 60 * 60 * 1000 // 7 days
    : false;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4" />
              Data Sources
            </CardTitle>
            <CardDescription className="text-xs">
              Information about data sources and freshness
            </CardDescription>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 hover:bg-accent rounded transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Confidence */}
        {overallConfidence !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Overall Data Confidence</span>
              <span className="font-semibold">{(overallConfidence * 100).toFixed(0)}%</span>
            </div>
            <Progress value={overallConfidence * 100} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {overallConfidence >= 0.8 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  High confidence data
                </span>
              ) : overallConfidence >= 0.6 ? (
                <span className="text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Moderate confidence - review recommended
                </span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Low confidence - verification required
                </span>
              )}
            </div>
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="flex items-center justify-between p-2 rounded border bg-muted/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs font-medium">Last Updated</div>
                <div className="text-xs text-muted-foreground">
                  {format(lastUpdated, "MMM dd, yyyy HH:mm")}
                </div>
              </div>
            </div>
            <Badge variant={isStale ? "destructive" : "outline"} className="text-xs">
              {freshnessStatus}
            </Badge>
          </div>
        )}

        {/* Source Breakdown */}
        <div className="space-y-2">
          <div className="text-xs font-semibold">Data Sources</div>
          <div className="space-y-1">
            {Object.entries(sourceCounts).map(([source, count]) => (
              <div
                key={source}
                className="flex items-center justify-between text-xs p-2 rounded border"
              >
                <span className="text-muted-foreground capitalize">
                  {source.replace("_", " ")}: {count} field{count !== 1 ? "s" : ""}
                </span>
                <Badge variant="outline" className="text-xs">
                  {((count / Object.keys(sources).length) * 100).toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Average Confidence */}
        {Object.values(sources).some((s) => s.confidence !== undefined) && (
          <div className="space-y-2">
            <div className="text-xs font-semibold">Average Confidence by Source</div>
            <div className="space-y-1">
              {Object.entries(sourceCounts).map(([source]) => {
                const sourceConfidences = Object.values(sources)
                  .filter((s) => s.source === source)
                  .map((s) => s.confidence || 1);
                const avgConfidence =
                  sourceConfidences.reduce((a, b) => a + b, 0) / sourceConfidences.length || 1;

                return (
                  <div key={source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground capitalize">
                        {source.replace("_", " ")}
                      </span>
                      <span className="font-semibold">{(avgConfidence * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={avgConfidence * 100} className="h-1" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
