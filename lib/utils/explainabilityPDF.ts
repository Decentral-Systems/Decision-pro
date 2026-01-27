/**
 * Explainability PDF Report Generator
 * Creates comprehensive PDF reports with SHAP values, feature importance, and model comparisons
 */

import jsPDF from "jspdf";
import "jspdf-autotable";
import { SHAPExplanation } from "@/components/credit/SHAPVisualization";
import { ModelEnsembleResponse } from "@/lib/api/services/explainability";

interface ExplainabilityReportData {
  creditScore: number;
  correlationId: string;
  customerId?: string;
  timestamp: string;
  shapExplanation?: SHAPExplanation;
  modelEnsemble?: ModelEnsembleResponse;
  complianceExplanations?: Array<{
    rule: string;
    status: "compliant" | "violation" | "warning";
    description: string;
  }>;
}

export function generateExplainabilityPDF(data: ExplainabilityReportData): void {
  const doc = new jsPDF();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.text("Credit Score Explainability Report", 14, yPosition);
  yPosition += 10;

  // Metadata
  doc.setFontSize(10);
  doc.text(`Correlation ID: ${data.correlationId}`, 14, yPosition);
  yPosition += 5;
  if (data.customerId) {
    doc.text(`Customer ID: ${data.customerId}`, 14, yPosition);
    yPosition += 5;
  }
  doc.text(`Generated: ${new Date(data.timestamp).toLocaleString()}`, 14, yPosition);
  yPosition += 10;

  // Credit Score Summary
  doc.setFontSize(16);
  doc.text("Credit Score Summary", 14, yPosition);
  yPosition += 8;

  doc.setFontSize(12);
  doc.text(`Final Credit Score: ${data.creditScore.toFixed(0)}`, 14, yPosition);
  yPosition += 10;

  // Model Ensemble Section
  if (data.modelEnsemble) {
    doc.setFontSize(16);
    doc.text("Model Ensemble Analysis", 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.text(
      `Consensus Score: ${(data.modelEnsemble.consensus_score * 100).toFixed(1)}%`,
      14,
      yPosition
    );
    yPosition += 5;
    doc.text(`Variance: ${data.modelEnsemble.variance.toFixed(0)}`, 14, yPosition);
    yPosition += 5;
    doc.text(
      `Disagreement Level: ${data.modelEnsemble.disagreement_level.toUpperCase()}`,
      14,
      yPosition
    );
    yPosition += 10;

    // Model predictions table
    if (data.modelEnsemble.model_predictions.length > 0) {
      const tableData = data.modelEnsemble.model_predictions.map((m) => [
        m.model_name,
        m.score.toFixed(0),
        `${(m.weight * 100).toFixed(1)}%`,
        `${(m.confidence * 100).toFixed(1)}%`,
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [["Model", "Score", "Weight", "Confidence"]],
        body: tableData,
        theme: "striped",
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // SHAP Features Section
  if (data.shapExplanation && data.shapExplanation.features.length > 0) {
    // New page if needed
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.text("Feature Importance (SHAP)", 14, yPosition);
    yPosition += 8;

    // Top positive features
    if (data.shapExplanation.top_positive_features.length > 0) {
      doc.setFontSize(12);
      doc.text("Top Positive Contributors", 14, yPosition);
      yPosition += 6;

      const positiveData = data.shapExplanation.top_positive_features
        .slice(0, 10)
        .map((f) => [
          f.feature.replace(/_/g, " "),
          f.shap_value.toFixed(2),
          f.feature_value?.toFixed(2) || "N/A",
        ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [["Feature", "SHAP Value", "Feature Value"]],
        body: positiveData,
        theme: "striped",
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Top negative features
    if (data.shapExplanation.top_negative_features.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.text("Top Negative Contributors", 14, yPosition);
      yPosition += 6;

      const negativeData = data.shapExplanation.top_negative_features
        .slice(0, 10)
        .map((f) => [
          f.feature.replace(/_/g, " "),
          f.shap_value.toFixed(2),
          f.feature_value?.toFixed(2) || "N/A",
        ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [["Feature", "SHAP Value", "Feature Value"]],
        body: negativeData,
        theme: "striped",
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // Compliance Explanations
  if (data.complianceExplanations && data.complianceExplanations.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.text("Regulatory Compliance", 14, yPosition);
    yPosition += 8;

    const complianceData = data.complianceExplanations.map((c) => [
      c.rule,
      c.status.toUpperCase(),
      c.description,
    ]);

    (doc as any).autoTable({
      startY: yPosition,
      head: [["Rule", "Status", "Description"]],
      body: complianceData,
      theme: "striped",
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount} - Generated by AIS Platform`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  // Save PDF
  doc.save(`explainability-report-${data.correlationId}.pdf`);
}
