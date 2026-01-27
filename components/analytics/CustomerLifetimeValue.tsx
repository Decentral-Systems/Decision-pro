"use client";
import React, { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ComposedChart, 
  Line, 
  Area,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Download, TrendingUp, Users, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { exportToExcel } from "@/lib/utils/export-service";

interface CustomerCLVData {
  customerId: string;
  customerName: string;
  segment: "high" | "medium" | "low";
  clv: number;
  averageMonthlyRevenue: number;
  tenure: number;
  churnProbability: number;
  loanCount: number;
  totalInterestPaid: number;
  lastActivity: string;
}

interface CLVTrendData {
  month: string;
  averageCLV: number;
  highSegment: number;
  mediumSegment: number;
  lowSegment: number;
  totalCustomers: number;
}

interface SegmentDistribution {
  segment: string;
  count: number;
  percentage: number;
  averageCLV: number;
  color: string;
}

interface CustomerLifetimeValueProps {
  customers: CustomerCLVData[];
  trends?: CLVTrendData[];
  title?: string;
  description?: string;
  className?: string;
}

const SEGMENT_COLORS = {
  high: "#22c55e",
  medium: "#f59e0b",
  low: "#ef4444",
};

/**
 * Customer Lifetime Value Analytics Component
 * 
 * Displays CLV analysis, segmentation, and trends
 */
export function CustomerLifetimeValue({
  customers,
  trends,
  title = "Customer Lifetime Value Analysis",
  description = "Analyze customer value and segmentation",
  className,
}: CustomerLifetimeValueProps) {
  const [viewType, setViewType] = useState<"overview" | "trends" | "details">("overview");
  const [sortBy, setSortBy] = useState<"clv" | "tenure" | "revenue">("clv");
  const [filterSegment, setFilterSegment] = useState<string>("all");

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (customers.length === 0) return null;

    const totalCLV = customers.reduce((sum, c) => sum + c.clv, 0);
    const avgCLV = totalCLV / customers.length;
    const highValueCount = customers.filter(c => c.segment === "high").length;
    const mediumValueCount = customers.filter(c => c.segment === "medium").length;
    const lowValueCount = customers.filter(c => c.segment === "low").length;
    const avgChurnProb = customers.reduce((sum, c) => sum + c.churnProbability, 0) / customers.length;

    return {
      totalCLV,
      avgCLV,
      highValueCount,
      mediumValueCount,
      lowValueCount,
      avgChurnProb,
      totalCustomers: customers.length,
    };
  }, [customers]);

  // Segment distribution data
  const segmentData: SegmentDistribution[] = useMemo(() => {
    const segments = ["high", "medium", "low"] as const;
    return segments.map(segment => {
      const segmentCustomers = customers.filter(c => c.segment === segment);
      const avgCLV = segmentCustomers.length > 0
        ? segmentCustomers.reduce((sum, c) => sum + c.clv, 0) / segmentCustomers.length
        : 0;
      
      return {
        segment: segment.charAt(0).toUpperCase() + segment.slice(1),
        count: segmentCustomers.length,
        percentage: (segmentCustomers.length / customers.length) * 100,
        averageCLV: avgCLV,
        color: SEGMENT_COLORS[segment],
      };
    });
  }, [customers]);

  // CLV distribution data for histogram
  const clvDistribution = useMemo(() => {
    const bins = 10;
    const clvValues = customers.map(c => c.clv);
    const min = Math.min(...clvValues);
    const max = Math.max(...clvValues);
    const binWidth = (max - min) / bins;

    const distribution = [];
    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = clvValues.filter(v => v >= binStart && v < binEnd).length;
      distribution.push({
        range: `${(binStart / 1000).toFixed(0)}k-${(binEnd / 1000).toFixed(0)}k`,
        count,
        percentage: (count / customers.length) * 100,
      });
    }
    return distribution;
  }, [customers]);

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];
    
    if (filterSegment !== "all") {
      result = result.filter(c => c.segment === filterSegment);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "clv":
          return b.clv - a.clv;
        case "tenure":
          return b.tenure - a.tenure;
        case "revenue":
          return b.averageMonthlyRevenue - a.averageMonthlyRevenue;
        default:
          return 0;
      }
    });

    return result;
  }, [customers, filterSegment, sortBy]);

  const handleExport = () => {
    const exportData = filteredCustomers.map(c => ({
      "Customer ID": c.customerId,
      "Name": c.customerName,
      "Segment": c.segment,
      "CLV (ETB)": c.clv,
      "Avg Monthly Revenue": c.averageMonthlyRevenue,
      "Tenure (months)": c.tenure,
      "Churn Probability": `${(c.churnProbability * 100).toFixed(1)}%`,
      "Loan Count": c.loanCount,
    }));

    exportToExcel(exportData, {
      filename: `customer-clv-${Date.now()}`,
      sheetName: "CLV Analysis",
    });
  };

  const formatCurrency = (value: number) => 
    value.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' ETB';

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Show summary cards even if empty - helps user understand what data is expected */}
        {summary ? (
          <>
            {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              icon={<DollarSign className="h-4 w-4" />}
              label="Average CLV"
              value={formatCurrency(summary.avgCLV)}
            />
            <SummaryCard
              icon={<Users className="h-4 w-4" />}
              label="Total Customers"
              value={summary.totalCustomers.toLocaleString()}
            />
            <SummaryCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="High-Value"
              value={`${summary.highValueCount} (${((summary.highValueCount / summary.totalCustomers) * 100).toFixed(0)}%)`}
              color="#22c55e"
            />
            <SummaryCard
              label="Avg Churn Risk"
              value={`${(summary.avgChurnProb * 100).toFixed(1)}%`}
              color={summary.avgChurnProb > 0.3 ? "#ef4444" : "#22c55e"}
            />
          </div>
          </>
        ) : (
          <div className="py-8 text-center border rounded-lg bg-muted/50">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground font-medium mb-1">No customer lifetime value data available</p>
            <p className="text-sm text-muted-foreground">
              CLV analytics data will appear here once customer and loan data is available in the database.
            </p>
          </div>
        )}

        {/* View Tabs - Always show tabs even if empty */}
        <Tabs value={viewType} onValueChange={(v: any) => setViewType(v)}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="details">Customer Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Segment Pie Chart */}
              <div>
                <h4 className="font-medium mb-4">Segment Distribution</h4>
                {customers.length > 0 && segmentData.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={segmentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="segment"
                          label={({ segment, percentage }) => `${segment} (${percentage.toFixed(0)}%)`}
                        >
                          {segmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string) => [value, name]}
                          labelFormatter={(label) => `Segment: ${label}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <p>No segment data available</p>
                  </div>
                )}
                <div className="flex justify-center gap-4 mt-2">
                  {segmentData.map(seg => (
                    <div key={seg.segment} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span>{seg.segment}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CLV Distribution */}
              <div>
                <h4 className="font-medium mb-4">CLV Distribution</h4>
                {customers.length > 0 && clvDistribution.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <Bar data={clvDistribution} dataKey="count">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="range" angle={-45} textAnchor="end" height={60} fontSize={10} />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [`${value} customers`, "Count"]}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </Bar>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <p>No CLV distribution data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Average CLV by Segment */}
            <div className="mt-6">
              <h4 className="font-medium mb-4">Average CLV by Segment</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <Bar data={segmentData} dataKey="averageCLV">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="segment" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), "Average CLV"]}
                    />
                    <Bar dataKey="averageCLV" radius={[4, 4, 0, 0]}>
                      {segmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </Bar>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="pt-4">
            {trends && trends.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="averageCLV"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Average CLV"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="highSegment"
                      stroke="#22c55e"
                      strokeWidth={2}
                      name="High Segment CLV"
                      dot={false}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="mediumSegment"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Medium Segment CLV"
                      dot={false}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="lowSegment"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Low Segment CLV"
                      dot={false}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="totalCustomers"
                      fill="#94a3b8"
                      fillOpacity={0.5}
                      name="Total Customers"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No trend data available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="pt-4">
            {/* Filters */}
            <div className="flex items-center gap-4 mb-4">
              <Select value={filterSegment} onValueChange={setFilterSegment}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Segments</SelectItem>
                  <SelectItem value="high">High Value</SelectItem>
                  <SelectItem value="medium">Medium Value</SelectItem>
                  <SelectItem value="low">Low Value</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clv">CLV (High to Low)</SelectItem>
                  <SelectItem value="tenure">Tenure</SelectItem>
                  <SelectItem value="revenue">Monthly Revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Customer Table */}
            <div className="border rounded-lg overflow-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-3 text-left font-medium">Customer</th>
                    <th className="p-3 text-left font-medium">Segment</th>
                    <th className="p-3 text-right font-medium">CLV</th>
                    <th className="p-3 text-right font-medium">Monthly Rev</th>
                    <th className="p-3 text-right font-medium">Tenure</th>
                    <th className="p-3 text-right font-medium">Churn Risk</th>
                    <th className="p-3 text-center font-medium">Loans</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.slice(0, 50).map((customer, index) => (
                    <tr 
                      key={customer.customerId}
                      className={cn("border-t", index % 2 === 0 && "bg-muted/30")}
                    >
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{customer.customerName}</p>
                          <p className="text-xs text-muted-foreground">{customer.customerId}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant="outline"
                          style={{ 
                            backgroundColor: SEGMENT_COLORS[customer.segment] + "20",
                            borderColor: SEGMENT_COLORS[customer.segment],
                            color: SEGMENT_COLORS[customer.segment]
                          }}
                        >
                          {customer.segment}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(customer.clv)}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(customer.averageMonthlyRevenue)}
                      </td>
                      <td className="p-3 text-right">
                        {customer.tenure} mo
                      </td>
                      <td className="p-3 text-right">
                        <span className={customer.churnProbability > 0.3 ? "text-red-600" : "text-green-600"}>
                          {(customer.churnProbability * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-3 text-center">{customer.loanCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredCustomers.length > 50 && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Showing 50 of {filteredCustomers.length} customers
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper Components
function SummaryCard({ 
  icon, 
  label, 
  value,
  color,
}: { 
  icon?: React.ReactNode;
  label: string; 
  value: string;
  color?: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

// Demo data generator
export function generateCLVData(count: number = 100): {
  customers: CustomerCLVData[];
  trends: CLVTrendData[];
} {
  const names = [
    "Abebe Kebede", "Tigist Haile", "Mohammed Ali", "Sara Tesfaye",
    "Daniel Girma", "Hana Bekele", "Yonas Tadesse", "Meron Alemayehu",
  ];

  const customers: CustomerCLVData[] = [];
  for (let i = 0; i < count; i++) {
    const clv = Math.floor(50000 + Math.random() * 450000);
    let segment: "high" | "medium" | "low";
    if (clv > 300000) segment = "high";
    else if (clv > 150000) segment = "medium";
    else segment = "low";

    customers.push({
      customerId: `CUST${String(1000 + i).padStart(6, "0")}`,
      customerName: names[Math.floor(Math.random() * names.length)],
      segment,
      clv,
      averageMonthlyRevenue: Math.floor(clv / (12 + Math.random() * 48)),
      tenure: Math.floor(6 + Math.random() * 60),
      churnProbability: Math.random() * 0.5,
      loanCount: Math.floor(1 + Math.random() * 5),
      totalInterestPaid: Math.floor(clv * 0.2 * Math.random()),
      lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  const trends: CLVTrendData[] = [];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let baseCLV = 200000;
  for (const month of months) {
    baseCLV += Math.floor(Math.random() * 10000 - 2000);
    trends.push({
      month,
      averageCLV: baseCLV,
      highSegment: baseCLV * 1.5,
      mediumSegment: baseCLV * 0.8,
      lowSegment: baseCLV * 0.4,
      totalCustomers: Math.floor(90 + Math.random() * 20),
    });
  }

  return { customers, trends };
}

export default CustomerLifetimeValue;


