"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, AlertTriangle, Save } from "lucide-react";
import { customerRegistrationSchema, CustomerRegistrationFormData } from "@/lib/utils/customerRegistrationSchema";
import { useToast } from "@/hooks/use-toast";
import { Step1BasicInfo } from "./steps/Step1BasicInfo";
import { Step2EmploymentIncome } from "./steps/Step2EmploymentIncome";
import { Step3FinancialOverview } from "./steps/Step3FinancialOverview";
import { Step4Review } from "./steps/Step4Review";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<WizardStepProps>;
  validate?: (data: Partial<CustomerRegistrationFormData>) => boolean;
}

interface WizardStepProps {
  formMethods?: ReturnType<typeof useForm<CustomerRegistrationFormData>>;
  onNext?: () => void;
  onPrevious?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}

interface CustomerRegistrationWizardProps {
  onSubmit: (data: CustomerRegistrationFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<CustomerRegistrationFormData>;
  isLoading?: boolean;
}

const STEPS: WizardStep[] = [
  {
    id: "basic",
    title: "Basic Information",
    description: "Customer identification and demographics",
    component: Step1BasicInfo,
  },
  {
    id: "employment",
    title: "Employment & Income",
    description: "Employment details and income sources",
    component: Step2EmploymentIncome,
  },
  {
    id: "financial",
    title: "Financial Overview",
    description: "Financial status and obligations",
    component: Step3FinancialOverview,
  },
  {
    id: "review",
    title: "Review & Submit",
    description: "Review all information and submit",
    component: Step4Review,
  },
];

const DRAFT_STORAGE_KEY = "customer_registration_draft";

export function CustomerRegistrationWizard({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: CustomerRegistrationWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [draftSaved, setDraftSaved] = useState(false);

  const formMethods = useForm<CustomerRegistrationFormData>({
    resolver: zodResolver(customerRegistrationSchema),
    defaultValues: {
      gender: "Male",
      marital_status: "Single",
      employment_status: "Employed",
      ...initialData,
    },
    mode: "onChange",
  });

  const { handleSubmit, trigger, getValues, watch, reset } = formMethods;

  // Load draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        const draftTimestamp = new Date(draftData.timestamp || 0);
        const draftAge = Math.floor((Date.now() - draftTimestamp.getTime()) / (1000 * 60)); // minutes
        
        if (draftAge < 60) { // Only load if less than 1 hour old
          reset(draftData.data);
          toast({
            title: "Draft Loaded",
            description: `Found a saved draft from ${draftAge} minute${draftAge !== 1 ? 's' : ''} ago.`,
          });
        } else {
          // Clear old draft
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    }
  }, [reset, toast]);

  // Auto-save draft
  useEffect(() => {
    const subscription = watch(() => {
      const timer = setTimeout(() => {
        try {
          const formData = getValues();
          const draft = {
            data: formData,
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
          setDraftSaved(true);
          setTimeout(() => setDraftSaved(false), 2000); // Hide indicator after 2 seconds
        } catch (error) {
          console.error("Error saving draft:", error);
        }
      }, 2000); // Debounce 2 seconds

      return () => clearTimeout(timer);
    });

    return () => subscription.unsubscribe();
  }, [watch, getValues]);

  const saveDraft = useCallback(() => {
    try {
      const formData = getValues();
      const draft = {
        data: formData,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      toast({
        title: "Draft Saved",
        description: "Your progress has been saved locally.",
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    }
  }, [getValues, toast]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }, []);

  const validateCurrentStep = useCallback(async () => {
    const step = STEPS[currentStep];
    const stepFields = getStepFields(currentStep);
    
    if (stepFields.length > 0) {
      const isValid = await trigger(stepFields as any);
      return isValid;
    }
    return true;
  }, [currentStep, trigger]);

  const getStepFields = (stepIndex: number): (keyof CustomerRegistrationFormData)[] => {
    switch (stepIndex) {
      case 0: // Basic Info
        return ["customer_id", "full_name", "phone_number", "id_number", "region", "city"];
      case 1: // Employment & Income
        return ["employment_status"]; // Cards validation handled separately
      case 2: // Financial Overview
        return []; // All optional
      case 3: // Review
        return []; // No validation needed
      default:
        return [];
    }
  };

  const handleNext = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before proceeding.",
        variant: "destructive",
      });
    }
  }, [currentStep, validateCurrentStep, toast]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleFormSubmit = useCallback(
    async (data: CustomerRegistrationFormData) => {
      try {
        await onSubmit(data);
        clearDraft(); // Clear draft on successful submit
      } catch (error) {
        console.error("Form submission error:", error);
        throw error; // Re-throw to let parent handle
      }
    },
    [onSubmit, clearDraft]
  );

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const CurrentStepComponent = STEPS[currentStep].component;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <FormProvider {...formMethods}>
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
            </span>
            <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;
            const isPast = index < currentStep;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isPast || isCompleted) {
                        setCurrentStep(index);
                      }
                    }}
                    disabled={!isPast && !isCompleted}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCompleted
                        ? "border-green-500 bg-green-500 text-white"
                        : isPast
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-muted bg-muted text-muted-foreground"
                    } ${isPast || isCompleted ? "cursor-pointer hover:border-primary" : "cursor-not-allowed"}`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </button>
                  <div className="mt-2 text-center">
                    <div
                      className={`text-xs font-medium ${
                        isCurrent ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 ${
                      isCompleted ? "bg-green-500" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep].title}</CardTitle>
            <CardDescription>{STEPS[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <CurrentStepComponent
              formMethods={formMethods}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
            />
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {draftSaved && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Save className="h-3 w-3" />
                Draft saved
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={saveDraft}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
            {!isFirstStep && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isLoading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
            {!isLastStep ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit(handleFormSubmit)}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit
              </Button>
            )}
          </div>
        </div>
      </div>
    </FormProvider>
  );
}

