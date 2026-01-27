"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerRegistrationFormData } from "@/lib/utils/customerRegistrationSchema";

interface Step1BasicInfoProps {
  formMethods?: any; // For backward compatibility
}

export function Step1BasicInfo({ formMethods: _ }: Step1BasicInfoProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CustomerRegistrationFormData>();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Customer ID */}
        <div className="space-y-2">
          <Label htmlFor="customer_id">
            Customer ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customer_id"
            placeholder="CUST_001"
            {...register("customer_id")}
          />
          {errors.customer_id && (
            <p className="text-sm text-destructive">
              {errors.customer_id.message}
            </p>
          )}
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="full_name"
            placeholder="Abebe Kebede"
            {...register("full_name")}
          />
          {errors.full_name && (
            <p className="text-sm text-destructive">
              {errors.full_name.message}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone_number">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone_number"
            placeholder="+251911234567"
            {...register("phone_number")}
          />
          {errors.phone_number && (
            <p className="text-sm text-destructive">
              {errors.phone_number.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="customer@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* ID Number */}
        <div className="space-y-2">
          <Label htmlFor="id_number">
            Ethiopian ID Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="id_number"
            placeholder="1234567890123456"
            maxLength={16}
            {...register("id_number")}
          />
          {errors.id_number && (
            <p className="text-sm text-destructive">
              {errors.id_number.message}
            </p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            {...register("date_of_birth")}
          />
          {errors.date_of_birth && (
            <p className="text-sm text-destructive">
              {errors.date_of_birth.message}
            </p>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && (
            <p className="text-sm text-destructive">
              {errors.gender.message}
            </p>
          )}
        </div>

        {/* Marital Status */}
        <div className="space-y-2">
          <Label htmlFor="marital_status">Marital Status</Label>
          <Controller
            name="marital_status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="marital_status">
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.marital_status && (
            <p className="text-sm text-destructive">
              {errors.marital_status.message}
            </p>
          )}
        </div>

        {/* Number of Dependents */}
        <div className="space-y-2">
          <Label htmlFor="number_of_dependents">Number of Dependents</Label>
          <Input
            id="number_of_dependents"
            type="number"
            min="0"
            max="20"
            placeholder="0"
            {...register("number_of_dependents", { valueAsNumber: true })}
          />
          {errors.number_of_dependents && (
            <p className="text-sm text-destructive">
              {errors.number_of_dependents.message}
            </p>
          )}
        </div>

        {/* Region */}
        <div className="space-y-2">
          <Label htmlFor="region">
            Region <span className="text-destructive">*</span>
          </Label>
          <Input
            id="region"
            placeholder="Addis Ababa"
            {...register("region")}
          />
          {errors.region && (
            <p className="text-sm text-destructive">
              {errors.region.message}
            </p>
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            placeholder="Addis Ababa"
            {...register("city")}
          />
          {errors.city && (
            <p className="text-sm text-destructive">
              {errors.city.message}
            </p>
          )}
        </div>

        {/* Sub City */}
        <div className="space-y-2">
          <Label htmlFor="sub_city">Sub City</Label>
          <Input
            id="sub_city"
            placeholder="Bole"
            {...register("sub_city")}
          />
          {errors.sub_city && (
            <p className="text-sm text-destructive">
              {errors.sub_city.message}
            </p>
          )}
        </div>

        {/* Postal Code */}
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal Code</Label>
          <Input
            id="postal_code"
            placeholder="1000"
            {...register("postal_code")}
          />
          {errors.postal_code && (
            <p className="text-sm text-destructive">
              {errors.postal_code.message}
            </p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2 col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Street address, house number"
            {...register("address")}
          />
          {errors.address && (
            <p className="text-sm text-destructive">
              {errors.address.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

