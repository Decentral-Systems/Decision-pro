"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { Download, Search, ArrowUp, ArrowDown, TrendingUp, TrendingDown } from "lucide-react";
import { exportToExcel } from "@/lib/utils/export-service";

export interface FeatureData {
  name: string;
  importance: number;
  category?: string;
  direction?: "positive" | "negative" | "neutral";
  description?: string;
  change?: number; // Change from previous model version
}

interface FeatureImportanceProps {
  data: FeatureData[];
  title?: string;
  description?: string;
  maxFeatures?: number;
  showSearch?: boolean;
  showCategories?: boolean;
  onFeatureClick?: (feature: FeatureData) => void;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  financial: "#3b82f6",
  demographic: "#10b981",
  behavioral: "#f59e0b",
  alternative: "#8b5cf6",
  temporal: "#ef4444",
  default: "#6b7280",
};

/**
 * Feature Importance Chart Component
 * 
 * Interactive horizontal bar chart showing feature importance
 */
export function FeatureImportance({
  data,
  title = "Feature Importance",
  description = "Top features affecting the prediction",
  maxFeatures = 20,
  showSearch = true,
  showCategories = true,
  onFeatureClick,
  className,
}: FeatureImportanceProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState<number>(Math.min(maxFeatures, 10));
  const [sortBy, setSortBy] = useState<"importance" | "name" | "change">("importance");
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(data.map(d => d.category || "default"));
    return ["all", ...Array.from(cats)];
  }, [data]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Search filter
    if (search) {
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(d => (d.category || "default") === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "importance":
          return Math.abs(b.importance) - Math.abs(a.importance);
        case "name":
          return a.name.localeCompare(b.name);
        case "change":
          return Math.abs(b.change || 0) - Math.abs(a.change || 0);
        default:
          return 0;
      }
    });

    return filtered.slice(0, displayCount);
  }, [data, search, selectedCategory, sortBy, displayCount]);

  // Calculate max importance for scaling
  const maxImportance = useMemo(() => {
    return Math.max(...data.map(d => Math.abs(d.importance)));
  }, [data]);

  const handleExport = () => {
    const exportData = filteredData.map(d => ({
      Feature: d.name,
      Importance: d.importance.toFixed(4),
      "Importance %": `${((d.importance / maxImportance) * 100).toFixed(2)}%`,
      Category: d.category || "N/A",
      Direction: d.direction || "N/A",
      Change: d.change !== undefined ? `${d.change > 0 ? '+' : ''}${(d.change * 100).toFixed(2)}%` : "N/A",
    }));

    exportToExcel(exportData, {
      filename: `feature-importance-${Date.now()}`,
      sheetName: "Features",
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          {showSearch && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search features..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          {showCategories && categories.length > 2 && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="importance">Importance</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="change">Change</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Display Count Slider */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Show top:</span>
          <Slider
            value={[displayCount]}
            min={5}
            max={Math.min(maxFeatures, data.length)}
            step={1}
            onValueChange={([v]) => setDisplayCount(v)}
            className="w-32"
          />
          <Badge variant="secondary">{displayCount}</Badge>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={Math.max(300, displayCount * 28)}>
          <BarChart
            data={filteredData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
            <XAxis 
              type="number" 
              domain={[0, maxImportance * 1.1]}
              tickFormatter={(v) => `${((v / maxImportance) * 100).toFixed(0)}%`}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={110}
              tick={{ fontSize: 12 }}
            />
            <RechartsTooltip content={<CustomTooltip maxImportance={maxImportance} />} />
            <Bar 
              dataKey="importance" 
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onMouseEnter={(data) => setHoveredFeature(data.name)}
              onMouseLeave={() => setHoveredFeature(null)}
              onClick={(data) => onFeatureClick?.(data)}
            >
              {filteredData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CATEGORY_COLORS[entry.category || "default"]}
                  opacity={hoveredFeature && hoveredFeature !== entry.name ? 0.5 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        {showCategories && (
          <div className="flex flex-wrap gap-4 pt-4 border-t">
            {Object.entries(CATEGORY_COLORS).filter(([cat]) => 
              data.some(d => (d.category || "default") === cat)
            ).map(([category, color]) => (
              <div key={category} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm capitalize">{category}</span>
              </div>
            ))}
          </div>
        )}

        {/* Feature Details Table (optional) */}
        {hoveredFeature && (
          <div className="p-3 bg-muted rounded-lg">
            {(() => {
              const feature = filteredData.find(f => f.name === hoveredFeature);
              if (!feature) return null;
              return (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{feature.name}</p>
                    {feature.description && (
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      {((feature.importance / maxImportance) * 100).toFixed(1)}%
                    </Badge>
                    {feature.direction && (
                      <Badge 
                        variant={feature.direction === "positive" ? "default" : "destructive"}
                      >
                        {feature.direction === "positive" ? (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        )}
                        {feature.direction}
                      </Badge>
                    )}
                    {feature.change !== undefined && (
                      <Badge variant="secondary" className={cn(
                        feature.change > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {feature.change > 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {feature.change > 0 ? '+' : ''}{(feature.change * 100).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, maxImportance }: any) {
  if (!active || !payload || !payload.length) return null;

  const feature = payload[0].payload as FeatureData;
  const percent = ((feature.importance / maxImportance) * 100).toFixed(2);

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="font-medium mb-2">{feature.name}</p>
      {feature.description && (
        <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
      )}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Importance:</span>
          <span className="font-medium">{feature.importance.toFixed(4)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Relative:</span>
          <span className="font-medium">{percent}%</span>
        </div>
        {feature.category && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Category:</span>
            <span className="font-medium capitalize">{feature.category}</span>
          </div>
        )}
        {feature.direction && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Direction:</span>
            <Badge 
              variant={feature.direction === "positive" ? "default" : "destructive"}
              className="h-5"
            >
              {feature.direction}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Generate sample feature importance data
 */
export function generateFeatureImportanceData(count: number = 20): FeatureData[] {
  const features: FeatureData[] = [
    { name: "monthly_income", importance: 0.185, category: "financial", direction: "positive", description: "Monthly income in ETB" },
    { name: "debt_to_income", importance: 0.142, category: "financial", direction: "negative", description: "Total debt to income ratio" },
    { name: "credit_utilization", importance: 0.128, category: "financial", direction: "negative", description: "Credit utilization percentage" },
    { name: "payment_history", importance: 0.115, category: "behavioral", direction: "positive", description: "Historical payment behavior" },
    { name: "employment_years", importance: 0.098, category: "demographic", direction: "positive", description: "Years of employment" },
    { name: "age", importance: 0.076, category: "demographic", direction: "positive", description: "Customer age" },
    { name: "loan_amount", importance: 0.068, category: "financial", direction: "negative", description: "Requested loan amount" },
    { name: "account_age", importance: 0.054, category: "temporal", direction: "positive", description: "Age of oldest account" },
    { name: "num_inquiries", importance: 0.042, category: "behavioral", direction: "negative", description: "Recent credit inquiries" },
    { name: "mobile_usage", importance: 0.038, category: "alternative", direction: "positive", description: "Mobile money usage patterns" },
    { name: "utility_payments", importance: 0.032, category: "alternative", direction: "positive", description: "Utility payment history" },
    { name: "region", importance: 0.028, category: "demographic", direction: "neutral", description: "Geographic region" },
    { name: "education_level", importance: 0.024, category: "demographic", direction: "positive", description: "Highest education level" },
    { name: "dependents", importance: 0.018, category: "demographic", direction: "negative", description: "Number of dependents" },
    { name: "social_score", importance: 0.015, category: "alternative", direction: "positive", description: "Social network analysis score" },
  ];

  return features.slice(0, count).map((f, i) => ({
    ...f,
    change: (Math.random() - 0.5) * 0.1, // Random change between -5% and +5%
  }));
}

export default FeatureImportance;


