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
import {
  InlineValidation,
  ValidatedField,
} from "@/components/common/ValidationIndicator";
import type { CreditScoringSectionProps } from "../../types/credit_scoring_form.types";

export function CreditScoringPersonalTab({
  register,
  control,
  errors,
  phoneNumber,
  idNumber,
  phoneValidation,
  idValidation,
}: CreditScoringSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Demographics and location</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="age">Age *</Label>
            <Input
              id="age"
              type="number"
              {...register("age", { valueAsNumber: true })}
              placeholder="35"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <ValidatedField
              status={
                !phoneNumber
                  ? "idle"
                  : phoneValidation?.isValidating
                    ? "validating"
                    : phoneValidation?.valid
                      ? "valid"
                      : "invalid"
              }
            >
              <Input
                id="phone_number"
                {...register("phone_number")}
                placeholder="+251912345678"
                className={
                  phoneValidation?.valid && phoneNumber
                    ? "border-green-500"
                    : ""
                }
              />
            </ValidatedField>
            {phoneNumber != null && phoneValidation != null && (
              <InlineValidation
                status={
                  phoneValidation.isValidating
                    ? "validating"
                    : phoneValidation.valid
                      ? "valid"
                      : "invalid"
                }
                message={
                  phoneValidation.isValidating
                    ? "Validating..."
                    : phoneValidation.valid
                      ? "Valid Ethiopian phone number"
                      : phoneValidation.error || "Invalid format"
                }
              />
            )}
            {errors.phone_number && (
              <p className="text-sm text-destructive">
                {errors.phone_number.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_number">ID Number</Label>
            <ValidatedField
              status={
                !idNumber
                  ? "idle"
                  : idValidation?.isValidating
                    ? "validating"
                    : idValidation?.valid
                      ? "valid"
                      : "invalid"
              }
            >
              <Input
                id="id_number"
                {...register("id_number")}
                placeholder="1234567890"
                maxLength={10}
                className={
                  idValidation?.valid && idNumber ? "border-green-500" : ""
                }
              />
            </ValidatedField>
            {idNumber != null && idValidation != null && (
              <InlineValidation
                status={
                  idValidation.isValidating
                    ? "validating"
                    : idValidation.valid
                      ? "valid"
                      : "invalid"
                }
                message={
                  idValidation.isValidating
                    ? "Validating..."
                    : idValidation.valid
                      ? "Valid Ethiopian ID number"
                      : idValidation.error || "Must be exactly 10 digits"
                }
              />
            )}
            {errors.id_number && (
              <p className="text-sm text-destructive">
                {errors.id_number.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              {...register("region")}
              placeholder="Addis Ababa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="urban_rural">Urban/Rural</Label>
            <Controller
              name="urban_rural"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urban">Urban</SelectItem>
                    <SelectItem value="rural">Rural</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_sector">Business Sector</Label>
            <Input
              id="business_sector"
              {...register("business_sector")}
              placeholder="Technology"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guarantor_available">Guarantor Available</Label>
            <Controller
              name="guarantor_available"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => field.onChange(value === "true")}
                  value={field.value?.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
