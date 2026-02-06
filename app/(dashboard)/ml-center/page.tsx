"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useMLCenterData,
  useStartTraining,
  useModelComparison,
  usePerformanceTrends,
  useDataDrift,
} from "@/lib/api/hooks/useML";
import { transformModelComparisonData } from "@/lib/utils/modelComparisonTransformer";
import { transformDriftData } from "@/lib/utils/dataDriftTransformer";
import {
  Brain,
  PlayCircle,
  Clock,
  TrendingUp,
  Zap,
  AlertTriangle,
  AlertCircle,
  GitCompare,
  Activity,
  Download,
  Settings,
  ArrowUp,
  ArrowDown,
  GitBranch,
  FileText,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { safeFormatDate } from "@/lib/utils/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiStatusIndicator } from "@/components/api-status-indicator";
import { AdvancedModelComparison } from "@/components/ml/AdvancedModelComparison";
import { DataDriftMonitor } from "@/components/ml/DataDriftMonitor";
import { exportToCSV } from "@/lib/utils/exportHelpers";
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";
import { useToast } from "@/hooks/use-toast";
import { CacheMetadata } from "@/components/common/CacheMetadata";
import { useAuth } from "@/lib/auth/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "default";
    case "training":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
};

const getModelTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    xgboost: "XGBoost",
    lightgbm: "LightGBM",
    neural_network: "Neural Network",
    lstm: "LSTM",
    transformer: "Transformer",
    meta_learner: "Meta Learner",
  };
  return labels[type] || type;
};

export default function MLCenterPage() {
  const { data, isLoading, error, refetch } = useMLCenterData();
  const startTraining = useStartTraining();
  const { toast } = useToast();
  const { user } = useAuth();
  const [abAllocation, setAbAllocation] = useState<Record<string, number>>({});
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  // Fetch real API data for advanced features
  const { data: comparisonData, isLoading: comparisonLoading } =
    useModelComparison();
  const { data: trendsData, isLoading: trendsLoading } = usePerformanceTrends(
    "30d",
    "day"
  );
  const { data: driftData, isLoading: driftLoading } = useDataDrift();

  // Use only API data - no fallback
  const mlData = data || null;

  // Transform API data to component format - no fallback, show empty state if API unavailable
  const comparisonTransform =
    comparisonData && trendsData
      ? transformModelComparisonData(comparisonData, trendsData)
      : { models: [], performanceHistory: [] };
  const { models: comparisonModels, performanceHistory } = comparisonTransform;

  const driftTransform = driftData
    ? transformDriftData(driftData)
    : { summary: null, featureDrifts: [], trends: [] };
  const {
    summary: driftSummary,
    featureDrifts,
    trends: driftTrends,
  } = driftTransform;

  const handleStartTraining = async (modelName: string) => {
    try {
      const result = await startTraining.mutateAsync({ model_name: modelName });
      // Refresh ML Center data to show new training job
      await refetch();
      console.log("Training started:", result);
    } catch (error) {
      console.error("Failed to start training:", error);
    }
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>ML Center Error</CardTitle>
              </div>
              <CardDescription>
                An error occurred while loading the ML Center. Please try
                refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">ML Center</h1>
              <CacheMetadata cacheKey="ml-center" variant="compact" />
            </div>
            <p className="text-muted-foreground">
              Model performance, training status, and ML operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ApiStatusIndicator endpoint="/api/ml/dashboard" label="Live" />
          </div>
        </div>

        {/* Error Alert */}
        {error && !mlData && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold">
                  Failed to load ML Center data from API.
                </span>
                <p className="mt-1 text-sm text-muted-foreground">
                  Error: {(error as any)?.message || "Unknown error occurred"}
                  {(error as any)?.statusCode &&
                    ` (Status: ${(error as any)?.statusCode})`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && !mlData && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No ML Center data found. The API returned an empty result.
            </AlertDescription>
          </Alert>
        )}

        {/* ML Metrics */}
        {mlData ? (
          <>
            <DashboardSection
              title="ML Metrics"
              description="Key performance indicators for ML models including active models, accuracy, predictions, and training jobs"
              icon={BarChart3}
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Models
                    </CardTitle>
                    <Brain className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {mlData.metrics?.active_models || 0} /{" "}
                      {mlData.metrics?.total_models || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Models in production
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average Accuracy
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {((mlData.metrics?.average_accuracy || 0) * 100).toFixed(
                        1
                      )}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Across all models
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Predictions
                    </CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(
                        mlData.metrics?.total_predictions || 0
                      ).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg latency: {mlData.metrics?.average_latency_ms || 0}ms
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Training Jobs
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {mlData.metrics?.training_jobs || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active training jobs
                    </p>
                  </CardContent>
                </Card>
              </div>
            </DashboardSection>

            <DashboardSection
              title="Model Management"
              description="Manage ML models, compare performance, monitor data drift, and track training jobs"
              icon={Brain}
            >
              <Tabs defaultValue="models" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="models">Models</TabsTrigger>
                  <TabsTrigger value="comparison" className="gap-2">
                    <GitCompare className="h-4 w-4" />
                    Advanced Comparison
                  </TabsTrigger>
                  <TabsTrigger value="drift" className="gap-2">
                    <Activity className="h-4 w-4" />
                    Data Drift
                  </TabsTrigger>
                  <TabsTrigger value="training">Training Jobs</TabsTrigger>
                </TabsList>

                {/* Models Tab */}
                <TabsContent value="models" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Model Performance</CardTitle>
                      <CardDescription>6-model ensemble system</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {isLoading ? (
                          <Skeleton className="h-40" />
                        ) : (
                          (mlData.models || []).map((model) => (
                            <div
                              key={model.model_id}
                              className="flex items-center justify-between rounded-lg border p-4"
                            >
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">
                                    {getModelTypeLabel(model.model_type)}
                                  </h3>
                                  <Badge
                                    variant={
                                      getStatusColor(model.status) as any
                                    }
                                  >
                                    {model.status}
                                  </Badge>
                                  {model.weight && (
                                    <Badge variant="outline">
                                      Weight: {model.weight}
                                    </Badge>
                                  )}
                                  <span className="text-sm text-muted-foreground">
                                    v{model.version}
                                  </span>
                                </div>
                                <div className="grid grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Accuracy:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {(model.accuracy * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      AUC-ROC:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {model.auc_roc.toFixed(3)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      F1 Score:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {model.f1_score.toFixed(3)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Last Trained:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {safeFormatDate(
                                        model.last_trained,
                                        "MMM d, yyyy",
                                        "Never"
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Settings className="mr-2 h-4 w-4" />
                                      Actions
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                      Model Registry
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedModel(model);
                                        setDeployDialogOpen(true);
                                      }}
                                    >
                                      <ArrowUp className="mr-2 h-4 w-4" />
                                      Promote to Production
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const correlationId =
                                          getOrCreateCorrelationId();
                                        toast({
                                          title: "Model Rollback Initiated",
                                          description: `Rolling back ${model.model_name} (ID: ${correlationId.substring(0, 8)}...)`,
                                        });
                                      }}
                                    >
                                      <ArrowDown className="mr-2 h-4 w-4" />
                                      Rollback
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const correlationId =
                                          getOrCreateCorrelationId();
                                        toast({
                                          title: "Canary Deployment",
                                          description: `Deploying ${model.model_name} to 10% traffic (ID: ${correlationId.substring(0, 8)}...)`,
                                        });
                                      }}
                                    >
                                      <GitBranch className="mr-2 h-4 w-4" />
                                      Canary Deploy
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const correlationId =
                                          getOrCreateCorrelationId();
                                        toast({
                                          title: "Shadow Deployment",
                                          description: `Shadow deploy ${model.model_name} (ID: ${correlationId.substring(0, 8)}...)`,
                                        });
                                      }}
                                    >
                                      <Zap className="mr-2 h-4 w-4" />
                                      Shadow Deploy
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const correlationId =
                                          getOrCreateCorrelationId();
                                        window.open(
                                          `/api/v1/models/${model.model_id}/artifacts?correlation_id=${correlationId}`,
                                          "_blank"
                                        );
                                      }}
                                    >
                                      <Download className="mr-2 h-4 w-4" />
                                      Download Artifacts
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleStartTraining(model.model_name)
                                  }
                                  disabled={startTraining.isPending}
                                >
                                  <PlayCircle className="mr-2 h-4 w-4" />
                                  Retrain
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Advanced Model Comparison Tab */}
                <TabsContent value="comparison" className="space-y-4">
                  {comparisonLoading || trendsLoading ? (
                    <Card>
                      <CardContent className="py-12">
                        <Skeleton className="h-64 w-full" />
                      </CardContent>
                    </Card>
                  ) : comparisonModels.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Model comparison data is not available. The API
                          endpoint may not be implemented yet.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <AdvancedModelComparison
                      models={comparisonModels}
                      performanceHistory={performanceHistory}
                      title="Model Performance Comparison"
                      description="Compare metrics across all ML models with radar charts and history"
                      onSelectModel={(model) =>
                        console.log("Selected model:", model)
                      }
                      onDeployModel={(model) =>
                        console.log("Deploy model:", model)
                      }
                    />
                  )}
                </TabsContent>

                {/* Data Drift Monitoring Tab */}
                <TabsContent value="drift" className="space-y-4">
                  {driftLoading ? (
                    <Card>
                      <CardContent className="py-12">
                        <Skeleton className="h-64 w-full" />
                      </CardContent>
                    </Card>
                  ) : !driftSummary ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Data drift monitoring data is not available. The API
                          endpoint may not be implemented yet.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <DataDriftMonitor
                      summary={driftSummary}
                      featureDrifts={featureDrifts}
                      trends={driftTrends}
                      title="Data Drift Monitoring"
                      description="Monitor feature and prediction drift across your models"
                      onRetrain={() => console.log("Retrain triggered")}
                      onRefresh={() => refetch()}
                    />
                  )}
                </TabsContent>

                {/* Training Jobs Tab */}
                <TabsContent value="training" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Training Jobs</CardTitle>
                      <CardDescription>
                        Recent and active training jobs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {isLoading ? (
                          <Skeleton className="h-40" />
                        ) : (
                          (mlData.recent_training_jobs || []).map((job) => (
                            <div
                              key={job.job_id}
                              className="space-y-3 rounded-lg border p-4"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">
                                    {job.model_name}
                                  </h3>
                                  <Badge
                                    variant={
                                      job.status === "completed"
                                        ? "default"
                                        : job.status === "failed"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                  >
                                    {job.status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Started:{" "}
                                  {safeFormatDate(
                                    job.started_at,
                                    "PPp",
                                    "Unknown"
                                  )}
                                </div>
                              </div>
                              {job.status === "running" && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span>Progress</span>
                                    <span>{job.progress}%</span>
                                  </div>
                                  <Progress value={job.progress} />
                                </div>
                              )}
                              {job.status === "completed" && job.metrics && (
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Accuracy:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {(job.metrics.accuracy * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      AUC-ROC:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {job.metrics.auc_roc.toFixed(3)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Time:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {Math.round(
                                        job.metrics.training_time_seconds / 60
                                      )}{" "}
                                      min
                                    </span>
                                  </div>
                                </div>
                              )}
                              {(job as any).error_message && (
                                <Alert variant="destructive">
                                  <AlertDescription>
                                    {(job as any).error_message}
                                  </AlertDescription>
                                </Alert>
                              )}
                              <div className="flex items-center gap-2">
                                {job.status === "failed" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const correlationId =
                                        getOrCreateCorrelationId();
                                      handleStartTraining(job.model_name);
                                      toast({
                                        title: "Retry Training",
                                        description: `Retrying ${job.model_name} (ID: ${correlationId.substring(0, 8)}...)`,
                                      });
                                    }}
                                  >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Retry
                                  </Button>
                                )}
                                {job.status === "running" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const correlationId =
                                        getOrCreateCorrelationId();
                                      toast({
                                        title: "Resume Training",
                                        description: `Resuming ${job.model_name} (ID: ${correlationId.substring(0, 8)}...)`,
                                      });
                                    }}
                                  >
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                    Resume
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const correlationId =
                                      getOrCreateCorrelationId();
                                    window.open(
                                      `/api/v1/models/training/${job.job_id}/artifacts?correlation_id=${correlationId}`,
                                      "_blank"
                                    );
                                  }}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download Artifacts
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const correlationId =
                                      getOrCreateCorrelationId();
                                    window.open(
                                      `/api/v1/models/training/${job.job_id}/logs?correlation_id=${correlationId}`,
                                      "_blank"
                                    );
                                  }}
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Logs
                                </Button>
                                {job.model_id && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      window.open(
                                        `/api/v1/models/${job.model_id}/endpoints`,
                                        "_blank"
                                      );
                                    }}
                                  >
                                    <Zap className="mr-2 h-4 w-4" />
                                    View Endpoints
                                  </Button>
                                )}
                              </div>
                              {job.latency_p95 && job.latency_p99 && (
                                <div className="text-xs text-muted-foreground">
                                  Latency: P95={job.latency_p95}ms, P99=
                                  {job.latency_p99}ms
                                </div>
                              )}
                              {job.lineage && (
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <div>
                                    Code: {job.lineage.code_version || "N/A"}
                                  </div>
                                  <div>
                                    Data: {job.lineage.data_version || "N/A"}
                                  </div>
                                  <div>
                                    Params:{" "}
                                    {job.lineage.params_hash
                                      ? job.lineage.params_hash.substring(
                                          0,
                                          8
                                        ) + "..."
                                      : "N/A"}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Export Reports */}
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const correlationId = getOrCreateCorrelationId();
                      if (comparisonModels.length > 0) {
                        const exportData = comparisonModels.map((m: any) => ({
                          Model: m.name,
                          Accuracy: m.accuracy,
                          "AUC-ROC": m.auc_roc,
                          "F1 Score": m.f1_score,
                          "Latency P95": m.latency_p95 || "N/A",
                          "Latency P99": m.latency_p99 || "N/A",
                        }));
                        await exportToCSV(
                          exportData,
                          "model_comparison",
                          undefined,
                          {
                            includeSignature: true,
                            version: "1.0.0",
                            filterSummary: `${comparisonModels.length} models compared`,
                          }
                        );
                        toast({
                          title: "Export Successful",
                          description: "Model comparison report exported",
                        });
                      }
                    }}
                    disabled={comparisonModels.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Comparison Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const correlationId = getOrCreateCorrelationId();
                      if (featureDrifts.length > 0) {
                        const exportData = featureDrifts.map((d: any) => ({
                          Feature: d.feature,
                          "Drift Score": d.drift_score,
                          Threshold: d.threshold,
                          Status: d.status,
                          "Last Check": d.last_check,
                        }));
                        await exportToCSV(
                          exportData,
                          "data_drift_report",
                          undefined,
                          {
                            includeSignature: true,
                            version: "1.0.0",
                            filterSummary: `${featureDrifts.length} features monitored`,
                          }
                        );
                        toast({
                          title: "Export Successful",
                          description: "Data drift report exported",
                        });
                      }
                    }}
                    disabled={featureDrifts.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Drift Report
                  </Button>
                </div>
              </Tabs>
            </DashboardSection>

            {/* A/B Deployment Dialog */}
            <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deploy Model</DialogTitle>
                  <DialogDescription>
                    Configure deployment settings for{" "}
                    {selectedModel?.model_name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Deployment Type</Label>
                    <Select defaultValue="production">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="canary">
                          Canary (10% traffic)
                        </SelectItem>
                        <SelectItem value="shadow">
                          Shadow (no traffic)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      A/B Allocation:{" "}
                      {abAllocation[selectedModel?.model_id] || 0}%
                    </Label>
                    <Slider
                      value={[abAllocation[selectedModel?.model_id] || 0]}
                      onValueChange={([value]) => {
                        setAbAllocation({
                          ...abAllocation,
                          [selectedModel?.model_id]: value,
                        });
                      }}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setDeployDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        const correlationId = getOrCreateCorrelationId();
                        toast({
                          title: "Deployment Initiated",
                          description: `Deploying ${selectedModel?.model_name} (ID: ${correlationId.substring(0, 8)}...)`,
                        });
                        setDeployDialogOpen(false);
                      }}
                    >
                      Deploy
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : null}
      </div>
    </ErrorBoundary>
  );
}
