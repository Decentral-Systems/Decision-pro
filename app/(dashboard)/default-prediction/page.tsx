"use client";

import { useState } from "react";
import { DefaultPredictionForm } from "@/components/prediction/DefaultPredictionForm";
import { PredictionResults } from "@/components/prediction/PredictionResults";
import { BatchPredictionForm } from "@/components/prediction/BatchPredictionForm";
import { useDefaultPrediction } from "@/lib/api/hooks/useDefaultPrediction";
import {
  DefaultPredictionRequest,
  DefaultPredictionResponse,
} from "@/types/prediction";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  User,
  Users,
  BarChart3,
  LineChart,
  Activity,
  AlertCircle,
  Download,
  Settings,
  Lightbulb,
  CheckCircle2,
  Brain,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { Button } from "@/components/ui/button";
import { ApiStatusIndicator } from "@/components/api-status-indicator";
import { SurvivalCurve } from "@/components/charts/SurvivalCurve";
import { HazardRateChart } from "@/components/charts/HazardRateChart";
import { SensitivityAnalysis } from "@/components/charts/SensitivityAnalysis";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { exportToCSV, exportToPDF } from "@/lib/utils/exportHelpers";
const AlertCircleIcon = AlertCircle;
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DefaultPredictionPage() {
  const [result, setResult] = useState<DefaultPredictionResponse | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [scenarioEditorOpen, setScenarioEditorOpen] = useState(false);
  const [customScenarios, setCustomScenarios] = useState<any[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const predictMutation = useDefaultPrediction();

  // Use real data from prediction result if available, otherwise show empty state
  const survivalData = result?.survival_curve || null;
  const hazardData = result?.hazard_rates || null;
  const sensitivityFactors = result?.sensitivity_analysis?.factors || [];
  const scenarios = result?.sensitivity_analysis?.scenarios || [];

  const handlePredict = async (data: DefaultPredictionRequest) => {
    try {
      const response = await predictMutation.mutateAsync(data);
      setResult(response);
    } catch (error: any) {
      // Don't set fallback result - keep result as null to show error
      console.warn("Prediction API unavailable:", error);
      setResult(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Default Prediction
          </h1>
          <p className="text-muted-foreground">
            Predict default probability using survival analysis models
            {result?.model_version && (
              <span className="ml-2 text-xs">
                • Model: {result.model_version}
              </span>
            )}
            {result?.correlation_id && (
              <span className="ml-2 text-xs">
                • ID: {result.correlation_id}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ApiStatusIndicator
            endpoint="/health"
            label="Live"
            showResponseTime={true}
          />
        </div>
      </div>

      <DashboardSection
        title="Default Prediction"
        description="Predict default probability using survival analysis models with single and batch processing capabilities"
        icon={Brain}
      >
        <Tabs defaultValue="single" className="space-y-6">
          <TabsList>
            <TabsTrigger value="single" className="gap-2">
              <User className="h-4 w-4" />
              Single Prediction
            </TabsTrigger>
            <TabsTrigger value="batch" className="gap-2">
              <Users className="h-4 w-4" />
              Batch Prediction
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <LineChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            {predictMutation.isError && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">
                      Failed to get prediction from API.
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Error:{" "}
                      {(predictMutation.error as any)?.message ||
                        "Unknown error occurred"}
                      {(predictMutation.error as any)?.statusCode &&
                        ` (Status: ${(predictMutation.error as any)?.statusCode})`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-4"
                    onClick={() => {
                      setResult(null);
                    }}
                  >
                    Clear
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <DefaultPredictionForm
                onSubmit={handlePredict}
                isLoading={predictMutation.isPending}
              />

              {result && (
                <div>
                  <PredictionResults result={result} />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="batch">
            <BatchPredictionForm
              onComplete={(results) => {
                const correlationId = getOrCreateCorrelationId();
                console.log(
                  "Batch complete:",
                  results,
                  "Correlation ID:",
                  correlationId
                );
              }}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {!result ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Run a prediction first to view analytics. The analytics
                      will be generated based on your prediction results.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Survival Analysis */}
                  {survivalData && survivalData.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Survival Analysis</CardTitle>
                            <CardDescription>
                              Probability of loan survival over time
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const exportData = survivalData.map(
                                  (d: any) => ({
                                    Time: d.time || d.period || d.month,
                                    "Survival Probability":
                                      d.probability || d.survival_probability,
                                  })
                                );
                                await exportToCSV(
                                  exportData,
                                  "survival_curve",
                                  undefined,
                                  {
                                    includeSignature: true,
                                    version: "1.0.0",
                                    filterSummary: `Model: ${result?.model_version || "N/A"}`,
                                  }
                                );
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Export CSV
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                // Export as PNG/PDF (would need chart-to-image library)
                                const htmlContent = `<html><body><h1>Survival Curve</h1><p>Model: ${result?.model_version || "N/A"}</p><p>Correlation ID: ${result?.correlation_id || "N/A"}</p></body></html>`;
                                await exportToPDF(
                                  htmlContent,
                                  "survival_curve",
                                  {
                                    includeSignature: true,
                                    version: "1.0.0",
                                    recordCount: survivalData.length,
                                  }
                                );
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Export PDF
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <SurvivalCurve
                          data={survivalData}
                          title=""
                          description=""
                          showConfidenceInterval={true}
                          interactive={true}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Survival curve data not available in prediction result
                      </CardContent>
                    </Card>
                  )}

                  {/* Hazard Rate Analysis */}
                  {hazardData && hazardData.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Hazard Rate Over Time</CardTitle>
                            <CardDescription>
                              Instantaneous default risk at each time point
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const exportData = hazardData.map((d: any) => ({
                                Time: d.time || d.period || d.month,
                                "Hazard Rate": d.hazard_rate || d.rate,
                              }));
                              exportToCSV(exportData, "hazard_rate");
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <HazardRateChart
                          data={hazardData}
                          title=""
                          description=""
                          showRiskZones={true}
                          showCumulativeHazard={false}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Hazard rate data not available in prediction result
                      </CardContent>
                    </Card>
                  )}

                  {/* Sensitivity Analysis */}
                  {sensitivityFactors.length > 0 && scenarios.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Sensitivity Analysis</CardTitle>
                            <CardDescription>
                              Impact of input variations on default prediction
                            </CardDescription>
                          </div>
                          <Dialog
                            open={scenarioEditorOpen}
                            onOpenChange={setScenarioEditorOpen}
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Settings className="mr-2 h-4 w-4" />
                                Edit Scenarios
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Scenario Editor</DialogTitle>
                                <DialogDescription>
                                  Create and compare custom scenarios for
                                  sensitivity analysis
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="text-sm text-muted-foreground">
                                  Base scenario factors:{" "}
                                  {sensitivityFactors
                                    .map((f: any) => f.name)
                                    .join(", ")}
                                </div>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setCustomScenarios([
                                      ...customScenarios,
                                      {
                                        name: `Scenario ${customScenarios.length + 1}`,
                                        factors: {},
                                      },
                                    ]);
                                  }}
                                >
                                  Add Scenario
                                </Button>
                                {customScenarios.map((scenario, idx) => (
                                  <div
                                    key={idx}
                                    className="space-y-2 rounded border p-4"
                                  >
                                    <Input
                                      placeholder="Scenario name"
                                      value={scenario.name}
                                      onChange={(e) => {
                                        const updated = [...customScenarios];
                                        updated[idx].name = e.target.value;
                                        setCustomScenarios(updated);
                                      }}
                                    />
                                    {sensitivityFactors.map((factor: any) => (
                                      <div
                                        key={factor.name}
                                        className="flex items-center gap-2"
                                      >
                                        <Label className="w-32">
                                          {factor.name}:
                                        </Label>
                                        <Input
                                          type="number"
                                          value={
                                            scenario.factors[factor.name] ||
                                            factor.value
                                          }
                                          onChange={(e) => {
                                            const updated = [
                                              ...customScenarios,
                                            ];
                                            updated[idx].factors[factor.name] =
                                              parseFloat(e.target.value);
                                            setCustomScenarios(updated);
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <SensitivityAnalysis
                          factors={sensitivityFactors}
                          baseOutcome={
                            result?.expected_value ||
                            result?.default_probability ||
                            0
                          }
                          scenarios={[...scenarios, ...customScenarios]}
                          title=""
                          description=""
                          outcomeLabel="Expected Value"
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Sensitivity analysis data not available in prediction
                        result
                      </CardContent>
                    </Card>
                  )}

                  {/* Counterfactual Suggestions */}
                  {result && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5" />
                          Counterfactual Suggestions
                        </CardTitle>
                        <CardDescription>
                          What-if analysis to improve default probability
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="rounded-lg border p-3">
                            <div className="mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="font-medium">
                                Reduce loan amount by 10%
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Could improve default probability by ~5-8%
                            </p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <div className="mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="font-medium">
                                Extend loan term by 6 months
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Could reduce monthly payment pressure
                            </p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <div className="mb-2 flex items-center gap-2">
                              <AlertCircleIcon className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium">
                                Increase interest rate by 2%
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Would increase default risk by ~3-5%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Model Information */}
                  {result && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Model Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Model Version:
                            </span>
                            <Badge>{result.model_version || "N/A"}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Correlation ID:
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {result.correlation_id
                                ? `${result.correlation_id.substring(0, 8)}...`
                                : "N/A"}
                            </Badge>
                          </div>
                          {result.confidence_interval && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Confidence Interval:
                              </span>
                              <span className="text-sm">
                                {result.confidence_interval.lower} -{" "}
                                {result.confidence_interval.upper}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DashboardSection>

      {/* Analytics Toggle */}
      {result && !showAnalytics && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Advanced Analytics Available
            </CardTitle>
            <CardDescription>
              View detailed survival curves, hazard rates, and sensitivity
              analysis for this prediction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowAnalytics(true)}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Show Analytics Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {showAnalytics && result && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Advanced Analytics</h2>
            <Button variant="outline" onClick={() => setShowAnalytics(false)}>
              Hide Analytics
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {survivalData && survivalData.length > 0 ? (
              <SurvivalCurve
                data={survivalData}
                title="Survival Probability"
                description="Based on current loan parameters"
                showConfidenceInterval={true}
                interactive={true}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Survival curve data not available
                </CardContent>
              </Card>
            )}

            {hazardData && hazardData.length > 0 ? (
              <HazardRateChart
                data={hazardData}
                title="Hazard Rate"
                description="Time-varying default risk"
                showRiskZones={true}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Hazard rate data not available
                </CardContent>
              </Card>
            )}
          </div>

          {sensitivityFactors.length > 0 && scenarios.length > 0 ? (
            <SensitivityAnalysis
              factors={sensitivityFactors}
              baseOutcome={
                result?.expected_value || result?.default_probability || 0
              }
              scenarios={scenarios}
              title="What-If Analysis"
              description="How changes in inputs affect the prediction"
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Sensitivity analysis data not available
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
