"use client";

import { useState, useEffect, useMemo } from "react";
import { useWebSocket, useWebSocketChannel } from "@/lib/hooks/useWebSocket";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, AlertTriangle, AlertCircle, Pause, Play, Download, Settings, Clock, FileText, BarChart3, Activity, Zap, Filter } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ApiStatusIndicator } from "@/components/common/ApiStatusIndicator";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RealtimeDashboard } from "@/components/realtime/RealtimeDashboard";
import { ScoreFeed } from "@/components/realtime/ScoreFeed";
import { CustomerRealtimeDashboard } from "@/components/realtime/CustomerRealtimeDashboard";
import {
  useRealtimeDashboard,
  useRealtimeScoreFeed,
  useRealtimeScoringFeed,
  useRealtimeMetrics,
  RealtimeScoreEntry,
  RealtimeMetrics,
} from "@/lib/api/hooks/useRealtimeScoring";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomerAutocomplete } from "@/components/common/CustomerAutocomplete";
import { RealtimeScoringFilters, useRealtimeFilters } from "@/components/realtime/RealtimeScoringFilters";
import { useToast } from "@/hooks/use-toast";
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";
import { exportToCSV, exportToPDF, exportToExcel } from "@/lib/utils/exportHelpers";
import { Slider } from "@/components/ui/slider";
import { CacheMetadata } from "@/components/common/CacheMetadata";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RealtimeScoringPage() {
  const [customerId, setCustomerId] = useState<string>("");
  const [searchCustomerId, setSearchCustomerId] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [windowSize, setWindowSize] = useState(50);
  const [maxRetention, setMaxRetention] = useState(1000);
  const [streamLatencies, setStreamLatencies] = useState<number[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const { toast } = useToast();
  
  // Advanced filtering
  const { filters, setFilters, applyFilters, hasActiveFilters } = useRealtimeFilters();

  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useRealtimeDashboard(
    searchCustomerId || undefined
  );
  const { data: scoreFeed, isLoading: feedLoading, error: feedError, refetch: refetchFeed } = useRealtimeScoreFeed();
  const { data: metricsData, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useRealtimeMetrics();
  
  // Also use the alternative feed hook that might have different data
  const { data: alternativeFeed } = useRealtimeScoringFeed(50);
  
  // Transform metrics data to match expected format
  const metrics = metricsData ? {
    total_scores_today: metricsData.total_scores_today || 0,
    average_score: metricsData.average_score || 0,
    scores_per_minute: metricsData.scores_per_minute || 0,
    active_customers: metricsData.active_customers || 0,
    score_trend: metricsData.score_trend || []
  } : undefined;
  
  // WebSocket for real-time updates
  const { status: wsStatus, isConnected: wsConnected } = useWebSocket({
    enabled: typeof window !== 'undefined',
  });
  
  // Subscribe to real-time credit score updates
  const { data: realtimeScoreUpdate } = useWebSocketChannel<RealtimeScoreEntry>(
    'credit_score_update',
    wsConnected
  );
  
  // Maintain local state for score feed with WebSocket updates
  const [liveScoreFeed, setLiveScoreFeed] = useState<RealtimeScoreEntry[]>([]);
  
  useEffect(() => {
    if (scoreFeed && scoreFeed.length > 0) {
      setLiveScoreFeed(scoreFeed);
    }
  }, [scoreFeed]);
  
  useEffect(() => {
    if (realtimeScoreUpdate && !isPaused) {
      const startTime = Date.now();
      setLiveScoreFeed((prev) => {
        // Anomaly detection: sudden score drop (check before updating)
        const recentScores = prev.slice(0, 5).map(s => s.score).filter(Boolean);
        if (recentScores.length > 0 && realtimeScoreUpdate.score) {
          const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
          if ((avgRecent - realtimeScoreUpdate.score) > 100) {
            toast({
              title: "Anomaly Detected",
              description: `Significant score drop detected for customer ${realtimeScoreUpdate.customer_id}`,
              variant: "destructive",
            });
          }
        }
        
        // Add new score at the beginning, limit to windowSize
        const updated = [realtimeScoreUpdate, ...prev];
        // Backpressure handling: if we exceed max retention, remove oldest
        if (updated.length > maxRetention) {
          return updated.slice(0, maxRetention);
        }
        return updated.slice(0, windowSize);
      });
      
      // Track latency
      const latency = Date.now() - startTime;
      setStreamLatencies((prev) => {
        const updated = [...prev, latency];
        return updated.slice(-100); // Keep last 100 measurements
      });
      
      setLastUpdateTime(new Date());
      
      // Show toast for critical risk events
      if (realtimeScoreUpdate.risk_category === "very_high" || 
          (realtimeScoreUpdate.score && realtimeScoreUpdate.score < 500)) {
        toast({
          title: "Critical Risk Alert",
          description: `Customer ${realtimeScoreUpdate.customer_id} scored ${realtimeScoreUpdate.score} (${realtimeScoreUpdate.risk_category} risk)`,
          variant: "destructive",
        });
      }
    }
  }, [realtimeScoreUpdate, isPaused, windowSize, maxRetention, toast]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = () => {
    setSearchCustomerId(customerId);
  };

  const handleRetry = () => {
    refetchMetrics();
    refetchFeed();
    if (searchCustomerId) {
      refetchDashboard();
    }
  };

  // Use only API data - no fallback
  const displayMetrics: RealtimeMetrics = metrics || {
    total_scores_today: 0,
    average_score: 0,
    scores_per_minute: 0,
    active_customers: 0,
    score_trend: [],
  };

  // Combine all score sources: WebSocket updates, primary feed, and alternative feed
  const allScores = useMemo(() => {
    const scores: RealtimeScoreEntry[] = [];
    const seenIds = new Set<string>();
    
    // Add WebSocket updates first (most recent)
    liveScoreFeed.forEach(score => {
      const id = `${score.customer_id}-${score.timestamp}`;
      if (!seenIds.has(id)) {
        scores.push(score);
        seenIds.add(id);
      }
    });
    
    // Add primary feed
    if (scoreFeed && scoreFeed.length > 0) {
      scoreFeed.forEach(score => {
        const id = `${score.customer_id}-${score.timestamp}`;
        if (!seenIds.has(id)) {
          scores.push(score);
          seenIds.add(id);
        }
      });
    }
    
    // Add alternative feed if available
    if (alternativeFeed && alternativeFeed.length > 0) {
      alternativeFeed.forEach((item: any) => {
        const score: RealtimeScoreEntry = {
          customer_id: item.customer_id || item.customerId || "",
          score: item.score || item.credit_score || 0,
          risk_category: (item.risk_category || item.riskCategory || "medium") as RealtimeScoreEntry["risk_category"],
          timestamp: item.timestamp || item.created_at || new Date().toISOString(),
          loan_amount: item.loan_amount || item.loanAmount,
        };
        const id = `${score.customer_id}-${score.timestamp}`;
        if (!seenIds.has(id)) {
          scores.push(score);
          seenIds.add(id);
        }
      });
    }
    
    // Sort by timestamp descending (most recent first)
    return scores.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [liveScoreFeed, scoreFeed, alternativeFeed]);
  
  // Apply filters to scores
  const displayScores = useMemo(() => {
    return applyFilters(allScores);
  }, [allScores, applyFilters]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Real-Time Scoring</h1>
            <CacheMetadata cacheKey="realtime-scoring" variant="compact" />
          </div>
          <p className="text-muted-foreground">
            Live credit scoring dashboard and activity feed
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Real API Health Status - checks realtime scoring endpoint */}
          <ApiStatusIndicator 
            endpoint="/api/scoring/realtime/metrics" 
            label="Live"
          />
          <div className="flex items-center gap-2">
            <CustomerAutocomplete
              value={customerId}
              onSelect={(customerId, customer) => {
                setCustomerId(customerId);
                if (customerId) {
                  setSearchCustomerId(customerId);
                }
              }}
              placeholder="Search customer..."
              className="w-64"
            />
          </div>
        </div>
      </div>

      {/* Error Alerts */}
      {metricsError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-semibold">Failed to load real-time metrics from API.</span>
              <p className="text-sm mt-1 text-muted-foreground">
                Error: {(metricsError as any)?.message || "Unknown error occurred"}
                {(metricsError as any)?.statusCode && ` (Status: ${(metricsError as any)?.statusCode})`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={() => refetchMetrics()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {feedError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-semibold">Failed to load score feed from API.</span>
              <p className="text-sm mt-1 text-muted-foreground">
                Error: {(feedError as any)?.message || "Unknown error occurred"}
                {(feedError as any)?.statusCode && ` (Status: ${(feedError as any)?.statusCode})`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={() => refetchFeed()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!metricsLoading && !feedLoading && !metricsError && !feedError && !metrics && (!scoreFeed || scoreFeed.length === 0) && liveScoreFeed.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No real-time scoring data available. The API returned an empty result.
          </AlertDescription>
        </Alert>
      )}

      {/* Stream Controls & Settings */}
      <DashboardSection
        title="Stream Controls"
        description="Manage real-time stream settings, monitoring, and export options"
        icon={Settings}
        actions={
          <>
            <Badge variant={wsConnected ? "default" : "destructive"} className="flex items-center gap-1">
              {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {wsStatus}
            </Badge>
            {lastUpdateTime && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last: {Math.floor((Date.now() - lastUpdateTime.getTime()) / 1000)}s ago
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={displayScores.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Feed
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={async () => {
                    const correlationId = getOrCreateCorrelationId();
                    const exportData = displayScores.slice(0, 100).map((score) => ({
                      "Customer ID": score.customer_id,
                      "Score": score.score,
                      "Risk Category": score.risk_category,
                      "Timestamp": score.timestamp,
                      "Loan Amount": score.loan_amount || "N/A",
                      "Correlation ID": score.correlation_id || correlationId,
                    }));
                    await exportToCSV(exportData, "realtime_scoring_feed", undefined, {
                      includeSignature: true,
                      version: "1.0.0",
                      filterSummary: `Recent ${exportData.length} entries`,
                    });
                    toast({
                      title: "Export Successful",
                      description: "CSV export completed",
                    });
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    const correlationId = getOrCreateCorrelationId();
                    const exportData = displayScores.slice(0, 100).map((score) => ({
                      "Customer ID": score.customer_id,
                      "Score": score.score,
                      "Risk Category": score.risk_category,
                      "Timestamp": score.timestamp,
                      "Loan Amount": score.loan_amount || "N/A",
                      "Correlation ID": score.correlation_id || correlationId,
                    }));
                    await exportToExcel(exportData, "realtime_scoring_feed", undefined, {
                      includeSignature: true,
                      version: "1.0.0",
                      filterSummary: `Recent ${exportData.length} entries`,
                    });
                    toast({
                      title: "Export Successful",
                      description: "Excel export completed",
                    });
                  }}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    const correlationId = getOrCreateCorrelationId();
                    const exportData = displayScores.slice(0, 100).map((score) => ({
                      "Customer ID": score.customer_id,
                      "Score": score.score,
                      "Risk Category": score.risk_category,
                      "Timestamp": score.timestamp,
                      "Loan Amount": score.loan_amount || "N/A",
                      "Correlation ID": score.correlation_id || correlationId,
                    }));
                    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Real-Time Scoring Feed Export</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h1>Real-Time Scoring Feed</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <p>Total Entries: ${exportData.length}</p>
  <table>
    <thead>
      <tr>
        <th>Customer ID</th>
        <th>Score</th>
        <th>Risk Category</th>
        <th>Timestamp</th>
        <th>Loan Amount</th>
      </tr>
    </thead>
    <tbody>
      ${exportData.map((score: any) => `
        <tr>
          <td>${score["Customer ID"]}</td>
          <td>${score.Score}</td>
          <td>${score["Risk Category"]}</td>
          <td>${score.Timestamp}</td>
          <td>${score["Loan Amount"]}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
</body>
</html>
                    `;
                    await exportToPDF(htmlContent, "realtime_scoring_feed", {
                      includeSignature: true,
                      version: "1.0.0",
                      recordCount: exportData.length,
                      filterSummary: `Recent ${exportData.length} entries`,
                    });
                    toast({
                      title: "Export Successful",
                      description: "PDF export started",
                    });
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      >
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-2">
              <Badge variant={wsConnected ? "default" : "destructive"} className="flex items-center gap-1">
                {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {wsStatus}
              </Badge>
              {lastUpdateTime && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last: {Math.floor((Date.now() - lastUpdateTime.getTime()) / 1000)}s ago
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={displayScores.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Feed
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={async () => {
                      const correlationId = getOrCreateCorrelationId();
                      const exportData = displayScores.slice(0, 100).map((score) => ({
                        "Customer ID": score.customer_id,
                        "Score": score.score,
                        "Risk Category": score.risk_category,
                        "Timestamp": score.timestamp,
                        "Loan Amount": score.loan_amount || "N/A",
                        "Correlation ID": score.correlation_id || correlationId,
                      }));
                      await exportToCSV(exportData, "realtime_scoring_feed", undefined, {
                        includeSignature: true,
                        version: "1.0.0",
                        filterSummary: `Recent ${exportData.length} entries`,
                      });
                      toast({
                        title: "Export Successful",
                        description: "CSV export completed",
                      });
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      const correlationId = getOrCreateCorrelationId();
                      const exportData = displayScores.slice(0, 100).map((score) => ({
                        "Customer ID": score.customer_id,
                        "Score": score.score,
                        "Risk Category": score.risk_category,
                        "Timestamp": score.timestamp,
                        "Loan Amount": score.loan_amount || "N/A",
                        "Correlation ID": score.correlation_id || correlationId,
                      }));
                      await exportToExcel(exportData, "realtime_scoring_feed", undefined, {
                        includeSignature: true,
                        version: "1.0.0",
                        filterSummary: `Recent ${exportData.length} entries`,
                      });
                      toast({
                        title: "Export Successful",
                        description: "Excel export completed",
                      });
                    }}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      const correlationId = getOrCreateCorrelationId();
                      const exportData = displayScores.slice(0, 100).map((score) => ({
                        "Customer ID": score.customer_id,
                        "Score": score.score,
                        "Risk Category": score.risk_category,
                        "Timestamp": score.timestamp,
                        "Loan Amount": score.loan_amount || "N/A",
                        "Correlation ID": score.correlation_id || correlationId,
                      }));
                      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Real-Time Scoring Feed Export</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h1>Real-Time Scoring Feed</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <p>Total Entries: ${exportData.length}</p>
  <table>
    <thead>
      <tr>
        <th>Customer ID</th>
        <th>Score</th>
        <th>Risk Category</th>
        <th>Timestamp</th>
        <th>Loan Amount</th>
      </tr>
    </thead>
    <tbody>
      ${exportData.map((score: any) => `
        <tr>
          <td>${score["Customer ID"]}</td>
          <td>${score.Score}</td>
          <td>${score["Risk Category"]}</td>
          <td>${score.Timestamp}</td>
          <td>${score["Loan Amount"]}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
</body>
</html>
                      `;
                      await exportToPDF(htmlContent, "realtime_scoring_feed", {
                        includeSignature: true,
                        version: "1.0.0",
                        recordCount: exportData.length,
                        filterSummary: `Recent ${exportData.length} entries`,
                      });
                      toast({
                        title: "Export Successful",
                        description: "PDF export started",
                      });
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid gap-4 md:grid-cols-3 mt-4">
            <div className="space-y-2">
              <Label>Window Size: {windowSize}</Label>
              <Slider
                value={[windowSize]}
                onValueChange={([value]) => setWindowSize(value)}
                min={10}
                max={500}
                step={10}
              />
              <p className="text-xs text-muted-foreground">Number of entries to display</p>
            </div>
            <div className="space-y-2">
              <Label>Max Retention: {maxRetention}</Label>
              <Slider
                value={[maxRetention]}
                onValueChange={([value]) => setMaxRetention(value)}
                min={100}
                max={10000}
                step={100}
              />
              <p className="text-xs text-muted-foreground">Maximum entries to keep in memory</p>
            </div>
            <div className="space-y-2">
              <Label>Stream Freshness</Label>
              <div className="flex items-center gap-2">
                {lastUpdateTime ? (
                  <>
                    {(() => {
                      const ageSeconds = Math.floor((Date.now() - lastUpdateTime.getTime()) / 1000);
                      const isFresh = ageSeconds < 30;
                      return (
                        <Badge variant={isFresh ? "default" : "destructive"}>
                          {isFresh ? "Fresh" : "Stale"} ({ageSeconds}s)
                        </Badge>
                      );
                    })()}
                  </>
                ) : (
                  <Badge variant="outline">No updates</Badge>
                )}
              </div>
              {streamLatencies.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Avg Latency: {Math.round(streamLatencies.reduce((a, b) => a + b, 0) / streamLatencies.length)}ms
                  <br />
                  P95: {Math.round(streamLatencies.sort((a, b) => b - a)[Math.floor(streamLatencies.length * 0.05)] || 0)}ms
                </div>
              )}
            </div>
            </div>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Advanced Filters */}
      <DashboardSection
        title="Advanced Filters"
        description="Filter real-time scoring feed by customer, score range, risk category, and time period"
        icon={Filter}
      >
        <RealtimeScoringFilters
        filters={filters}
        onFiltersChange={setFilters}
        onApply={() => {
          // Sync customer filter with search
          if (filters.customerId && filters.customerId !== searchCustomerId) {
            setSearchCustomerId(filters.customerId);
            setCustomerId(filters.customerId);
          }
        }}
        />
      </DashboardSection>

      {/* Real-Time Dashboard */}
      <DashboardSection
        title="Real-Time Metrics Dashboard"
        description="Live scoring metrics, trends, and performance indicators"
        icon={Activity}
      >
        <RealtimeDashboard
        metrics={displayMetrics}
        isLoading={metricsLoading}
        />
      </DashboardSection>

      {/* Customer-Specific Dashboard (if customer ID provided) */}
      {searchCustomerId && (
        <DashboardSection
          title="Customer-Specific Dashboard"
          description={`Real-time scoring analytics for customer ${searchCustomerId}`}
          icon={Zap}
        >
          <CustomerRealtimeDashboard
          customerId={searchCustomerId}
          data={dashboardData}
          isLoading={dashboardLoading}
          />
        </DashboardSection>
      )}

      {/* Live Score Feed */}
      <DashboardSection
        title="Live Score Feed"
        description="Real-time credit scoring activity feed with filtering and window controls"
        icon={Zap}
        collapsible={true}
        defaultOpen={true}
      >
        <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasActiveFilters && allScores.length !== displayScores.length && (
              <div className="text-sm text-muted-foreground">
                Showing {displayScores.length} of {allScores.length} scores (filtered)
              </div>
            )}
            {liveScoreFeed.length > maxRetention * 0.9 && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Backpressure: {liveScoreFeed.length}/{maxRetention}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {isPaused && <Badge variant="outline">Paused</Badge>}
          </div>
        </div>
        <ScoreFeed scores={displayScores.slice(0, windowSize)} maxEntries={windowSize} />
        </div>
      </DashboardSection>
    </div>
  );
}

