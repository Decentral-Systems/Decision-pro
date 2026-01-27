"use client";

import React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useUpdateApprovalWorkflowRules, useApprovalWorkflowRules } from "@/lib/api/hooks/useRules";
import { useToast } from "@/hooks/use-toast";
import { approvalWorkflowRuleRequestSchema } from "@/lib/validations/rules";
import { ApprovalWorkflowRuleRequest, ApprovalLevel } from "@/types/rules";
import { Checkbox } from "@/components/ui/checkbox";

interface ApprovalWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ApprovalWorkflowDialog({
  open,
  onOpenChange,
  onSuccess,
}: ApprovalWorkflowDialogProps) {
  const { toast } = useToast();
  const { data: existingRules } = useApprovalWorkflowRules();
  const updateRules = useUpdateApprovalWorkflowRules();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ApprovalWorkflowRuleRequest>({
    resolver: zodResolver(approvalWorkflowRuleRequestSchema),
    defaultValues: {
      levels: [
        {
          level: 1,
          name: "Automatic Approval",
          min_credit_score: 750,
          max_loan_amount: 50000,
          required_approvers: 0,
          auto_approve: true,
        },
      ],
    },
  });

  // Update form when existing rules are loaded
  React.useEffect(() => {
    if (existingRules && existingRules.levels) {
      reset({ levels: existingRules.levels });
    }
  }, [existingRules, reset]);

  const {
    fields: levelFields,
    append: appendLevel,
    remove: removeLevel,
  } = useFieldArray({
    control,
    name: "levels",
  });

  const onSubmit = async (data: ApprovalWorkflowRuleRequest) => {
    try {
      await updateRules.mutateAsync(data);
      toast({
        title: "Success",
        description: "Approval workflow rules updated successfully",
      });
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update approval workflow rules",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Approval Workflow Rules</DialogTitle>
          <DialogDescription>
            Configure approval levels with credit score thresholds and loan amount limits
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>Approval Levels</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendLevel({
                  level: levelFields.length + 1,
                  name: "",
                  min_credit_score: 0,
                  max_loan_amount: 0,
                  required_approvers: 1,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Level
            </Button>
          </div>

          {levelFields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Level {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLevel(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`level_${index}_name`}>Name *</Label>
                  <Input
                    id={`level_${index}_name`}
                    {...register(`levels.${index}.name`)}
                    placeholder="e.g., Junior Officer Review"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`level_${index}_level`}>Level Number</Label>
                  <Input
                    id={`level_${index}_level`}
                    type="number"
                    {...register(`levels.${index}.level`, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`level_${index}_min_score`}>Min Credit Score *</Label>
                  <Input
                    id={`level_${index}_min_score`}
                    type="number"
                    {...register(`levels.${index}.min_credit_score`, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`level_${index}_max_amount`}>Max Loan Amount *</Label>
                  <Input
                    id={`level_${index}_max_amount`}
                    type="number"
                    {...register(`levels.${index}.max_loan_amount`, { valueAsNumber: true })}
                    placeholder="Use 0 for unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`level_${index}_approvers`}>Required Approvers *</Label>
                  <Input
                    id={`level_${index}_approvers`}
                    type="number"
                    {...register(`levels.${index}.required_approvers`, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`level_${index}_escalation`}>Escalation Threshold</Label>
                  <Input
                    id={`level_${index}_escalation`}
                    type="number"
                    step="0.01"
                    {...register(`levels.${index}.escalation_threshold`, { valueAsNumber: true })}
                    placeholder="0.0 - 1.0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Controller
                    name={`levels.${index}.auto_approve`}
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label>Auto Approve</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Controller
                    name={`levels.${index}.auto_reject`}
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label>Auto Reject</Label>
                </div>
              </div>
            </div>
          ))}

          {errors.levels && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errors.levels.message}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateRules.isPending}>
              {updateRules.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Rules
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

