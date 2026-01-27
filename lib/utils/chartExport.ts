/**
 * Chart Export Utilities
 * Provides functions to export charts as PNG, SVG, and PDF
 */

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface ChartExportOptions {
  /** Chart title for the exported file */
  title?: string;
  /** Width of exported image (default: 1200) */
  width?: number;
  /** Height of exported image (default: 600) */
  height?: number;
  /** Quality for PNG export (0-1, default: 1) */
  quality?: number;
  /** Background color (default: white) */
  backgroundColor?: string;
}

/**
 * Export chart element to PNG
 */
export async function exportChartToPNG(
  element: HTMLElement,
  filename: string = "chart",
  options: ChartExportOptions = {}
): Promise<void> {
  const {
    title,
    width = 1200,
    height = 600,
    quality = 1,
    backgroundColor = "#ffffff",
  } = options;

  try {
    const canvas = await html2canvas(element, {
      width,
      height,
      scale: 2, // Higher quality
      backgroundColor,
      logging: false,
      useCORS: true,
    });

    // Create download link
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png", quality);
    link.click();
  } catch (error) {
    console.error("[ChartExport] Failed to export PNG:", error);
    throw new Error("Failed to export chart as PNG");
  }
}

/**
 * Export chart element to SVG
 * Note: This works best with SVG-based charts (like Recharts)
 */
export function exportChartToSVG(
  svgElement: SVGSVGElement,
  filename: string = "chart",
  options: ChartExportOptions = {}
): void {
  try {
    const { title } = options;
    
    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    
    // Set viewBox if not present
    if (!clonedSvg.getAttribute("viewBox")) {
      const width = clonedSvg.width.baseVal.value || 1200;
      const height = clonedSvg.height.baseVal.value || 600;
      clonedSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }
    
    // Add title if provided
    if (title) {
      const titleElement = document.createElementNS("http://www.w3.org/2000/svg", "title");
      titleElement.textContent = title;
      clonedSvg.insertBefore(titleElement, clonedSvg.firstChild);
    }
    
    // Serialize SVG
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    
    // Create blob and download
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.download = `${filename}.svg`;
    link.href = url;
    link.click();
    
    // Cleanup
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("[ChartExport] Failed to export SVG:", error);
    throw new Error("Failed to export chart as SVG");
  }
}

/**
 * Export chart element to PDF
 */
export async function exportChartToPDF(
  element: HTMLElement,
  filename: string = "chart",
  options: ChartExportOptions = {}
): Promise<void> {
  const {
    title = "Chart",
    width = 1200,
    height = 600,
    backgroundColor = "#ffffff",
  } = options;

  try {
    // Convert to canvas first
    const canvas = await html2canvas(element, {
      width,
      height,
      scale: 2,
      backgroundColor,
      logging: false,
      useCORS: true,
    });

    // Calculate PDF dimensions (A4 landscape: 297x210mm)
    const pdfWidth = 297; // mm
    const pdfHeight = (height / width) * pdfWidth;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
      unit: "mm",
      format: [pdfWidth, pdfHeight],
    });

    // Add title if provided
    if (title) {
      pdf.setFontSize(16);
      pdf.text(title, pdfWidth / 2, 15, { align: "center" });
    }

    // Add image to PDF
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, title ? 20 : 0, pdfWidth, pdfHeight - (title ? 20 : 0));

    // Save PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("[ChartExport] Failed to export PDF:", error);
    throw new Error("Failed to export chart as PDF");
  }
}

/**
 * Export chart with multiple format options
 */
export async function exportChart(
  element: HTMLElement | SVGSVGElement,
  format: "png" | "svg" | "pdf",
  filename: string = "chart",
  options: ChartExportOptions = {}
): Promise<void> {
  if (format === "svg" && element instanceof SVGSVGElement) {
    exportChartToSVG(element, filename, options);
  } else if (format === "png" && element instanceof HTMLElement) {
    await exportChartToPNG(element, filename, options);
  } else if (format === "pdf" && element instanceof HTMLElement) {
    await exportChartToPDF(element, filename, options);
  } else {
    throw new Error(`Unsupported export format or element type: ${format}`);
  }
}
