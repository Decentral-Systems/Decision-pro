"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomerRegistrationWizard } from "./CustomerRegistrationWizard";
import { useCreateCustomer } from "@/lib/api/hooks/useCustomers";
import { useToast } from "@/hooks/use-toast";
import { CustomerRegistrationFormData } from "@/lib/utils/customerRegistrationSchema";
import { transformCustomerRegistration } from "@/lib/utils/transformCustomerRegistration";

interface CustomerCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CustomerCreationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CustomerCreationDialogProps) {
  const { toast } = useToast();
  const createCustomer = useCreateCustomer();

  const handleSubmit = async (data: CustomerRegistrationFormData) => {
    try {
      // Transform form data to API format
      const transformedData = transformCustomerRegistration(data);
      
      // Submit to API
      await createCustomer.mutateAsync(transformedData as any);
      
      toast({
        title: "Success",
        description: "Customer created successfully",
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Failed to create customer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
      throw error; // Re-throw to let wizard handle it
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Customer</DialogTitle>
          <DialogDescription>
            Complete the registration form to create a new customer profile. 
            Fields marked with * are required. You can save your progress and continue later.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <CustomerRegistrationWizard
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createCustomer.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
