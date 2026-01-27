"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { exportCustomer360Report } from "@/lib/utils/customerReportExport";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Customer360Data } from "@/lib/utils/customer360Transform";

interface CustomerReportExportProps {
  data: Customer360Data;
  className?: string;
}

export function CustomerReportExport({
  data,
  className,
}: CustomerReportExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportCustomer360Report(data, [
        'profile',
        'credit',
        'risk',
        'loans',
        'payments',
        'engagement',
      ]);
      toast({
        title: "Report Generated",
        description: "Customer 360 report has been exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to generate customer 360 report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isExporting}
      className={className}
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? "Generating..." : "Export Report"}
    </Button>
  );
}



