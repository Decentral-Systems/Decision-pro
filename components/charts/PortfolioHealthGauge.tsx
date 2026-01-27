"use client";

import { useState } from "react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { formatNumber } from "@/lib/utils/format";
import { PortfolioHealthDetailModal } from "@/components/dashboard/PortfolioHealthDetailModal";
import { ChevronRight } from "lucide-react";

interface PortfolioHealthGaugeProps {
  overallScore: number;
  components: {
    credit_quality: number;
    diversification: number;
    liquidity: number;
    profitability: number;
  };
  height?: number;
  historicalData?: any; // Historical data for drill-down
}

export function PortfolioHealthGauge({
  overallScore,
  components,
  height = 400,
  historicalData,
}: PortfolioHealthGaugeProps) {
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Prepare data for multi-level gauge
  const data = [
    {
      name: "Credit Quality",
      value: components.credit_quality,
      fill: "#10b981", // green
    },
    {
      name: "Diversification",
      value: components.diversification,
      fill: "#3b82f6", // blue
    },
    {
      name: "Liquidity",
      value: components.liquidity,
      fill: "#8b5cf6", // purple
    },
    {
      name: "Profitability",
      value: components.profitability,
      fill: "#f59e0b", // amber
    },
  ];

  const getOverallStatus = (score: number) => {
    if (score >= 80) return { color: "#10b981", label: "Excellent" };
    if (score >= 65) return { color: "#3b82f6", label: "Good" };
    if (score >= 50) return { color: "#f59e0b", label: "Fair" };
    return { color: "#ef4444", label: "Poor" };
  };

  const overallStatus = getOverallStatus(overallScore);

  return (
    <div className="relative w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="80%"
          barSize={15}
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
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconSize={12}
            formatter={(value) => (
              <span style={{ fontSize: "12px", color: "#666" }}>{value}</span>
            )}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      
      {/* Center display for overall score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-5xl font-bold" style={{ color: overallStatus.color }}>
          {formatNumber(overallScore, 1)}
        </div>
        <div className="text-sm font-semibold mt-2" style={{ color: overallStatus.color }}>
          {overallStatus.label}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Portfolio Health Score
        </div>
      </div>

      {/* Component breakdown with drill-down */}
      <div className="absolute bottom-0 left-0 right-0 grid grid-cols-4 gap-2 p-4">
        {data.map((item, index) => (
          <button
            key={index}
            className="text-center hover:bg-muted/50 rounded-lg p-2 transition-colors cursor-pointer group"
            onClick={() => {
              const componentKey = item.name.toLowerCase().replace(/\s+/g, '_');
              setSelectedComponent({
                name: item.name,
                value: item.value,
                target: 100,
                historical: historicalData?.[componentKey] || [],
                description: getComponentDescription(item.name),
                recommendations: getComponentRecommendations(item.name, item.value),
              });
              setModalOpen(true);
            }}
          >
            <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              {item.name}
              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-lg font-semibold" style={{ color: item.fill }}>
              {formatNumber(item.value, 1)}
            </div>
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      <PortfolioHealthDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        component={selectedComponent}
      />
    </div>
  );
}

// Helper functions for component details
function getComponentDescription(componentName: string): string {
  const descriptions: Record<string, string> = {
    "Credit Quality": "Measures the overall creditworthiness of the loan portfolio, including default rates, delinquency rates, and credit score distributions.",
    "Diversification": "Assesses the spread of risk across different sectors, loan types, and customer segments to minimize concentration risk.",
    "Liquidity": "Evaluates the portfolio's ability to meet short-term obligations and maintain sufficient liquid assets.",
    "Profitability": "Analyzes the portfolio's return on assets, net interest margin, and overall profitability metrics.",
  };
  return descriptions[componentName] || "Portfolio health component metric.";
}

function getComponentRecommendations(componentName: string, value: number): string[] {
  const recommendations: Record<string, string[]> = {
    "Credit Quality": value < 80 ? [
      "Review and tighten credit approval criteria",
      "Increase monitoring of high-risk loans",
      "Consider restructuring underperforming loans",
      "Implement early warning systems for potential defaults",
    ] : [
      "Maintain current credit standards",
      "Continue regular portfolio reviews",
      "Monitor for emerging risks",
    ],
    "Diversification": value < 80 ? [
      "Expand into underrepresented sectors",
      "Reduce concentration in top exposures",
      "Develop new customer segments",
      "Consider geographic diversification",
    ] : [
      "Maintain balanced portfolio composition",
      "Monitor concentration limits",
      "Continue diversification strategy",
    ],
    "Liquidity": value < 80 ? [
      "Increase liquid asset reserves",
      "Review loan-to-deposit ratio",
      "Optimize cash flow management",
      "Consider reducing long-term commitments",
    ] : [
      "Maintain adequate liquidity buffers",
      "Continue monitoring liquidity ratios",
      "Optimize asset-liability management",
    ],
    "Profitability": value < 80 ? [
      "Review pricing strategies",
      "Reduce operational costs",
      "Focus on high-margin products",
      "Improve collection efficiency",
    ] : [
      "Maintain profitability focus",
      "Continue cost optimization",
      "Explore growth opportunities",
    ],
  };
  return recommendations[componentName] || ["Continue monitoring this metric"];
}

