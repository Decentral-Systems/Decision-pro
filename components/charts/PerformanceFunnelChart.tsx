"use client";

interface PerformanceFunnelData {
  total_predictions: number;
  successful_predictions: number;
  accurate_predictions: number;
  high_confidence_predictions: number;
}

interface PerformanceFunnelChartProps {
  data: PerformanceFunnelData;
}

export function PerformanceFunnelChart({ data }: PerformanceFunnelChartProps) {
  const stages = [
    {
      label: "Total Predictions",
      value: data.total_predictions,
      percentage: 100,
      color: "#3b82f6", // blue
    },
    {
      label: "Successful",
      value: data.successful_predictions,
      percentage: (data.successful_predictions / data.total_predictions) * 100,
      color: "#10b981", // green
    },
    {
      label: "Accurate",
      value: data.accurate_predictions,
      percentage: (data.accurate_predictions / data.total_predictions) * 100,
      color: "#f59e0b", // amber
    },
    {
      label: "High Confidence",
      value: data.high_confidence_predictions,
      percentage: (data.high_confidence_predictions / data.total_predictions) * 100,
      color: "#ef4444", // red
    },
  ];

  const maxWidth = 100; // Maximum width percentage

  return (
    <div className="w-full space-y-4">
      {stages.map((stage, index) => (
        <div key={index} className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{stage.label}</span>
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold">{stage.value.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">
                {stage.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="h-12 rounded-lg overflow-hidden bg-gray-200 relative">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(stage.percentage / 100) * maxWidth}%`,
                backgroundColor: stage.color,
                opacity: 0.8,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

