"use client";

import { GaugeChart } from "./GaugeChart";

interface RiskGaugeChartProps {
  riskScore: number;
  riskLevel?: string;
  height?: number;
}

export function RiskGaugeChart({
  riskScore,
  riskLevel,
  height = 300,
}: RiskGaugeChartProps) {
  // Convert risk score (0-1) to percentage (0-100)
  const percentage = riskScore * 100;
  
  // Determine color based on risk level or score
  const getColor = () => {
    if (riskLevel) {
      const level = riskLevel.toLowerCase();
      if (level === "low") return "#10b981"; // green
      if (level === "medium") return "#f59e0b"; // amber
      if (level === "high") return "#f97316"; // orange
      if (level === "very_high" || level === "very high") return "#ef4444"; // red
    }
    
    // Default color based on score
    if (riskScore < 0.3) return "#10b981";
    if (riskScore < 0.5) return "#3b82f6";
    if (riskScore < 0.7) return "#f59e0b";
    return "#ef4444";
  };

  const colors = {
    excellent: "#10b981",
    good: "#3b82f6",
    fair: "#f59e0b",
    poor: "#ef4444",
  };

  return (
    <div style={{ height }}>
      <GaugeChart
        value={percentage}
        max={100}
        min={0}
        label={riskLevel ? `Risk: ${riskLevel}` : "Risk Score"}
        colors={colors}
      />
      <div className="text-center mt-4">
        <div className="text-2xl font-bold" style={{ color: getColor() }}>
          {(riskScore * 100).toFixed(1)}%
        </div>
        {riskLevel && (
          <div className="text-sm text-muted-foreground capitalize">
            {riskLevel.replace(/_/g, " ")}
          </div>
        )}
      </div>
    </div>
  );
}



