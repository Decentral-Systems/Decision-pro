"use client";

interface DriftHeatmapData {
  feature_name: string;
  drift_score: number;
  severity: "low" | "medium" | "high";
}

interface DriftHeatmapChartProps {
  data: DriftHeatmapData[];
  maxItems?: number;
}

export function DriftHeatmapChart({ data, maxItems = 20 }: DriftHeatmapChartProps) {
  const sortedData = [...data]
    .sort((a, b) => b.drift_score - a.drift_score)
    .slice(0, maxItems);

  const getSeverityColor = (severity: string, score: number) => {
    if (severity === "high" || score > 0.7) return "bg-red-500";
    if (severity === "medium" || score > 0.4) return "bg-amber-500";
    return "bg-green-500";
  };

  const getOpacity = (score: number) => {
    return Math.min(0.3 + (score * 0.7), 1);
  };

  return (
    <div className="w-full">
      <div className="space-y-2">
        {sortedData.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-32 text-sm text-muted-foreground truncate">
              {item.feature_name}
            </div>
            <div className="flex-1 relative">
              <div className="h-8 rounded-md overflow-hidden bg-gray-200">
                <div
                  className={`h-full ${getSeverityColor(item.severity, item.drift_score)}`}
                  style={{
                    width: `${item.drift_score * 100}%`,
                    opacity: getOpacity(item.drift_score),
                  }}
                />
              </div>
            </div>
            <div className="w-20 text-right">
              <span className="text-sm font-medium">
                {(item.drift_score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-20">
              {item.severity === "high" && (
                <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                  High
                </span>
              )}
              {item.severity === "medium" && (
                <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">
                  Medium
                </span>
              )}
              {item.severity === "low" && (
                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                  Low
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {sortedData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No drift data available
        </div>
      )}
    </div>
  );
}

