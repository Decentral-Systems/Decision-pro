/**
 * Export Service
 * Provides PDF and Excel export functionality for reports and data
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface ExportOptions {
  filename?: string;
  title?: string;
  author?: string;
  subject?: string;
}

export interface ExcelSheet {
  name: string;
  data: any[];
  columns?: string[];
}

export class ExportService {
  /**
   * Export data to PDF format
   */
  static exportToPDF(
    data: any,
    options: ExportOptions = {}
  ): void {
    const doc = new jsPDF();
    const {
      filename = `export_${new Date().toISOString().split("T")[0]}.pdf`,
      title = "Export Report",
      author = "AIS Platform",
      subject = "Data Export",
    } = options;

    // Set document properties
    doc.setProperties({
      title,
      author,
      subject,
    });

    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    // Add generation date
    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      30
    );

    let yPosition = 40;

    // Handle different data types
    if (Array.isArray(data)) {
      // Array of objects - create table
      if (data.length > 0 && typeof data[0] === "object") {
        const columns = Object.keys(data[0]);
        const rows = data.map((item) =>
          columns.map((col) => {
            const value = item[col];
            if (value === null || value === undefined) return "";
            if (typeof value === "object") return JSON.stringify(value);
            return String(value);
          })
        );

        autoTable(doc, {
          head: [columns],
          body: rows,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] },
        });
      } else {
        // Simple array
        doc.setFontSize(12);
        data.forEach((item, index) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(String(item), 14, yPosition);
          yPosition += 7;
        });
      }
    } else if (typeof data === "object") {
      // Object - create key-value table
      const entries = Object.entries(data);
      const rows = entries.map(([key, value]) => [
        key,
        typeof value === "object" ? JSON.stringify(value) : String(value),
      ]);

      autoTable(doc, {
        head: [["Property", "Value"]],
        body: rows,
        startY: yPosition,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
      });
    } else {
      // Simple value
      doc.setFontSize(12);
      doc.text(String(data), 14, yPosition);
    }

    // Save the PDF
    doc.save(filename);
  }

  /**
   * Export data to Excel format
   */
  static exportToExcel(
    data: ExcelSheet[] | any[],
    options: ExportOptions = {}
  ): void {
    const workbook = XLSX.utils.book_new();
    const {
      filename = `export_${new Date().toISOString().split("T")[0]}.xlsx`,
    } = options;

    // Handle multiple sheets
    if (Array.isArray(data) && data.length > 0 && "name" in data[0]) {
      // Array of sheet objects
      (data as ExcelSheet[]).forEach((sheet) => {
        const worksheet = XLSX.utils.json_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
      });
    } else if (Array.isArray(data)) {
      // Single array - create one sheet
      if (data.length > 0 && typeof data[0] === "object") {
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      } else {
        // Simple array
        const worksheet = XLSX.utils.aoa_to_sheet(data.map((item) => [item]));
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      }
    } else if (typeof data === "object") {
      // Single object - create one sheet
      const worksheet = XLSX.utils.json_to_sheet([data]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    }

    // Write file
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Export credit score result to PDF
   */
  static exportCreditScoreToPDF(
    creditScoreData: any,
    options: ExportOptions = {}
  ): void {
    const doc = new jsPDF();
    const {
      filename = `credit_score_${new Date().toISOString().split("T")[0]}.pdf`,
      title = "Credit Score Report",
    } = options;

    doc.setProperties({
      title,
      author: "AIS Platform",
      subject: "Credit Score Report",
    });

    // Title
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    // Generation date
    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      30
    );

    let yPosition = 45;

    // Customer Information
    if (creditScoreData.customer_id) {
      doc.setFontSize(12);
      doc.text("Customer Information", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.text(`Customer ID: ${creditScoreData.customer_id}`, 14, yPosition);
      yPosition += 7;
    }

    // Score Information
    if (creditScoreData.credit_score !== undefined) {
      doc.setFontSize(12);
      doc.text("Credit Score", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(16);
      doc.text(
        `Score: ${creditScoreData.credit_score}`,
        14,
        yPosition
      );
      yPosition += 10;
    }

    // Risk Category
    if (creditScoreData.risk_category) {
      doc.setFontSize(10);
      doc.text(
        `Risk Category: ${creditScoreData.risk_category}`,
        14,
        yPosition
      );
      yPosition += 10;
    }

    // Model Scores Table
    if (creditScoreData.model_scores && Array.isArray(creditScoreData.model_scores)) {
      yPosition += 5;
      const modelRows = creditScoreData.model_scores.map((model: any) => [
        model.model_name || "Unknown",
        model.score?.toFixed(2) || "N/A",
        model.weight ? `${(model.weight * 100).toFixed(1)}%` : "N/A",
      ]);

      autoTable(doc, {
        head: [["Model", "Score", "Weight"]],
        body: modelRows,
        startY: yPosition,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
      });
    }

    // Recommendations
    if (creditScoreData.recommendations && Array.isArray(creditScoreData.recommendations)) {
      const pageHeight = doc.internal.pageSize.height;
      const currentY = (doc as any).lastAutoTable.finalY || yPosition;
      
      if (currentY > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      } else {
        yPosition = currentY + 10;
      }

      doc.setFontSize(12);
      doc.text("Recommendations", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      creditScoreData.recommendations.forEach((rec: string) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`• ${rec}`, 14, yPosition);
        yPosition += 7;
      });
    }

    doc.save(filename);
  }

  /**
   * Export prediction result to PDF
   */
  static exportPredictionToPDF(
    predictionData: any,
    options: ExportOptions = {}
  ): void {
    const doc = new jsPDF();
    const {
      filename = `prediction_${new Date().toISOString().split("T")[0]}.pdf`,
      title = "Default Prediction Report",
    } = options;

    doc.setProperties({
      title,
      author: "AIS Platform",
      subject: "Default Prediction Report",
    });

    // Title
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    // Generation date
    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      30
    );

    let yPosition = 45;

    // Customer Information
    if (predictionData.customer_id) {
      doc.setFontSize(12);
      doc.text("Customer Information", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.text(`Customer ID: ${predictionData.customer_id}`, 14, yPosition);
      yPosition += 7;
    }

    // Prediction Results
    if (predictionData.default_probability !== undefined) {
      doc.setFontSize(12);
      doc.text("Prediction Results", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(16);
      const probability = (predictionData.default_probability * 100).toFixed(2);
      doc.text(
        `Default Probability: ${probability}%`,
        14,
        yPosition
      );
      yPosition += 10;
    }

    // Risk Factors
    if (predictionData.key_factors && Array.isArray(predictionData.key_factors)) {
      doc.setFontSize(12);
      doc.text("Key Risk Factors", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      predictionData.key_factors.forEach((factor: any) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        const factorText = typeof factor === "string" 
          ? factor 
          : `${factor.factor}: ${factor.impact || ""}`;
        doc.text(`• ${factorText}`, 14, yPosition);
        yPosition += 7;
      });
    }

    doc.save(filename);
  }

  /**
   * Export customer list to Excel
   */
  static exportCustomersToExcel(
    customers: any[],
    options: ExportOptions = {}
  ): void {
    const {
      filename = `customers_${new Date().toISOString().split("T")[0]}.xlsx`,
    } = options;

    // Flatten customer data for Excel
    const flattenedCustomers = customers.map((customer) => ({
      "Customer ID": customer.customer_id,
      "Full Name": customer.full_name,
      "Email": customer.email || "",
      "Phone": customer.phone_number || "",
      "Region": customer.region || "",
      "Credit Score": customer.credit_score || "",
      "Risk Score": customer.risk_score ? (customer.risk_score * 100).toFixed(2) + "%" : "",
      "Status": customer.status || "",
      "Created At": customer.created_at || "",
    }));

    this.exportToExcel(flattenedCustomers, { filename });
  }
}

// Named exports for convenience
export const exportToPDF = (
  data: any,
  options?: ExportOptions & { sheetName?: string }
) => {
  // Handle different option formats
  if (options?.sheetName) {
    // This is likely from a component that expects different format
    ExportService.exportToPDF(data, {
      filename: options.filename || options.title || `export_${Date.now()}.pdf`,
      title: options.title || options.sheetName,
    });
  } else {
    ExportService.exportToPDF(data, options);
  }
};

export const exportToExcel = (
  data: any[] | ExcelSheet[],
  options?: ExportOptions & { sheetName?: string }
) => {
  // Handle different option formats
  if (options?.sheetName && Array.isArray(data)) {
    // Convert to ExcelSheet format if needed
    const excelData: ExcelSheet[] = [{
      name: options.sheetName,
      data: data,
    }];
    ExportService.exportToExcel(excelData, {
      filename: options.filename || `export_${Date.now()}.xlsx`,
    });
  } else {
    ExportService.exportToExcel(data as any, options);
  }
};

