"use client";

import { useFormContext, Controller } from "react-hook-form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, Banknote, Smartphone, ShieldCheck, History, MoreHorizontal, Wifi } from "lucide-react";
import { CustomerRegistrationFormData } from "@/lib/utils/customerRegistrationSchema";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

interface AdvancedRegistrationSectionsProps {
  formMethods?: any;
}

export function AdvancedRegistrationSections({ formMethods: _ }: AdvancedRegistrationSectionsProps) {
  const { register, control, formState: { errors } } = useFormContext<CustomerRegistrationFormData>();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>Advanced sections contain optional fields for comprehensive customer profiling. 
        These fields help improve credit scoring accuracy but are not required for basic registration.</p>
      </div>

      {/* Detailed Bank Data Section */}
      <Collapsible
        open={openSections.has("bank_details")}
        onOpenChange={() => toggleSection("bank_details")}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex flex-col items-start">
              <span className="font-semibold">Detailed Bank Data</span>
              <span className="text-xs text-muted-foreground">Balance patterns, salary deposits, transaction patterns, NSF data</span>
            </div>
            {openSections.has("bank_details") ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 p-4 border rounded-lg">
          {/* Balance Data Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Balance Data</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_avg_balance_1m">Average Balance - 1 Month (ETB)</Label>
                <Input
                  id="bank_avg_balance_1m"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="15000"
                  {...register("bank_avg_balance_1m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_avg_balance_3m">Average Balance - 3 Months (ETB)</Label>
                <Input
                  id="bank_avg_balance_3m"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="18000"
                  {...register("bank_avg_balance_3m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="average_daily_balance_90d">Average Daily Balance - 90 Days (ETB)</Label>
                <Input
                  id="average_daily_balance_90d"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="20000"
                  {...register("average_daily_balance_90d" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_balance_90d">Minimum Balance - 90 Days (ETB)</Label>
                <Input
                  id="min_balance_90d"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5000"
                  {...register("min_balance_90d" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_balance_90d">Maximum Balance - 90 Days (ETB)</Label>
                <Input
                  id="max_balance_90d"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="35000"
                  {...register("max_balance_90d" as any, { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Salary Patterns Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Salary Patterns</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary_deposit_count_3m">Salary Deposits - 3 Months</Label>
                <Input
                  id="salary_deposit_count_3m"
                  type="number"
                  min="0"
                  placeholder="3"
                  {...register("salary_deposit_count_3m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_deposit_count_6m">Salary Deposits - 6 Months</Label>
                <Input
                  id="salary_deposit_count_6m"
                  type="number"
                  min="0"
                  placeholder="6"
                  {...register("salary_deposit_count_6m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_deposit_count_12m">Salary Deposits - 12 Months</Label>
                <Input
                  id="salary_deposit_count_12m"
                  type="number"
                  min="0"
                  placeholder="12"
                  {...register("salary_deposit_count_12m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_regular_day_match_rate">Salary Regular Day Match Rate (0-1)</Label>
                <Input
                  id="salary_regular_day_match_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.85"
                  {...register("salary_regular_day_match_rate" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_amount_avg">Average Salary Amount (ETB)</Label>
                <Input
                  id="salary_amount_avg"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="30000"
                  {...register("salary_amount_avg" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_amount_std">Salary Amount Std Deviation (ETB)</Label>
                <Input
                  id="salary_amount_std"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="2000"
                  {...register("salary_amount_std" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_inflow_consistency_score">Salary Inflow Consistency Score (0-100)</Label>
                <Input
                  id="salary_inflow_consistency_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="85"
                  {...register("salary_inflow_consistency_score" as any, { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Transaction Patterns Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Transaction Patterns</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="net_inflow_volatility_90d">Net Inflow Volatility - 90 Days</Label>
                <Input
                  id="net_inflow_volatility_90d"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.15"
                  {...register("net_inflow_volatility_90d" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="net_inflow_volatility_6m">Net Inflow Volatility - 6 Months</Label>
                <Input
                  id="net_inflow_volatility_6m"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.12"
                  {...register("net_inflow_volatility_6m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_inflow_avg">Monthly Inflow Average (ETB)</Label>
                <Input
                  id="monthly_inflow_avg"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="35000"
                  {...register("monthly_inflow_avg" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_outflow_avg">Monthly Outflow Average (ETB)</Label>
                <Input
                  id="monthly_outflow_avg"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="28000"
                  {...register("monthly_outflow_avg" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_net_flow_avg">Monthly Net Flow Average (ETB)</Label>
                <Input
                  id="monthly_net_flow_avg"
                  type="number"
                  step="0.01"
                  placeholder="7000"
                  {...register("monthly_net_flow_avg" as any, { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Balance Patterns Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Balance Patterns</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number_of_negative_balance_days_90d">Negative Balance Days - 90 Days</Label>
                <Input
                  id="number_of_negative_balance_days_90d"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("number_of_negative_balance_days_90d" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number_of_negative_balance_days_6m">Negative Balance Days - 6 Months</Label>
                <Input
                  id="number_of_negative_balance_days_6m"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("number_of_negative_balance_days_6m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_of_month_cash_crunch_indicator">End of Month Cash Crunch</Label>
                <Controller
                  name="end_of_month_cash_crunch_indicator" as any
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="end_of_month_cash_crunch_indicator"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="end_of_month_cash_crunch_indicator" className="cursor-pointer">
                        {field.value ? "Yes" : "No"}
                      </Label>
                    </div>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overdraft_usage_days_90d">Overdraft Usage Days - 90 Days</Label>
                <Input
                  id="overdraft_usage_days_90d"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("overdraft_usage_days_90d" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overdraft_usage_days_6m">Overdraft Usage Days - 6 Months</Label>
                <Input
                  id="overdraft_usage_days_6m"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("overdraft_usage_days_6m" as any, { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Patterns Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Payment Patterns</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="utility_bill_payment_count_12m">Utility Bill Payments - 12 Months</Label>
                <Input
                  id="utility_bill_payment_count_12m"
                  type="number"
                  min="0"
                  placeholder="12"
                  {...register("utility_bill_payment_count_12m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utility_bill_payment_count_6m">Utility Bill Payments - 6 Months</Label>
                <Input
                  id="utility_bill_payment_count_6m"
                  type="number"
                  min="0"
                  placeholder="6"
                  {...register("utility_bill_payment_count_6m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utility_bill_on_time_rate">Utility Bill On-Time Rate (0-1)</Label>
                <Input
                  id="utility_bill_on_time_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.96"
                  {...register("utility_bill_on_time_rate" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utility_on_time_rate_12m">Utility On-Time Rate - 12 Months (0-1)</Label>
                <Input
                  id="utility_on_time_rate_12m"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.94"
                  {...register("utility_on_time_rate_12m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utility_recent_missed_bills_3m_flag">Recent Missed Bills (3m)</Label>
                <Controller
                  name="utility_recent_missed_bills_3m_flag" as any
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="utility_recent_missed_bills_3m_flag"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="utility_recent_missed_bills_3m_flag" className="cursor-pointer">
                        {field.value ? "Yes" : "No"}
                      </Label>
                    </div>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telecom_on_time_rate_12m">Telecom On-Time Rate - 12 Months (0-1)</Label>
                <Input
                  id="telecom_on_time_rate_12m"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.98"
                  {...register("telecom_on_time_rate_12m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telecom_payment_count_12m">Telecom Payments - 12 Months</Label>
                <Input
                  id="telecom_payment_count_12m"
                  type="number"
                  min="0"
                  placeholder="12"
                  {...register("telecom_payment_count_12m" as any, { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Transaction Anomalies Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Transaction Anomalies</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="merchant_spend_ratio">Merchant Spend Ratio (0-1)</Label>
                <Input
                  id="merchant_spend_ratio"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.35"
                  {...register("merchant_spend_ratio" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cash_deposit_anomaly_flag">Cash Deposit Anomaly</Label>
                <Controller
                  name="cash_deposit_anomaly_flag" as any
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="cash_deposit_anomaly_flag"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="cash_deposit_anomaly_flag" className="cursor-pointer">
                        {field.value ? "Yes" : "No"}
                      </Label>
                    </div>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cash_deposit_count_6m">Cash Deposit Count - 6 Months</Label>
                <Input
                  id="cash_deposit_count_6m"
                  type="number"
                  min="0"
                  placeholder="3"
                  {...register("cash_deposit_count_6m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cash_deposit_amount_avg">Average Cash Deposit Amount (ETB)</Label>
                <Input
                  id="cash_deposit_amount_avg"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5000"
                  {...register("cash_deposit_amount_avg" as any, { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* NSF and Returned Payments Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">NSF and Returned Payments</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nsf_count_6m">NSF Count - 6 Months</Label>
                <Input
                  id="nsf_count_6m"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("nsf_count_6m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nsf_count_12m">NSF Count - 12 Months</Label>
                <Input
                  id="nsf_count_12m"
                  type="number"
                  min="0"
                  placeholder="1"
                  {...register("nsf_count_12m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nsf_frequency_6m">NSF Frequency - 6 Months</Label>
                <Input
                  id="nsf_frequency_6m"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.0"
                  {...register("nsf_frequency_6m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returned_payment_count_6m">Returned Payment Count - 6 Months</Label>
                <Input
                  id="returned_payment_count_6m"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("returned_payment_count_6m" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returned_payment_count_12m">Returned Payment Count - 12 Months</Label>
                <Input
                  id="returned_payment_count_12m"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("returned_payment_count_12m" as any, { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Recurring Patterns Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Recurring Patterns</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recurring_payment_count">Recurring Payment Count</Label>
                <Input
                  id="recurring_payment_count"
                  type="number"
                  min="0"
                  placeholder="8"
                  {...register("recurring_payment_count" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurring_payment_amount_avg">Average Recurring Payment Amount (ETB)</Label>
                <Input
                  id="recurring_payment_amount_avg"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="2500"
                  {...register("recurring_payment_amount_avg" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscription_payment_count">Subscription Payment Count</Label>
                <Input
                  id="subscription_payment_count"
                  type="number"
                  min="0"
                  placeholder="3"
                  {...register("subscription_payment_count" as any, { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Mobile Money Section */}
      <Collapsible
        open={openSections.has("mobile_money")}
        onOpenChange={() => toggleSection("mobile_money")}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex flex-col items-start">
              <span className="font-semibold">Mobile Money</span>
              <span className="text-xs text-muted-foreground">Mobile money provider, transaction patterns, airtime purchases</span>
            </div>
            {openSections.has("mobile_money") ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 p-4 border rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile_money_provider">Mobile Money Provider</Label>
              <Input
                id="mobile_money_provider"
                placeholder="M-Pesa, M-Pesa, etc."
                {...register("mobile_money_provider" as any)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile_money_account_number">Account Number</Label>
              <Input
                id="mobile_money_account_number"
                placeholder="0911234567"
                {...register("mobile_money_account_number" as any)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile_money_inflow_outflow_ratio">Inflow/Outflow Ratio</Label>
              <Input
                id="mobile_money_inflow_outflow_ratio"
                type="number"
                step="0.01"
                min="0"
                placeholder="1.18"
                {...register("mobile_money_inflow_outflow_ratio" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile_money_transaction_count_90d">Transaction Count - 90 Days</Label>
              <Input
                id="mobile_money_transaction_count_90d"
                type="number"
                min="0"
                placeholder="85"
                {...register("mobile_money_transaction_count_90d" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile_money_txn_volume_90d">Transaction Volume - 90 Days (ETB)</Label>
              <Input
                id="mobile_money_txn_volume_90d"
                type="number"
                step="0.01"
                min="0"
                placeholder="125000"
                {...register("mobile_money_txn_volume_90d" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile_money_avg_balance_90d">Average Balance - 90 Days (ETB)</Label>
              <Input
                id="mobile_money_avg_balance_90d"
                type="number"
                step="0.01"
                min="0"
                placeholder="8500"
                {...register("mobile_money_avg_balance_90d" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="momo_cash_out_velocity_48hr">M-Pesa Cash Out Velocity - 48hr</Label>
              <Input
                id="momo_cash_out_velocity_48hr"
                type="number"
                min="0"
                placeholder="2"
                {...register("momo_cash_out_velocity_48hr" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="momo_cash_out_count_90d">M-Pesa Cash Out Count - 90 Days</Label>
              <Input
                id="momo_cash_out_count_90d"
                type="number"
                min="0"
                placeholder="25"
                {...register("momo_cash_out_count_90d" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="momo_cash_in_count_90d">M-Pesa Cash In Count - 90 Days</Label>
              <Input
                id="momo_cash_in_count_90d"
                type="number"
                min="0"
                placeholder="30"
                {...register("momo_cash_in_count_90d" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="momo_transfer_count_90d">M-Pesa Transfer Count - 90 Days</Label>
              <Input
                id="momo_transfer_count_90d"
                type="number"
                min="0"
                placeholder="20"
                {...register("momo_transfer_count_90d" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="airtime_purchase_pattern_score">Airtime Purchase Pattern Score (0-100)</Label>
              <Input
                id="airtime_purchase_pattern_score"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="70"
                {...register("airtime_purchase_pattern_score" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="airtime_purchase_count_90d">Airtime Purchase Count - 90 Days</Label>
              <Input
                id="airtime_purchase_count_90d"
                type="number"
                min="0"
                placeholder="15"
                {...register("airtime_purchase_count_90d" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="airtime_purchase_amount_avg">Average Airtime Purchase Amount (ETB)</Label>
              <Input
                id="airtime_purchase_amount_avg"
                type="number"
                step="0.01"
                min="0"
                placeholder="50"
                {...register("airtime_purchase_amount_avg" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telecom_spend_ratio">Telecom Spend Ratio (0-1)</Label>
              <Input
                id="telecom_spend_ratio"
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="0.08"
                {...register("telecom_spend_ratio" as any, { valueAsNumber: true })}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* KYC & Verification Section */}
      <Collapsible
        open={openSections.has("kyc")}
        onOpenChange={() => toggleSection("kyc")}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex flex-col items-start">
              <span className="font-semibold">KYC & Verification</span>
              <span className="text-xs text-muted-foreground">KYC level, verification status, fraud detection</span>
            </div>
            {openSections.has("kyc") ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 p-4 border rounded-lg">
          {/* Verification Status Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Verification Status</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kyc_level">KYC Level</Label>
                <Controller
                  name="kyc_level" as any
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="kyc_level">
                        <SelectValue placeholder="Select KYC level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tier1">Tier1</SelectItem>
                        <SelectItem value="Tier2">Tier2</SelectItem>
                        <SelectItem value="Tier3">Tier3</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fayda_verification_status">Fayda Verification Status</Label>
                <Controller
                  name="fayda_verification_status" as any
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="fayda_verification_status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Verified">Verified</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_verification_status">Address Verification Status</Label>
                <Controller
                  name="address_verification_status" as any
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="address_verification_status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Verified">Verified</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source_of_income_verified_flag">Source of Income Verified</Label>
                <Controller
                  name="source_of_income_verified_flag" as any
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="source_of_income_verified_flag"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="source_of_income_verified_flag" className="cursor-pointer">
                        {field.value ? "Yes" : "No"}
                      </Label>
                    </div>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pep_or_sanctions_hit_flag">PEP or Sanctions Hit</Label>
                <Controller
                  name="pep_or_sanctions_hit_flag" as any
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="pep_or_sanctions_hit_flag"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="pep_or_sanctions_hit_flag" className="cursor-pointer">
                        {field.value ? "Yes" : "No"}
                      </Label>
                    </div>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document_expiry_days">Document Expiry Days</Label>
                <Input
                  id="document_expiry_days"
                  type="number"
                  min="0"
                  placeholder="1825"
                  {...register("document_expiry_days" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="id_expiry_date">ID Expiry Date</Label>
                <Input
                  id="id_expiry_date"
                  type="date"
                  {...register("id_expiry_date" as any)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Fraud Detection Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Fraud Detection</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="is_device_emulator">Device Emulator</Label>
                <Controller
                  name="is_device_emulator" as any
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_device_emulator"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="is_device_emulator" className="cursor-pointer">
                        {field.value ? "Yes" : "No"}
                      </Label>
                    </div>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="device_compromise_status">Device Compromise Status</Label>
                <Input
                  id="device_compromise_status"
                  placeholder="Safe, Compromised, etc."
                  {...register("device_compromise_status" as any)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_behavior_anomaly_score">Session Behavior Anomaly Score (0-100)</Label>
                <Input
                  id="session_behavior_anomaly_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="5"
                  {...register("session_behavior_anomaly_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shared_device_fraud_link">Shared Device Fraud Link</Label>
                <Controller
                  name="shared_device_fraud_link" as any
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="shared_device_fraud_link"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="shared_device_fraud_link" className="cursor-pointer">
                        {field.value ? "Yes" : "No"}
                      </Label>
                    </div>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applications_last_30d_across_devices">Applications Last 30d Across Devices</Label>
                <Input
                  id="applications_last_30d_across_devices"
                  type="number"
                  min="0"
                  placeholder="1"
                  {...register("applications_last_30d_across_devices" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="identity_mismatch_types_count">Identity Mismatch Types Count</Label>
                <Input
                  id="identity_mismatch_types_count"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("identity_mismatch_types_count" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sim_swap_recent_flag">SIM Swap Recent</Label>
                <Controller
                  name="sim_swap_recent_flag" as any
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="sim_swap_recent_flag"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="sim_swap_recent_flag" className="cursor-pointer">
                        {field.value ? "Yes" : "No"}
                      </Label>
                    </div>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biometric_liveness_check_status">Biometric Liveness Check Status</Label>
                <Input
                  id="biometric_liveness_check_status"
                  placeholder="Passed, Failed, etc."
                  {...register("biometric_liveness_check_status" as any)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="device_id_consistency_score">Device ID Consistency Score (0-1)</Label>
                <Input
                  id="device_id_consistency_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.98"
                  {...register("device_id_consistency_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_tenure_months">Phone Tenure (Months)</Label>
                <Input
                  id="phone_tenure_months"
                  type="number"
                  min="0"
                  placeholder="24"
                  {...register("phone_tenure_months" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="application_velocity_user_30d">Application Velocity User - 30 Days</Label>
                <Input
                  id="application_velocity_user_30d"
                  type="number"
                  min="0"
                  placeholder="1"
                  {...register("application_velocity_user_30d" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shared_contact_link_flag">Shared Contact Link</Label>
                <Controller
                  name="shared_contact_link_flag" as any
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="shared_contact_link_flag"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="shared_contact_link_flag" className="cursor-pointer">
                        {field.value ? "Yes" : "No"}
                      </Label>
                    </div>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gambling_registration_flag">Gambling Registration</Label>
                <Controller
                  name="gambling_registration_flag" as any
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="gambling_registration_flag"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="gambling_registration_flag" className="cursor-pointer">
                        {field.value ? "Yes" : "No"}
                      </Label>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Digital Behavioral Intelligence Section */}
      <Collapsible
        open={openSections.has("digital_behavioral")}
        onOpenChange={() => toggleSection("digital_behavioral")}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex flex-col items-start">
              <span className="font-semibold">Digital Behavioral Intelligence</span>
              <span className="text-xs text-muted-foreground">App data, SMS logs, social graph, behavioral scores</span>
            </div>
            {openSections.has("digital_behavioral") ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 p-4 border rounded-lg">
          {/* App Data Sub-section */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  <span className="font-medium">App Data</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>App List Categories (Key-Value Pairs)</Label>
                  <p className="text-xs text-muted-foreground">
                    Enter app categories and their counts. Example: finance: 8, shopping: 5
                  </p>
                  <Input
                    placeholder='{"finance": 8, "shopping": 5, "social": 14}'
                    {...register("app_list_categories" as any, {
                      setValueAs: (value: string) => {
                        if (!value) return undefined;
                        try {
                          return JSON.parse(value);
                        } catch {
                          return undefined;
                        }
                      },
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="app_count_total">Total App Count</Label>
                    <Input
                      id="app_count_total"
                      type="number"
                      min="0"
                      placeholder="49"
                      {...register("app_count_total" as any, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app_count_finance">Finance App Count</Label>
                    <Input
                      id="app_count_finance"
                      type="number"
                      min="0"
                      placeholder="8"
                      {...register("app_count_finance" as any, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app_count_shopping">Shopping App Count</Label>
                    <Input
                      id="app_count_shopping"
                      type="number"
                      min="0"
                      placeholder="5"
                      {...register("app_count_shopping" as any, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app_count_social">Social App Count</Label>
                    <Input
                      id="app_count_social"
                      type="number"
                      min="0"
                      placeholder="14"
                      {...register("app_count_social" as any, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app_count_productivity">Productivity App Count</Label>
                    <Input
                      id="app_count_productivity"
                      type="number"
                      min="0"
                      placeholder="6"
                      {...register("app_count_productivity" as any, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app_count_entertainment">Entertainment App Count</Label>
                    <Input
                      id="app_count_entertainment"
                      type="number"
                      min="0"
                      placeholder="12"
                      {...register("app_count_entertainment" as any, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app_count_utilities">Utilities App Count</Label>
                    <Input
                      id="app_count_utilities"
                      type="number"
                      min="0"
                      placeholder="4"
                      {...register("app_count_utilities" as any, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app_engagement_frequency_30d">App Engagement Frequency - 30 Days</Label>
                    <Input
                      id="app_engagement_frequency_30d"
                      type="number"
                      min="0"
                      placeholder="45"
                      {...register("app_engagement_frequency_30d" as any, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app_engagement_frequency_7d">App Engagement Frequency - 7 Days</Label>
                    <Input
                      id="app_engagement_frequency_7d"
                      type="number"
                      min="0"
                      placeholder="12"
                      {...register("app_engagement_frequency_7d" as any, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app_engagement_frequency_90d">App Engagement Frequency - 90 Days</Label>
                    <Input
                      id="app_engagement_frequency_90d"
                      type="number"
                      min="0"
                      placeholder="128"
                      {...register("app_engagement_frequency_90d" as any, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="push_notification_interaction_rate">Push Notification Interaction Rate (0-1)</Label>
                    <Input
                      id="push_notification_interaction_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="0.65"
                      {...register("push_notification_interaction_rate" as any, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="push_notification_sent_count_30d">Push Notifications Sent - 30 Days</Label>
                    <Input
                      id="push_notification_sent_count_30d"
                      type="number"
                      min="0"
                      placeholder="25"
                      {...register("push_notification_sent_count_30d" as any, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="push_notification_opened_count_30d">Push Notifications Opened - 30 Days</Label>
                    <Input
                      id="push_notification_opened_count_30d"
                      type="number"
                      min="0"
                      placeholder="16"
                      {...register("push_notification_opened_count_30d" as any, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_app_open_date">Last App Open Date</Label>
                    <Input
                      id="last_app_open_date"
                      type="date"
                      {...register("last_app_open_date" as any)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="app_install_date">App Install Date</Label>
                    <Input
                      id="app_install_date"
                      type="date"
                      {...register("app_install_date" as any)}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* SMS Logs Sub-section */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  <span className="font-medium">SMS Logs</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sms_financial_logs_available">SMS Financial Logs Available</Label>
                  <Controller
                    name="sms_financial_logs_available" as any
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <Switch
                          id="sms_financial_logs_available"
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="sms_financial_logs_available" className="cursor-pointer">
                          {field.value ? "Yes" : "No"}
                        </Label>
                      </div>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms_active_lenders_count_90d">Active Lenders Count - 90 Days</Label>
                  <Input
                    id="sms_active_lenders_count_90d"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register("sms_active_lenders_count_90d" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms_active_lenders_count_30d">Active Lenders Count - 30 Days</Label>
                  <Input
                    id="sms_active_lenders_count_30d"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register("sms_active_lenders_count_30d" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms_loan_rejection_count_90d">Loan Rejection Count - 90 Days</Label>
                  <Input
                    id="sms_loan_rejection_count_90d"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register("sms_loan_rejection_count_90d" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms_loan_approval_count_90d">Loan Approval Count - 90 Days</Label>
                  <Input
                    id="sms_loan_approval_count_90d"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register("sms_loan_approval_count_90d" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms_transaction_count_90d">SMS Transaction Count - 90 Days</Label>
                  <Input
                    id="sms_transaction_count_90d"
                    type="number"
                    min="0"
                    placeholder="120"
                    {...register("sms_transaction_count_90d" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms_financial_message_count_90d">Financial Message Count - 90 Days</Label>
                  <Input
                    id="sms_financial_message_count_90d"
                    type="number"
                    min="0"
                    placeholder="45"
                    {...register("sms_financial_message_count_90d" as any, { valueAsNumber: true })}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Social Graph Sub-section */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  <span className="font-medium">Social Graph</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="social_graph_connections">Social Graph Connections</Label>
                  <Input
                    id="social_graph_connections"
                    type="number"
                    min="0"
                    placeholder="245"
                    {...register("social_graph_connections" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_book_size">Phone Book Size</Label>
                  <Input
                    id="phone_book_size"
                    type="number"
                    min="0"
                    placeholder="320"
                    {...register("phone_book_size" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="call_log_io_ratio">Call Log Incoming/Outgoing Ratio</Label>
                  <Input
                    id="call_log_io_ratio"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1.2"
                    {...register("call_log_io_ratio" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="call_log_incoming_count_30d">Incoming Calls - 30 Days</Label>
                  <Input
                    id="call_log_incoming_count_30d"
                    type="number"
                    min="0"
                    placeholder="180"
                    {...register("call_log_incoming_count_30d" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="call_log_outgoing_count_30d">Outgoing Calls - 30 Days</Label>
                  <Input
                    id="call_log_outgoing_count_30d"
                    type="number"
                    min="0"
                    placeholder="150"
                    {...register("call_log_outgoing_count_30d" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="peer_vouching_count">Peer Vouching Count</Label>
                  <Input
                    id="peer_vouching_count"
                    type="number"
                    min="0"
                    placeholder="3"
                    {...register("peer_vouching_count" as any, { valueAsNumber: true })}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Behavioral Scores Sub-section */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  <span className="font-medium">Behavioral Scores</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="savings_behavior_score">Savings Behavior Score (0-100)</Label>
                  <Input
                    id="savings_behavior_score"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="75"
                    {...register("savings_behavior_score" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="savings_transaction_count_90d">Savings Transaction Count - 90 Days</Label>
                  <Input
                    id="savings_transaction_count_90d"
                    type="number"
                    min="0"
                    placeholder="12"
                    {...register("savings_transaction_count_90d" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="savings_amount_avg">Average Savings Amount (ETB)</Label>
                  <Input
                    id="savings_amount_avg"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5000"
                    {...register("savings_amount_avg" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discretionary_spend_ratio_90d">Discretionary Spend Ratio - 90 Days (0-1)</Label>
                  <Input
                    id="discretionary_spend_ratio_90d"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.25"
                    {...register("discretionary_spend_ratio_90d" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discretionary_spend_ratio_30d">Discretionary Spend Ratio - 30 Days (0-1)</Label>
                  <Input
                    id="discretionary_spend_ratio_30d"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.28"
                    {...register("discretionary_spend_ratio_30d" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="essential_spend_ratio_90d">Essential Spend Ratio - 90 Days (0-1)</Label>
                  <Input
                    id="essential_spend_ratio_90d"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.75"
                    {...register("essential_spend_ratio_90d" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income_source_count_180d">Income Source Count - 180 Days</Label>
                  <Input
                    id="income_source_count_180d"
                    type="number"
                    min="0"
                    placeholder="2"
                    {...register("income_source_count_180d" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income_source_count_90d">Income Source Count - 90 Days</Label>
                  <Input
                    id="income_source_count_90d"
                    type="number"
                    min="0"
                    placeholder="1"
                    {...register("income_source_count_90d" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shared_household_expense_flag">Shared Household Expense</Label>
                  <Controller
                    name="shared_household_expense_flag" as any
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <Switch
                          id="shared_household_expense_flag"
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="shared_household_expense_flag" className="cursor-pointer">
                          {field.value ? "Yes" : "No"}
                        </Label>
                      </div>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spending_habit_consistency_score">Spending Habit Consistency Score (0-100)</Label>
                  <Input
                    id="spending_habit_consistency_score"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="82"
                    {...register("spending_habit_consistency_score" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_spending_avg">Monthly Spending Average (ETB)</Label>
                  <Input
                    id="monthly_spending_avg"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="28000"
                    {...register("monthly_spending_avg" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_spending_std">Monthly Spending Std Deviation (ETB)</Label>
                  <Input
                    id="monthly_spending_std"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="2000"
                    {...register("monthly_spending_std" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post_payday_spending_spike_ratio">Post Payday Spending Spike Ratio</Label>
                  <Input
                    id="post_payday_spending_spike_ratio"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.15"
                    {...register("post_payday_spending_spike_ratio" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekend_social_spending_volatility">Weekend Social Spending Volatility</Label>
                  <Input
                    id="weekend_social_spending_volatility"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.20"
                    {...register("weekend_social_spending_volatility" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekend_spending_avg">Weekend Spending Average (ETB)</Label>
                  <Input
                    id="weekend_spending_avg"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="3500"
                    {...register("weekend_spending_avg" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekday_spending_avg">Weekday Spending Average (ETB)</Label>
                  <Input
                    id="weekday_spending_avg"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="2500"
                    {...register("weekday_spending_avg" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anonymized_peer_default_rate">Anonymized Peer Default Rate (0-1)</Label>
                  <Input
                    id="anonymized_peer_default_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.05"
                    {...register("anonymized_peer_default_rate" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="network_risk_score">Network Risk Score (0-100)</Label>
                  <Input
                    id="network_risk_score"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="12"
                    {...register("network_risk_score" as any, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_network_centrality_score">Social Network Centrality Score (0-100)</Label>
                  <Input
                    id="social_network_centrality_score"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="65"
                    {...register("social_network_centrality_score" as any, { valueAsNumber: true })}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CollapsibleContent>
      </Collapsible>

      {/* Credit History Section */}
      <Collapsible
        open={openSections.has("credit_history")}
        onOpenChange={() => toggleSection("credit_history")}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex flex-col items-start">
              <span className="font-semibold">Credit History</span>
              <span className="text-xs text-muted-foreground">Prior loans, delinquency flags, credit history length</span>
            </div>
            {openSections.has("credit_history") ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 p-4 border rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prior_loans_count">Prior Loans Count</Label>
              <Input
                id="prior_loans_count"
                type="number"
                min="0"
                placeholder="2"
                {...register("prior_loans_count" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prior_rollover_count">Prior Rollover Count</Label>
              <Input
                id="prior_rollover_count"
                type="number"
                min="0"
                placeholder="1"
                {...register("prior_rollover_count" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recent_delinquency_flag">Recent Delinquency</Label>
              <Controller
                name="recent_delinquency_flag" as any
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="recent_delinquency_flag"
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="recent_delinquency_flag" className="cursor-pointer">
                      {field.value ? "Yes" : "No"}
                    </Label>
                  </div>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prior_default_flag">Prior Default</Label>
              <Controller
                name="prior_default_flag" as any
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="prior_default_flag"
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="prior_default_flag" className="cursor-pointer">
                      {field.value ? "Yes" : "No"}
                    </Label>
                  </div>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit_history_length_months">Credit History Length (Months)</Label>
              <Input
                id="credit_history_length_months"
                type="number"
                min="0"
                placeholder="24"
                {...register("credit_history_length_months" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delinquency_30d_count_12m">30-Day Delinquency Count - 12 Months</Label>
              <Input
                id="delinquency_30d_count_12m"
                type="number"
                min="0"
                placeholder="0"
                {...register("delinquency_30d_count_12m" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delinquency_60d_count_12m">60-Day Delinquency Count - 12 Months</Label>
              <Input
                id="delinquency_60d_count_12m"
                type="number"
                min="0"
                placeholder="0"
                {...register("delinquency_60d_count_12m" as any, { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delinquency_90d_count_12m">90-Day Delinquency Count - 12 Months</Label>
              <Input
                id="delinquency_90d_count_12m"
                type="number"
                min="0"
                placeholder="0"
                {...register("delinquency_90d_count_12m" as any, { valueAsNumber: true })}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Additional Features Section */}
      <Collapsible
        open={openSections.has("additional_features")}
        onOpenChange={() => toggleSection("additional_features")}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex flex-col items-start">
              <span className="font-semibold">Additional Features</span>
              <span className="text-xs text-muted-foreground">Demographics, economic factors, psychological scores</span>
            </div>
            {openSections.has("additional_features") ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 p-4 border rounded-lg">
          {/* Demographics Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Demographics</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  max="120"
                  placeholder="34"
                  {...register("age" as any, { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Location & Community Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Location & Community</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location_stability_score">Location Stability Score (0-1)</Label>
                <Input
                  id="location_stability_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.85"
                  {...register("location_stability_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="community_involvement_score">Community Involvement Score (0-100)</Label>
                <Input
                  id="community_involvement_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="70"
                  {...register("community_involvement_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="continuous_learning_engagement">Continuous Learning Engagement (0-100)</Label>
                <Input
                  id="continuous_learning_engagement"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="65"
                  {...register("continuous_learning_engagement" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="digital_adoption_index">Digital Adoption Index (0-100)</Label>
                <Input
                  id="digital_adoption_index"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="80"
                  {...register("digital_adoption_index" as any, { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Economic Factors Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Economic Factors</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agricultural_dependency_score">Agricultural Dependency Score (0-1)</Label>
                <Input
                  id="agricultural_dependency_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.10"
                  {...register("agricultural_dependency_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remittance_dependency_score">Remittance Dependency Score (0-1)</Label>
                <Input
                  id="remittance_dependency_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.15"
                  {...register("remittance_dependency_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="informal_credit_usage_score">Informal Credit Usage Score (0-1)</Label>
                <Input
                  id="informal_credit_usage_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.20"
                  {...register("informal_credit_usage_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="local_economic_resilience_score">Local Economic Resilience Score (0-1)</Label>
                <Input
                  id="local_economic_resilience_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.75"
                  {...register("local_economic_resilience_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regional_unemployment_rate">Regional Unemployment Rate (0-1)</Label>
                <Input
                  id="regional_unemployment_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.12"
                  {...register("regional_unemployment_rate" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inflation_rate_recent">Recent Inflation Rate (0-1)</Label>
                <Input
                  id="inflation_rate_recent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.18"
                  {...register("inflation_rate_recent" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector_cyclicality_index">Sector Cyclicality Index (0-1)</Label>
                <Input
                  id="sector_cyclicality_index"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.30"
                  {...register("sector_cyclicality_index" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exchange_rate_12m_change">Exchange Rate 12m Change</Label>
                <Input
                  id="exchange_rate_12m_change"
                  type="number"
                  step="0.01"
                  placeholder="0.08"
                  {...register("exchange_rate_12m_change" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conflict_risk_index">Conflict Risk Index (0-1)</Label>
                <Input
                  id="conflict_risk_index"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.05"
                  {...register("conflict_risk_index" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="drought_flood_index">Drought/Flood Index (0-1)</Label>
                <Input
                  id="drought_flood_index"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.10"
                  {...register("drought_flood_index" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="energy_blackout_days_90d">Energy Blackout Days - 90 Days</Label>
                <Input
                  id="energy_blackout_days_90d"
                  type="number"
                  min="0"
                  placeholder="5"
                  {...register("energy_blackout_days_90d" as any, { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Psychological & Behavioral Sub-section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Psychological & Behavioral</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="financial_literacy_score">Financial Literacy Score (0-100)</Label>
                <Input
                  id="financial_literacy_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="78"
                  {...register("financial_literacy_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk_tolerance_score">Risk Tolerance Score (0-1)</Label>
                <Input
                  id="risk_tolerance_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.65"
                  {...register("risk_tolerance_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cognitive_proficiency_score">Cognitive Proficiency Score (0-1)</Label>
                <Input
                  id="cognitive_proficiency_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.75"
                  {...register("cognitive_proficiency_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="behavioral_consistency_score">Behavioral Consistency Score (0-1)</Label>
                <Input
                  id="behavioral_consistency_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.82"
                  {...register("behavioral_consistency_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="online_reputation_score">Online Reputation Score (0-1)</Label>
                <Input
                  id="online_reputation_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.70"
                  {...register("online_reputation_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="microfinance_engagement_score">Microfinance Engagement Score (0-1)</Label>
                <Input
                  id="microfinance_engagement_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.60"
                  {...register("microfinance_engagement_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cooperative_membership_score">Cooperative Membership Score (0-1)</Label>
                <Input
                  id="cooperative_membership_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.55"
                  {...register("cooperative_membership_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conscientiousness_score">Conscientiousness Score (0-1)</Label>
                <Input
                  id="conscientiousness_score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.80"
                  {...register("conscientiousness_score" as any, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscription_lapse_count_12m">Subscription Lapse Count - 12 Months</Label>
                <Input
                  id="subscription_lapse_count_12m"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("subscription_lapse_count_12m" as any, { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Additional Notes */}
      <div className="text-xs text-muted-foreground p-4 bg-muted/50 rounded-lg">
        <p className="font-semibold mb-2">About Advanced Sections:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>These sections contain optional fields for comprehensive customer profiling</li>
          <li>Fields help improve credit scoring accuracy but are not required</li>
          <li>You can complete basic registration without filling these sections</li>
          <li>Full implementation includes 100+ additional fields across all categories</li>
        </ul>
      </div>
    </div>
  );
}

