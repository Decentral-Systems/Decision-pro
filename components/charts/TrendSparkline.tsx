/**
 * Trend Sparkline Component
 * Mini line chart for showing trends inline
 */

"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface TrendSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function TrendSparkline({ 
  data, 
  width = 60, 
  height = 20, 
  color = "#0ea5e9",
  className 
}: TrendSparklineProps) {
  const path = useMemo(() => {
    if (!data || data.length === 0) return "";
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1 || 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });
    
    return `M ${points.join(" L ")}`;
  }, [data, width, height]);

  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-xs text-muted-foreground", className)}>
        No data
      </div>
    );
  }

  const trend = data.length >= 2 
    ? (data[data.length - 1] - data[0]) / data.length
    : 0;
  const isPositive = trend > 0;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {data.length >= 2 && (
        <span className={cn(
          "text-xs",
          isPositive ? "text-red-600" : "text-green-600"
        )}>
          {isPositive ? "↑" : "↓"}
        </span>
      )}
    </div>
  );
}



