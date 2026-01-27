"use client";
import React, { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Line
} from "recharts";
import { Download, Calendar, DollarSign, TrendingDown } from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/utils/export-service";

interface PaymentData {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
}

interface PaymentScheduleProps {
  loanAmount: number;
  interestRate: number; // Annual rate as decimal (e.g., 0.15 for 15%)
  termMonths: number;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Payment Schedule Component
 * 
 * Displays loan amortization schedule with visualizations
 */
export function PaymentSchedule({
  loanAmount,
  interestRate,
  termMonths,
  title = "Payment Schedule",
  description = "Monthly payment breakdown and amortization",
  className,
}: PaymentScheduleProps) {
  const [activeTab, setActiveTab] = useState<"chart" | "table">("chart");
  const [chartType, setChartType] = useState<"stacked" | "area" | "breakdown">("stacked");

  // Calculate amortization schedule
  const schedule = useMemo(() => {
    return calculateAmortizationSchedule(loanAmount, interestRate, termMonths);
  }, [loanAmount, interestRate, termMonths]);

  // Calculate summary stats
  const summary = useMemo(() => {
    if (schedule.length === 0) return null;
    
    const totalPayment = schedule.reduce((sum, p) => sum + p.payment, 0);
    const totalInterest = schedule.reduce((sum, p) => sum + p.interest, 0);
    const monthlyPayment = schedule[0]?.payment || 0;
    
    return {
      monthlyPayment,
      totalPayment,
      totalInterest,
      totalPrincipal: loanAmount,
      interestRatio: totalInterest / totalPayment,
    };
  }, [schedule, loanAmount]);

  const handleExport = async (format: "pdf" | "excel") => {
    const exportData = schedule.map(p => ({
      Month: p.month,
      "Payment (ETB)": p.payment.toFixed(2),
      "Principal (ETB)": p.principal.toFixed(2),
      "Interest (ETB)": p.interest.toFixed(2),
      "Balance (ETB)": p.balance.toFixed(2),
    }));

    if (format === "excel") {
      exportToExcel(exportData, {
        filename: `payment-schedule-${Date.now()}`,
        sheetName: "Schedule",
      });
    } else {
      await exportToPDF(exportData, {
        title: "Loan Payment Schedule",
        filename: `payment-schedule-${Date.now()}`,
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
              <Download className="h-4 w-4 mr-1" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loan Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Monthly Payment"
              value={`${summary.monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })} ETB`}
            />
            <SummaryCard
              icon={<Calendar className="h-4 w-4" />}
              label="Total Payment"
              value={`${summary.totalPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })} ETB`}
            />
            <SummaryCard
              icon={<TrendingDown className="h-4 w-4" />}
              label="Total Interest"
              value={`${summary.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })} ETB`}
              sublabel={`${(summary.interestRatio * 100).toFixed(1)}% of total`}
            />
            <SummaryCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Principal"
              value={`${loanAmount.toLocaleString()} ETB`}
              sublabel={`${termMonths} months @ ${(interestRate * 100).toFixed(1)}%`}
            />
          </div>
        )}

        {/* View Toggle */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="chart">Chart View</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
            </TabsList>
            {activeTab === "chart" && (
              <div className="flex gap-1">
                <Button 
                  variant={chartType === "stacked" ? "secondary" : "ghost"} 
                  size="sm"
                  onClick={() => setChartType("stacked")}
                >
                  Stacked
                </Button>
                <Button 
                  variant={chartType === "area" ? "secondary" : "ghost"} 
                  size="sm"
                  onClick={() => setChartType("area")}
                >
                  Area
                </Button>
                <Button 
                  variant={chartType === "breakdown" ? "secondary" : "ghost"} 
                  size="sm"
                  onClick={() => setChartType("breakdown")}
                >
                  Breakdown
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="chart">
            <ResponsiveContainer width="100%" height={350}>
              {chartType === "stacked" ? (
                <BarChart data={schedule} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    label={{ value: 'Amount (ETB)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="principal" stackId="a" fill="#3b82f6" name="Principal" />
                  <Bar dataKey="interest" stackId="a" fill="#ef4444" name="Interest" />
                </BarChart>
              ) : chartType === "area" ? (
                <AreaChart data={schedule} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="cumulativePrincipal" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                    name="Cumulative Principal"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulativeInterest" 
                    stackId="1" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.6}
                    name="Cumulative Interest"
                  />
                </AreaChart>
              ) : (
                <ComposedChart data={schedule} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="principal" fill="#3b82f6" name="Principal" />
                  <Bar yAxisId="left" dataKey="interest" fill="#ef4444" name="Interest" />
                  <Line yAxisId="right" type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} name="Balance" dot={false} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="table">
            <div className="border rounded-lg max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="text-center">Month</TableHead>
                    <TableHead className="text-right">Payment</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="text-center font-medium">{row.month}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.payment)}</TableCell>
                      <TableCell className="text-right text-blue-600">{formatCurrency(row.principal)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(row.interest)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(row.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Interest vs Principal Ratio Over Time */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Interest/Principal Ratio Over Time</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden flex">
              {schedule.slice(0, Math.min(24, termMonths)).map((p, i) => {
                const ratio = p.interest / p.payment;
                return (
                  <div
                    key={i}
                    className="h-full"
                    style={{ 
                      width: `${100 / Math.min(24, termMonths)}%`,
                      backgroundColor: `hsl(${(1 - ratio) * 120}, 70%, 50%)`,
                    }}
                    title={`Month ${p.month}: ${(ratio * 100).toFixed(1)}% interest`}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>High Interest</span>
              <div className="w-16 h-3 rounded bg-gradient-to-r from-red-500 to-green-500" />
              <span>Low Interest</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper Components
function SummaryCard({ 
  icon, 
  label, 
  value, 
  sublabel 
}: { 
  icon: React.ReactNode;
  label: string; 
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <p className="text-lg font-bold">{value}</p>
      {sublabel && (
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[180px]">
      <p className="font-medium mb-2">Month {label}</p>
      <div className="space-y-1 text-sm">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Utility functions
function calculateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number
): PaymentData[] {
  const monthlyRate = annualRate / 12;
  const schedule: PaymentData[] = [];
  
  // Calculate monthly payment using amortization formula
  const monthlyPayment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  let balance = principal;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;

  for (let month = 1; month <= termMonths; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    
    balance -= principalPayment;
    cumulativePrincipal += principalPayment;
    cumulativeInterest += interestPayment;

    schedule.push({
      month,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, balance),
      cumulativePrincipal,
      cumulativeInterest,
    });
  }

  return schedule;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  }) + ' ETB';
}

export default PaymentSchedule;


