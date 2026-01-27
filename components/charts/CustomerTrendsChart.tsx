"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useCustomerTrends } from "@/lib/api/hooks/useCustomerTrends";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerTrendsChartProps {
  customerId: string;
  defaultTimeRange?: string;
}

export function CustomerTrendsChart({ customerId, defaultTimeRange = "90d" }: CustomerTrendsChartProps) {
  const [timeRange, setTimeRange] = React.useState(defaultTimeRange);
  const { data: trendsData, isLoading, error } = useCustomerTrends(customerId, timeRange);

  const trends = trendsData?.trends || {};

  // Format data for charts
  const creditScoreData = (trends.credit_scores || []).map((item: any) => ({
    date: item.date ? new Date(item.date).toLocaleDateString() : "",
    value: item.value || 0,
    max: item.max || item.value || 0,
    min: item.min || item.value || 0,
  }));

  const loanAmountData = (trends.loan_amounts || []).map((item: any) => ({
    date: item.date ? new Date(item.date).toLocaleDateString() : "",
    value: item.value || 0,
  }));

  const riskLevelData = (trends.risk_levels || []).map((item: any) => ({
    date: item.date ? new Date(item.date).toLocaleDateString() : "",
    level: item.value || "medium",
  }));

  const defaultProbData = (trends.default_probabilities || []).map((item: any) => ({
    date: item.date ? new Date(item.date).toLocaleDateString() : "",
    value: (item.value || 0) * 100, // Convert to percentage
  }));

  // Calculate trends
  const calculateTrend = (data: any[]) => {
    if (data.length < 2) return null;
    const first = data[0]?.value || 0;
    const last = data[data.length - 1]?.value || 0;
    const change = last - first;
    const percentChange = first !== 0 ? (change / first) * 100 : 0;
    return { change, percentChange };
  };

  const creditScoreTrend = calculateTrend(creditScoreData);
  const loanAmountTrend = calculateTrend(loanAmountData);
  const defaultProbTrend = calculateTrend(defaultProbData);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !trendsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Trends</CardTitle>
          <CardDescription>Historical customer metrics and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {error ? "Failed to load trends data" : "No trends data available"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Customer Trends</CardTitle>
            <CardDescription>Historical customer metrics and trends over time</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="credit-scores" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="credit-scores">Credit Scores</TabsTrigger>
            <TabsTrigger value="loan-amounts">Loan Amounts</TabsTrigger>
            <TabsTrigger value="risk-levels">Risk Levels</TabsTrigger>
            <TabsTrigger value="default-prob">Default Probability</TabsTrigger>
          </TabsList>

          <TabsContent value="credit-scores" className="space-y-4">
            {creditScoreTrend && (
              <div className="flex items-center gap-2 text-sm">
                {creditScoreTrend.change > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : creditScoreTrend.change < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-500" />
                )}
                <span className={creditScoreTrend.change > 0 ? "text-green-500" : creditScoreTrend.change < 0 ? "text-red-500" : "text-gray-500"}>
                  {creditScoreTrend.change > 0 ? "+" : ""}{creditScoreTrend.change.toFixed(0)} points
                  ({creditScoreTrend.percentChange > 0 ? "+" : ""}{creditScoreTrend.percentChange.toFixed(1)}%)
                </span>
              </div>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={creditScoreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Average Score" />
                <Area type="monotone" dataKey="max" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} name="Max Score" />
                <Area type="monotone" dataKey="min" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} name="Min Score" />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="loan-amounts" className="space-y-4">
            {loanAmountTrend && (
              <div className="flex items-center gap-2 text-sm">
                {loanAmountTrend.change > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : loanAmountTrend.change < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-500" />
                )}
                <span className={loanAmountTrend.change > 0 ? "text-green-500" : loanAmountTrend.change < 0 ? "text-red-500" : "text-gray-500"}>
                  {loanAmountTrend.change > 0 ? "+" : ""}ETB {loanAmountTrend.change.toFixed(2)}
                  ({loanAmountTrend.percentChange > 0 ? "+" : ""}{loanAmountTrend.percentChange.toFixed(1)}%)
                </span>
              </div>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={loanAmountData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `ETB ${value}`} />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} name="Loan Amount" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="risk-levels" className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={riskLevelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="level" stroke="#8884d8" strokeWidth={2} name="Risk Level" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="default-prob" className="space-y-4">
            {defaultProbTrend && (
              <div className="flex items-center gap-2 text-sm">
                {defaultProbTrend.change < 0 ? (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                ) : defaultProbTrend.change > 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-500" />
                )}
                <span className={defaultProbTrend.change < 0 ? "text-green-500" : defaultProbTrend.change > 0 ? "text-red-500" : "text-gray-500"}>
                  {defaultProbTrend.change > 0 ? "+" : ""}{defaultProbTrend.change.toFixed(2)}%
                  ({defaultProbTrend.percentChange > 0 ? "+" : ""}{defaultProbTrend.percentChange.toFixed(1)}%)
                </span>
              </div>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={defaultProbData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Area type="monotone" dataKey="value" stroke="#ff4d4f" fill="#ff4d4f" fillOpacity={0.6} name="Default Probability %" />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
