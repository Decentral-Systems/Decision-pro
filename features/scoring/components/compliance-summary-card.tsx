"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertTriangle, Shield } from "lucide-react";
import type { NBEComplianceResult } from "../utils/nbe-compliance";

interface ComplianceSummaryCardProps {
  compliance: NBEComplianceResult | null;
  className?: string;
}

export function ComplianceSummaryCard({
  compliance,
  className,
}: ComplianceSummaryCardProps) {
  if (!compliance) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            NBE Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Enter loan parameters to check compliance
          </div>
        </CardContent>
      </Card>
    );
  }

  const complianceScore = compliance.compliant
    ? 100
    : Math.max(0, 100 - compliance.violations.length * 20);
  const hasWarnings = compliance.warnings.length > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            NBE Compliance Status
          </CardTitle>
          {compliance.compliant ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Compliant
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              {compliance.violations.length} Violation
              {compliance.violations.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Real-time regulatory compliance check
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Compliance Score</span>
            <span className="font-semibold">{complianceScore}%</span>
          </div>
          <Progress
            value={complianceScore}
            className={`h-2 ${
              compliance.compliant
                ? "bg-green-100"
                : complianceScore >= 60
                  ? "bg-yellow-100"
                  : "bg-red-100"
            }`}
          />
        </div>

        {compliance.violations.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Violations:
            </div>
            <ul className="text-xs space-y-0.5 pl-4">
              {compliance.violations.slice(0, 3).map((violation, index) => (
                <li key={index} className="list-disc text-red-600">
                  {violation.rule}
                </li>
              ))}
              {compliance.violations.length > 3 && (
                <li className="text-muted-foreground">
                  +{compliance.violations.length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

        {hasWarnings && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-yellow-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Warnings:
            </div>
            <ul className="text-xs space-y-0.5 pl-4">
              {compliance.warnings.slice(0, 2).map((warning, index) => (
                <li key={index} className="list-disc text-yellow-600">
                  {warning.rule}
                </li>
              ))}
            </ul>
          </div>
        )}

        {Object.keys(compliance.recommendations).length > 0 && (
          <div className="pt-2 border-t space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">Recommendations:</div>
            {compliance.recommendations.max_loan_amount != null && (
              <div className="text-xs text-muted-foreground">
                Max Loan: {compliance.recommendations.max_loan_amount.toLocaleString()} ETB
              </div>
            )}
            {compliance.recommendations.max_monthly_payment != null && (
              <div className="text-xs text-muted-foreground">
                Max Payment:{" "}
                {compliance.recommendations.max_monthly_payment.toLocaleString()} ETB/month
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
