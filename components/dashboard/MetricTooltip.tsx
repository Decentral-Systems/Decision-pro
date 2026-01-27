"use client";
import React, { memo } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, HelpCircle } from "lucide-react";

interface MetricTooltipProps {
  metricName: string;
  description?: string;
  formula?: string;
  target?: string;
  interpretation?: string;
  children?: React.ReactNode;
  icon?: "info" | "help";
}

const METRIC_DEFINITIONS: Record<string, {
  description: string;
  formula?: string;
  target?: string;
  interpretation?: string;
}> = {
  // Banking Ratios
  "NIM": {
    description: "Net Interest Margin - Measures the difference between interest income generated and interest paid out relative to interest-earning assets",
    formula: "(Interest Income - Interest Expense) / Average Earning Assets",
    target: ">3.5%",
    interpretation: "Higher NIM indicates better profitability from lending activities. Ethiopian banks typically target 3.5-5%.",
  },
  "ROE": {
    description: "Return on Equity - Measures profitability relative to shareholder equity",
    formula: "Net Income / Average Shareholders' Equity",
    target: ">20%",
    interpretation: "Higher ROE indicates efficient use of shareholder capital. Above 20% is considered excellent for Ethiopian banks.",
  },
  "ROA": {
    description: "Return on Assets - Measures efficiency of asset utilization",
    formula: "Net Income / Average Total Assets",
    target: ">2%",
    interpretation: "Higher ROA indicates better asset management. Ethiopian banks typically target 2-3%.",
  },
  "CAR": {
    description: "Capital Adequacy Ratio - Regulatory requirement for capital reserves to absorb potential losses",
    formula: "(Tier 1 Capital + Tier 2 Capital) / Risk-Weighted Assets",
    target: ">8% (NBE minimum)",
    interpretation: "NBE requires minimum 8%. Higher CAR provides better cushion against losses and indicates financial stability.",
  },
  "NPL": {
    description: "Non-Performing Loans - Loans in default or near default (90+ days past due)",
    formula: "Non-Performing Loans / Total Loans",
    target: "<3% (NBE guideline)",
    interpretation: "Lower NPL ratio indicates better credit quality. NBE guidelines suggest keeping below 3%.",
  },
  "CIR": {
    description: "Cost-to-Income Ratio - Operational efficiency indicator",
    formula: "Operating Expenses / Operating Income",
    target: "<60%",
    interpretation: "Lower CIR indicates better operational efficiency. Below 60% is considered efficient for Ethiopian banks.",
  },
  "LDR": {
    description: "Loan-to-Deposit Ratio - Liquidity risk indicator",
    formula: "Total Loans / Total Deposits",
    target: "70-85%",
    interpretation: "Optimal range is 70-85%. Too low indicates underutilization, too high indicates liquidity risk.",
  },
  
  // Banking KPIs
  "Total Assets": {
    description: "Total value of all assets owned by the bank",
    interpretation: "Indicates the size and scale of banking operations.",
  },
  "Total Deposits": {
    description: "Total customer deposits held by the bank",
    interpretation: "Primary source of funding for lending activities. Growth indicates customer confidence.",
  },
  "Total Loans": {
    description: "Total outstanding loans to customers",
    interpretation: "Core revenue-generating asset. Growth indicates business expansion.",
  },
  "Net Income": {
    description: "Profit after all expenses and taxes",
    interpretation: "Bottom-line profitability measure. Key indicator of financial performance.",
  },
  
  // Portfolio Metrics
  "Credit Quality": {
    description: "Overall creditworthiness of the loan portfolio",
    interpretation: "Considers default rates, delinquency rates, and credit score distributions.",
  },
  "Diversification": {
    description: "Spread of risk across different sectors, loan types, and customer segments",
    interpretation: "Higher diversification reduces concentration risk and portfolio volatility.",
  },
  "Liquidity": {
    description: "Ability to meet short-term obligations and maintain sufficient liquid assets",
    interpretation: "Critical for operational stability and regulatory compliance.",
  },
  "Profitability": {
    description: "Portfolio's return on assets, net interest margin, and overall profitability metrics",
    interpretation: "Measures financial performance and sustainability of lending operations.",
  },
};

function MetricTooltipComponent({
  metricName,
  description,
  formula,
  target,
  interpretation,
  children,
  icon = "info",
}: MetricTooltipProps) {
  // Get predefined metric definition if available
  const metricDef = METRIC_DEFINITIONS[metricName] || {};
  const finalDescription = description || metricDef.description || "No description available";
  const finalFormula = formula || metricDef.formula;
  const finalTarget = target || metricDef.target;
  const finalInterpretation = interpretation || metricDef.interpretation;

  const IconComponent = icon === "help" ? HelpCircle : Info;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {children || (
            <button className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <IconComponent className="h-4 w-4" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm p-4">
          <div className="space-y-2">
            <div>
              <h4 className="font-semibold text-sm mb-1">{metricName}</h4>
              <p className="text-xs text-muted-foreground">{finalDescription}</p>
            </div>
            
            {finalFormula && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium mb-1">Formula:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block">
                  {finalFormula}
                </code>
              </div>
            )}
            
            {finalTarget && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium mb-1">Target:</p>
                <p className="text-xs text-muted-foreground">{finalTarget}</p>
              </div>
            )}
            
            {finalInterpretation && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium mb-1">Interpretation:</p>
                <p className="text-xs text-muted-foreground">{finalInterpretation}</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const MetricTooltip = memo(MetricTooltipComponent);

