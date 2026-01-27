"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Download, 
  FileText, 
  Table, 
  FileSpreadsheet,
  Loader2,
  Calendar,
  Filter
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ApprovalExportDialogProps {
  filters?: {
    date_from?: string;
    date_to?: string;
    stage?: string;
    status?: string;
  };
}

export function ApprovalExportDialog({ filters }: ApprovalExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [dateFrom, setDateFrom] = useState(filters?.date_from || "");
  const [dateTo, setDateTo] = useState(filters?.date_to || "");
  const [includeStage, setIncludeStage] = useState(filters?.stage || "all");
  const [includeStatus, setIncludeStatus] = useState(filters?.status || "all");
  const { toast } = useToast();

  // Export fields selection
  const [selectedFields, setSelectedFields] = useState({
    workflow_id: true,
    application_number: true,
    customer_id: true,
    loan_amount: true,
    current_stage: true,
    workflow_status: true,
    created_at: true,
    updated_at: true,
    approval_level: false,
    required_approvals: false,
    received_approvals: false,
    conditions: false,
    decision_history: false,
    rules_evaluation: false,
  });

  const exportFormats = [
    { value: "csv", label: "CSV", icon: Table, description: "Comma-separated values" },
    { value: "excel", label: "Excel", icon: FileSpreadsheet, description: "Microsoft Excel format" },
    { value: "json", label: "JSON", icon: FileText, description: "JavaScript Object Notation" },
    { value: "pdf", label: "PDF", icon: FileText, description: "Portable Document Format" },
  ];

  const availableFields = [
    { key: "workflow_id", label: "Workflow ID", description: "Unique workflow identifier" },
    { key: "application_number", label: "Application Number", description: "Loan application number" },
    { key: "customer_id", label: "Customer ID", description: "Customer identifier" },
    { key: "loan_amount", label: "Loan Amount", description: "Requested loan amount" },
    { key: "current_stage", label: "Current Stage", description: "Current workflow stage" },
    { key: "workflow_status", label: "Workflow Status", description: "Overall workflow status" },
    { key: "created_at", label: "Created Date", description: "Workflow creation date" },
    { key: "updated_at", label: "Updated Date", description: "Last update date" },
    { key: "approval_level", label: "Approval Level", description: "Required approval level" },
    { key: "required_approvals", label: "Required Approvals", description: "Number of required approvals" },
    { key: "received_approvals", label: "Received Approvals", description: "Number of received approvals" },
    { key: "conditions", label: "Conditions", description: "Conditional approval requirements" },
    { key: "decision_history", label: "Decision History", description: "Approval/rejection history" },
    { key: "rules_evaluation", label: "Rules Evaluation", description: "Rules engine evaluation results" },
  ];

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(selectedFields).every(Boolean);
    const newState = Object.keys(selectedFields).reduce((acc, key) => {
      acc[key] = !allSelected;
      return acc;
    }, {} as typeof selectedFields);
    setSelectedFields(newState);
  };

  const handleExport = async () => {
    const selectedFieldKeys = Object.entries(selectedFields)
      .filter(([_, selected]) => selected)
      .map(([key, _]) => key);

    if (selectedFieldKeys.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one field to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      // In a real implementation, this would call the API
      const exportData = {
        format: exportFormat,
        fields: selectedFieldKeys,
        filters: {
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          stage: includeStage !== "all" ? includeStage : undefined,
          status: includeStatus !== "all" ? includeStatus : undefined,
        },
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real implementation, this would trigger a file download
      // For now, we'll just show a success message
      toast({
        title: "Export Started",
        description: `Your ${exportFormat.toUpperCase()} export is being prepared. You'll receive a download link shortly.`,
      });

      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export approval data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const selectedCount = Object.values(selectedFields).filter(Boolean).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Approval Data
          </DialogTitle>
          <DialogDescription>
            Export approval workflow data with custom filters and field selection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Format</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {exportFormats.map((format) => {
                const Icon = format.icon;
                return (
                  <div
                    key={format.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      exportFormat === format.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setExportFormat(format.value)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{format.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{format.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Additional Filters
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stage-filter">Stage</Label>
                <Select value={includeStage} onValueChange={setIncludeStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="initial_review">Initial Review</SelectItem>
                    <SelectItem value="credit_assessment">Credit Assessment</SelectItem>
                    <SelectItem value="compliance_check">Compliance Check</SelectItem>
                    <SelectItem value="automated_decision">Automated Decision</SelectItem>
                    <SelectItem value="risk_review">Risk Review</SelectItem>
                    <SelectItem value="final_approval">Final Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={includeStatus} onValueChange={setIncludeStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="conditional">Conditional</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                Fields to Export ({selectedCount} selected)
              </Label>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {Object.values(selectedFields).every(Boolean) ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4">
              {availableFields.map((field) => (
                <div key={field.key} className="flex items-start space-x-2">
                  <Checkbox
                    id={field.key}
                    checked={selectedFields[field.key as keyof typeof selectedFields]}
                    onCheckedChange={() => handleFieldToggle(field.key)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={field.key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {field.label}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {field.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedCount > 0 ? (
                <>Exporting {selectedCount} fields in {exportFormat.toUpperCase()} format</>
              ) : (
                <>Please select at least one field to export</>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={isExporting || selectedCount === 0}>
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}