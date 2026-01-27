"use client";

import { useState, useMemo } from "react";
import { PricingCalculator } from "@/components/pricing/PricingCalculator";
import { PricingResults } from "@/components/pricing/PricingResults";
import { useCalculatePricing } from "@/lib/api/hooks/usePricing";
import { PricingRequest, PricingResponse } from "@/types/pricing";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiStatusIndicator } from "@/components/common/ApiStatusIndicator";
import { PaymentSchedule } from "@/components/charts/PaymentSchedule";
import { MonteCarloSimulation } from "@/components/charts/MonteCarloSimulation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";
import { formatCurrency } from "@/lib/utils/format";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { exportToCSV, exportToPDF } from "@/lib/utils/exportHelpers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nbeComplianceValidator } from "@/lib/utils/nbe-compliance";
import { Calendar, CheckCircle2, AlertCircle, DollarSign, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";

export default function DynamicPricingPage() {
  const [result, setResult] = useState<PricingResponse | null>(null);
  const [lastRequest, setLastRequest] = useState<PricingRequest | null>(null);
  const [scenario, setScenario] = useState<"base" | "stress" | "promo">("base");
  const [sensitivityFactors, setSensitivityFactors] = useState<Record<string, number>>({});
  const [startTime, setStartTime] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const pricingMutation = useCalculatePricing();

  const handleCalculate = async (data: PricingRequest) => {
    try {
      setLastRequest(data);
      setStartTime(Date.now());
      const correlationId = getOrCreateCorrelationId();
      
      // Apply scenario adjustments
      let adjustedData = { ...data };
      if (scenario === "stress") {
        adjustedData.credit_score = (adjustedData.credit_score || 700) - 50;
      } else if (scenario === "promo") {
        // Promo scenario - lower base rate
      }
      
      // Apply sensitivity factors
      if (Object.keys(sensitivityFactors).length > 0) {
        // Adjust data based on sensitivity sliders
      }
      
      const requestWithCorrelation = {
        ...adjustedData,
        correlation_id: correlationId,
      };
      const response = await pricingMutation.mutateAsync(requestWithCorrelation as PricingRequest);
      const endTime = Date.now();
      setLatency(endTime - (startTime || endTime));
      
      setResult({
        ...response,
        correlation_id: response.correlation_id || correlationId,
      });
    } catch (error: any) {
      console.warn("Pricing API unavailable:", error);
      setResult(null);
      setLatency(null);
    }
  };

  // Calculate payment schedule parameters from result
  const scheduleParams = useMemo(() => {
    if (!result || !lastRequest) return null;
    return {
      loanAmount: lastRequest.loan_amount || 100000,
      interestRate: result.recommended_rate || 0.15,
      termMonths: lastRequest.loan_term_months || 36,
    };
  }, [result, lastRequest]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dynamic Pricing</h1>
          <p className="text-muted-foreground">
            Calculate personalized interest rates based on risk assessment
            {result?.correlation_id && (
              <span className="ml-2 text-xs">
                • ID: {result.correlation_id}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ApiStatusIndicator endpoint="/health" label="Live" showResponseTime={true} />
        </div>
      </div>

      {pricingMutation.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-semibold">Failed to calculate pricing from API.</span>
              <p className="text-sm mt-1 text-muted-foreground">
                Error: {(pricingMutation.error as any)?.message || "Unknown error occurred"}
                {(pricingMutation.error as any)?.statusCode && ` (Status: ${(pricingMutation.error as any)?.statusCode})`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={() => {
                setResult(null);
                // Form will need to be resubmitted by user
              }}
            >
              Clear
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <DashboardSection
        title="Pricing Calculator"
        description="Calculate personalized interest rates based on risk assessment with regulatory compliance validation"
        icon={DollarSign}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <PricingCalculator
            onSubmit={handleCalculate}
            isLoading={pricingMutation.isPending}
          />

          {result && (
            <div className="space-y-4">
              {/* Regulatory Compliance Indicator */}
              {result.recommended_rate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Regulatory Compliance
                    </CardTitle>
                  </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Interest Rate Range (NBE):</span>
                      <Badge variant={
                        result.recommended_rate >= 0.12 && result.recommended_rate <= 0.25
                          ? "default"
                          : "destructive"
                      }>
                        {result.recommended_rate >= 0.12 && result.recommended_rate <= 0.25 ? (
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                        ) : (
                          <AlertCircle className="mr-1 h-3 w-3" />
                        )}
                        12% - 25%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Recommended Rate:</span>
                      <span className="font-medium">
                        {(result.recommended_rate * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <PricingResults result={result} />
          </div>
        )}
        </div>
      </DashboardSection>

      {/* Payment Schedule and Monte Carlo when result is available */}
      {scheduleParams && (
        <DashboardSection
          title="Payment Analysis"
          description="Amortization schedule and Monte Carlo risk simulation for loan payment analysis"
          icon={TrendingUp}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <PaymentSchedule
              loanAmount={scheduleParams.loanAmount}
              interestRate={scheduleParams.interestRate}
              termMonths={scheduleParams.termMonths}
              title="Amortization Schedule"
              description="Monthly payment breakdown with principal and interest"
            />

            <MonteCarloSimulation
              baseValue={scheduleParams.loanAmount}
              volatility={0.15}
              timeHorizon={scheduleParams.termMonths}
              numSimulations={500}
              title="Loan Value Simulation"
              description="Risk distribution analysis through Monte Carlo"
              valueLabel="Loan Value (ETB)"
            />
          </div>
        </DashboardSection>
      )}

      {/* Show empty state when no result */}
      {!result && !pricingMutation.isPending && (
        <DashboardSection
          title="Payment Schedule"
          description="Calculate pricing to see your personalized payment schedule and analysis"
          icon={Calendar}
        >
          <Card>
            <CardHeader>
              <CardTitle>Payment Schedule</CardTitle>
              <CardDescription>
                Calculate pricing to see your personalized payment schedule and analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Enter loan details and calculate pricing to view payment schedule and risk analysis.
              </p>
            </CardContent>
          </Card>
        </DashboardSection>
      )}
    </div>
  );
}


