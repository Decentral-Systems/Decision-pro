"use client";

import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreditScoringSectionProps } from "../../types/credit_scoring_form.types";

export function CreditScoringEmploymentTab({
  register,
  control,
}: CreditScoringSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employment Information</CardTitle>
        <CardDescription>Employment status and details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="employment_status">Employment Status *</Label>
            <Controller
              name="employment_status"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self_employed">Self Employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="years_employed">Years Employed *</Label>
            <Input
              id="years_employed"
              type="number"
              step="0.1"
              {...register("years_employed", { valueAsNumber: true })}
              placeholder="5"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="employer_name">Employer Name</Label>
            <Input
              id="employer_name"
              {...register("employer_name")}
              placeholder="Company Name"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
