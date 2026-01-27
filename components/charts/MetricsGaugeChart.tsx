"use client";

import { GaugeChart } from "./GaugeChart";

interface MetricsGaugeChartProps {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  aucRoc: number;
}

export function MetricsGaugeChart({
  accuracy,
  precision,
  recall,
  f1Score,
  aucRoc,
}: MetricsGaugeChartProps) {
  const metrics = [
    { label: "Accuracy", value: accuracy * 100 },
    { label: "Precision", value: precision * 100 },
    { label: "Recall", value: recall * 100 },
    { label: "F1 Score", value: f1Score * 100 },
    { label: "AUC-ROC", value: aucRoc * 100 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="flex flex-col items-center">
          <GaugeChart
            value={metric.value}
            max={100}
            min={0}
            label={metric.label}
          />
        </div>
      ))}
    </div>
  );
}

