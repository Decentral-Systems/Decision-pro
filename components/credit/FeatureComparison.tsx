/**
 * Feature-Level Comparison Component
 * Compares feature values across multiple credit scores
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useMemo } from "react";
import { exportToPDF, exportToExcel } from "@/lib/utils/export-service";
import { ScoreHistoryItem } from "./ScoreComparison";

interface FeatureComparisonProps {
  scores: ScoreHistoryItem[];
  features?: Record<string, any>; // Feature values for each score
  className?: string;
}

interface FeatureDiff {
  feature: string;
  values: Record<string, number | string>;
  changes: Record<string, { value: number; direction: "up" | "down" | "same" }>;
  maxChange: number;
  significantChange: boolean;
}

export function FeatureComparison({
  scores,
  features,
  className,
}: FeatureComparisonProps) {
  // Extract feature differences
  const featureDiffs = useMemo<FeatureDiff[]>(() => {
    if (!features || scores.length < 2) return [];

    const featureNames = new Set<string>();
    scores.forEach((score) => {
      if (score.model_predictions) {
        Object.keys(score.model_predictions).forEach((key) => featureNames.add(key));
      }
    });

    return Array.from(featureNames).map((featureName) => {
      const values: Record<string, number | string> = {};
      const changes: Record<string, { value: number; direction: "up" | "down" | "same" }> = {};

      scores.forEach((score, index) => {
        const value = score.model_predictions?.[featureName] || 0;
        values[score.id] = value;

        if (index > 0) {
          const prevValue = scores[index - 1].model_predictions?.[featureName] || 0;
          const change = typeof value === "number" && typeof prevValue === "number"
            ? value - prevValue
            : 0;
          changes[score.id] = {
            value: change,
            direction: change > 0 ? "up" : change < 0 ? "down" : "same",
          };
        }
      });

      const changeValues = Object.values(changes).map((c) => Math.abs(c.value));
      const maxChange = Math.max(...changeValues, 0);

      return {
        feature: featureName,
        values,
        changes,
        maxChange,
        significantChange: maxChange > 10, // Threshold for significant change
      };
    });
  }, [scores, features]);

  const handleExport = async (format: "pdf" | "excel") => {
    const exportData = featureDiffs.map((diff) => ({
      Feature: diff.feature,
      ...Object.fromEntries(
        scores.map((score) => [score.id, diff.values[score.id] || "N/A"])
      ),
      "Max Change": diff.maxChange.toFixed(2),
      "Significant": diff.significantChange ? "Yes" : "No",
    }));

    if (format === "pdf") {
      await exportToPDF(
        {
          title: "Feature Comparison Report",
          data: exportData,
          generatedAt: new Date().toISOString(),
        },
        `feature-comparison-${Date.now()}`
      );
    } else {
      await exportToExcel(exportData, `feature-comparison-${Date.now()}`);
    }
  };

  if (scores.length < 2) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Feature Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Select at least 2 scores to compare features
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Feature-Level Comparison</CardTitle>
            <CardDescription className="text-xs">
              Compare feature values across {scores.length} scores
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
              <Download className="h-4 w-4 mr-1" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Feature</TableHead>
                {scores.map((score, index) => (
                  <TableHead key={score.id} className="text-center">
                    Score #{scores.length - index}
                    {index === 0 && <Badge variant="outline" className="ml-2 text-xs">Current</Badge>}
                  </TableHead>
                ))}
                <TableHead className="text-center">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {featureDiffs
                .sort((a, b) => b.maxChange - a.maxChange)
                .slice(0, 20) // Top 20 features
                .map((diff) => (
                  <TableRow key={diff.feature}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {diff.feature}
                        {diff.significantChange && (
                          <Badge variant="outline" className="text-xs bg-yellow-50">
                            Significant
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {scores.map((score) => (
                      <TableCell key={score.id} className="text-center">
                        {typeof diff.values[score.id] === "number"
                          ? diff.values[score.id].toFixed(2)
                          : diff.values[score.id] || "N/A"}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      {Object.entries(diff.changes).map(([scoreId, change]) => (
                        <div key={scoreId} className="flex items-center justify-center gap-1">
                          {change.direction === "up" ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : change.direction === "down" ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <Minus className="h-4 w-4 text-gray-400" />
                          )}
                          <span
                            className={
                              change.direction === "up"
                                ? "text-green-600"
                                : change.direction === "down"
                                  ? "text-red-600"
                                  : "text-gray-400"
                            }
                          >
                            {change.value > 0 ? "+" : ""}
                            {change.value.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        {featureDiffs.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No feature data available for comparison
          </div>
        )}
      </CardContent>
    </Card>
  );
}
