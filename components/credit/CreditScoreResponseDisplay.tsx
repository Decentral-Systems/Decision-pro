"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CreditScoreResponse,
  ModelPrediction,
} from "@/types/credit";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  FileText,
  BarChart3,
  Target,
  Info,
  Download,
  Copy,
  Sparkles,
  Zap,
  Award,
  Clock,
  Globe,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF, exportToCSV, exportToExcel } from "@/lib/utils/exportHelpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SHAPVisualization } from "./SHAPVisualization";
import { AuditTrailDisplay } from "./AuditTrailDisplay";
import { HistoricalScoreTrend } from "./HistoricalScoreTrend";
import { LoanTermsDisplay } from "./LoanTermsDisplay";
import { FeatureComparison } from "./FeatureComparison";
import { ModelEnsembleVisualization } from "./ModelEnsembleVisualization";
import { ProductRecommendations } from "./ProductRecommendations";
import { SHAPVisualizationWithAPI } from "./SHAPVisualizationWithAPI";

interface CreditScoreResponseDisplayProps {
  response: CreditScoreResponse;
  formData?: {
    loan_amount?: number;
    monthly_income?: number;
    loan_term_months?: number;
  };
}

export function CreditScoreResponseDisplay({
  response,
  formData,
}: CreditScoreResponseDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "low":
        return { bg: "bg-green-500", text: "text-green-700", border: "border-green-300", light: "bg-green-50" };
      case "medium":
        return { bg: "bg-yellow-500", text: "text-yellow-700", border: "border-yellow-300", light: "bg-yellow-50" };
      case "high":
        return { bg: "bg-orange-500", text: "text-orange-700", border: "border-orange-300", light: "bg-orange-50" };
      case "very_high":
        return { bg: "bg-red-500", text: "text-red-700", border: "border-red-300", light: "bg-red-50" };
      default:
        return { bg: "bg-gray-500", text: "text-gray-700", border: "border-gray-300", light: "bg-gray-50" };
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation?.toLowerCase()) {
      case "approve":
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case "reject":
        return <XCircle className="h-6 w-6 text-red-500" />;
      case "review":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 750) return { text: "text-green-600", bg: "bg-green-100", ring: "ring-green-500" };
    if (score >= 650) return { text: "text-yellow-600", bg: "bg-yellow-100", ring: "ring-yellow-500" };
    if (score >= 550) return { text: "text-orange-600", bg: "bg-orange-100", ring: "ring-orange-500" };
    return { text: "text-red-600", bg: "bg-red-100", ring: "ring-red-500" };
  };

  const getScoreLabel = (score: number) => {
    if (score >= 750) return "Excellent";
    if (score >= 650) return "Good";
    if (score >= 550) return "Fair";
    return "Poor";
  };

  const scorePercentage = Math.max(0, Math.min(100, ((response.credit_score - 300) / (850 - 300)) * 100));
  const riskColors = getRiskColor(response.risk_category);
  const scoreColors = getScoreColor(response.credit_score);

  const handleCopyResponse = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      toast({
        title: "Success",
        description: "Response copied to clipboard!",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy response",
        variant: "destructive",
      });
    }
  };

  const handleDownloadResponse = () => {
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credit-score-${response.customer_id}-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Success",
      description: "Response downloaded!",
    });
  };

  const handleExportPDF = async () => {
    try {
      const htmlContent = generateCreditScorePDF(response);
      await exportToPDF(htmlContent, `credit-score-${response.customer_id}`, {
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
          "Customer ID": response.customer_id,
          "Credit Score": response.credit_score,
          "Risk Category": response.risk_category,
          "Recommendation": response.approval_recommendation,
          "Confidence": `${((response.confidence || 0) * 100).toFixed(1)}%`,
          "Ensemble Score": response.ensemble_score?.toFixed(0) || "N/A",
          "Models Used": response.model_predictions?.length || 0,
          "Compliance": response.compliance_check?.compliant ? "Compliant" : "Non-Compliant",
          "Generated At": new Date().toISOString(),
        },
      ];
      await exportToExcel(exportData, `credit-score-${response.customer_id}`, undefined, {
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
          customer_id: response.customer_id,
          credit_score: response.credit_score,
          risk_category: response.risk_category,
          recommendation: response.approval_recommendation,
          confidence: ((response.confidence || 0) * 100).toFixed(1),
          ensemble_score: response.ensemble_score?.toFixed(0) || "N/A",
          models_used: response.model_predictions?.length || 0,
          compliant: response.compliance_check?.compliant ? "Yes" : "No",
          generated_at: new Date().toISOString(),
        },
      ];
      await exportToCSV(exportData, `credit-score-${response.customer_id}`, undefined, {
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

  const generateCreditScorePDF = (data: CreditScoreResponse): string => {
    const modelPredictions = data.model_predictions?.map((m: ModelPrediction) => ({
      model: m.model_name,
      score: m.predicted_score?.toFixed(0) || "N/A",
      weight: `${((m.weight || 0) * 100).toFixed(1)}%`,
    })) || [];

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Credit Score Report - ${data.customer_id}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    .header { border-bottom: 3px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #4CAF50; margin: 0; font-size: 28px; }
    .header .meta { color: #666; font-size: 12px; margin-top: 10px; }
    .score-section { text-align: center; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; margin: 30px 0; }
    .score-value { font-size: 72px; font-weight: bold; margin: 20px 0; }
    .score-label { font-size: 24px; opacity: 0.9; }
    .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
    .metric-card { background: #f5f5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px; }
    .metric-value { font-size: 24px; font-weight: bold; color: #333; }
    .recommendation { background: ${data.approval_recommendation?.toLowerCase() === "approve" ? "#d4edda" : data.approval_recommendation?.toLowerCase() === "reject" ? "#f8d7da" : "#fff3cd"}; padding: 20px; border-radius: 8px; border-left: 4px solid ${data.approval_recommendation?.toLowerCase() === "approve" ? "#28a745" : data.approval_recommendation?.toLowerCase() === "reject" ? "#dc3545" : "#ffc107"}; margin: 20px 0; }
    .recommendation-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666; text-align: center; }
    @media print {
      body { padding: 10px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Credit Score Analysis Report</h1>
    <div class="meta">
      <div>Customer ID: ${data.customer_id}</div>
      <div>Generated: ${new Date().toLocaleString()}</div>
      ${data.correlation_id ? `<div>Correlation ID: ${data.correlation_id}</div>` : ""}
    </div>
  </div>

  <div class="score-section">
    <div class="score-label">Credit Score</div>
    <div class="score-value">${data.credit_score?.toFixed(0) || "N/A"}</div>
    <div class="score-label">${getScoreLabel(data.credit_score)}</div>
  </div>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-label">Risk Category</div>
      <div class="metric-value">${data.risk_category?.toUpperCase() || "N/A"}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Confidence</div>
      <div class="metric-value">${((data.confidence || 0) * 100).toFixed(1)}%</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Ensemble Score</div>
      <div class="metric-value">${data.ensemble_score?.toFixed(0) || "N/A"}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Models Used</div>
      <div class="metric-value">${data.model_predictions?.length || 0}</div>
    </div>
  </div>

  <div class="recommendation">
    <div class="recommendation-title">Recommendation: ${data.approval_recommendation?.toUpperCase() || "PENDING"}</div>
    ${data.compliance_check?.compliant ? 
      "<p style='color: #28a745; margin: 10px 0 0 0;'><strong>✓ Compliance Check: PASSED</strong></p>" :
      "<p style='color: #dc3545; margin: 10px 0 0 0;'><strong>✗ Compliance Check: FAILED</strong></p>"
    }
  </div>

  ${modelPredictions.length > 0 ? `
  <h2 style="margin-top: 40px; color: #333;">Model Predictions</h2>
  <table>
    <thead>
      <tr>
        <th>Model</th>
        <th>Predicted Score</th>
        <th>Weight</th>
      </tr>
    </thead>
    <tbody>
      ${modelPredictions.map((m: any) => `
        <tr>
          <td>${m.model}</td>
          <td>${m.score}</td>
          <td>${m.weight}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  ` : ""}

  <div class="footer">
    <p>This report was generated by Akafay Intelligent Services (AIS) Platform</p>
    <p>For questions or support, please contact your system administrator</p>
  </div>
</body>
</html>
    `;
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Credit Score Analysis</h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive AI-powered credit assessment results
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyResponse}>
            <Copy className="h-4 w-4 mr-2" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadResponse}>
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
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
      </div>

      {/* Main Score Card - Enhanced */}
      <Card className="border-2 shadow-lg overflow-hidden">
        <div className={`h-2 ${riskColors.bg}`} />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Credit Score Result
              </CardTitle>
              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Customer: <span className="font-semibold">{response.customer_id}</span>
                </span>
                {response.correlation_id && (
                  <span className="text-xs font-mono">
                    ID: {response.correlation_id.slice(0, 8)}...
                  </span>
                )}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={`${riskColors.bg} text-white border-0 px-4 py-2 text-sm font-semibold shadow-md`}
            >
              {response.risk_category?.toUpperCase() || "UNKNOWN"} RISK
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Score Display - Enhanced */}
            <div className="text-center space-y-6">
              <div className={`inline-flex items-center justify-center w-48 h-48 rounded-full ${scoreColors.bg} ${scoreColors.ring} ring-8 relative`}>
                <div className="text-center">
                  <div className={`text-7xl font-extrabold ${scoreColors.text}`}>
                    {response.credit_score?.toFixed(0) || "N/A"}
                  </div>
                  <div className={`text-lg font-semibold mt-2 ${scoreColors.text}`}>
                    {getScoreLabel(response.credit_score)}
                  </div>
                </div>
                <div className="absolute -top-2 -right-2">
                  <div className={`${riskColors.bg} text-white rounded-full p-2 shadow-lg`}>
                    <Award className="h-6 w-6" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 max-w-2xl mx-auto">
                <Progress 
                  value={scorePercentage} 
                  className="h-4 shadow-inner" 
                />
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">300 (Poor)</span>
                  <span className="text-muted-foreground">850 (Excellent)</span>
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* Key Metrics Grid - Enhanced */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className={`border-2 hover:shadow-md transition-shadow ${((response.confidence || 0) * 100) < 80 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : ''}`}>
                <CardContent className="pt-6">
                  <div className="space-y-2 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm">Confidence</span>
                      {((response.confidence || 0) * 100) < 80 && (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div className={`text-3xl font-bold ${((response.confidence || 0) * 100) < 80 ? 'text-yellow-600' : 'text-primary'}`}>
                      {((response.confidence || 0) * 100).toFixed(1)}%
                    </div>
                    {((response.confidence || 0) * 100) < 80 && (
                      <div className="text-xs text-yellow-600 font-semibold">
                        Low Confidence Warning
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <BarChart3 className="h-4 w-4" />
                      <span className="text-sm">Ensemble Score</span>
                    </div>
                    <div className="text-3xl font-bold">
                      {response.ensemble_score?.toFixed(0) || "N/A"}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm">Models Used</span>
                    </div>
                    <div className="text-3xl font-bold">
                      {response.model_predictions?.length || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-2 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">Compliance</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      {response.compliance_check?.compliant ? (
                        <>
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                          <span className="text-sm font-semibold text-green-600">Compliant</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-6 w-6 text-red-500" />
                          <span className="text-sm font-semibold text-red-600">Non-Compliant</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendation - Enhanced */}
            <Alert className={`border-2 ${riskColors.border} ${riskColors.light}`}>
              <div className="flex items-start gap-4">
                {getRecommendationIcon(response.approval_recommendation)}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <AlertDescription className="font-bold text-xl">
                      Recommendation: <span className={riskColors.text}>{response.approval_recommendation?.toUpperCase() || "PENDING"}</span>
                    </AlertDescription>
                    <Badge variant="outline" className="ml-2">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date().toLocaleTimeString()}
                    </Badge>
                  </div>
                  {response.compliance_check?.violations &&
                    response.compliance_check.violations.length > 0 && (
                      <div className="mt-4 space-y-2 pt-4 border-t">
                        <div className="text-sm font-semibold text-destructive flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Compliance Violations ({response.compliance_check.violations.length})
                        </div>
                        <div className="space-y-2">
                          {response.compliance_check.violations.map((violation, idx) => (
                            <div key={idx} className="text-sm bg-white/50 p-2 rounded border border-red-200">
                              <div className="font-semibold text-destructive">{violation.rule}</div>
                              <div className="text-muted-foreground mt-1">{violation.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs - Enhanced */}
      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="models" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Models
          </TabsTrigger>
          <TabsTrigger value="explanation" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Explanation
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="raw" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Raw Data
          </TabsTrigger>
        </TabsList>

        {/* Model Predictions - Enhanced */}
        <TabsContent value="models" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart3 className="h-6 w-6 text-primary" />
                Ensemble Model Predictions
              </CardTitle>
              <CardDescription>
                Individual model scores and their weighted contributions to the final ensemble
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {response.model_predictions && response.model_predictions.length > 0 ? (
                  response.model_predictions.map((model: ModelPrediction, idx: number) => {
                    const modelScorePercentage =
                      Math.max(0, Math.min(100, ((model.score - 300) / (850 - 300)) * 100));
                    const modelColors = getScoreColor(model.score);
                    
                    return (
                      <Card key={idx} className="border-2 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${modelColors.bg}`}>
                                  <Activity className={`h-5 w-5 ${modelColors.text}`} />
                                </div>
                                <div>
                                  <div className="font-bold text-lg">{model.model_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Model #{idx + 1} in ensemble
                                  </div>
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <div className="text-2xl font-bold">{model.score.toFixed(0)}</div>
                                <div className="text-sm text-muted-foreground">
                                  {(model.probability * 100).toFixed(1)}% confidence
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Score Range</span>
                                <Badge variant="outline" className="font-semibold">
                                  Weight: {(model.weight * 100).toFixed(1)}%
                                </Badge>
                              </div>
                              <Progress value={modelScorePercentage} className="h-3" />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>300</span>
                                <span>850</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No model predictions available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Explanation - Enhanced with SHAP */}
        <TabsContent value="explanation" className="space-y-4 mt-6">
          {/* Enhanced Confidence Warning */}
          {((response.confidence || 0) * 100) < 80 && (
            <Alert variant="destructive" className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <AlertDescription className="font-semibold text-yellow-900 dark:text-yellow-100">
                <div className="space-y-4">
                  <div>
                    <div className="text-lg">⚠️ Low Model Confidence Warning</div>
                    <div className="text-sm font-normal mt-1">
                      The model confidence is below 80% ({((response.confidence || 0) * 100).toFixed(1)}%). 
                      This indicates lower certainty in the credit score prediction.
                    </div>
                  </div>

                  {/* Confidence Trend Indicator */}
                  <div className="pt-2 border-t border-yellow-300 dark:border-yellow-800">
                    <div className="text-sm font-medium mb-2">Confidence Trend</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-yellow-200 dark:bg-yellow-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-600 transition-all duration-500"
                          style={{ width: `${(response.confidence || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">
                        {((response.confidence || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {((response.confidence || 0) * 100) < 60
                        ? "Very Low - High uncertainty"
                        : ((response.confidence || 0) * 100) < 70
                        ? "Low - Moderate uncertainty"
                        : "Moderate - Some uncertainty"}
                    </div>
                  </div>

                  {/* Actionable Recommendations */}
                  <div className="pt-2 border-t border-yellow-300 dark:border-yellow-800">
                    <div className="text-sm font-medium mb-2">Recommended Actions</div>
                    <ul className="space-y-2 text-sm font-normal">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Review SHAP explanations</strong> - Examine which features are contributing most to uncertainty
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Check customer history</strong> - Compare with previous scores and identify significant changes
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Verify data quality</strong> - Ensure all input data is accurate and complete
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Consider additional verification</strong> - Request supporting documentation or contact customer for clarification
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Consult with supervisor</strong> - For confidence below 60%, supervisor review is recommended
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Additional Context */}
                  <div className="pt-2 border-t border-yellow-300 dark:border-yellow-800">
                    <div className="text-xs text-muted-foreground">
                      <strong>Note:</strong> Low confidence does not automatically mean rejection. 
                      It indicates the model is less certain about this prediction and requires careful review.
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Model Ensemble Visualization with Disagreement Detection */}
          <ModelEnsembleVisualization
            predictionId={response.correlation_id}
            modelPredictions={response.model_predictions?.map((p: ModelPrediction) => ({
              model_name: p.model_name || "unknown",
              score: p.predicted_score || 0,
              weight: p.weight || 1 / (response.model_predictions?.length || 1),
              confidence: p.confidence || 0.8,
            }))}
            ensembleScore={response.credit_score}
          />

          {/* SHAP Visualization with Real API Integration */}
          <SHAPVisualizationWithAPI
            correlationId={response.correlation_id}
            customerId={response.customer_id}
            creditScore={response.credit_score}
            fallbackExplanation={response.explanation}
          />

          {/* Legacy Explanation Display (fallback) */}
          {response.explanation?.top_features &&
          response.explanation.top_features.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-6 w-6 text-primary" />
                  Feature Impact Summary
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of factors influencing the credit score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-700">
                      <TrendingUp className="h-5 w-5" />
                      Positive Factors
                    </h4>
                    <div className="grid gap-3">
                      {response.explanation.top_features
                        .filter((f: any) => f.impact === "positive")
                        .map((feature: any, idx: number) => (
                          <Card key={idx} className="border-2 border-green-200 bg-green-50 hover:shadow-md transition-shadow">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-green-900">{feature.feature}</span>
                                <Badge variant="outline" className="bg-green-100 border-green-300 text-green-800">
                                  +{feature.importance.toFixed(2)}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                  <div className="border-t" />
                  <div>
                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-700">
                      <TrendingDown className="h-5 w-5" />
                      Negative Factors
                    </h4>
                    <div className="grid gap-3">
                      {response.explanation.top_features
                        .filter((f: any) => f.impact === "negative")
                        .map((feature: any, idx: number) => (
                          <Card key={idx} className="border-2 border-red-200 bg-red-50 hover:shadow-md transition-shadow">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-red-900">{feature.feature}</span>
                                <Badge variant="outline" className="bg-red-100 border-red-300 text-red-800">
                                  {feature.importance.toFixed(2)}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Historical Score Trend */}
          <HistoricalScoreTrend
            customerId={response.customer_id}
            currentScore={response.credit_score}
            currentDate={new Date()}
          />
        </TabsContent>

        {/* Compliance - Enhanced with Audit Trail */}
        <TabsContent value="compliance" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="h-6 w-6 text-primary" />
                NBE Compliance Check
              </CardTitle>
              <CardDescription>
                Ethiopian National Bank regulatory compliance verification and audit trail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Card className={`border-2 ${response.compliance_check?.compliant ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      {response.compliance_check?.compliant ? (
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                      ) : (
                        <XCircle className="h-12 w-12 text-red-500" />
                      )}
                      <div>
                        <div className="font-bold text-2xl">
                          {response.compliance_check?.compliant
                            ? "Compliant"
                            : "Non-Compliant"}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          All regulatory requirements
                          {response.compliance_check?.compliant
                            ? " have been met"
                            : " have not been fully met"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {response.compliance_check?.violations &&
                  response.compliance_check.violations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-lg text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Violations ({response.compliance_check.violations.length})
                      </h4>
                      {response.compliance_check.violations.map((violation, idx) => (
                        <Alert key={idx} variant="destructive" className="border-2">
                          <AlertTriangle className="h-5 w-5" />
                          <AlertDescription>
                            <div className="font-bold text-base">{violation.rule}</div>
                            <div className="text-sm mt-2">{violation.description}</div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Loan Terms Display */}
          {formData && (
            <LoanTermsDisplay
              customerId={response.customer_id}
              loanAmount={formData.loan_amount}
              monthlyIncome={formData.monthly_income}
              loanTermMonths={formData.loan_term_months}
              creditScore={response.credit_score}
              riskCategory={response.risk_category}
            />
          )}

          {/* Product Recommendations */}
          {response.customer_id && (
            <ProductRecommendations
              customerId={response.customer_id}
              applicationData={{
                loan_amount: formData?.loan_amount,
                monthly_income: formData?.monthly_income,
                credit_score: response.credit_score,
                risk_category: response.risk_category,
              }}
            />
          )}

          {/* Audit Trail Display */}
          <AuditTrailDisplay
            customerId={response.customer_id}
            correlationId={response.correlation_id}
            limit={20}
            showFilters={true}
          />
        </TabsContent>

        {/* Features - Enhanced with Feature Comparison */}
        <TabsContent value="features" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="h-6 w-6 text-primary" />
                Feature Importance
              </CardTitle>
              <CardDescription>
                SHAP values and feature contributions analysis (if available)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {response.explanation?.shap_values ||
              response.explanation?.lime_explanation ? (
                <div className="space-y-4">
                  <Alert className="border-2">
                    <Info className="h-5 w-5" />
                    <AlertDescription className="font-medium">
                      Feature importance data is available. This visualization shows how
                      different features contributed to the final credit score.
                    </AlertDescription>
                  </Alert>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground py-8">
                        {response.explanation.shap_values
                          ? "SHAP values loaded - Visualization coming soon"
                          : "LIME explanation loaded - Visualization coming soon"}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Feature importance data not available in this response</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feature Comparison with Historical Scores */}
          {response.customer_id && (
            <FeatureComparison
              scores={[
                {
                  id: response.correlation_id || "current",
                  customer_id: response.customer_id,
                  credit_score: response.credit_score,
                  risk_category: response.risk_category,
                  created_at: new Date().toISOString(),
                  model_predictions: response.model_predictions || {},
                },
              ]}
              features={response.model_predictions}
            />
          )}
        </TabsContent>

        {/* Raw Data - Enhanced */}
        <TabsContent value="raw" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Complete Response Data</CardTitle>
                  <CardDescription>Full JSON response for debugging and analysis</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyResponse}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy JSON
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadResponse}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-6 rounded-lg overflow-x-auto text-xs border-2 max-h-[600px] overflow-y-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
