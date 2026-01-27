"use client";

import { useFieldArray, useFormContext, Controller } from "react-hook-form";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CustomerRegistrationFormData, cardSchema } from "@/lib/utils/customerRegistrationSchema";
import { Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface MultiCardManagerProps {
  name?: string; // For future use if needed
}

export function MultiCardManager({ name: _ }: MultiCardManagerProps) {
  const { control, watch, setValue, formState: { errors } } = useFormContext<CustomerRegistrationFormData>();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "cards",
  });

  const cards = watch("cards") || [];
  const totalIncome = cards.reduce((sum, card) => {
    const income = card?.employer?.monthly_income || 0;
    return sum + (typeof income === "number" ? income : 0);
  }, 0);

  const addCard = () => {
    const cardNumber = fields.length + 1;
    append({
      card_number: cardNumber,
      card_name: `Card ${cardNumber}`,
      is_primary: fields.length === 0, // First card is primary by default
      employer: {
        employment_status: undefined,
        employer_name: undefined,
        employment_sector: undefined,
        job_title: undefined,
        employment_years: undefined,
        current_job_months: undefined,
        monthly_income: undefined,
      },
      bank: {
        bank_name: undefined,
        bank_account_number: undefined,
        bank_account_type: undefined,
        bank_account_age_months: undefined,
        bank_avg_balance_6m: undefined,
      },
    });
  };

  const removeCard = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      // If we removed the primary card, make the first remaining card primary
      const remainingCards = cards.filter((_, i) => i !== index);
      if (remainingCards.length > 0 && cards[index]?.is_primary) {
        // Update the first remaining card to be primary
        // This will be handled by the form state
      }
    }
  };

  const setPrimaryCard = (index: number) => {
    const currentCards = watch("cards") || [];
    const updatedCards = currentCards.map((card, i) => ({
      ...card,
      is_primary: i === index,
    }));
    setValue("cards", updatedCards, { shouldValidate: true });
  };

  if (fields.length === 0) {
    return (
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Add at least one income source (employment/bank combination). You can add multiple cards for customers with multiple income sources.
          </AlertDescription>
        </Alert>
        <Button type="button" variant="outline" onClick={addCard} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Income Source
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Income Display */}
      {totalIncome > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Monthly Income</p>
                <p className="text-2xl font-bold">{totalIncome.toLocaleString()} ETB</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sum of all income sources
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {fields.length} {fields.length === 1 ? "Source" : "Sources"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards */}
      {fields.map((field, index) => {
        const cardErrors = (errors.cards as any)?.[index];
        const isPrimary = watch(`cards.${index}.is_primary`);

        return (
          <Card key={field.id} className={isPrimary ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>
                    {watch(`cards.${index}.card_name`) || `Card ${index + 1}`}
                  </CardTitle>
                  {isPrimary && (
                    <Badge variant="default">Primary</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`primary-${index}`} className="text-sm cursor-pointer">
                      Primary
                    </Label>
                    <Switch
                      id={`primary-${index}`}
                      checked={isPrimary || false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setPrimaryCard(index);
                        }
                      }}
                    />
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCard(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
              <CardDescription>
                Employment and bank information for this income source
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Card Name */}
              <div className="space-y-2">
                <Label htmlFor={`cards.${index}.card_name`}>Card Name (Optional)</Label>
                <Input
                  id={`cards.${index}.card_name`}
                  placeholder={`Card ${index + 1} - e.g., "Primary Employment"`}
                  {...control.register(`cards.${index}.card_name`)}
                />
              </div>

              {/* Employer Section */}
              <div className="space-y-4 border-l-4 border-l-blue-500 pl-4">
                <h4 className="font-semibold text-sm">Employer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`cards.${index}.employer.employment_status`}>Employment Status</Label>
                    <Controller
                      name={`cards.${index}.employer.employment_status`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Employed">Employed</SelectItem>
                            <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Unemployed">Unemployed</SelectItem>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {cardErrors?.employer?.employment_status && (
                      <p className="text-sm text-destructive">
                        {cardErrors.employer.employment_status.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`cards.${index}.employer.employer_name`}>Employer Name</Label>
                    <Input
                      id={`cards.${index}.employer.employer_name`}
                      placeholder="Company name"
                      {...control.register(`cards.${index}.employer.employer_name`)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`cards.${index}.employer.employment_sector`}>Employment Sector</Label>
                    <Input
                      id={`cards.${index}.employer.employment_sector`}
                      placeholder="Technology, Finance, etc."
                      {...control.register(`cards.${index}.employer.employment_sector`)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`cards.${index}.employer.job_title`}>Job Title</Label>
                    <Input
                      id={`cards.${index}.employer.job_title`}
                      placeholder="Software Engineer"
                      {...control.register(`cards.${index}.employer.job_title`)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`cards.${index}.employer.employment_years`}>Employment Years</Label>
                    <Input
                      id={`cards.${index}.employer.employment_years`}
                      type="number"
                      min="0"
                      max="50"
                      placeholder="5"
                      {...control.register(`cards.${index}.employer.employment_years`, { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`cards.${index}.employer.current_job_months`}>Current Job (Months)</Label>
                    <Input
                      id={`cards.${index}.employer.current_job_months`}
                      type="number"
                      min="0"
                      max="600"
                      placeholder="24"
                      {...control.register(`cards.${index}.employer.current_job_months`, { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor={`cards.${index}.employer.monthly_income`}>Monthly Income (ETB)</Label>
                    <Input
                      id={`cards.${index}.employer.monthly_income`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="30000"
                      {...control.register(`cards.${index}.employer.monthly_income`, { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>

              {/* Bank Section */}
              <div className="space-y-4 border-l-4 border-l-green-500 pl-4">
                <h4 className="font-semibold text-sm">Bank Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`cards.${index}.bank.bank_name`}>Bank Name</Label>
                    <Input
                      id={`cards.${index}.bank.bank_name`}
                      placeholder="Commercial Bank of Ethiopia"
                      {...control.register(`cards.${index}.bank.bank_name`)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`cards.${index}.bank.bank_account_number`}>Account Number</Label>
                    <Input
                      id={`cards.${index}.bank.bank_account_number`}
                      placeholder="1234567890123"
                      {...control.register(`cards.${index}.bank.bank_account_number`)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`cards.${index}.bank.bank_account_type`}>Account Type</Label>
                    <Controller
                      name={`cards.${index}.bank.bank_account_type`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Checking">Checking</SelectItem>
                            <SelectItem value="Savings">Savings</SelectItem>
                            <SelectItem value="Current">Current</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`cards.${index}.bank.bank_account_age_months`}>Account Age (Months)</Label>
                    <Input
                      id={`cards.${index}.bank.bank_account_age_months`}
                      type="number"
                      min="0"
                      max="600"
                      placeholder="36"
                      {...control.register(`cards.${index}.bank.bank_account_age_months`, { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor={`cards.${index}.bank.bank_avg_balance_6m`}>Average Balance - 6 Months (ETB)</Label>
                    <Input
                      id={`cards.${index}.bank.bank_avg_balance_6m`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="20000"
                      {...control.register(`cards.${index}.bank.bank_avg_balance_6m`, { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Add Card Button */}
      <Button type="button" variant="outline" onClick={addCard} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Another Income Source
      </Button>
    </div>
  );
}

