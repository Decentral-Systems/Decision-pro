/**
 * Banking Ratio Analysis Utilities
 * Functions for analyzing banking ratios and generating recommendations
 */

export interface RatioAnalysisResult {
  trend: "improving" | "declining" | "stable";
  trendPercentage: number;
  recommendations: string[];
  status: "excellent" | "good" | "fair" | "poor";
}

/**
 * Analyze ratio trend based on historical data
 */
export function analyzeRatioTrend(
  currentValue: number,
  historicalValues: number[]
): { trend: "improving" | "declining" | "stable"; trendPercentage: number } {
  if (historicalValues.length === 0) {
    return { trend: "stable", trendPercentage: 0 };
  }

  const previousValue = historicalValues[historicalValues.length - 1];
  const change = currentValue - previousValue;
  const changePercentage = previousValue !== 0 ? (change / previousValue) * 100 : 0;

  // Threshold for determining trend (5% change)
  const threshold = 5;

  if (changePercentage > threshold) {
    return { trend: "improving", trendPercentage: changePercentage };
  } else if (changePercentage < -threshold) {
    return { trend: "declining", trendPercentage: Math.abs(changePercentage) };
  } else {
    return { trend: "stable", trendPercentage: Math.abs(changePercentage) };
  }
}

/**
 * Get recommendations for NIM (Net Interest Margin)
 */
export function getNIMRecommendations(currentValue: number, target: number = 0.035): string[] {
  const recommendations: string[] = [];

  if (currentValue < target * 0.9) {
    recommendations.push("Review interest rate strategies to improve net interest margin");
    recommendations.push("Consider optimizing deposit pricing and loan pricing structures");
    recommendations.push("Analyze interest-earning asset composition for better yield");
  } else if (currentValue > target * 1.2) {
    recommendations.push("Monitor for potential interest rate risk exposure");
    recommendations.push("Ensure pricing remains competitive in the market");
  }

  return recommendations;
}

/**
 * Get recommendations for ROE (Return on Equity)
 */
export function getROERecommendations(currentValue: number, target: number = 0.13): string[] {
  const recommendations: string[] = [];

  if (currentValue < target * 0.9) {
    recommendations.push("Focus on improving profitability through revenue growth");
    recommendations.push("Consider optimizing capital structure and leverage");
    recommendations.push("Review operational efficiency and cost management");
  } else if (currentValue > target * 1.2) {
    recommendations.push("Excellent ROE - maintain current performance levels");
    recommendations.push("Consider reinvesting profits for sustainable growth");
  }

  return recommendations;
}

/**
 * Get recommendations for ROA (Return on Assets)
 */
export function getROARecommendations(currentValue: number, target: number = 0.012): string[] {
  const recommendations: string[] = [];

  if (currentValue < target * 0.9) {
    recommendations.push("Improve asset utilization and efficiency");
    recommendations.push("Review asset quality and non-performing assets");
    recommendations.push("Optimize asset allocation and investment strategies");
  }

  return recommendations;
}

/**
 * Get recommendations for CAR (Capital Adequacy Ratio)
 */
export function getCARRecommendations(currentValue: number, target: number = 0.14): string[] {
  const recommendations: string[] = [];

  if (currentValue < target) {
    recommendations.push("Consider raising additional capital to meet regulatory requirements");
    recommendations.push("Review risk-weighted assets and optimize capital allocation");
    recommendations.push("Monitor capital ratios closely for compliance");
  } else if (currentValue > target * 1.5) {
    recommendations.push("Excess capital - consider strategic deployment or shareholder returns");
    recommendations.push("Maintain adequate buffer above regulatory minimum");
  }

  return recommendations;
}

/**
 * Get recommendations for NPL (Non-Performing Loans)
 */
export function getNPLRecommendations(currentValue: number, target: number = 0.03): string[] {
  const recommendations: string[] = [];

  if (currentValue > target) {
    recommendations.push("Strengthen credit risk assessment and underwriting processes");
    recommendations.push("Implement proactive loan monitoring and early warning systems");
    recommendations.push("Develop strategies for non-performing loan recovery");
    recommendations.push("Review portfolio composition and risk concentrations");
  } else if (currentValue < target * 0.5) {
    recommendations.push("Excellent asset quality - maintain current risk management practices");
    recommendations.push("Continue monitoring credit portfolio for early signs of stress");
  }

  return recommendations;
}

/**
 * Get recommendations for CIR (Cost-to-Income Ratio)
 */
export function getCIRRecommendations(currentValue: number, target: number = 0.55): string[] {
  const recommendations: string[] = [];

  if (currentValue > target) {
    recommendations.push("Focus on operational efficiency and cost optimization");
    recommendations.push("Review automation opportunities to reduce operational costs");
    recommendations.push("Analyze revenue streams to improve income generation");
    recommendations.push("Consider digital transformation initiatives");
  } else if (currentValue < target * 0.8) {
    recommendations.push("Excellent efficiency - maintain cost discipline");
    recommendations.push("Invest in growth opportunities while maintaining efficiency");
  }

  return recommendations;
}

/**
 * Get recommendations for LDR (Loan-to-Deposit Ratio)
 */
export function getLDRRecommendations(currentValue: number, target: number = 0.80): string[] {
  const recommendations: string[] = [];

  if (currentValue > target * 1.1) {
    recommendations.push("Consider increasing deposit base to improve liquidity");
    recommendations.push("Monitor liquidity risk and maintain adequate buffers");
    recommendations.push("Review loan growth strategy and portfolio composition");
  } else if (currentValue < target * 0.7) {
    recommendations.push("Opportunity to increase loan deployment");
    recommendations.push("Review lending strategies to optimize asset utilization");
    recommendations.push("Ensure competitive loan pricing to attract borrowers");
  }

  return recommendations;
}

/**
 * Get status based on value and thresholds
 */
export function getRatioStatus(
  value: number,
  thresholds: { excellent: number; good: number; fair: number }
): "excellent" | "good" | "fair" | "poor" {
  if (value >= thresholds.excellent) return "excellent";
  if (value >= thresholds.good) return "good";
  if (value >= thresholds.fair) return "fair";
  return "poor";
}

/**
 * Get related metrics for a ratio
 */
export function getRelatedMetrics(ratioAbbreviation: string): string[] {
  const relatedMetricsMap: Record<string, string[]> = {
    NIM: ["Interest Income", "Interest Expenses", "Average Earning Assets"],
    ROE: ["Net Income", "Shareholders' Equity", "ROA"],
    ROA: ["Net Income", "Total Assets", "Asset Turnover"],
    CAR: ["Total Capital", "Risk-Weighted Assets", "Tier 1 Capital"],
    NPL: ["Total Loans", "Loan Loss Provisions", "Write-offs"],
    CIR: ["Operating Expenses", "Operating Income", "Efficiency Ratio"],
    LDR: ["Total Loans", "Total Deposits", "Liquidity Ratio"],
  };

  return relatedMetricsMap[ratioAbbreviation] || [];
}



