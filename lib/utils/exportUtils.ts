/**
 * Export Utilities
 * Functions for exporting dashboard data to various formats
 * NOTE: These functions are client-side only and use browser APIs
 */

// Dynamic imports to avoid SSR issues - these libraries require browser APIs
let jsPDF: any;
let autoTable: any;
let XLSX: any;

// Lazy load these libraries only when needed (client-side)
async function loadExportLibraries() {
  if (typeof window === 'undefined') {
    throw new Error('Export functions are only available in the browser');
  }
  
  if (!jsPDF) {
    jsPDF = (await import("jspdf")).default;
    autoTable = (await import("jspdf-autotable")).default;
    XLSX = await import("xlsx");
  }
  
  return { jsPDF, autoTable, XLSX };
}

import type { DashboardData, ExecutiveDashboardData } from "@/types/dashboard";

export interface ExportOptions {
  includeKPIs?: boolean;
  includeBankingMetrics?: boolean;
  includeRevenue?: boolean;
  includePortfolio?: boolean;
  includeOperational?: boolean;
  includeCompliance?: boolean;
}

const defaultExportOptions: ExportOptions = {
  includeKPIs: true,
  includeBankingMetrics: true,
  includeRevenue: true,
  includePortfolio: true,
  includeOperational: true,
  includeCompliance: true,
};

/**
 * Export dashboard data to PDF
 */
export async function exportToPDF(
  dashboardData: DashboardData | null,
  executiveData: ExecutiveDashboardData | null,
  options: ExportOptions = {}
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('exportToPDF is only available in the browser');
  }
  
  const { jsPDF: PDF, autoTable: table } = await loadExportLibraries();
  const opts = { ...defaultExportOptions, ...options };
  const doc = new PDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(18);
  doc.text("Executive Dashboard Report", 14, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
  yPosition += 15;

  // KPIs Section
  if (opts.includeKPIs && dashboardData) {
    doc.setFontSize(14);
    doc.text("Key Performance Indicators", 14, yPosition);
    yPosition += 8;

    const kpiData = [
      ["Metric", "Value", "Change"],
      [
        dashboardData.revenue?.label || "Revenue",
        formatValue(dashboardData.revenue?.value || 0, dashboardData.revenue?.format || "currency"),
        formatChange(dashboardData.revenue?.change || 0, dashboardData.revenue?.changeType || "increase"),
      ],
      [
        dashboardData.loans?.label || "Loans",
        formatValue(dashboardData.loans?.value || 0, dashboardData.loans?.format || "number"),
        formatChange(dashboardData.loans?.change || 0, dashboardData.loans?.changeType || "increase"),
      ],
      [
        dashboardData.customers?.label || "Customers",
        formatValue(dashboardData.customers?.value || 0, dashboardData.customers?.format || "number"),
        formatChange(dashboardData.customers?.change || 0, dashboardData.customers?.changeType || "increase"),
      ],
      [
        dashboardData.risk_score?.label || "Risk Score",
        formatValue(dashboardData.risk_score?.value || 0, dashboardData.risk_score?.format || "number"),
        formatChange(dashboardData.risk_score?.change || 0, dashboardData.risk_score?.changeType || "increase"),
      ],
    ];

    table(doc, {
      head: [kpiData[0]],
      body: kpiData.slice(1),
      startY: yPosition,
      theme: "striped",
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Banking Metrics
  if (opts.includeBankingMetrics && executiveData?.banking_kpis) {
    doc.setFontSize(14);
    doc.text("Banking Metrics", 14, yPosition);
    yPosition += 8;

    const bankingData = [
      ["Metric", "Value"],
      ["Total Assets", formatCurrency(executiveData.banking_kpis.total_assets || 0)],
      ["Total Deposits", formatCurrency(executiveData.banking_kpis.total_deposits || 0)],
      ["Total Loans", formatCurrency(executiveData.banking_kpis.total_loans || 0)],
      ["Net Income", formatCurrency(executiveData.banking_kpis.net_income || 0)],
    ];

    autoTable(doc, {
      head: [bankingData[0]],
      body: bankingData.slice(1),
      startY: yPosition,
      theme: "striped",
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Banking Ratios
  if (opts.includeBankingMetrics && executiveData?.banking_ratios) {
    doc.setFontSize(14);
    doc.text("Banking Ratios", 14, yPosition);
    yPosition += 8;

    const ratios = executiveData.banking_ratios;
    const ratiosData = [
      ["Ratio", "Value"],
      ["NIM", formatPercentage((ratios.nim || 0) * 100)],
      ["ROE", formatPercentage((ratios.roe || 0) * 100)],
      ["ROA", formatPercentage((ratios.roa || 0) * 100)],
      ["CAR", formatPercentage((ratios.car || 0) * 100)],
      ["NPL", formatPercentage((ratios.npl || 0) * 100)],
      ["CIR", formatPercentage((ratios.cir || 0) * 100)],
      ["LDR", formatPercentage((ratios.ldr || 0) * 100)],
    ];

    autoTable(doc, {
      head: [ratiosData[0]],
      body: ratiosData.slice(1),
      startY: yPosition,
      theme: "striped",
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Portfolio Health
  if (opts.includePortfolio && executiveData?.portfolio_health) {
    doc.setFontSize(14);
    doc.text("Portfolio Health", 14, yPosition);
    yPosition += 8;

    const portfolio = executiveData.portfolio_health;
    const portfolioData = [
      ["Metric", "Value"],
      ["Overall Score", formatNumber(portfolio.overall_score || 0, 1)],
      ["Diversification Index", formatNumber((portfolio.components?.diversification || 0) * 100, 1) + "%"],
      ["Concentration Risk", formatPercentage(portfolio.concentration_risk || 0)],
      ["Approval Rate", formatPercentage(portfolio.approval_rate || 0)],
      ["Default Rate", formatPercentage(portfolio.default_rate || 0)],
    ];

    autoTable(doc, {
      head: [portfolioData[0]],
      body: portfolioData.slice(1),
      startY: yPosition,
      theme: "striped",
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    (doc as any).setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      (doc as any).internal.pageSize.getWidth() / 2,
      (doc as any).internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save the PDF
  doc.save(`executive-dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export dashboard data to Excel
 */
export async function exportToExcel(
  dashboardData: DashboardData | null,
  executiveData: ExecutiveDashboardData | null,
  options: ExportOptions = {}
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('exportToExcel is only available in the browser');
  }
  
  const { XLSX: xlsxLib } = await loadExportLibraries();
  const opts = { ...defaultExportOptions, ...options };
  const workbook = xlsxLib.utils.book_new();

  // Sheet 1: Executive Summary (KPIs)
  if (opts.includeKPIs && dashboardData) {
    const kpiData = [
      ["Metric", "Value", "Change", "Change Type"],
      [
        dashboardData.revenue?.label || "Revenue",
        dashboardData.revenue?.value || 0,
        dashboardData.revenue?.change || 0,
        dashboardData.revenue?.changeType || "increase",
      ],
      [
        dashboardData.loans?.label || "Loans",
        dashboardData.loans?.value || 0,
        dashboardData.loans?.change || 0,
        dashboardData.loans?.changeType || "increase",
      ],
      [
        dashboardData.customers?.label || "Customers",
        dashboardData.customers?.value || 0,
        dashboardData.customers?.change || 0,
        dashboardData.customers?.changeType || "increase",
      ],
      [
        dashboardData.risk_score?.label || "Risk Score",
        dashboardData.risk_score?.value || 0,
        dashboardData.risk_score?.change || 0,
        dashboardData.risk_score?.changeType || "increase",
      ],
    ];
    const kpiSheet = xlsxLib.utils.aoa_to_sheet(kpiData);
    xlsxLib.utils.book_append_sheet(workbook, kpiSheet, "Executive Summary");
  }

  // Sheet 2: Banking Metrics
  if (opts.includeBankingMetrics && executiveData?.banking_kpis) {
    const bankingData = [
      ["Metric", "Value"],
      ["Total Assets", executiveData.banking_kpis.total_assets || 0],
      ["Total Deposits", executiveData.banking_kpis.total_deposits || 0],
      ["Total Loans", executiveData.banking_kpis.total_loans || 0],
      ["Net Income", executiveData.banking_kpis.net_income || 0],
      ["Assets Growth", (executiveData.banking_kpis.assets_growth || 0) + "%"],
      ["Deposits Growth", (executiveData.banking_kpis.deposits_growth || 0) + "%"],
      ["Income Growth", (executiveData.banking_kpis.income_growth || 0) + "%"],
    ];
    const bankingSheet = xlsxLib.utils.aoa_to_sheet(bankingData);
    xlsxLib.utils.book_append_sheet(workbook, bankingSheet, "Banking Metrics");
  }

  // Sheet 3: Banking Ratios
  if (opts.includeBankingMetrics && executiveData?.banking_ratios) {
    const ratios = executiveData.banking_ratios;
    const ratiosData = [
      ["Ratio", "Value (%)"],
      ["NIM", (ratios.nim || 0) * 100],
      ["ROE", (ratios.roe || 0) * 100],
      ["ROA", (ratios.roa || 0) * 100],
      ["CAR", (ratios.car || 0) * 100],
      ["NPL", (ratios.npl || 0) * 100],
      ["CIR", (ratios.cir || 0) * 100],
      ["LDR", (ratios.ldr || 0) * 100],
    ];
    const ratiosSheet = xlsxLib.utils.aoa_to_sheet(ratiosData);
    xlsxLib.utils.book_append_sheet(workbook, ratiosSheet, "Banking Ratios");
  }

  // Sheet 4: Portfolio Health
  if (opts.includePortfolio && executiveData?.portfolio_health) {
    const portfolio = executiveData.portfolio_health;
    const portfolioData = [
      ["Metric", "Value"],
      ["Overall Score", portfolio.overall_score || 0],
      ["Diversification Index", (portfolio.components?.diversification || 0) * 100],
      ["Concentration Risk", portfolio.concentration_risk || 0],
      ["Approval Rate", portfolio.approval_rate || 0],
      ["Default Rate", portfolio.default_rate || 0],
      ["Average Loan Size", portfolio.average_loan_size || 0],
      ["Active Loans", portfolio.active_loans || 0],
    ];
    const portfolioSheet = xlsxLib.utils.aoa_to_sheet(portfolioData);
    xlsxLib.utils.book_append_sheet(workbook, portfolioSheet, "Portfolio Health");
  }

  // Sheet 5: Operational Metrics
  if (opts.includeOperational && executiveData?.operational_efficiency) {
    const operational = executiveData.operational_efficiency;
    const operationalData = [
      ["Metric", "Value"],
      ["Processing Time (ms)", operational.processing_time || 0],
      ["Automation Rate (%)", operational.automation_rate || 0],
      ["Throughput (req/min)", operational.throughput || 0],
      ["Error Rate (%)", operational.error_rate || 0],
    ];
    const operationalSheet = xlsxLib.utils.aoa_to_sheet(operationalData);
    xlsxLib.utils.book_append_sheet(workbook, operationalSheet, "Operational Metrics");
  }

  // Save the Excel file
  xlsxLib.writeFile(workbook, `executive-dashboard-${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export dashboard data to JSON
 */
export function exportToJSON(
  dashboardData: DashboardData | null,
  executiveData: ExecutiveDashboardData | null
): void {
  if (typeof window === 'undefined') {
    throw new Error('exportToJSON is only available in the browser');
  }
  const exportData = {
    exportDate: new Date().toISOString(),
    dashboardData,
    executiveData,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `executive-dashboard-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper functions
function formatValue(value: number, format: string): string {
  if (format === "currency") return formatCurrency(value);
  if (format === "percentage") return formatPercentage(value / 100);
  return formatNumber(value, 0);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

function formatChange(change: number, changeType: string): string {
  const sign = changeType === "increase" ? "+" : "-";
  return `${sign}${Math.abs(change).toFixed(2)}%`;
}

