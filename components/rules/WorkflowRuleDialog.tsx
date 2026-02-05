"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Layout, FileText } from "lucide-react";
import { useCreateWorkflowRule, useUpdateWorkflowRule } from "@/lib/api/hooks/useRules";
import { useToast } from "@/hooks/use-toast";
import { workflowRuleRequestSchema } from "@/lib/validations/rules";
import { WorkflowRule, WorkflowRuleRequest } from "@/types/rules";
import { getOperatorsForField, inferFieldType } from "@/lib/utils/ruleHelpers";
import { Checkbox } from "@/components/ui/checkbox";
import { VisualRuleBuilder } from "./VisualRuleBuilder";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoButton } from "./InfoButton";
import { PRODUCT_TYPES, getAllCustomerSegments, WORKFLOW_RULE_TYPES, ERROR_HANDLING_OPTIONS } from "@/lib/constants/rules";

type WorkflowRuleFormData = WorkflowRuleRequest;

interface WorkflowRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: WorkflowRule;
  onSuccess?: () => void;
}

export function WorkflowRuleDialog({
  open,
  onOpenChange,
  rule,
  onSuccess,
}: WorkflowRuleDialogProps) {
  const { toast } = useToast();
  const createRule = useCreateWorkflowRule();
  const updateRule = useUpdateWorkflowRule();
  const [viewMode, setViewMode] = useState<"form" | "visual">("form");
  const [visualBuilderData, setVisualBuilderData] = useState<WorkflowRuleRequest | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WorkflowRuleFormData>({
    resolver: zodResolver(workflowRuleRequestSchema),
    defaultValues: rule
      ? {
          rule_name: rule.rule_name,
          rule_description: rule.rule_description,
          rule_conditions: rule.rule_conditions,
          rule_actions: rule.rule_actions,
          rule_type: rule.rule_type,
          product_type: rule.product_type,
          customer_segment: rule.customer_segment,
          priority: rule.priority,
          is_active: rule.is_active,
          execution_order: rule.execution_order,
          validation_script: rule.validation_script,
          error_handling: rule.error_handling,
        }
      : {
          rule_name: "",
          rule_conditions: {
            conditions: [],
            logical_operator: "AND",
          },
          rule_actions: {
            actions: [],
          },
          rule_type: "approval",
          priority: 0,
          is_active: true,
          execution_order: 0,
          error_handling: "continue",
        },
  });

  const {
    fields: conditionFields,
    append: appendCondition,
    remove: removeCondition,
  } = useFieldArray({
    control,
    name: "rule_conditions.conditions",
  });

  const {
    fields: actionFields,
    append: appendAction,
    remove: removeAction,
  } = useFieldArray({
    control,
    name: "rule_actions.actions",
  });

  const onSubmit = async (data: WorkflowRuleFormData) => {
    try {
      if (rule) {
        await updateRule.mutateAsync({ ruleId: rule.id, rule: data });
        toast({
          title: "Success",
          description: "Workflow rule updated successfully",
        });
      } else {
        await createRule.mutateAsync(data);
        toast({
          title: "Success",
          description: "Workflow rule created successfully",
        });
      }
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save rule",
        variant: "destructive",
      });
    }
  };

  // Reset view mode when dialog opens/closes
  useEffect(() => {
    if (open) {
      setViewMode("form");
      setVisualBuilderData(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{rule ? "Edit Workflow Rule" : "Create Workflow Rule"}</DialogTitle>
              <DialogDescription>
                Configure automated workflow rules for credit decisioning
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "form" | "visual")} className="w-auto">
                <TabsList>
                  <TabsTrigger value="form" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Form
                  </TabsTrigger>
                  <TabsTrigger value="visual" className="flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Visual
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <InfoButton section="visual-builder" tooltip="Learn about Visual Builder" />
            </div>
          </div>
        </DialogHeader>

        {viewMode === "visual" ? (
          <div className="space-y-4">
            <VisualRuleBuilder
              ruleType="workflow"
              initialData={rule ? {
                rule_name: rule.rule_name,
                rule_description: rule.rule_description,
                rule_conditions: rule.rule_conditions,
                rule_actions: rule.rule_actions,
                rule_type: rule.rule_type,
                product_type: rule.product_type,
                customer_segment: rule.customer_segment,
                priority: rule.priority,
                is_active: rule.is_active,
                execution_order: rule.execution_order,
                validation_script: rule.validation_script,
                error_handling: rule.error_handling,
              } : undefined}
              onDataChange={(data) => {
                setVisualBuilderData(data as WorkflowRuleRequest);
                // Sync with form
                Object.entries(data).forEach(([key, value]) => {
                  setValue(key as any, value);
                });
              }}
              validationErrors={errors}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (visualBuilderData) {
                    handleSubmit(onSubmit)(visualBuilderData as any);
                  } else {
                    handleSubmit(onSubmit)();
                  }
                }}
                disabled={createRule.isPending || updateRule.isPending}
              >
                {createRule.isPending || updateRule.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {rule ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  rule ? "Update Rule" : "Create Rule"
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rule_name">Rule Name *</Label>
              <Input id="rule_name" {...register("rule_name")} />
              {errors.rule_name && (
                <p className="text-sm text-destructive">{errors.rule_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule_type">Rule Type *</Label>
              <Controller
                name="rule_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKFLOW_RULE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule_description">Description</Label>
            <Textarea id="rule_description" {...register("rule_description")} rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_type">Product Type</Label>
              <Controller
                name="product_type"
                control={control}
                render={({ field }) => (
                  <Select 
                    onValueChange={(value) => field.onChange(value === "all" ? undefined : value)} 
                    value={field.value || "all"}
                  >
                    <SelectTrigger id="product_type">
                      <SelectValue placeholder="Select product type (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      {PRODUCT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_segment">Customer Segment</Label>
              <Controller
                name="customer_segment"
                control={control}
                render={({ field }) => (
                  <Select 
                    onValueChange={(value) => field.onChange(value === "all" ? undefined : value)} 
                    value={field.value || "all"}
                  >
                    <SelectTrigger id="customer_segment">
                      <SelectValue placeholder="Select segment (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Segments</SelectItem>
                      {getAllCustomerSegments().map((segment) => (
                        <SelectItem key={segment.value} value={segment.value}>
                          {segment.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                {...register("priority", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Conditions *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendCondition({
                    field: "",
                    operator: "equals",
                    value: "",
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Condition
              </Button>
            </div>

            <Controller
              name="rule_conditions.logical_operator"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            {conditionFields.map((field, index) => {
              const fieldValue = watch(`rule_conditions.conditions.${index}.field`);
              const fieldType = fieldValue ? inferFieldType(fieldValue) : "string";
              const availableOperators = getOperatorsForField(fieldType);

              return (
                <div key={field.id} className="flex gap-2 items-start p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Field name"
                      {...register(`rule_conditions.conditions.${index}.field`)}
                    />
                    <Controller
                      name={`rule_conditions.conditions.${index}.operator`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableOperators.map((op) => (
                              <SelectItem key={op} value={op}>
                                {op.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <Input
                      placeholder="Value"
                      {...register(`rule_conditions.conditions.${index}.value`)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Actions *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendAction({
                    type: "auto_approve",
                    parameters: {},
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Action
              </Button>
            </div>

            {actionFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start p-3 border rounded-lg">
                <div className="flex-1">
                  <Controller
                    name={`rule_actions.actions.${index}.type`}
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto_approve">Auto Approve</SelectItem>
                          <SelectItem value="auto_reject">Auto Reject</SelectItem>
                          <SelectItem value="require_review">Require Review</SelectItem>
                          <SelectItem value="notify">Notify</SelectItem>
                          <SelectItem value="limit_adjustment">Limit Adjustment</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Textarea
                    className="mt-2"
                    placeholder='Parameters (JSON): {"max_amount": 100000}'
                    {...register(`rule_actions.actions.${index}.parameters` as any)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAction(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="execution_order">Execution Order</Label>
              <Input
                id="execution_order"
                type="number"
                {...register("execution_order", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="error_handling">Error Handling</Label>
              <Controller
                name="error_handling"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ERROR_HANDLING_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label>Active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRule.isPending || updateRule.isPending}>
              {(createRule.isPending || updateRule.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {rule ? "Update" : "Create"} Rule
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

