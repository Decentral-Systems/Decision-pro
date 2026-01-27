"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface SunburstSegment {
  name: string;
  value: number;
  children?: SunburstSegment[];
}

interface SunburstChartProps {
  data: SunburstSegment[];
  colors?: string[];
}

// Default color palette
const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export function SunburstChart({
  data,
  colors = DEFAULT_COLORS,
}: SunburstChartProps) {
  // Flatten hierarchical data for visualization
  // For simplicity, we'll show the top-level segments
  // A full sunburst would require nested Pie charts
  const flattenedData = data.map((segment) => ({
    name: segment.name,
    value: segment.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={flattenedData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {flattenedData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [
            value.toLocaleString(),
            "Count",
          ]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

