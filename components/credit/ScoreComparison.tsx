"use client";
import React, { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  BarChart3, 
  Download, 
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  User
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ExportService } from "@/lib/utils/export-service";
import { FeatureComparison } from "./FeatureComparison";

export interface ScoreHistoryItem {
  id: string;
  prediction_id?: string;
  customer_id: string;
  credit_score: number;
  risk_category: string;
  approval_recommendation?: string;
  loan_amount?: number;
  monthly_income?: number;
  created_at: string;
  model_predictions?: Record<string, number>;
  compliance_status?: any;
}

interface ScoreComparisonProps<T extends ScoreHistoryItem = ScoreHistoryItem> {
  items: T[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxSelections?: number;
  className?: string;
}

/**
 * Score Comparison Component
 * 
 * Allows users to select and compare multiple credit scores side-by-side
 */
export function ScoreComparison<T extends ScoreHistoryItem>({
  items,
  selectedIds,
  onSelectionChange,
  maxSelections = 4,
  className,
}: ScoreComparisonProps<T>) {
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.includes(item.id));
  }, [items, selectedIds]);

  const handleToggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else if (selectedIds.length < maxSelections) {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  const handleExportComparison = async (format: "pdf" | "excel") => {
    const exportData = selectedItems.map((item) => ({
      "Prediction ID": item.prediction_id,
      "Customer ID": item.customer_id,
      "Credit Score": item.credit_score,
      "Risk Category": item.risk_category,
      "Recommendation": item.approval_recommendation,
      "Loan Amount": item.loan_amount || "N/A",
      "Monthly Income": item.monthly_income || "N/A",
      "Date": format === "pdf" ? formatDate(item.created_at) : item.created_at,
    }));

    // Include feature comparison data if available
    const featureData = selectedItems
      .filter((item) => item.model_predictions)
      .map((item) => ({
        "Score ID": item.id,
        "Date": formatDate(item.created_at),
        ...item.model_predictions,
      }));

    if (format === "pdf") {
      ExportService.exportToPDF(exportData, {
        title: "Credit Score Comparison Report",
        filename: `score-comparison-${Date.now()}.pdf`,
      });
    } else {
      // Excel export with multiple sheets
      const sheets = [
        {
          name: "Score Comparison",
          data: exportData,
        },
      ];

      if (featureData.length > 0) {
        sheets.push({
          name: "Feature Comparison",
          data: featureData,
        });
      }

      ExportService.exportToExcel(sheets, {
        filename: `score-comparison-${Date.now()}.xlsx`,
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Score Comparison
            </CardTitle>
            <CardDescription>
              Select up to {maxSelections} scores to compare
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <>
                <Badge variant="secondary">
                  {selectedIds.length} selected
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearSelection}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </>
            )}
            <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  disabled={selectedIds.length < 2}
                  size="sm"
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Compare ({selectedIds.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Credit Score Comparison</DialogTitle>
                  <DialogDescription>
                    Side-by-side comparison of {selectedIds.length} credit scores
                  </DialogDescription>
                </DialogHeader>
                <ComparisonView 
                  items={selectedItems} 
                  onExport={handleExportComparison}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Select</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer ID</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Recommendation</TableHead>
              <TableHead>Loan Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow 
                key={item.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedIds.includes(item.id) && "bg-primary/5"
                )}
                onClick={() => handleToggleSelection(item.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={() => handleToggleSelection(item.id)}
                    disabled={!selectedIds.includes(item.id) && selectedIds.length >= maxSelections}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {formatDate(item.created_at)}
                </TableCell>
                <TableCell className="font-medium">
                  {item.customer_id}
                </TableCell>
                <TableCell>
                  <ScoreBadge score={item.credit_score} />
                </TableCell>
                <TableCell>
                  <RiskBadge risk={item.risk_category} />
                </TableCell>
                <TableCell>
                  <RecommendationBadge recommendation={item.approval_recommendation} />
                </TableCell>
                <TableCell>
                  {item.loan_amount 
                    ? `${item.loan_amount.toLocaleString()} ETB`
                    : "-"
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/**
 * Comparison View Component
 * 
 * Displays side-by-side comparison of selected scores
 */
interface ComparisonViewProps {
  items: ScoreHistoryItem[];
  onExport: (format: "pdf" | "excel") => void;
}

function ComparisonView({ items, onExport }: ComparisonViewProps) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [items]);

  const scoreStats = useMemo(() => {
    const scores = sortedItems.map((i) => i.credit_score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const range = max - min;
    
    // Calculate trend (from oldest to newest)
    const oldest = sortedItems[sortedItems.length - 1]?.credit_score || 0;
    const newest = sortedItems[0]?.credit_score || 0;
    const trend = newest - oldest;
    
    return { min, max, avg, range, trend };
  }, [sortedItems]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Average Score" 
          value={Math.round(scoreStats.avg)} 
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <StatCard 
          label="Score Range" 
          value={scoreStats.range} 
          suffix="pts"
          icon={<Minus className="h-4 w-4" />}
        />
        <StatCard 
          label="Highest" 
          value={scoreStats.max} 
          icon={<ArrowUp className="h-4 w-4 text-green-500" />}
        />
        <StatCard 
          label="Trend" 
          value={scoreStats.trend} 
          suffix="pts"
          icon={scoreStats.trend >= 0 
            ? <TrendingUp className="h-4 w-4 text-green-500" /> 
            : <TrendingDown className="h-4 w-4 text-red-500" />
          }
          positive={scoreStats.trend >= 0}
        />
      </div>

      {/* Feature-Level Comparison */}
      {sortedItems.length >= 2 && (
        <FeatureComparison
          scores={sortedItems}
          features={sortedItems.reduce((acc, item) => {
            if (item.model_predictions) {
              acc[item.id] = item.model_predictions;
            }
            return acc;
          }, {} as Record<string, any>)}
        />
      )}

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedItems.map((item, index) => (
          <ComparisonCard 
            key={item.id} 
            item={item} 
            index={index}
            isLatest={index === 0}
            previousScore={sortedItems[index + 1]?.credit_score}
          />
        ))}
      </div>

      {/* Model Predictions Comparison */}
      {sortedItems.some((i) => i.model_predictions) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Model Predictions Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  {sortedItems.map((item) => (
                    <TableHead key={item.id} className="text-center">
                      {formatDate(item.created_at)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {getUniqueModelNames(sortedItems).map((modelName) => (
                  <TableRow key={modelName}>
                    <TableCell className="font-medium">{modelName}</TableCell>
                    {sortedItems.map((item) => (
                      <TableCell key={item.id} className="text-center">
                        {item.model_predictions?.[modelName] 
                          ? Math.round(item.model_predictions[modelName])
                          : "-"
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Export buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onExport("excel")}>
          <Download className="h-4 w-4 mr-1" />
          Export Excel
        </Button>
        <Button variant="outline" size="sm" onClick={() => onExport("pdf")}>
          <Download className="h-4 w-4 mr-1" />
          Export PDF
        </Button>
      </div>
    </div>
  );
}

/**
 * Comparison Card for individual score
 */
interface ComparisonCardProps {
  item: ScoreHistoryItem;
  index: number;
  isLatest: boolean;
  previousScore?: number;
}

function ComparisonCard({ item, index, isLatest, previousScore }: ComparisonCardProps) {
  const scoreDiff = previousScore ? item.credit_score - previousScore : null;

  return (
    <Card className={cn(
      "relative overflow-hidden",
      isLatest && "ring-2 ring-primary"
    )}>
      {isLatest && (
        <Badge className="absolute top-2 right-2" variant="secondary">
          Latest
        </Badge>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDate(item.created_at)}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          {item.customer_id}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className="text-4xl font-bold">{item.credit_score}</div>
          {scoreDiff !== null && (
            <div className={cn(
              "flex items-center justify-center gap-1 text-sm",
              scoreDiff > 0 ? "text-green-600" : scoreDiff < 0 ? "text-red-600" : "text-muted-foreground"
            )}>
              {scoreDiff > 0 ? (
                <ArrowUp className="h-4 w-4" />
              ) : scoreDiff < 0 ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              {scoreDiff > 0 ? "+" : ""}{scoreDiff} pts
            </div>
          )}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Risk:</span>
            <RiskBadge risk={item.risk_category} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recommendation:</span>
            <RecommendationBadge recommendation={item.approval_recommendation} />
          </div>
          {item.loan_amount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan:</span>
              <span className="font-medium">{item.loan_amount.toLocaleString()} ETB</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper components
function StatCard({ 
  label, 
  value, 
  suffix, 
  icon,
  positive 
}: { 
  label: string; 
  value: number; 
  suffix?: string;
  icon?: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className={cn(
        "text-2xl font-bold",
        positive !== undefined && (positive ? "text-green-600" : "text-red-600")
      )}>
        {positive !== undefined && value > 0 && "+"}
        {value}
        {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 750) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (score >= 650) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    if (score >= 550) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  return (
    <span className={cn("px-2 py-1 rounded-md text-sm font-medium", getColor())}>
      {score}
    </span>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const getVariant = () => {
    const r = risk.toLowerCase();
    if (r === "low") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (r === "medium") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    if (r === "high") return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium capitalize", getVariant())}>
      {risk}
    </span>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const getVariant = () => {
    const r = recommendation.toLowerCase();
    if (r === "approve" || r === "approved") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (r === "review") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium capitalize", getVariant())}>
      {recommendation}
    </span>
  );
}

// Utility functions
function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), "MMM dd, yyyy HH:mm");
  } catch {
    return dateString;
  }
}

function getUniqueModelNames(items: ScoreHistoryItem[]): string[] {
  const names = new Set<string>();
  items.forEach((item) => {
    if (item.model_predictions) {
      Object.keys(item.model_predictions).forEach((name) => names.add(name));
    }
  });
  return Array.from(names).sort();
}

export default ScoreComparison;

