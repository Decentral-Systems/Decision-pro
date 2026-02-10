"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { NBEComplianceResult } from "../utils/nbe-compliance";
import { ComplianceSummaryCard } from "./compliance-summary-card";
import { NbeComplianceDisplay } from "./nbe-compliance-display";
import { SupervisorOverrideDialog } from "./supervisor-override-dialog";

interface NbeComplianceBlockProps {
  compliance: NBEComplianceResult | null;
  showOverrideDialog: boolean;
  onOpenOverrideDialogChange: (open: boolean) => void;
  onOverride: (reason: string) => Promise<void>;
  customerId?: string;
  supervisorId?: string;
}

export function NbeComplianceBlock({
  compliance,
  showOverrideDialog,
  onOpenOverrideDialogChange,
  onOverride,
  customerId,
  supervisorId,
}: NbeComplianceBlockProps) {
  return (
    <>
      {compliance != null && !compliance.compliant && (
        <Alert
          variant="destructive"
          className="border-2 border-red-500 bg-red-50 dark:bg-red-950"
        >
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="font-semibold text-red-900 dark:text-red-100">
            <div className="space-y-2">
              <div className="text-lg">
                ⚠️ CRITICAL: NBE Compliance Violations Detected
              </div>
              <div className="text-sm font-normal">
                This loan application violates NBE regulatory requirements. Submission is blocked
                until violations are resolved or supervisor override is approved.
              </div>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm font-normal">
                {compliance.violations.map((violation, index) => (
                  <li key={index}>
                    <strong>{violation.rule}:</strong> {violation.description}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {compliance != null && <ComplianceSummaryCard compliance={compliance} />}
        {compliance != null && <NbeComplianceDisplay compliance={compliance} />}
      </div>

      {compliance != null && !compliance.compliant && (
        <SupervisorOverrideDialog
          open={showOverrideDialog}
          onOpenChange={onOpenOverrideDialogChange}
          violations={compliance.violations}
          customerId={customerId}
          onOverride={onOverride}
          supervisorId={supervisorId}
        />
      )}
    </>
  );
}
