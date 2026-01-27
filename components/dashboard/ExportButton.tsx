"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from "lucide-react";
import { exportToPDF, exportToExcel, exportToJSON, type ExportOptions } from "@/lib/utils/exportUtils";
import type { DashboardData, ExecutiveDashboardData } from "@/types/dashboard";

interface ExportButtonProps {
  dashboardData: DashboardData | null;
  executiveData: ExecutiveDashboardData | null;
  className?: string;
}

export function ExportButton({ dashboardData, executiveData, className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeKPIs: true,
    includeBankingMetrics: true,
    includeRevenue: true,
    includePortfolio: true,
    includeOperational: true,
    includeCompliance: true,
  });

  const handleExport = async (format: "pdf" | "excel" | "json") => {
    setIsExporting(true);
    try {
      if (format === "pdf") {
        await exportToPDF(dashboardData, executiveData, exportOptions);
      } else if (format === "excel") {
        await exportToExcel(dashboardData, executiveData, exportOptions);
      } else {
        exportToJSON(dashboardData, executiveData);
      }
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      alert(`Failed to export ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };

  const toggleOption = (key: keyof ExportOptions) => {
    setExportOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isExporting} className={className}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport("pdf")} disabled={isExporting}>
            <FileText className="mr-2 h-4 w-4" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("excel")} disabled={isExporting}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export as Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("json")} disabled={isExporting}>
            <FileJson className="mr-2 h-4 w-4" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowOptions(true)} disabled={isExporting}>
            Export Options
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export Options Dialog */}
      <Dialog open={showOptions} onOpenChange={setShowOptions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Options</DialogTitle>
            <DialogDescription>
              Select which sections to include in the export
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeKPIs"
                checked={exportOptions.includeKPIs}
                onCheckedChange={() => toggleOption("includeKPIs")}
              />
              <Label htmlFor="includeKPIs" className="cursor-pointer">
                Key Performance Indicators
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeBankingMetrics"
                checked={exportOptions.includeBankingMetrics}
                onCheckedChange={() => toggleOption("includeBankingMetrics")}
              />
              <Label htmlFor="includeBankingMetrics" className="cursor-pointer">
                Banking Metrics & Ratios
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeRevenue"
                checked={exportOptions.includeRevenue}
                onCheckedChange={() => toggleOption("includeRevenue")}
              />
              <Label htmlFor="includeRevenue" className="cursor-pointer">
                Revenue Analytics
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includePortfolio"
                checked={exportOptions.includePortfolio}
                onCheckedChange={() => toggleOption("includePortfolio")}
              />
              <Label htmlFor="includePortfolio" className="cursor-pointer">
                Portfolio Health
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeOperational"
                checked={exportOptions.includeOperational}
                onCheckedChange={() => toggleOption("includeOperational")}
              />
              <Label htmlFor="includeOperational" className="cursor-pointer">
                Operational Efficiency
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCompliance"
                checked={exportOptions.includeCompliance}
                onCheckedChange={() => toggleOption("includeCompliance")}
              />
              <Label htmlFor="includeCompliance" className="cursor-pointer">
                Compliance Metrics
              </Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

