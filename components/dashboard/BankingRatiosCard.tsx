"use client";

import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { MetricTooltip } from "@/components/dashboard/MetricTooltip";
import { BankingRatioDetailModal, type BankingRatio } from "@/components/dashboard/BankingRatioDetailModal";
import {
  analyzeRatioTrend,
  getNIMRecommendations,
  getROERecommendations,
  getROARecommendations,
  getCARRecommendations,
  getNPLRecommendations,
  getCIRRecommendations,
  getLDRRecommendations,
  getRelatedMetrics,
} from "@/lib/utils/bankingRatioAnalysis";
import type { BankingRatios } from "@/types/dashboard";

interface BankingRatiosCardProps {
  ratios: BankingRatios;
  className?: string;
}

function BankingRatiosCardComponent({ ratios, className }: BankingRatiosCardProps) {
  const [selectedRatio, setSelectedRatio] = useState<BankingRatio | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getRatioColor = (value: number | undefined, thresholds: { excellent: number; good: number; fair: number }) => {
    if (value === undefined) return "text-muted-foreground";
    if (value >= thresholds.excellent) return "text-green-600";
    if (value >= thresholds.good) return "text-blue-600";
    if (value >= thresholds.fair) return "text-amber-600";
    return "text-red-600";
  };

  const handleRatioClick = (ratioData: BankingRatio) => {
    setSelectedRatio(ratioData);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRatio(null);
  };

  const createRatioData = (abbreviation: string, currentValue: number): BankingRatio => {
    const baseTrend = analyzeRatioTrend(currentValue / 100, [currentValue / 100, currentValue / 100]);
    const ratioConfigs: Record<string, Partial<BankingRatio>> = {
      NIM: {
        name: "Net Interest Margin",
        description: "Measures the difference between interest income and interest expenses relative to earning assets. A higher NIM indicates better profitability.",
        formula: "NIM = (Interest Income - Interest Expenses) / Average Earning Assets",
        target: 3.5,
        industryAverage: 3.2,
        recommendations: getNIMRecommendations(currentValue / 100),
      },
      ROE: {
        name: "Return on Equity",
        description: "Measures profitability relative to shareholders' equity. Indicates how effectively the bank uses equity to generate profits.",
        formula: "ROE = Net Income / Shareholders' Equity",
        target: 13.0,
        industryAverage: 12.5,
        recommendations: getROERecommendations(currentValue / 100),
      },
      ROA: {
        name: "Return on Assets",
        description: "Measures profitability relative to total assets. Shows how efficiently the bank uses its assets to generate profits.",
        formula: "ROA = Net Income / Total Assets",
        target: 1.3,
        industryAverage: 1.2,
        recommendations: getROARecommendations(currentValue / 100),
      },
      CAR: {
        name: "Capital Adequacy Ratio",
        description: "Measures the bank's capital relative to risk-weighted assets. Required by regulators to ensure financial stability.",
        formula: "CAR = Total Capital / Risk-Weighted Assets",
        target: 14.0,
        industryAverage: 15.0,
        recommendations: getCARRecommendations(currentValue / 100),
      },
      NPL: {
        name: "Non-Performing Loans Ratio",
        description: "Measures the percentage of loans that are in default or close to default. Lower is better, indicating better asset quality.",
        formula: "NPL = Non-Performing Loans / Total Loans",
        target: 3.0,
        industryAverage: 4.0,
        recommendations: getNPLRecommendations(currentValue / 100),
      },
      CIR: {
        name: "Cost-to-Income Ratio",
        description: "Measures operating expenses relative to operating income. Lower is better, indicating greater operational efficiency.",
        formula: "CIR = Operating Expenses / Operating Income",
        target: 55.0,
        industryAverage: 58.0,
        recommendations: getCIRRecommendations(currentValue / 100),
      },
      LDR: {
        name: "Loan-to-Deposit Ratio",
        description: "Measures loans relative to deposits. Indicates liquidity position and lending capacity.",
        formula: "LDR = Total Loans / Total Deposits",
        target: 80.0,
        industryAverage: 78.0,
        recommendations: getLDRRecommendations(currentValue / 100),
      },
    };
    const config = ratioConfigs[abbreviation] || {};
    return {
      abbreviation,
      name: config.name || abbreviation,
      currentValue,
      unit: "percentage",
      description: config.description || "",
      formula: config.formula || "",
      target: config.target,
      industryAverage: config.industryAverage,
      trend: baseTrend.trend,
      trendPercentage: baseTrend.trendPercentage,
      recommendations: config.recommendations || [],
      relatedMetrics: getRelatedMetrics(abbreviation),
    };
  };

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className || ""}`}>
      {/* NIM - Net Interest Margin */}
      {ratios.nim !== undefined && (
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => ratios.nim !== undefined && handleRatioClick(createRatioData("NIM", ratios.nim * 100))}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Net Interest Margin (NIM)
              <MetricTooltip metricName="NIM" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <GaugeChart
                value={ratios.nim * 100}
                max={10}
                min={0}
                label="NIM"
              />
              <p className={`text-xs text-center ${getRatioColor(ratios.nim, { excellent: 0.04, good: 0.03, fair: 0.02 })}`}>
                Industry benchmark: 3-4%
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ROE - Return on Equity */}
      {ratios.roe !== undefined && (
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => ratios.roe !== undefined && handleRatioClick(createRatioData("ROE", ratios.roe * 100))}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Return on Equity (ROE)
              <MetricTooltip metricName="ROE" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <GaugeChart
                value={ratios.roe * 100}
                max={30}
                min={0}
                label="ROE"
              />
              <p className={`text-xs text-center ${getRatioColor(ratios.roe, { excellent: 0.15, good: 0.12, fair: 0.10 })}`}>
                Target: 12-15%
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ROA - Return on Assets */}
      {ratios.roa !== undefined && (
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => ratios.roa !== undefined && handleRatioClick(createRatioData("ROA", ratios.roa * 100))}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Return on Assets (ROA)
              <MetricTooltip metricName="ROA" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <GaugeChart
                value={ratios.roa * 100}
                max={3}
                min={0}
                label="ROA"
              />
              <p className={`text-xs text-center ${getRatioColor(ratios.roa, { excellent: 0.015, good: 0.012, fair: 0.010 })}`}>
                Target: 1.2-1.5%
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CAR - Capital Adequacy Ratio */}
      {ratios.car !== undefined && (
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => ratios.car !== undefined && handleRatioClick(createRatioData("CAR", ratios.car * 100))}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Capital Adequacy Ratio (CAR)
              <MetricTooltip metricName="CAR" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <GaugeChart
                value={ratios.car * 100}
                max={20}
                min={0}
                label="CAR"
              />
              <p className={`text-xs text-center ${getRatioColor(ratios.car, { excellent: 0.15, good: 0.12, fair: 0.10 })}`}>
                Regulatory minimum: 12%
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NPL - Non-Performing Loans */}
      {ratios.npl !== undefined && (
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => ratios.npl !== undefined && handleRatioClick(createRatioData("NPL", ratios.npl * 100))}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Non-Performing Loans (NPL)
              <MetricTooltip metricName="NPL" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <GaugeChart
                value={ratios.npl * 100}
                max={10}
                min={0}
                label="NPL"
              />
              <p className={`text-xs text-center ${getRatioColor(ratios.npl, { excellent: 0.03, good: 0.05, fair: 0.08 })}`}>
                Lower is better (Target: &lt;3%)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CIR - Cost-to-Income Ratio */}
      {ratios.cir !== undefined && (
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => ratios.cir !== undefined && handleRatioClick(createRatioData("CIR", ratios.cir * 100))}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Cost-to-Income Ratio (CIR)
              <MetricTooltip metricName="CIR" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <GaugeChart
                value={ratios.cir * 100}
                max={100}
                min={0}
                label="CIR"
              />
              <p className={`text-xs text-center ${getRatioColor(ratios.cir, { excellent: 0.50, good: 0.60, fair: 0.70 })}`}>
                Lower is better (Target: &lt;60%)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LDR - Loan-to-Deposit Ratio */}
      {ratios.ldr !== undefined && (
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => ratios.ldr !== undefined && handleRatioClick(createRatioData("LDR", ratios.ldr * 100))}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Loan-to-Deposit Ratio (LDR)
              <MetricTooltip metricName="LDR" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <GaugeChart
                value={ratios.ldr * 100}
                max={100}
                min={0}
                label="LDR"
              />
              <p className={`text-xs text-center ${getRatioColor(ratios.ldr, { excellent: 0.80, good: 0.85, fair: 0.90 })}`}>
                Optimal range: 75-85%
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Detail Modal */}
      <BankingRatioDetailModal
        isOpen={isModalOpen}
        onClose={closeModal}
        ratio={selectedRatio}
      />
    </div>
  );
}

export const BankingRatiosCard = memo(BankingRatiosCardComponent);

