"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Plus,
  X,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export interface Condition {
  id: string;
  type: string;
  description: string;
  required_documents?: string[];
  deadline?: string;
  status: "pending" | "fulfilled" | "overdue";
  fulfilled_date?: string;
  notes?: string;
}

interface ConditionalApprovalManagerProps {
  workflowId: string;
  conditions: Condition[];
  onConditionsChange: () => void;
}

export function ConditionalApprovalManager({
  workflowId,
  conditions,
  onConditionsChange,
}: ConditionalApprovalManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // New condition form state
  const [newCondition, setNewCondition] = useState({
    type: "",
    description: "",
    required_documents: [] as string[],
    deadline: "",
  });

  const conditionTypes = [
    { value: "document_verification", label: "Document Verification" },
    { value: "income_verification", label: "Income Verification" },
    { value: "collateral_assessment", label: "Collateral Assessment" },
    { value: "reference_check", label: "Reference Check" },
    { value: "employment_verification", label: "Employment Verification" },
    { value: "credit_bureau_check", label: "Credit Bureau Check" },
    { value: "property_valuation", label: "Property Valuation" },
    { value: "insurance_requirement", label: "Insurance Requirement" },
    { value: "co_signer_approval", label: "Co-signer Approval" },
    { value: "other", label: "Other" },
  ];

  const handleAddCondition = async () => {
    if (!newCondition.type || !newCondition.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation, this would call an API
      // For now, we'll simulate the API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Success",
        description: "Condition added successfully",
      });

      setIsAddDialogOpen(false);
      setNewCondition({
        type: "",
        description: "",
        required_documents: [],
        deadline: "",
      });
      onConditionsChange();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add condition",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFulfillCondition = async (conditionId: string) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call an API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Success",
        description: "Condition marked as fulfilled",
      });

      onConditionsChange();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fulfill condition",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCondition = async (conditionId: string) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call an API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Success",
        description: "Condition removed successfully",
      });

      onConditionsChange();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove condition",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "fulfilled":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Fulfilled
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-500">
            <AlertCircle className="mr-1 h-3 w-3" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const pendingConditions = conditions.filter((c) => c.status === "pending");
  const fulfilledConditions = conditions.filter(
    (c) => c.status === "fulfilled"
  );
  const overdueConditions = conditions.filter(
    (c) => c.status === "overdue" || isOverdue(c.deadline)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Conditional Approval Management
            </CardTitle>
            <CardDescription>
              Manage conditions that must be fulfilled before final approval
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Condition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Condition</DialogTitle>
                <DialogDescription>
                  Add a condition that must be fulfilled before final approval
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="condition-type">Condition Type *</Label>
                  <Select
                    value={newCondition.type}
                    onValueChange={(value) =>
                      setNewCondition((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition type" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="condition-description">Description *</Label>
                  <Textarea
                    id="condition-description"
                    value={newCondition.description}
                    onChange={(e) =>
                      setNewCondition((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe what needs to be fulfilled..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="condition-deadline">
                    Deadline (Optional)
                  </Label>
                  <Input
                    id="condition-deadline"
                    type="date"
                    value={newCondition.deadline}
                    onChange={(e) =>
                      setNewCondition((prev) => ({
                        ...prev,
                        deadline: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddCondition} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Condition"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {conditions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No conditions set for this approval</p>
            <p className="text-sm">This loan can proceed to final approval</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-yellow-50 p-4 text-center dark:bg-yellow-900/20">
                <div className="text-2xl font-bold text-yellow-600">
                  {pendingConditions.length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                <div className="text-2xl font-bold text-green-600">
                  {fulfilledConditions.length}
                </div>
                <div className="text-sm text-muted-foreground">Fulfilled</div>
              </div>
              <div className="rounded-lg bg-red-50 p-4 text-center dark:bg-red-900/20">
                <div className="text-2xl font-bold text-red-600">
                  {overdueConditions.length}
                </div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
            </div>

            {/* Conditions List */}
            <div className="space-y-4">
              {conditions.map((condition) => (
                <div
                  key={condition.id}
                  className={`rounded-lg border p-4 ${
                    condition.status === "overdue" ||
                    isOverdue(condition.deadline)
                      ? "border-red-200 bg-red-50 dark:bg-red-900/20"
                      : condition.status === "fulfilled"
                        ? "border-green-200 bg-green-50 dark:bg-green-900/20"
                        : "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        {getStatusBadge(condition.status)}
                        <Badge variant="outline">
                          {conditionTypes.find(
                            (t) => t.value === condition.type
                          )?.label || condition.type}
                        </Badge>
                      </div>
                      <p className="mb-2 text-sm font-medium">
                        {condition.description}
                      </p>
                      {condition.deadline && (
                        <p className="mb-2 text-xs text-muted-foreground">
                          Deadline:{" "}
                          {new Date(condition.deadline).toLocaleDateString()}
                          {isOverdue(condition.deadline) && (
                            <span className="ml-2 text-red-500">(Overdue)</span>
                          )}
                        </p>
                      )}
                      {condition.required_documents &&
                        condition.required_documents.length > 0 && (
                          <div className="mb-2 text-xs text-muted-foreground">
                            Required documents:{" "}
                            {condition.required_documents.join(", ")}
                          </div>
                        )}
                      {condition.fulfilled_date && (
                        <p className="text-xs text-green-600">
                          Fulfilled on:{" "}
                          {new Date(
                            condition.fulfilled_date
                          ).toLocaleDateString()}
                        </p>
                      )}
                      {condition.notes && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Notes: {condition.notes}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      {condition.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleFulfillCondition(condition.id)}
                          disabled={isLoading}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Fulfill
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveCondition(condition.id)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Summary */}
            {conditions.length > 0 && (
              <div className="rounded-lg bg-muted p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {fulfilledConditions.length} of {conditions.length}{" "}
                    conditions fulfilled
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all duration-300"
                    style={{
                      width: `${(fulfilledConditions.length / conditions.length) * 100}%`,
                    }}
                  />
                </div>
                {fulfilledConditions.length === conditions.length && (
                  <p className="mt-2 text-sm font-medium text-green-600">
                    ✅ All conditions fulfilled - Ready for final approval
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
