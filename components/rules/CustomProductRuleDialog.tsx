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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, AlertTriangle, Loader2, Layout, FileText } from "lucide-react";
import { useCreateCustomProductRule, useUpdateCustomProductRule } from "@/lib/api/hooks/useRules";
import { useToast } from "@/hooks/use-toast";
import { customProductRuleRequestSchema } from "@/lib/validations/rules";
import { CustomProductRule, CustomProductRuleRequest } from "@/types/rules";
import { getOperatorsForField, inferFieldType } from "@/lib/utils/ruleHelpers";
import { Checkbox } from "@/components/ui/checkbox";
import { VisualRuleBuilder } from "./VisualRuleBuilder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoButton } from "./InfoButton";
import { PRODUCT_TYPES, EVALUATION_SCOPES } from "@/lib/constants/rules";

type CustomProductRuleFormData = CustomProductRuleRequest;

interface CustomProductRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: CustomProductRule;
  onSuccess?: () => void;
}

export function CustomProductRuleDialog({
  open,
  onOpenChange,
  rule,
  onSuccess,
}: CustomProductRuleDialogProps) {
  const { toast } = useToast();
  const createRule = useCreateCustomProductRule();
  const updateRule = useUpdateCustomProductRule();
  const [viewMode, setViewMode] = useState<"form" | "visual">("form");
  const [visualBuilderData, setVisualBuilderData] = useState<CustomProductRuleRequest | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomProductRuleFormData>({
    resolver: zodResolver(customProductRuleRequestSchema),
    defaultValues: rule
      ? {
          rule_name: rule.rule_name,
          product_type: rule.product_type,
          rule_description: rule.rule_description,
          rule_definition: rule.rule_definition,
          rule_actions: rule.rule_actions,
          evaluation_order: rule.evaluation_order,
          evaluation_scope: rule.evaluation_scope,
          is_active: rule.is_active,
          is_mandatory: rule.is_mandatory,
          validation_script: rule.validation_script,
          error_message: rule.error_message,
        }
      : {
          rule_name: "",
          product_type: "",
          rule_definition: {
            rule_type: "eligibility",
            conditions: [],
            logical_operator: "AND",
          },
          rule_actions: [],
          evaluation_order: 0,
          evaluation_scope: "all",
          is_active: true,
          is_mandatory: false,
        },
  });

  const {
    fields: conditionFields,
    append: appendCondition,
    remove: removeCondition,
  } = useFieldArray({
    control,
    name: "rule_definition.conditions",
  });

  const {
    fields: actionFields,
    append: appendAction,
    remove: removeAction,
  } = useFieldArray({
    control,
    name: "rule_actions",
  });

  const ruleType = watch("rule_definition.rule_type");

  // Enhanced client-side validation
  const validateRule = (data: CustomProductRuleFormData): string[] => {
    const errors: string[] = [];

    // Validate rule name
    if (!data.rule_name || data.rule_name.trim().length === 0) {
      errors.push("Rule name is required");
    } else if (data.rule_name.length > 100) {
      errors.push("Rule name must be 100 characters or less");
    }

    // Validate product type
    if (!data.product_type || data.product_type.trim().length === 0) {
      errors.push("Product type is required");
    }

    // Validate conditions
    if (!data.rule_definition.conditions || data.rule_definition.conditions.length === 0) {
      errors.push("At least one condition is required");
    } else {
      data.rule_definition.conditions.forEach((condition, index) => {
        if (!condition.field || condition.field.trim().length === 0) {
          errors.push(`Condition ${index + 1}: Field name is required`);
        }
        if (condition.value === undefined || condition.value === null || condition.value === "") {
          errors.push(`Condition ${index + 1}: Value is required`);
        }
      });
    }

    // Validate actions
    if (!data.rule_actions || data.rule_actions.length === 0) {
      errors.push("At least one action is required");
    } else {
      data.rule_actions.forEach((action, index) => {
        if (!action.type) {
          errors.push(`Action ${index + 1}: Action type is required`);
        }
        // Validate action-specific requirements
        if (action.type === "set_limit" && !action.value && !action.calculation) {
          errors.push(`Action ${index + 1}: Limit value or calculation is required for set_limit action`);
        }
        if (action.type === "adjust_interest_rate" && action.multiplier === undefined && !action.calculation) {
          errors.push(`Action ${index + 1}: Multiplier or calculation is required for adjust_interest_rate action`);
        }
      });
    }

    // Validate evaluation order
    if (data.evaluation_order < 0) {
      errors.push("Evaluation order must be 0 or greater");
    }

    return errors;
  };

  const onSubmit = async (data: CustomProductRuleFormData) => {
    // Client-side validation
    const validationErrors = validateRule(data);
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(". "),
        variant: "destructive",
      });
      return;
    }

    try {
      if (rule) {
        await updateRule.mutateAsync({ ruleId: rule.id, rule: data });
        toast({
          title: "Success",
          description: "Custom product rule updated successfully",
        });
      } else {
        await createRule.mutateAsync(data);
        toast({
          title: "Success",
          description: "Custom product rule created successfully",
        });
      }
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail?.message || error?.message || "Failed to save rule";
      toast({
        title: "Error",
        description: errorMessage,
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
              <DialogTitle>{rule ? "Edit Custom Product Rule" : "Create Custom Product Rule"}</DialogTitle>
              <DialogDescription>
                Configure conditions and actions for product-specific rules
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
              ruleType="product"
              initialData={rule ? {
                rule_name: rule.rule_name,
                product_type: rule.product_type,
                rule_description: rule.rule_description,
                rule_definition: rule.rule_definition,
                rule_actions: rule.rule_actions,
                evaluation_order: rule.evaluation_order,
                evaluation_scope: rule.evaluation_scope,
                is_active: rule.is_active,
                is_mandatory: rule.is_mandatory,
                validation_script: rule.validation_script,
                error_message: rule.error_message,
              } : undefined}
              onDataChange={(data) => {
                setVisualBuilderData(data as CustomProductRuleRequest);
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
              <Input
                id="rule_name"
                {...register("rule_name")}
                placeholder="e.g., High Income Eligibility Rule"
              />
              {errors.rule_name && (
                <p className="text-sm text-destructive">{errors.rule_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_type">Product Type *</Label>
              <Controller
                name="product_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="product_type">
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.product_type && (
                <p className="text-sm text-destructive">{errors.product_type.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule_description">Description</Label>
            <Textarea
              id="rule_description"
              {...register("rule_description")}
              placeholder="Describe what this rule does..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rule_type">Rule Type *</Label>
              <Controller
                name="rule_definition.rule_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rule type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eligibility">Eligibility</SelectItem>
                      <SelectItem value="limit_calculation">Limit Calculation</SelectItem>
                      <SelectItem value="pricing">Pricing</SelectItem>
                      <SelectItem value="approval">Approval</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evaluation_scope">Evaluation Scope</Label>
              <Controller
                name="evaluation_scope"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="eligibility">Eligibility</SelectItem>
                      <SelectItem value="scoring">Scoring</SelectItem>
                      <SelectItem value="pricing">Pricing</SelectItem>
                      <SelectItem value="approval">Approval</SelectItem>
                    </SelectContent>
                  </Select>
                )}
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
              name="rule_definition.logical_operator"
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
              const fieldValue = watch(`rule_definition.conditions.${index}.field`);
              const fieldType = fieldValue ? inferFieldType(fieldValue) : "string";
              const availableOperators = getOperatorsForField(fieldType);

              return (
                <div key={field.id} className="flex gap-2 items-start p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <Input
                        placeholder="Field name"
                        {...register(`rule_definition.conditions.${index}.field`)}
                      />
                    </div>
                    <Controller
                      name={`rule_definition.conditions.${index}.operator`}
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
                      {...register(`rule_definition.conditions.${index}.value`)}
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

            {errors.rule_definition?.conditions && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {errors.rule_definition.conditions.message}
                </AlertDescription>
              </Alert>
            )}
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
                    type: "set_limit",
                    value: "",
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Action
              </Button>
            </div>

            {actionFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start p-3 border rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Controller
                    name={`rule_actions.${index}.type`}
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Action type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="set_limit">Set Limit</SelectItem>
                          <SelectItem value="adjust_interest_rate">Adjust Interest Rate</SelectItem>
                          <SelectItem value="approve">Approve</SelectItem>
                          <SelectItem value="reject">Reject</SelectItem>
                          <SelectItem value="require_review">Require Review</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Input
                    placeholder="Value or calculation"
                    {...register(`rule_actions.${index}.value`)}
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

            {errors.rule_actions && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errors.rule_actions.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="evaluation_order">Evaluation Order</Label>
              <Input
                id="evaluation_order"
                type="number"
                {...register("evaluation_order", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label>Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="is_mandatory"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label>Mandatory</Label>
            </div>
          </div>

          {errors.root && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}

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

