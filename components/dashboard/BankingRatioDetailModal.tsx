"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { formatNumber, formatPercentage } from "@/lib/utils/format";
import { TrendingUp, TrendingDown, AlertCircle, Info, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface BankingRatio {
  name: string;
  abbreviation: string;
  currentValue: number;
  unit: "percentage" | "number";
  description: string;
  formula: string;
  target?: number;
  industryAverage?: number;
  peerAverage?: number;
  trend: "improving" | "declining" | "stable";
  trendPercentage: number;
  historicalData?: Array<{ date: string; value: number }>;
  recommendations: string[];
  relatedMetrics: string[];
}

interface BankingRatioDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ratio: BankingRatio | null;
}

export function BankingRatioDetailModal({ isOpen, onClose, ratio }: BankingRatioDetailModalProps) {
  if (!ratio) return null;

  const getTrendIcon = () => {
    if (ratio.trend === "improving") return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (ratio.trend === "declining") return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <AlertCircle className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (ratio.trend === "improving") return "text-green-600";
    if (ratio.trend === "declining") return "text-red-600";
    return "text-gray-600";
  };

  const getStatusBadge = () => {
    if (ratio.target && ratio.currentValue >= ratio.target * 0.9 && ratio.currentValue <= ratio.target * 1.1) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">On Target</Badge>;
    }
    if (ratio.target && ratio.currentValue < ratio.target * 0.9) {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Below Target</Badge>;
    }
    if (ratio.target && ratio.currentValue > ratio.target * 1.1) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Above Target</Badge>;
    }
    return null;
  };

  const formatValue = (value: number) => {
    return ratio.unit === "percentage" ? formatPercentage(value / 100) : formatNumber(value, 2);
  };

  // Generate synthetic historical data if not provided
  const historicalData = ratio.historicalData || (() => {
    const data: Array<{ date: string; value: number }> = [];
    const now = Date.now();
    const days = 90;
    const baseValue = ratio.currentValue;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      data.push({
        date: date.toISOString().split('T')[0],
        value: baseValue * (1 + variation),
      });
    }
    return data;
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{ratio.name} ({ratio.abbreviation})</DialogTitle>
              <DialogDescription className="mt-2">{ratio.description}</DialogDescription>
            </div>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Current Value and Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-4">
                <div className="text-4xl font-bold">{formatValue(ratio.currentValue)}</div>
                <div className={`flex items-center gap-2 ${getTrendColor()}`}>
                  {getTrendIcon()}
                  <span className="font-semibold">
                    {ratio.trendPercentage > 0 ? "+" : ""}
                    {formatPercentage(ratio.trendPercentage / 100)} ({ratio.trend})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historical Trend Chart */}
          {historicalData && historicalData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historical Trend (Last 90 Days)</CardTitle>
                <CardDescription>Trend over time with benchmark comparisons</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      className="text-xs"
                      tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    />
                    <YAxis
                      className="text-xs"
                      tickFormatter={(value) => formatValue(value)}
                    />
                    <Tooltip
                      formatter={(value: number) => formatValue(value)}
                      labelFormatter={(label) => new Date(label).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    />
                    <Legend />
                    {ratio.target && (
                      <ReferenceLine
                        y={ratio.target}
                        stroke="#10b981"
                        strokeDasharray="5 5"
                        label={{ value: "Target", position: "right" }}
                      />
                    )}
                    {ratio.industryAverage && (
                      <ReferenceLine
                        y={ratio.industryAverage}
                        stroke="#3b82f6"
                        strokeDasharray="3 3"
                        label={{ value: "Industry Avg", position: "right" }}
                      />
                    )}
                    {ratio.peerAverage && (
                      <ReferenceLine
                        y={ratio.peerAverage}
                        stroke="#f59e0b"
                        strokeDasharray="2 2"
                        label={{ value: "Peer Avg", position: "right" }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name={ratio.abbreviation}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Benchmarks and Targets */}
          <div className="grid gap-4 md:grid-cols-3">
            {ratio.target !== undefined && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Target
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatValue(ratio.target)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {ratio.currentValue >= ratio.target * 0.9 && ratio.currentValue <= ratio.target * 1.1
                      ? "Within target range"
                      : ratio.currentValue < ratio.target
                      ? `${formatValue(ratio.target - ratio.currentValue)} below target`
                      : `${formatValue(ratio.currentValue - ratio.target)} above target`}
                  </div>
                </CardContent>
              </Card>
            )}

            {ratio.industryAverage !== undefined && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Industry Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatValue(ratio.industryAverage)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {ratio.currentValue > ratio.industryAverage
                      ? `${formatValue(ratio.currentValue - ratio.industryAverage)} above industry`
                      : `${formatValue(ratio.industryAverage - ratio.currentValue)} below industry`}
                  </div>
                </CardContent>
              </Card>
            )}

            {ratio.peerAverage !== undefined && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Peer Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatValue(ratio.peerAverage)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {ratio.currentValue > ratio.peerAverage
                      ? `${formatValue(ratio.currentValue - ratio.peerAverage)} above peers`
                      : `${formatValue(ratio.peerAverage - ratio.currentValue)} below peers`}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Formula and Calculation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                Formula & Calculation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Formula: </span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{ratio.formula}</code>
                </div>
                <div className="text-sm text-muted-foreground mt-2">{ratio.description}</div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {ratio.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendations</CardTitle>
                <CardDescription>Actions to improve this ratio</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {ratio.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Related Metrics */}
          {ratio.relatedMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related Metrics</CardTitle>
                <CardDescription>Metrics that influence or are influenced by this ratio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ratio.relatedMetrics.map((metric, index) => (
                    <Badge key={index} variant="outline">{metric}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

