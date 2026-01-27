"use client";

import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

interface GaugeChartProps {
  value: number | undefined | null;
  max?: number;
  min?: number;
  label?: string;
  colors?: {
    excellent: string;
    good: string;
    fair: string;
    poor: string;
  };
}

export function GaugeChart({
  value,
  max = 100,
  min = 0,
  label = "Score",
  colors = {
    excellent: "#10b981", // green
    good: "#3b82f6", // blue
    fair: "#f59e0b", // amber
    poor: "#ef4444", // red
  },
}: GaugeChartProps) {
  // Handle undefined/null values - default to 0
  const safeValue = value ?? 0;
  
  // Calculate percentage
  const percentage = ((safeValue - min) / (max - min)) * 100;

  // Determine color based on value
  const getColor = () => {
    const pct = percentage / 100;
    if (pct >= 0.8) return colors.excellent;
    if (pct >= 0.6) return colors.good;
    if (pct >= 0.4) return colors.fair;
    return colors.poor;
  };

  // Create data for the gauge
  // We'll use a RadialBarChart to create a gauge effect
  const data = [
    {
      name: "score",
      value: percentage,
      fill: getColor(),
    },
    {
      name: "remaining",
      value: 100 - percentage,
      fill: "#e5e7eb", // gray background
    },
  ];

  return (
    <div className="relative w-full" style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="90%"
          barSize={20}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={10}
            fill="#8884d8"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </RadialBar>
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold" style={{ color: getColor() }}>
          {safeValue.toFixed(0)}
        </div>
        <div className="text-sm text-muted-foreground mt-2">{label}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {min} - {max}
        </div>
      </div>
    </div>
  );
}

