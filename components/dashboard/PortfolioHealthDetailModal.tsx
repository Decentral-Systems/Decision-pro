"use client";

import { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react";

interface ComponentDetail {
  name: string;
  value: number;
  target: number;
  historical?: Array<{ timestamp: string; value: number }>;
  description: string;
  recommendations?: string[];
}

interface PortfolioHealthDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component: ComponentDetail | null;
}

function PortfolioHealthDetailModalComponent({
  open,
  onOpenChange,
  component,
}: PortfolioHealthDetailModalProps) {
  if (!component) return null;

  const getStatusColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 95) return "text-green-600";
    if (percentage >= 80) return "text-amber-600";
    return "text-red-600";
  };

  const getStatusBadge = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 95) return { variant: "default" as const, label: "Excellent" };
    if (percentage >= 80) return { variant: "secondary" as const, label: "Good" };
    return { variant: "destructive" as const, label: "Needs Attention" };
  };

  const status = getStatusBadge(component.value, component.target);
  const trend = component.historical && component.historical.length > 1
    ? component.historical[component.historical.length - 1].value - component.historical[0].value
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {component.name}
            <Badge variant={status.variant}>{status.label}</Badge>
          </DialogTitle>
          <DialogDescription>{component.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current Score</span>
                <span className={`text-2xl font-bold ${getStatusColor(component.value, component.target)}`}>
                  {component.value.toFixed(1)}
                </span>
              </div>
              <Progress value={(component.value / component.target) * 100} className="h-2" />
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>0</span>
                <span>Target: {component.target}</span>
              </div>
            </div>

            {/* Trend Indicator */}
            {component.historical && component.historical.length > 1 && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                {trend > 0 ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-sm">
                      <span className="font-semibold text-green-600">+{trend.toFixed(1)}</span> improvement over time
                    </span>
                  </>
                ) : trend < 0 ? (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-sm">
                      <span className="font-semibold text-red-600">{trend.toFixed(1)}</span> decline over time
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <span className="text-sm">Stable performance</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Historical Trend Chart */}
          {component.historical && component.historical.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Historical Trend</h4>
              <div className="border rounded-lg p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={component.historical}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="timestamp"
                      className="text-xs"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      }}
                    />
                    <YAxis
                      className="text-xs"
                      domain={[0, component.target]}
                    />
                    <Tooltip
                      formatter={(value: number) => [value.toFixed(2), component.name]}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        });
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {component.recommendations && component.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {component.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benchmark Comparison */}
          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-semibold">Benchmark Comparison</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Current</div>
                <div className="text-lg font-bold">{component.value.toFixed(1)}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Target</div>
                <div className="text-lg font-bold">{component.target.toFixed(1)}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Gap</div>
                <div className={`text-lg font-bold ${component.value >= component.target ? 'text-green-600' : 'text-red-600'}`}>
                  {(component.value - component.target).toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const PortfolioHealthDetailModal = memo(PortfolioHealthDetailModalComponent);



