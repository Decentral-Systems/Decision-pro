"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useUpdateCustomer } from "@/lib/api/hooks/useCustomers";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

// Validation schema for customer update (same as creation but customer_id is optional)
const customerUpdateSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(200, "Full name must be less than 200 characters").optional(),
  phone_number: z.string()
    .regex(/^(\+251|0)[0-9]{9}$/, "Invalid Ethiopian phone number format. Use +251XXXXXXXXX or 0XXXXXXXXX").optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  id_number: z.string()
    .regex(/^[0-9]{10}$/, "Ethiopian ID number must be exactly 10 digits").optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format").optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  marital_status: z.enum(["Single", "Married", "Divorced", "Widowed"]).optional(),
  region: z.string().min(1, "Region is required").max(100).optional(),
  city: z.string().min(1, "City is required").max(100).optional(),
  address: z.string().max(500).optional(),
  monthly_income: z.number().min(0, "Monthly income must be positive").optional(),
  employment_status: z.enum(["Employed", "Self-Employed", "Unemployed", "Student", "Retired"]).optional(),
  employer_name: z.string().max(200).optional(),
  bank_name: z.string().max(200).optional(),
  bank_account_number: z.string().max(50).optional(),
});

type CustomerUpdateFormData = z.infer<typeof customerUpdateSchema>;

interface CustomerEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerData?: any;
  onSuccess?: () => void;
}

export function CustomerEditDialog({
  open,
  onOpenChange,
  customerId,
  customerData,
  onSuccess,
}: CustomerEditDialogProps) {
  const { toast } = useToast();
  const updateCustomer = useUpdateCustomer();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CustomerUpdateFormData>({
    resolver: zodResolver(customerUpdateSchema),
  });

  // Populate form when customer data is loaded
  useEffect(() => {
    if (customerData && open) {
      const customer = customerData.customer || customerData;
      const profile = customerData.profile || customerData;
      
      reset({
        full_name: customer.full_name || profile?.full_name || "",
        phone_number: customer.phone_number || profile?.phone_number || "",
        email: customer.email || profile?.email || "",
        id_number: customer.id_number || profile?.id_number || "",
        date_of_birth: customer.date_of_birth || profile?.date_of_birth || "",
        gender: customer.gender || profile?.gender || "Male",
        marital_status: customer.marital_status || profile?.marital_status || "Single",
        region: customer.region || profile?.region || "",
        city: customer.city || profile?.city || "",
        address: customer.address || profile?.address || "",
        monthly_income: customer.monthly_income || profile?.monthly_income || undefined,
        employment_status: customer.employment_status || profile?.employment_status || "Employed",
        employer_name: customer.employer_name || profile?.employer_name || "",
        bank_name: customer.bank_name || profile?.bank_name || "",
        bank_account_number: customer.bank_account_number || profile?.bank_account_number || "",
      });
    }
  }, [customerData, open, reset]);

  const onSubmit = async (data: CustomerUpdateFormData) => {
    try {
      // Transform form data to API format (only include fields that have values)
      const updateData: any = {};

      if (data.full_name) updateData.full_name = data.full_name;
      if (data.phone_number) updateData.phone_number = data.phone_number;
      if (data.email) updateData.email = data.email;
      if (data.id_number) updateData.id_number = data.id_number;
      if (data.date_of_birth) updateData.date_of_birth = data.date_of_birth;
      if (data.gender) updateData.gender = data.gender;
      if (data.marital_status) updateData.marital_status = data.marital_status;
      if (data.region) updateData.region = data.region;
      if (data.city) updateData.city = data.city;
      if (data.address) updateData.address = data.address;
      if (data.monthly_income !== undefined) updateData.monthly_income = data.monthly_income;
      if (data.employment_status) updateData.employment_status = data.employment_status;
      if (data.employer_name) updateData.employer_name = data.employer_name;
      if (data.bank_name) updateData.bank_name = data.bank_name;
      if (data.bank_account_number) updateData.bank_account_number = data.bank_account_number;

      await updateCustomer.mutateAsync({ customerId, data: updateData });
      
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Failed to update customer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Update customer information. Only fields with values will be updated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {updateCustomer.isError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {updateCustomer.error?.message || "Failed to update customer"}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
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
              <Label htmlFor="phone_number">Phone Number</Label>
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
              <Label htmlFor="id_number">Ethiopian ID Number</Label>
              <Input
                id="id_number"
                placeholder="1234567890"
                maxLength={10}
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

            {/* Region */}
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
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
              <Label htmlFor="city">City</Label>
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

            {/* Monthly Income */}
            <div className="space-y-2">
              <Label htmlFor="monthly_income">Monthly Income (ETB)</Label>
              <Input
                id="monthly_income"
                type="number"
                step="0.01"
                placeholder="30000"
                {...register("monthly_income", { valueAsNumber: true })}
              />
              {errors.monthly_income && (
                <p className="text-sm text-destructive">
                  {errors.monthly_income.message}
                </p>
              )}
            </div>

            {/* Employment Status */}
            <div className="space-y-2">
              <Label htmlFor="employment_status">Employment Status</Label>
              <Controller
                name="employment_status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="employment_status">
                      <SelectValue placeholder="Select employment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employed">Employed</SelectItem>
                      <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                      <SelectItem value="Unemployed">Unemployed</SelectItem>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.employment_status && (
                <p className="text-sm text-destructive">
                  {errors.employment_status.message}
                </p>
              )}
            </div>

            {/* Employer Name */}
            <div className="space-y-2">
              <Label htmlFor="employer_name">Employer Name</Label>
              <Input
                id="employer_name"
                placeholder="Company name"
                {...register("employer_name")}
              />
              {errors.employer_name && (
                <p className="text-sm text-destructive">
                  {errors.employer_name.message}
                </p>
              )}
            </div>

            {/* Bank Name */}
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                placeholder="Commercial Bank of Ethiopia"
                {...register("bank_name")}
              />
              {errors.bank_name && (
                <p className="text-sm text-destructive">
                  {errors.bank_name.message}
                </p>
              )}
            </div>

            {/* Bank Account Number */}
            <div className="space-y-2">
              <Label htmlFor="bank_account_number">Bank Account Number</Label>
              <Input
                id="bank_account_number"
                placeholder="1234567890123"
                {...register("bank_account_number")}
              />
              {errors.bank_account_number && (
                <p className="text-sm text-destructive">
                  {errors.bank_account_number.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateCustomer.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateCustomer.isPending}>
              {updateCustomer.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

