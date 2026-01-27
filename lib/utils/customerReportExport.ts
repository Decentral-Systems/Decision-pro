/**
 * Customer 360 Report Export Utilities
 * Provides functions to export customer 360 reports as PDF
 */

interface CustomerReportData {
  customer_id: string;
  full_name?: string;
  [key: string]: any;
}

/**
 * Generate PDF report for Customer 360 data
 */
export async function exportCustomer360Report(
  data: CustomerReportData,
  includeSections?: string[]
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Report export is only available in the browser');
  }

  try {
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.text('Customer 360 Report', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.text(`Customer ID: ${data.customer_id}`, 20, yPosition);
    yPosition += 7;

    if (data.full_name) {
      pdf.text(`Name: ${data.full_name}`, 20, yPosition);
      yPosition += 7;
    }

    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 15;

    // Add sections based on data
    const sections = includeSections || [
      'profile',
      'credit',
      'risk',
      'loans',
      'payments',
      'engagement',
    ];

    sections.forEach((section) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.text(section.charAt(0).toUpperCase() + section.slice(1), 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      const sectionData = data[section];
      if (sectionData && typeof sectionData === 'object') {
        Object.entries(sectionData).forEach(([key, value]) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          const displayValue =
            typeof value === 'object' ? JSON.stringify(value) : String(value);
          pdf.text(`${key}: ${displayValue}`, 25, yPosition, {
            maxWidth: 165,
          });
          yPosition += 6;
        });
      }
      yPosition += 5;
    });

    const filename = `customer-360-${data.customer_id}-${Date.now()}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating customer 360 report:', error);
    throw error;
  }
}




