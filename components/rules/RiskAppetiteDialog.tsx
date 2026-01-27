"use client";

import { useForm, Controller } from "react-hook-form";
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
import { AlertTriangle, Loader2 } from "lucide-react";
import { useCreateRiskAppetiteConfig, useUpdateRiskAppetiteConfig } from "@/lib/api/hooks/useRules";
import { useToast } from "@/hooks/use-toast";
import { riskAppetiteConfigRequestSchema } from "@/lib/validations/rules";
import { RiskAppetiteConfig, RiskAppetiteConfigRequest } from "@/types/rules";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRODUCT_TYPES, getAllCustomerSegments, RISK_TOLERANCE_LEVELS } from "@/lib/constants/rules";

type RiskAppetiteFormData = RiskAppetiteConfigRequest;

interface RiskAppetiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: RiskAppetiteConfig;
  onSuccess?: () => void;
}

export function RiskAppetiteDialog({
  open,
  onOpenChange,
  config,
  onSuccess,
}: RiskAppetiteDialogProps) {
  const { toast } = useToast();
  const createConfig = useCreateRiskAppetiteConfig();
  const updateConfig = useUpdateRiskAppetiteConfig();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RiskAppetiteFormData>({
    resolver: zodResolver(riskAppetiteConfigRequestSchema),
    defaultValues: config
      ? {
          config_name: config.config_name,
          config_type: config.config_type,
          product_type: config.product_type,
          customer_segment: config.customer_segment,
          risk_parameters: config.risk_parameters,
          limit_adjustments: config.limit_adjustments,
          interest_rate_adjustments: config.interest_rate_adjustments,
          approval_rules: config.approval_rules,
          is_active: config.is_active,
          priority: config.priority,
          description: config.description,
        }
      : {
          config_name: "",
          config_type: "global",
          risk_parameters: {},
          limit_adjustments: {
            base_multiplier: 1.0,
            risk_adjustment_factors: {
              low_risk: 1.2,
              medium_risk: 1.0,
              high_risk: 0.7,
              critical_risk: 0.3,
            },
          },
          interest_rate_adjustments: {
            base_rate: 0.15,
            risk_premiums: {
              low_risk: -0.02,
              medium_risk: 0.0,
              high_risk: 0.05,
              critical_risk: 0.10,
            },
          },
          is_active: true,
          priority: 0,
        },
  });

  const onSubmit = async (data: RiskAppetiteFormData) => {
    try {
      if (config) {
        await updateConfig.mutateAsync({ configId: config.id, config: data });
        toast({
          title: "Success",
          description: "Risk appetite configuration updated successfully",
        });
      } else {
        await createConfig.mutateAsync(data);
        toast({
          title: "Success",
          description: "Risk appetite configuration created successfully",
        });
      }
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {config ? "Edit Risk Appetite Configuration" : "Create Risk Appetite Configuration"}
          </DialogTitle>
          <DialogDescription>
            Configure risk parameters, limits, and interest rates
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="config_name">Config Name *</Label>
              <Input id="config_name" {...register("config_name")} />
              {errors.config_name && (
                <p className="text-sm text-destructive">{errors.config_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="config_type">Config Type *</Label>
              <Controller
                name="config_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="segment">Segment</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <Tabs defaultValue="risk" className="w-full">
            <TabsList>
              <TabsTrigger value="risk">Risk Parameters</TabsTrigger>
              <TabsTrigger value="limits">Limit Adjustments</TabsTrigger>
              <TabsTrigger value="rates">Interest Rates</TabsTrigger>
              <TabsTrigger value="approval">Approval Rules</TabsTrigger>
            </TabsList>

            <TabsContent value="risk" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_credit_score">Min Credit Score</Label>
                  <Input
                    id="min_credit_score"
                    type="number"
                    {...register("risk_parameters.min_credit_score_threshold", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_credit_score">Max Credit Score</Label>
                  <Input
                    id="max_credit_score"
                    type="number"
                    {...register("risk_parameters.max_credit_score_threshold", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_default_prob">Max Default Probability</Label>
                  <Input
                    id="max_default_prob"
                    type="number"
                    step="0.01"
                    {...register("risk_parameters.max_default_probability", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="risk_tolerance">Risk Tolerance</Label>
                  <Controller
                    name="risk_parameters.risk_tolerance_level"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tolerance" />
                        </SelectTrigger>
                        <SelectContent>
                          {RISK_TOLERANCE_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="limits" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_multiplier">Base Multiplier</Label>
                  <Input
                    id="base_multiplier"
                    type="number"
                    step="0.1"
                    {...register("limit_adjustments.base_multiplier", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_limit">Min Limit (ETB)</Label>
                  <Input
                    id="min_limit"
                    type="number"
                    {...register("limit_adjustments.min_limit_etb", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_limit">Max Limit (ETB)</Label>
                  <Input
                    id="max_limit"
                    type="number"
                    {...register("limit_adjustments.max_limit_etb", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Risk Adjustment Factors</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="low_risk_factor">Low Risk</Label>
                    <Input
                      id="low_risk_factor"
                      type="number"
                      step="0.1"
                      {...register("limit_adjustments.risk_adjustment_factors.low_risk", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medium_risk_factor">Medium Risk</Label>
                    <Input
                      id="medium_risk_factor"
                      type="number"
                      step="0.1"
                      {...register("limit_adjustments.risk_adjustment_factors.medium_risk", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="high_risk_factor">High Risk</Label>
                    <Input
                      id="high_risk_factor"
                      type="number"
                      step="0.1"
                      {...register("limit_adjustments.risk_adjustment_factors.high_risk", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="critical_risk_factor">Critical Risk</Label>
                    <Input
                      id="critical_risk_factor"
                      type="number"
                      step="0.1"
                      {...register("limit_adjustments.risk_adjustment_factors.critical_risk", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rates" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="base_rate">Base Rate (%)</Label>
                <Input
                  id="base_rate"
                  type="number"
                  step="0.01"
                  {...register("interest_rate_adjustments.base_rate", {
                    valueAsNumber: true,
                  })}
                  defaultValue={0.15}
                />
              </div>
              <div className="space-y-2">
                <Label>Risk Premiums (%)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="low_risk_premium">Low Risk</Label>
                    <Input
                      id="low_risk_premium"
                      type="number"
                      step="0.01"
                      {...register("interest_rate_adjustments.risk_premiums.low_risk", {
                        valueAsNumber: true,
                      })}
                      defaultValue={-0.02}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medium_risk_premium">Medium Risk</Label>
                    <Input
                      id="medium_risk_premium"
                      type="number"
                      step="0.01"
                      {...register("interest_rate_adjustments.risk_premiums.medium_risk", {
                        valueAsNumber: true,
                      })}
                      defaultValue={0.0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="high_risk_premium">High Risk</Label>
                    <Input
                      id="high_risk_premium"
                      type="number"
                      step="0.01"
                      {...register("interest_rate_adjustments.risk_premiums.high_risk", {
                        valueAsNumber: true,
                      })}
                      defaultValue={0.05}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="critical_risk_premium">Critical Risk</Label>
                    <Input
                      id="critical_risk_premium"
                      type="number"
                      step="0.01"
                      {...register("interest_rate_adjustments.risk_premiums.critical_risk", {
                        valueAsNumber: true,
                      })}
                      defaultValue={0.10}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="approval" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Auto Approve Conditions</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="auto_approve_min_score">Min Credit Score</Label>
                      <Input
                        id="auto_approve_min_score"
                        type="number"
                        {...register("approval_rules.auto_approve_conditions.min_credit_score", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="auto_approve_max_prob">Max Default Prob</Label>
                      <Input
                        id="auto_approve_max_prob"
                        type="number"
                        step="0.01"
                        {...register("approval_rules.auto_approve_conditions.max_default_prob", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="auto_approve_max_fraud">Max Fraud Score</Label>
                      <Input
                        id="auto_approve_max_fraud"
                        type="number"
                        {...register("approval_rules.auto_approve_conditions.max_fraud_score", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Auto Reject Conditions</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="auto_reject_max_score">Max Credit Score</Label>
                      <Input
                        id="auto_reject_max_score"
                        type="number"
                        {...register("approval_rules.auto_reject_conditions.max_credit_score", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="auto_reject_min_prob">Min Default Prob</Label>
                      <Input
                        id="auto_reject_min_prob"
                        type="number"
                        step="0.01"
                        {...register("approval_rules.auto_reject_conditions.min_default_prob", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="auto_reject_min_fraud">Min Fraud Score</Label>
                      <Input
                        id="auto_reject_min_fraud"
                        type="number"
                        {...register("approval_rules.auto_reject_conditions.min_fraud_score", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" type="number" {...register("priority", { valueAsNumber: true })} />
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
            <Button type="submit" disabled={createConfig.isPending || updateConfig.isPending}>
              {(createConfig.isPending || updateConfig.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {config ? "Update" : "Create"} Configuration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

