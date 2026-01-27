/**
 * Export Helpers
 * Utilities for exporting data to various formats (CSV, Excel, PDF)
 * Includes signature hashing and version tracking for compliance
 */

import { getOrCreateCorrelationId } from "./correlationId";

export interface ExportMetadata {
  version: string;
  generatedAt: string;
  generatedBy?: string;
  correlationId: string;
  signature?: string;
  filterSummary?: string;
  recordCount: number;
}

export interface SignedExportResult {
  content: string | Blob;
  metadata: ExportMetadata;
  filename: string;
}

/**
 * Generate hash signature for export data
 */
async function generateSignature(data: string): Promise<string> {
  // Use Web Crypto API for hashing
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Create export metadata
 */
function createExportMetadata(
  recordCount: number,
  options?: {
    version?: string;
    generatedBy?: string;
    filterSummary?: string;
  }
): ExportMetadata {
  return {
    version: options?.version || '1.0.0',
    generatedAt: new Date().toISOString(),
    generatedBy: options?.generatedBy,
    correlationId: getOrCreateCorrelationId(),
    recordCount,
    filterSummary: options?.filterSummary,
  };
}

/**
 * Export data to CSV with signature
 */
export async function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<string, string>,
  options?: {
    includeSignature?: boolean;
    version?: string;
    generatedBy?: string;
    filterSummary?: string;
  }
): Promise<void> {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const keys = Object.keys(data[0]);
  const headerRow = keys.map(key => headers?.[key] || key);
  const rows = data.map(row =>
    keys.map(key => {
      const value = row[key];
      // Handle values that might contain commas or quotes
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
  );

  let csvContent = [headerRow, ...rows]
    .map(row => row.join(','))
    .join('\n');

  // Add metadata and signature if requested
  if (options?.includeSignature) {
    const metadata = createExportMetadata(data.length, options);
    const signature = await generateSignature(csvContent);
    metadata.signature = signature;

    // Append metadata as comments
    csvContent = `# Export Metadata
# Version: ${metadata.version}
# Generated At: ${metadata.generatedAt}
# Correlation ID: ${metadata.correlationId}
# Signature: ${signature}
# Record Count: ${metadata.recordCount}
${metadata.filterSummary ? `# Filter Summary: ${metadata.filterSummary}\n` : ''}
${csvContent}`;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export data to CSV with signature (synchronous version for backwards compatibility)
 */
export function exportToCSVSync<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<string, string>
): void {
  exportToCSV(data, filename, headers, { includeSignature: false }).catch(console.error);
}

/**
 * Export data to Excel (XLSX format using simple CSV approach)
 * Note: For true Excel support, you'd need a library like xlsx
 */
export async function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<string, string>,
  options?: {
    includeSignature?: boolean;
    version?: string;
    generatedBy?: string;
    filterSummary?: string;
  }
): Promise<void> {
  // For now, use CSV format which Excel can open
  // In production, consider using a library like 'xlsx' for true Excel support
  await exportToCSV(data, filename, headers, options);
}

/**
 * Generate PDF content for batch results summary
 */
export function generateBatchResultsPDF(
  results: any[],
  summary: {
    total: number;
    successful: number;
    failed: number;
  }
): string {
  // Generate HTML content that can be converted to PDF
  // In production, use a library like jsPDF or pdfmake
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Batch Credit Scoring Results</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .summary-item { display: inline-block; margin-right: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        .success { color: green; }
        .failed { color: red; }
      </style>
    </head>
    <body>
      <h1>Batch Credit Scoring Results</h1>
      <div class="summary">
        <div class="summary-item"><strong>Total:</strong> ${summary.total}</div>
        <div class="summary-item"><strong>Successful:</strong> ${summary.successful}</div>
        <div class="summary-item"><strong>Failed:</strong> ${summary.failed}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>Status</th>
            <th>Credit Score</th>
            <th>Risk Category</th>
            <th>Recommendation</th>
          </tr>
        </thead>
        <tbody>
          ${results.slice(0, 100).map(r => `
            <tr>
              <td>${r.customer_id}</td>
              <td class="${r.success ? 'success' : 'failed'}">${r.success ? 'Success' : 'Failed'}</td>
              <td>${r.credit_score || '—'}</td>
              <td>${r.risk_category || '—'}</td>
              <td>${r.approval_recommendation || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${results.length > 100 ? `<p><em>Showing first 100 results. Total: ${results.length}</em></p>` : ''}
    </body>
    </html>
  `;
  return html;
}

/**
 * Export to PDF by opening print dialog with signature
 */
export async function exportToPDF(
  htmlContent: string,
  filename: string,
  options?: {
    includeSignature?: boolean;
    version?: string;
    generatedBy?: string;
    filterSummary?: string;
    recordCount?: number;
  }
): Promise<void> {
  let finalContent = htmlContent;

  // Add signature and metadata if requested
  if (options?.includeSignature) {
    const signature = await generateSignature(htmlContent);
    const metadata = createExportMetadata(options.recordCount || 0, {
      version: options.version,
      generatedBy: options.generatedBy,
      filterSummary: options.filterSummary,
    });
    metadata.signature = signature;

    // Inject metadata into HTML
    const metadataSection = `
      <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; font-size: 11px; color: #666;">
        <strong>Export Metadata</strong><br>
        Version: ${metadata.version}<br>
        Generated At: ${metadata.generatedAt}<br>
        Correlation ID: ${metadata.correlationId}<br>
        Signature: ${signature.substring(0, 16)}...<br>
        ${metadata.recordCount !== undefined ? `Record Count: ${metadata.recordCount}<br>` : ''}
        ${metadata.filterSummary ? `Filter Summary: ${metadata.filterSummary}<br>` : ''}
      </div>
    `;

    // Insert before closing body tag
    finalContent = htmlContent.replace('</body>', `${metadataSection}</body>`);
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }
  
  printWindow.document.write(finalContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

/**
 * Generate signed export with metadata
 */
export async function generateSignedExport<T extends Record<string, any>>(
  data: T[],
  format: 'csv' | 'excel' | 'pdf',
  filename: string,
  options?: {
    headers?: Record<string, string>;
    version?: string;
    generatedBy?: string;
    filterSummary?: string;
    htmlContent?: string; // For PDF
  }
): Promise<SignedExportResult> {
  const metadata = createExportMetadata(data.length, {
    version: options?.version,
    generatedBy: options?.generatedBy,
    filterSummary: options?.filterSummary,
  });

  let content: string | Blob;
  let signature: string;

  if (format === 'pdf' && options?.htmlContent) {
    signature = await generateSignature(options.htmlContent);
    content = new Blob([options.htmlContent], { type: 'text/html' });
  } else {
    // Generate CSV content
    const keys = Object.keys(data[0] || {});
    const headerRow = keys.map(key => options?.headers?.[key] || key);
    const rows = data.map(row =>
      keys.map(key => {
        const value = row[key];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
    );
    const csvContent = [headerRow, ...rows].map(row => row.join(',')).join('\n');
    signature = await generateSignature(csvContent);
    content = new Blob([csvContent], { type: format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv' });
  }

  metadata.signature = signature;

  const timestamp = new Date().toISOString().split('T')[0];
  const extension = format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv';
  const finalFilename = `${filename}_${timestamp}.${extension}`;

  return {
    content,
    metadata,
    filename: finalFilename,
  };
}

/**
 * Generate PDF content for customers export
 */
export function generateCustomersPDF(
  customers: any[],
  filters?: Record<string, any>
): string {
  const appliedFilters = filters ? Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v !== "" && v !== "all").map(([k, v]) => `${k}: ${v}`).join(", ") : "None";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Customers Export</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; margin-bottom: 10px; }
        .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .summary-item { display: inline-block; margin-right: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>Customers Export</h1>
      <div class="meta">
        <div>Generated: ${new Date().toLocaleString()}</div>
        <div>Total Customers: ${customers.length}</div>
        <div>Applied Filters: ${appliedFilters}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Region</th>
            <th>Credit Score</th>
            <th>Risk Level</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${customers.slice(0, 500).map((c: any) => `
            <tr>
              <td>${c.customer_id || c.id || "N/A"}</td>
              <td>${c.full_name || c.name || "N/A"}</td>
              <td>${c.phone_number || c.phone || "N/A"}</td>
              <td>${c.email || "N/A"}</td>
              <td>${c.region || "N/A"}</td>
              <td>${c.credit_score ? c.credit_score.toFixed(0) : "N/A"}</td>
              <td>${c.risk_level || "N/A"}</td>
              <td>${c.status || "N/A"}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${customers.length > 500 ? `<p style="margin-top: 20px; color: #666;"><em>Showing first 500 of ${customers.length} customers. For complete data, use CSV or Excel export.</em></p>` : ''}
    </body>
    </html>
  `;
  return html;
}

/**
 * Export data to CSV (alias for backwards compatibility)
 */
export const exportToCsv = exportToCSV;

/**
 * Export data to JSON with signature
 */
export async function exportToJSON<T extends Record<string, any>>(
  data: T[],
  filename: string,
  options?: {
    includeSignature?: boolean;
    version?: string;
    generatedBy?: string;
    filterSummary?: string;
    pretty?: boolean;
  }
): Promise<void> {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const exportData = {
    metadata: options?.includeSignature
      ? createExportMetadata(data.length, options)
      : undefined,
    data,
    exportedAt: new Date().toISOString(),
  };

  let jsonContent = options?.pretty
    ? JSON.stringify(exportData, null, 2)
    : JSON.stringify(exportData);

  // Add signature if requested
  if (options?.includeSignature && exportData.metadata) {
    const signature = await generateSignature(jsonContent);
    exportData.metadata.signature = signature;
    jsonContent = options?.pretty
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);
  }

  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export data to XML with signature
 */
export async function exportToXML<T extends Record<string, any>>(
  data: T[],
  filename: string,
  rootElement: string = "data",
  itemElement: string = "item",
  options?: {
    includeSignature?: boolean;
    version?: string;
    generatedBy?: string;
    filterSummary?: string;
  }
): Promise<void> {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Escape XML special characters
  const escapeXML = (str: string): string => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  // Convert object to XML element
  const objectToXML = (obj: any, elementName: string): string => {
    let xml = `<${elementName}>`;
    for (const [key, value] of Object.entries(obj)) {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_");
      if (value === null || value === undefined) {
        xml += `<${safeKey}></${safeKey}>`;
      } else if (typeof value === "object" && !Array.isArray(value)) {
        xml += objectToXML(value, safeKey);
      } else {
        xml += `<${safeKey}>${escapeXML(String(value))}</${safeKey}>`;
      }
    }
    xml += `</${elementName}>`;
    return xml;
  };

  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xmlContent += `<${rootElement}>\n`;

  // Add metadata if requested
  if (options?.includeSignature) {
    const metadata = createExportMetadata(data.length, options);
    xmlContent += "  <metadata>\n";
    xmlContent += `    <version>${escapeXML(metadata.version)}</version>\n`;
    xmlContent += `    <generatedAt>${escapeXML(metadata.generatedAt)}</generatedAt>\n`;
    if (metadata.generatedBy) {
      xmlContent += `    <generatedBy>${escapeXML(metadata.generatedBy)}</generatedBy>\n`;
    }
    xmlContent += `    <correlationId>${escapeXML(metadata.correlationId)}</correlationId>\n`;
    xmlContent += `    <recordCount>${metadata.recordCount}</recordCount>\n`;
    if (metadata.filterSummary) {
      xmlContent += `    <filterSummary>${escapeXML(metadata.filterSummary)}</filterSummary>\n`;
    }
    xmlContent += "  </metadata>\n";
  }

  // Add data items
  xmlContent += "  <items>\n";
  data.forEach((item) => {
    xmlContent += `    ${objectToXML(item, itemElement).replace(/\n/g, "\n    ")}\n`;
  });
  xmlContent += "  </items>\n";

  // Add signature if requested
  if (options?.includeSignature) {
    const signature = await generateSignature(xmlContent);
    xmlContent += `  <signature>${signature}</signature>\n`;
  }

  xmlContent += `</${rootElement}>`;

  const blob = new Blob([xmlContent], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

