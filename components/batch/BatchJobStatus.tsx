"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { useBatchScoringJobStatus, useBatchScoringResults } from "@/lib/api/hooks/useBatchScoring";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface BatchJobStatusProps {
  jobId: string;
  onResultsReady?: (results: any) => void;
}

export function BatchJobStatus({ jobId, onResultsReady }: BatchJobStatusProps) {
  const { data: jobStatus, isLoading, error, refetch } = useBatchScoringJobStatus(jobId);
  const { data: results, isLoading: resultsLoading } = useBatchScoringResults(
    jobId,
    jobStatus?.status === "completed" ? "json" : undefined
  );

  React.useEffect(() => {
    if (jobStatus?.status === "completed" && results && onResultsReady) {
      onResultsReady(results);
    }
  }, [jobStatus?.status, results, onResultsReady]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "failed":
      case "error":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "running":
      case "processing":
        return <Badge variant="default" className="bg-blue-500"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      case "pending":
      case "queued":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />{status || "Unknown"}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !jobStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Batch Job Status</CardTitle>
          <CardDescription>Job ID: {jobId}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {error ? "Failed to load job status" : "Job not found"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = jobStatus.progress || 0;
  const total = jobStatus.total || 0;
  const processed = jobStatus.processed || 0;
  const failed = jobStatus.failed || 0;
  const successful = processed - failed;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Batch Job Status</CardTitle>
            <CardDescription>Job ID: {jobId}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(jobStatus.status)}
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{successful}</div>
            <div className="text-xs text-muted-foreground">Successful</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{failed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{processed}</div>
            <div className="text-xs text-muted-foreground">Processed</div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {jobStatus.started_at && (
            <div>
              <div className="text-muted-foreground">Started</div>
              <div>{new Date(jobStatus.started_at).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(jobStatus.started_at), { addSuffix: true })}
              </div>
            </div>
          )}
          {jobStatus.completed_at && (
            <div>
              <div className="text-muted-foreground">Completed</div>
              <div>{new Date(jobStatus.completed_at).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(jobStatus.completed_at), { addSuffix: true })}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {jobStatus.error_message && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="text-sm font-medium text-destructive">Error</div>
            <div className="text-sm text-muted-foreground mt-1">{jobStatus.error_message}</div>
          </div>
        )}

        {/* Results Download */}
        {jobStatus.status === "completed" && results && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div>
              <div className="text-sm font-medium">Results Ready</div>
              <div className="text-xs text-muted-foreground">
                {results.results?.length || 0} results available
              </div>
            </div>
            {jobStatus.results_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={jobStatus.results_url} download>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Loading Results */}
        {jobStatus.status === "completed" && resultsLoading && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Loading results...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
