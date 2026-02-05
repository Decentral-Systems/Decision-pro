/**
 * Loan Terms Display Component
 * Shows Rules Engine calculated loan terms and recommendations
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calculator,
  Info,
  DollarSign,
  Percent,
} from "lucide-react";
import {
  useRealtimeRulesEvaluation,
} from "@/lib/api/hooks/useRulesEngine";
import { useEvaluateWorkflow as useEvaluateWorkflowLegacy } from "@/lib/api/hooks/useRules";
import { useDebounce } from "@/lib/utils/debouncedValidation";
import { AlertCircle, Edit2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuditLogger } from "@/lib/utils/audit-logger";
import { useAuth } from "@/lib/auth/auth-context";

interface LoanTermsDisplayProps {
  customerId?: string;
  loanAmount?: number;
  monthlyIncome?: number;
  loanTermMonths?: number;
  creditScore?: number;
  riskCategory?: string;
  productType?: string;
  className?: string;
}

export function LoanTermsDisplay({
  customerId,
  loanAmount,
  monthlyIncome,
  loanTermMonths,
  creditScore,
  riskCategory,
  productType = "personal_loan",
  className,
}: LoanTermsDisplayProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { logEvent } = useAuditLogger();
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [overriddenTerms, setOverriddenTerms] = useState<{
    amount?: number;
    interestRate?: number;
  } | null>(null);

  // Debounce values to avoid excessive API calls
  const debouncedLoanAmount = useDebounce(loanAmount, 500);
  const debouncedMonthlyIncome = useDebounce(monthlyIncome, 500);
  const debouncedLoanTermMonths = useDebounce(loanTermMonths, 500);

  // Real-time rules evaluation
  const rulesRequest =
    customerId && debouncedLoanAmount && debouncedMonthlyIncome && debouncedLoanTermMonths
      ? {
          customer_id: customerId,
          product_type: productType,
          application_data: {
            loan_amount: debouncedLoanAmount,
            monthly_income: debouncedMonthlyIncome,
            loan_term_months: debouncedLoanTermMonths,
            credit_score: creditScore,
            risk_category: riskCategory,
          },
          evaluation_scope: "all" as const,
        }
      : null;

  const { data: rulesResult, isLoading: isEvaluating, error: rulesError } =
    useRealtimeRulesEvaluation(rulesRequest, !!rulesRequest);

  const evaluateWorkflow = useEvaluateWorkflowLegacy();
  const [workflowResult, setWorkflowResult] = useState<any>(null);

  // Evaluate workflow when rules are available
  useEffect(() => {
    if (!rulesRequest || !rulesResult) return;

    evaluateWorkflow
      .mutateAsync({
        application_data: {
          customer_id: customerId!,
          loan_amount: debouncedLoanAmount!,
          monthly_income: debouncedMonthlyIncome!,
          loan_term_months: debouncedLoanTermMonths!,
          credit_score: creditScore,
          risk_level: riskCategory,
        },
        product_type: productType,
      })
      .then((result) => {
        setWorkflowResult(result);
      })
      .catch((err) => {
        console.warn("Workflow evaluation failed:", err);
      });
  }, [rulesResult, customerId, debouncedLoanAmount, debouncedMonthlyIncome, debouncedLoanTermMonths, creditScore, riskCategory, productType]);

  // Use overridden terms if available, otherwise use Rules Engine results
  const recommendedLoanAmount =
    overriddenTerms?.amount ||
    rulesResult?.recommended_amount ||
    rulesResult?.max_loan_amount ||
    loanAmount;
  const recommendedInterestRate =
    overriddenTerms?.interestRate || rulesResult?.interest_rate;
  const automatedDecision = workflowResult?.decision;
  const approvalLevel = workflowResult?.approval_level || rulesResult?.approval_level;
  const fallbackUsed = rulesResult?.fallback_used || false;

  const handleOverride = async () => {
    if (!overrideJustification.trim()) {
      toast({
        title: "Justification Required",
        description: "Please provide a reason for overriding the recommended terms",
        variant: "destructive",
      });
      return;
    }

    const originalTerms = {
      amount: rulesResult?.recommended_amount || rulesResult?.max_loan_amount || loanAmount,
      interestRate: rulesResult?.interest_rate,
    };

    const newTerms = {
      amount: overriddenTerms?.amount || recommendedLoanAmount,
      interestRate: overriddenTerms?.interestRate || recommendedInterestRate,
    };

    // Log override to audit trail
    try {
      await logEvent({
        event_type: "user_action",
        customer_id: customerId,
        action: "Loan terms overridden",
        details: {
          original_terms: originalTerms,
          overridden_terms: newTerms,
          justification: overrideJustification,
          product_type: productType,
          credit_score: creditScore,
        },
        before_value: originalTerms,
        after_value: newTerms,
      });
    } catch (error) {
      console.warn("Failed to log terms override to audit trail:", error);
      // Continue with override even if audit logging fails
    }

    setOverriddenTerms(newTerms);

    toast({
      title: "Terms Overridden",
      description: "Loan terms have been overridden. Justification logged to audit trail.",
    });

    setOverrideDialogOpen(false);
    setOverrideJustification("");
  };

  if (!rulesRequest) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Loan Terms
          </CardTitle>
          <CardDescription>Rules Engine recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Enter loan parameters to get Rules Engine recommendations
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isEvaluating) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Loan Terms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Evaluating rules...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Recommended Loan Terms
        </CardTitle>
        <CardDescription>
          Calculated by Rules Engine based on credit score and business rules
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recommended Loan Amount */}
        {recommendedLoanAmount && (
          <div className="p-3 rounded-lg border bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Recommended Loan Amount</span>
              </div>
              <div className="text-lg font-bold">
                {recommendedLoanAmount.toLocaleString()} ETB
              </div>
            </div>
            {recommendedLoanAmount !== loanAmount && (
              <div className="text-xs text-muted-foreground mt-1">
                Adjusted from {loanAmount?.toLocaleString()} ETB
              </div>
            )}
          </div>
        )}

        {/* Recommended Interest Rate */}
        {recommendedInterestRate !== undefined && (
          <div className="p-3 rounded-lg border bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Recommended Interest Rate</span>
              </div>
              <div className="text-lg font-bold">
                {(recommendedInterestRate * 100).toFixed(2)}%
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Risk-based pricing within NBE limits (12-25%)
            </div>
          </div>
        )}

        {/* Automated Decision */}
        {automatedDecision && (
          <Alert
            className={
              automatedDecision === "approve"
                ? "border-green-500 bg-green-50"
                : automatedDecision === "reject"
                  ? "border-red-500 bg-red-50"
                  : "border-yellow-500 bg-yellow-50"
            }
          >
            {automatedDecision === "approve" ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : automatedDecision === "reject" ? (
              <XCircle className="h-4 w-4 text-red-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription>
              <div className="font-semibold">
                Automated Decision: {automatedDecision.toUpperCase()}
              </div>
              {workflowResult?.decision_reason && (
                <div className="text-sm mt-1">{workflowResult.decision_reason}</div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Approval Level */}
        {approvalLevel && (
          <div className="p-3 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Required Approval Level</span>
              <Badge variant="outline">{approvalLevel}</Badge>
            </div>
          </div>
        )}

        {/* Fallback Indicator */}
        {fallbackUsed && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Rules Engine unavailable. Using fallback calculation based on NBE rules.
            </AlertDescription>
          </Alert>
        )}

        {/* Override Indicator */}
        {overriddenTerms && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Terms have been manually overridden by analyst.
            </AlertDescription>
          </Alert>
        )}

        {/* Override Button */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOverrideDialogOpen(true)}
            className="w-full"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Override Terms
          </Button>
        </div>
      </CardContent>

      {/* Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Recommended Terms</DialogTitle>
            <DialogDescription>
              Override the Rules Engine recommended terms. This action will be logged to the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Loan Amount (ETB)</Label>
              <Input
                type="number"
                value={recommendedLoanAmount || ""}
                onChange={(e) =>
                  setOverriddenTerms({
                    ...overriddenTerms,
                    amount: parseFloat(e.target.value) || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Interest Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="12"
                max="25"
                value={recommendedInterestRate ? recommendedInterestRate * 100 : ""}
                onChange={(e) =>
                  setOverriddenTerms({
                    ...overriddenTerms,
                    interestRate: parseFloat(e.target.value) / 100 || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Justification *</Label>
              <Textarea
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
                placeholder="Explain why you are overriding the recommended terms..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleOverride}>
              <Save className="h-4 w-4 mr-2" />
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
