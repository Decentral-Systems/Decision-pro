"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DefaultPredictionResponse } from "@/types/prediction";
import { MetricTrend } from "@/components/charts/MetricTrend";
import { AlertTriangle, TrendingDown, CheckCircle2, Download, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF, exportToCSV, exportToExcel } from "@/lib/utils/exportHelpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PredictionResultsProps {
  result: DefaultPredictionResponse;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "low":
      return "default";
    case "medium":
      return "secondary";
    case "high":
      return "destructive";
    case "very_high":
      return "destructive";
    default:
      return "outline";
  }
};

export function PredictionResults({ result }: PredictionResultsProps) {
  const { toast } = useToast();
  const defaultProbability = result.default_probability * 100;
  const survivalData = result.survival_analysis.map((s) => ({
    name: `${s.time_period}m`,
    value: s.survival_probability * 100,
  }));

  const handleExportPDF = async () => {
    try {
      const htmlContent = generatePredictionPDF(result);
      await exportToPDF(htmlContent, `default-prediction-${result.customer_id || 'result'}`, {
        includeSignature: true,
        version: "1.0.0",
        recordCount: 1,
      });
      toast({
        title: "Success",
        description: "PDF export started!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const exportData = [
        {
          "Customer ID": result.customer_id || "N/A",
          "Default Probability": `${(result.default_probability * 100).toFixed(2)}%`,
          "Risk Category": result.risk_category,
          "Survival Probability": `${((1 - result.default_probability) * 100).toFixed(2)}%`,
          "Expected Default Time": result.expected_default_time ? `${result.expected_default_time} months` : "N/A",
          "Confidence Lower": `${(result.confidence_interval.lower * 100).toFixed(1)}%`,
          "Confidence Upper": `${(result.confidence_interval.upper * 100).toFixed(1)}%`,
          "Generated At": new Date().toISOString(),
        },
      ];
      await exportToExcel(exportData, `default-prediction-${result.customer_id || 'result'}`, undefined, {
        includeSignature: true,
        version: "1.0.0",
      });
      toast({
        title: "Success",
        description: "Excel export completed!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export Excel",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      const exportData = [
        {
          customer_id: result.customer_id || "N/A",
          default_probability: (result.default_probability * 100).toFixed(2),
          risk_category: result.risk_category,
          survival_probability: ((1 - result.default_probability) * 100).toFixed(2),
          expected_default_time: result.expected_default_time || "N/A",
          confidence_lower: (result.confidence_interval.lower * 100).toFixed(1),
          confidence_upper: (result.confidence_interval.upper * 100).toFixed(1),
          generated_at: new Date().toISOString(),
        },
      ];
      await exportToCSV(exportData, `default-prediction-${result.customer_id || 'result'}`, undefined, {
        includeSignature: true,
        version: "1.0.0",
      });
      toast({
        title: "Success",
        description: "CSV export completed!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export CSV",
        variant: "destructive",
      });
    }
  };

  const generatePredictionPDF = (data: DefaultPredictionResponse): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Default Prediction Report - ${data.customer_id || 'Result'}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    .header { border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #0ea5e9; margin: 0; font-size: 28px; }
    .header .meta { color: #666; font-size: 12px; margin-top: 10px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
    .metric-card { background: #f5f5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; text-align: center; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px; }
    .metric-value { font-size: 32px; font-weight: bold; color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #0ea5e9; color: white; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Default Prediction Report</h1>
    <div class="meta">
      <div>Customer ID: ${data.customer_id || "N/A"}</div>
      <div>Generated: ${new Date().toLocaleString()}</div>
    </div>
  </div>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-label">Default Probability</div>
      <div class="metric-value">${(data.default_probability * 100).toFixed(2)}%</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Risk Category</div>
      <div class="metric-value">${data.risk_category.toUpperCase()}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Survival Probability</div>
      <div class="metric-value">${((1 - data.default_probability) * 100).toFixed(2)}%</div>
    </div>
  </div>

  <h2>Survival Analysis Details</h2>
  <table>
    <thead>
      <tr>
        <th>Month</th>
        <th>Survival Probability</th>
        <th>Hazard Rate</th>
        <th>Cumulative Default Prob.</th>
      </tr>
    </thead>
    <tbody>
      ${data.survival_analysis.map((s) => `
        <tr>
          <td>${s.time_period}</td>
          <td>${(s.survival_probability * 100).toFixed(2)}%</td>
          <td>${(s.hazard_rate * 100).toFixed(4)}%</td>
          <td>${(s.cumulative_default_probability * 100).toFixed(2)}%</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  ${data.key_factors && data.key_factors.length > 0 ? `
  <h2>Key Risk Factors</h2>
  <table>
    <thead>
      <tr>
        <th>Factor</th>
        <th>Impact</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      ${data.key_factors.map((f) => `
        <tr>
          <td>${f.factor}</td>
          <td>${f.impact > 0 ? "+" : ""}${f.impact.toFixed(2)}</td>
          <td>${f.description}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  ` : ""}

  <div class="footer">
    <p>This report was generated by Akafay Intelligent Services (AIS) Platform</p>
  </div>
</body>
</html>
    `;
  };

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileText className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Main Prediction Results */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Default Probability</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{defaultProbability.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Confidence: {result.confidence_interval.lower.toFixed(1)}% -{" "}
              {result.confidence_interval.upper.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Category</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={getRiskColor(result.risk_category) as any} className="text-lg px-3 py-1">
              {result.risk_category.toUpperCase()}
            </Badge>
            {result.expected_default_time && (
              <p className="text-xs text-muted-foreground mt-2">
                Expected default: {result.expected_default_time} months
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Survival Probability</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {((1 - result.default_probability) * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Probability of no default</p>
          </CardContent>
        </Card>
      </div>

      {/* Survival Analysis Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Survival Analysis</CardTitle>
          <CardDescription>
            Probability of remaining default-free over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MetricTrend data={survivalData} color="#0ea5e9" />
        </CardContent>
      </Card>

      {/* Key Factors */}
      {result.key_factors && result.key_factors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Risk Factors</CardTitle>
            <CardDescription>
              Factors contributing to default risk assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.key_factors.map((factor, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{factor.factor}</span>
                    <Badge variant={factor.impact > 0 ? "destructive" : "default"}>
                      Impact: {factor.impact > 0 ? "+" : ""}
                      {factor.impact.toFixed(2)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{factor.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Survival Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Survival Analysis Details</CardTitle>
          <CardDescription>
            Month-by-month survival and hazard rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Month</th>
                  <th className="text-right p-2">Survival Probability</th>
                  <th className="text-right p-2">Hazard Rate</th>
                  <th className="text-right p-2">Cumulative Default Prob.</th>
                </tr>
              </thead>
              <tbody>
                {result.survival_analysis.map((s, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{s.time_period}</td>
                    <td className="text-right p-2">
                      {(s.survival_probability * 100).toFixed(2)}%
                    </td>
                    <td className="text-right p-2">{(s.hazard_rate * 100).toFixed(4)}%</td>
                    <td className="text-right p-2">
                      {(s.cumulative_default_probability * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

