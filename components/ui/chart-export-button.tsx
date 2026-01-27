"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileImage, FileText, File } from "lucide-react";
import { exportChartAsPNG, exportChartAsPDF, exportChartAsSVG } from "@/lib/utils/chartExport";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ChartExportButtonProps {
  chartId: string;
  chartTitle?: string;
  className?: string;
}

export function ChartExportButton({
  chartId,
  chartTitle = "Chart",
  className,
}: ChartExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (
    exportFn: () => Promise<void>,
    format: string
  ) => {
    setIsExporting(true);
    try {
      await exportFn();
      toast({
        title: "Export Successful",
        description: `Chart exported as ${format}`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || `Failed to export chart as ${format}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const sanitizeFilename = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const baseFilename = sanitizeFilename(chartTitle);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting}
          className={className}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            handleExport(
              () => exportChartAsPNG(chartId, `${baseFilename}.png`),
              "PNG"
            )
          }
          disabled={isExporting}
        >
          <FileImage className="h-4 w-4 mr-2" />
          Export as PNG
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            handleExport(
              () => exportChartAsPDF(chartId, `${baseFilename}.pdf`, chartTitle),
              "PDF"
            )
          }
          disabled={isExporting}
        >
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            handleExport(
              async () => { exportChartAsSVG(chartId, `${baseFilename}.svg`); },
              "SVG"
            )
          }
          disabled={isExporting}
        >
          <File className="h-4 w-4 mr-2" />
          Export as SVG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

