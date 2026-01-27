"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PricingResponse } from "@/types/pricing";
import { formatCurrency } from "@/lib/utils/format";
import { CheckCircle2, AlertTriangle, TrendingUp, Download, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF, exportToCSV, exportToExcel } from "@/lib/utils/exportHelpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PricingResultsProps {
  result: PricingResponse;
}

export function PricingResults({ result }: PricingResultsProps) {
  const { toast } = useToast();

  const handleExportPDF = async () => {
    try {
      const htmlContent = generatePricingPDF(result);
      await exportToPDF(htmlContent, `pricing-${result.customer_id || 'result'}`, {
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
          "Interest Rate": `${result.interest_rate.toFixed(2)}%`,
          "Monthly Payment": formatCurrency(result.monthly_payment),
          "Total Payment": formatCurrency(result.total_payment),
          "Total Interest": formatCurrency(result.total_interest),
          "Compliance": result.compliance_check.compliant ? "Compliant" : "Non-Compliant",
          "Base Rate": `${result.pricing_breakdown.base_rate.toFixed(2)}%`,
          "Risk Adjustment": `${result.pricing_breakdown.risk_adjustment.toFixed(2)}%`,
          "Final Rate": `${result.pricing_breakdown.final_rate.toFixed(2)}%`,
          "Generated At": new Date().toISOString(),
        },
      ];
      await exportToExcel(exportData, `pricing-${result.customer_id || 'result'}`, undefined, {
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
          interest_rate: result.interest_rate.toFixed(2),
          monthly_payment: result.monthly_payment,
          total_payment: result.total_payment,
          total_interest: result.total_interest,
          compliant: result.compliance_check.compliant ? "Yes" : "No",
          base_rate: result.pricing_breakdown.base_rate.toFixed(2),
          risk_adjustment: result.pricing_breakdown.risk_adjustment.toFixed(2),
          final_rate: result.pricing_breakdown.final_rate.toFixed(2),
          generated_at: new Date().toISOString(),
        },
      ];
      await exportToCSV(exportData, `pricing-${result.customer_id || 'result'}`, undefined, {
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

  const generatePricingPDF = (data: PricingResponse): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Pricing Report - ${data.customer_id || 'Result'}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    .header { border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #8b5cf6; margin: 0; font-size: 28px; }
    .header .meta { color: #666; font-size: 12px; margin-top: 10px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
    .metric-card { background: #f5f5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6; text-align: center; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px; }
    .metric-value { font-size: 32px; font-weight: bold; color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #8b5cf6; color: white; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Dynamic Pricing Report</h1>
    <div class="meta">
      <div>Customer ID: ${data.customer_id || "N/A"}</div>
      <div>Generated: ${new Date().toLocaleString()}</div>
    </div>
  </div>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-label">Interest Rate</div>
      <div class="metric-value">${data.interest_rate.toFixed(2)}%</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Monthly Payment</div>
      <div class="metric-value">${formatCurrency(data.monthly_payment)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Total Payment</div>
      <div class="metric-value">${formatCurrency(data.total_payment)}</div>
    </div>
  </div>

  <h2>Pricing Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Component</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Base Rate</td>
        <td>${data.pricing_breakdown.base_rate.toFixed(2)}%</td>
      </tr>
      <tr>
        <td>Risk Adjustment</td>
        <td>${data.pricing_breakdown.risk_adjustment >= 0 ? "+" : ""}${data.pricing_breakdown.risk_adjustment.toFixed(2)}%</td>
      </tr>
      <tr>
        <td>Product Adjustment</td>
        <td>${data.pricing_breakdown.product_adjustment >= 0 ? "+" : ""}${data.pricing_breakdown.product_adjustment.toFixed(2)}%</td>
      </tr>
      <tr>
        <td>Term Adjustment</td>
        <td>${data.pricing_breakdown.term_adjustment >= 0 ? "+" : ""}${data.pricing_breakdown.term_adjustment.toFixed(2)}%</td>
      </tr>
      <tr style="font-weight: bold; background: #e9d5ff;">
        <td>Final Rate</td>
        <td>${data.pricing_breakdown.final_rate.toFixed(2)}%</td>
      </tr>
    </tbody>
  </table>

  <h2>Compliance Status</h2>
  <p><strong>Status:</strong> ${data.compliance_check.compliant ? "✓ Compliant" : "✗ Non-Compliant"}</p>
  <p><strong>Rate Range:</strong> ${data.compliance_check.min_rate}% - ${data.compliance_check.max_rate}%</p>

  ${data.alternatives && data.alternatives.length > 0 ? `
  <h2>Alternative Terms</h2>
  <table>
    <thead>
      <tr>
        <th>Term (months)</th>
        <th>Interest Rate</th>
        <th>Monthly Payment</th>
        <th>Total Payment</th>
      </tr>
    </thead>
    <tbody>
      ${data.alternatives.map((alt) => `
        <tr>
          <td>${alt.term_months}</td>
          <td>${alt.interest_rate.toFixed(2)}%</td>
          <td>${formatCurrency(alt.monthly_payment)}</td>
          <td>${formatCurrency(alt.monthly_payment * alt.term_months)}</td>
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
      {/* Main Pricing Results */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interest Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{result.interest_rate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Annual interest rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(result.monthly_payment)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(result.total_payment)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total interest: {formatCurrency(result.total_interest)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Check */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {result.compliance_check.compliant ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">Compliant with NBE regulations</span>
                <Badge variant="default">Compliant</Badge>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="font-medium">Non-compliant - rate outside limits</span>
                <Badge variant="destructive">Non-Compliant</Badge>
              </>
            )}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Rate range: {result.compliance_check.min_rate}% - {result.compliance_check.max_rate}%
          </div>
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Breakdown</CardTitle>
          <CardDescription>Components that make up the final interest rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Base Rate</span>
              <span className="font-medium">{result.pricing_breakdown.base_rate.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Risk Adjustment</span>
              <span className={`font-medium ${result.pricing_breakdown.risk_adjustment >= 0 ? "text-red-600" : "text-green-600"}`}>
                {result.pricing_breakdown.risk_adjustment >= 0 ? "+" : ""}
                {result.pricing_breakdown.risk_adjustment.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Product Adjustment</span>
              <span className="font-medium">
                {result.pricing_breakdown.product_adjustment >= 0 ? "+" : ""}
                {result.pricing_breakdown.product_adjustment.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Term Adjustment</span>
              <span className="font-medium">
                {result.pricing_breakdown.term_adjustment >= 0 ? "+" : ""}
                {result.pricing_breakdown.term_adjustment.toFixed(2)}%
              </span>
            </div>
            <div className="border-t pt-4 flex items-center justify-between">
              <span className="font-bold">Final Rate</span>
              <span className="text-2xl font-bold">{result.pricing_breakdown.final_rate.toFixed(2)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Terms */}
      {result.alternatives && result.alternatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alternative Terms</CardTitle>
            <CardDescription>
              Compare different loan terms for this customer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term (months)</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Monthly Payment</TableHead>
                  <TableHead>Total Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.alternatives.map((alt, index) => (
                  <TableRow key={index}>
                    <TableCell>{alt.term_months}</TableCell>
                    <TableCell>{alt.interest_rate.toFixed(2)}%</TableCell>
                    <TableCell>{formatCurrency(alt.monthly_payment)}</TableCell>
                    <TableCell>
                      {formatCurrency(alt.monthly_payment * alt.term_months)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


