"use client";

import {
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface ConfusionMatrix {
  true_positive: number;
  true_negative: number;
  false_positive: number;
  false_negative: number;
}

interface ConfusionMatrixChartProps {
  data: ConfusionMatrix;
}

export function ConfusionMatrixChart({ data }: ConfusionMatrixChartProps) {
  const total = data.true_positive + data.true_negative + data.false_positive + data.false_negative;

  const matrixData = [
    [
      { value: data.true_positive, label: "TP", color: "#10b981" }, // green
      { value: data.false_positive, label: "FP", color: "#f59e0b" }, // amber
    ],
    [
      { value: data.false_negative, label: "FN", color: "#f59e0b" }, // amber
      { value: data.true_negative, label: "TN", color: "#10b981" }, // green
    ],
  ];

  const getPercentage = (value: number) => ((value / total) * 100).toFixed(1);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
        {matrixData.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-2 gap-2">
            {row.map((cell, cellIndex) => (
              <div
                key={cellIndex}
                className="relative aspect-square rounded-lg border-2"
                style={{
                  backgroundColor: `${cell.color}20`,
                  borderColor: cell.color,
                }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                  <div className="text-xs font-medium text-muted-foreground">{cell.label}</div>
                  <div className="text-2xl font-bold" style={{ color: cell.color }}>
                    {cell.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{getPercentage(cell.value)}%</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div>
            <span className="font-medium">Actual Positive:</span>{" "}
            {data.true_positive + data.false_negative}
          </div>
          <div>
            <span className="font-medium">Actual Negative:</span>{" "}
            {data.true_negative + data.false_positive}
          </div>
          <div>
            <span className="font-medium">Predicted Positive:</span>{" "}
            {data.true_positive + data.false_positive}
          </div>
          <div>
            <span className="font-medium">Predicted Negative:</span>{" "}
            {data.true_negative + data.false_negative}
          </div>
        </div>
      </div>
    </div>
  );
}

