"use client";

import { useState } from "react";
import dynamicImport from "next/dynamic";
import { CreditScoringForm } from "@/components/forms/CreditScoringForm";
import { CreditScoreResponse } from "@/types/credit";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users, Brain, Calculator } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ApiStatusIndicator } from "@/components/common/ApiStatusIndicator";

// Dynamic import to avoid SSR issues  
const ModelVersionSelector = dynamicImport(
  () => import("@/components/credit/ModelVersionSelector").then((mod) => ({ default: mod.ModelVersionSelector })),
  { ssr: false }
);

export default function CreditScoringPage() {
  const [customerType, setCustomerType] = useState<"new" | "existing">("new");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [result, setResult] = useState<CreditScoreResponse | null>(null);

  const handleResult = (result: CreditScoreResponse) => {
    setResult(result);
    console.log("Credit score result:", result);
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Credit Scoring</h1>
          <p className="text-muted-foreground">
            Calculate credit scores using our 6-model ensemble
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ApiStatusIndicator endpoint="/api/scoring/realtime/metrics" label="Live" />
        </div>
      </div>

      {/* Customer Type Selection */}
      <DashboardSection
        title="Customer Type Selection"
        description="Choose whether to score an existing customer or create a new one"
        icon={Calculator}
      >
        <Card>
          <CardContent className="pt-6">
            <Tabs
              value={customerType}
              onValueChange={(value) => {
                setCustomerType(value as "new" | "existing");
                setSelectedCustomerId(undefined);
                setResult(null);
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  New Customer
                </TabsTrigger>
                <TabsTrigger value="existing" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Existing Customer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-4">
                <div className="text-sm text-muted-foreground">
                  Enter all customer information manually in the form below.
                </div>
              </TabsContent>

              <TabsContent value="existing" className="mt-4">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Search and select an existing customer to pre-populate the form with their data.
                    You can modify any values before submitting.
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Model Version Selector */}
      <DashboardSection
        title="Model Configuration"
        description="Select model version for credit scoring predictions"
        icon={Brain}
      >
        <ModelVersionSelector
          modelId="credit_scoring_ensemble"
          showABTesting={true}
        />
      </DashboardSection>

      {/* Credit Scoring Form */}
      <DashboardSection
        title="Credit Scoring Form"
        description="Calculate credit scores using our 6-model ensemble with comprehensive feature analysis"
        icon={Brain}
        variant="large"
      >
        <CreditScoringForm
        onResult={handleResult}
        customerType={customerType}
        selectedCustomerId={selectedCustomerId}
        onCustomerSelect={handleCustomerSelect}
        />
      </DashboardSection>

      {/* Results are now displayed inside the form component */}
    </div>
  );
}
