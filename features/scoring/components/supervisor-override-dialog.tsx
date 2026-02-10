"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield } from "lucide-react";
import type { ComplianceViolation } from "../utils/nbe-compliance";
import { useAuditLogger } from "@/lib/utils/audit-logger";

interface SupervisorOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  violations: ComplianceViolation[];
  customerId?: string;
  onOverride: (reason: string) => Promise<void>;
  supervisorId?: string;
}

export function SupervisorOverrideDialog({
  open,
  onOpenChange,
  violations,
  customerId,
  onOverride,
  supervisorId,
}: SupervisorOverrideDialogProps) {
  const [overrideReason, setOverrideReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logComplianceOverride } = useAuditLogger();

  const handleOverride = async () => {
    if (!overrideReason.trim()) {
      setError("Override reason is required");
      return;
    }

    if (overrideReason.trim().length < 20) {
      setError("Override reason must be at least 20 characters");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await logComplianceOverride(
        customerId ?? "",
        violations.map((v) => ({
          rule: v.rule,
          description: v.description,
          severity: v.severity,
        })),
        overrideReason,
        supervisorId
      );

      await onOverride(overrideReason);

      setOverrideReason("");
      onOpenChange(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to process override"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Supervisor Override Required
          </DialogTitle>
          <DialogDescription>
            This loan application has NBE compliance violations that require
            supervisor approval to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="mb-2 font-semibold">Compliance Violations:</div>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {violations.map((violation, index) => (
                  <li key={index}>
                    <strong>{violation.rule}:</strong> {violation.description}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="override-reason">
              Override Justification <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="override-reason"
              placeholder="Please provide a detailed justification for overriding these compliance violations. Minimum 20 characters required."
              value={overrideReason}
              onChange={(e) => {
                setOverrideReason(e.target.value);
                setError(null);
              }}
              rows={5}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground">
              {overrideReason.length} / 20 minimum characters
            </div>
            {error != null && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This override will be logged to the
              audit trail and may be subject to regulatory review. Only proceed
              if you have valid business justification for the override.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOverrideReason("");
              setError(null);
              onOpenChange(false);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleOverride}
            disabled={
              isSubmitting ||
              !overrideReason.trim() ||
              overrideReason.trim().length < 20
            }
          >
            {isSubmitting ? "Processing..." : "Approve Override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
