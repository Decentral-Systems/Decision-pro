"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CreditScoringSectionProps } from "../../types/credit_scoring_form.types";

export function CreditScoringCreditHistoryTab({
  register,
  errors,
}: CreditScoringSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit History</CardTitle>
        <CardDescription>Credit accounts and payment history</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="credit_history_length">
              Credit History Length (Years) *
            </Label>
            <Input
              id="credit_history_length"
              type="number"
              {...register("credit_history_length", {
                valueAsNumber: true,
              })}
              placeholder="5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="number_of_credit_accounts">
              Number of Credit Accounts *
            </Label>
            <Input
              id="number_of_credit_accounts"
              type="number"
              {...register("number_of_credit_accounts", {
                valueAsNumber: true,
              })}
              placeholder="3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_history_score">
              Payment History Score (0-100) *
            </Label>
            <Input
              id="payment_history_score"
              type="number"
              {...register("payment_history_score", {
                valueAsNumber: true,
              })}
              placeholder="85"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="number_of_late_payments">
              Number of Late Payments *
            </Label>
            <Input
              id="number_of_late_payments"
              type="number"
              {...register("number_of_late_payments", {
                valueAsNumber: true,
              })}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="number_of_defaults">Number of Defaults *</Label>
            <Input
              id="number_of_defaults"
              type="number"
              {...register("number_of_defaults", { valueAsNumber: true })}
              placeholder="0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
