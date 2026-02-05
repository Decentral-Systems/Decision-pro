"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Clock, TrendingUp, Users } from "lucide-react";
import { MetricTrend } from "@/components/charts/MetricTrend";

interface RealtimeMetrics {
  total_scores_today: number;
  average_score: number;
  scores_per_minute: number;
  active_customers: number;
  score_trend: Array<{ time: string; count: number; avg_score: number }>;
}

interface RealtimeDashboardProps {
  metrics: RealtimeMetrics;
  isLoading?: boolean;
}

export function RealtimeDashboard({ metrics, isLoading }: RealtimeDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-muted animate-pulse rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const trendData = metrics.score_trend.map((t) => ({
    name: t.time,
    value: t.count,
  }));

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scores Today</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_scores_today.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.scores_per_minute} per minute
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.average_score.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Today&apos;s average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scores/Min</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.scores_per_minute.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Current rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_customers}</div>
            <p className="text-xs text-muted-foreground">Being scored</p>
          </CardContent>
        </Card>
      </div>

      {/* Score Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Activity Trend</CardTitle>
          <CardDescription>Number of scores processed over time</CardDescription>
        </CardHeader>
        <CardContent>
          <MetricTrend data={trendData} color="#0ea5e9" />
        </CardContent>
      </Card>
    </div>
  );
}


