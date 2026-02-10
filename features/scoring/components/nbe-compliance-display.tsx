"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type {
  NBEComplianceResult,
  ComplianceViolation,
  ComplianceWarning,
} from "../utils/nbe-compliance";

interface NbeComplianceDisplayProps {
  compliance: NBEComplianceResult;
  className?: string;
}

export function NbeComplianceDisplay({
  compliance,
  className,
}: NbeComplianceDisplayProps) {
  if (compliance.compliant && compliance.warnings.length === 0) {
    return (
      <Alert className={className}>
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle>NBE Compliance</AlertTitle>
        <AlertDescription>
          This loan application complies with all NBE regulatory requirements.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      {!compliance.compliant && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>NBE Compliance Violations</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {compliance.violations.map((violation: ComplianceViolation, index: number) => (
                <li key={index}>
                  <strong>{violation.rule}:</strong> {violation.description}
                  {violation.max_allowed != null && (
                    <span className="ml-2 text-xs">
                      (Max allowed: {violation.max_allowed.toLocaleString()} ETB)
                    </span>
                  )}
                  {violation.min_required != null && (
                    <span className="ml-2 text-xs">
                      (Min required: {violation.min_required.toLocaleString()} ETB)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {compliance.warnings.length > 0 && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>NBE Compliance Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {compliance.warnings.map((warning: ComplianceWarning, index: number) => (
                <li key={index}>
                  <strong>{warning.rule}:</strong> {warning.description}
                  {warning.recommendation && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({warning.recommendation})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {Object.keys(compliance.recommendations).length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Recommendations</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {compliance.recommendations.max_loan_amount != null && (
                <div>
                  <Badge variant="outline" className="mr-2">
                    Max Loan Amount
                  </Badge>
                  {compliance.recommendations.max_loan_amount.toLocaleString()} ETB
                </div>
              )}
              {compliance.recommendations.max_monthly_payment != null && (
                <div>
                  <Badge variant="outline" className="mr-2">
                    Max Monthly Payment
                  </Badge>
                  {compliance.recommendations.max_monthly_payment.toLocaleString()} ETB
                </div>
              )}
              {compliance.recommendations.suggested_interest_rate != null && (
                <div>
                  <Badge variant="outline" className="mr-2">
                    Suggested Interest Rate
                  </Badge>
                  {(compliance.recommendations.suggested_interest_rate * 100).toFixed(2)}%
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
