"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface Payment {
  date?: string;
  timestamp?: string;
  amount?: number;
  status?: string;
  on_time?: boolean;
  [key: string]: any;
}

interface PaymentTimelineChartProps {
  payments: Payment[];
  chartType?: "line" | "bar";
  height?: number;
}

export function PaymentTimelineChart({
  payments,
  chartType = "line",
  height = 400,
}: PaymentTimelineChartProps) {
  if (!payments || payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No payment history available
      </div>
    );
  }

  // Prepare chart data
  const chartData = payments
    .map((payment) => {
      const date = payment.date || payment.timestamp || "";
      return {
        date: date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
        rawDate: date,
        amount: payment.amount || 0,
        onTime: payment.on_time || payment.status === "completed" || payment.status === "on_time" ? 1 : 0,
        late: payment.on_time === false || payment.status === "late" || payment.status === "overdue" ? 1 : 0,
        status: payment.status || "unknown",
      };
    })
    .sort((a, b) => {
      if (!a.rawDate || !b.rawDate) return 0;
      return new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime();
    });

  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis label={{ value: "Amount (ETB)", angle: -90, position: "insideLeft" }} />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "On Time" || name === "Late") {
                return [value === 1 ? "Yes" : "No", name];
              }
              return [`ETB ${value.toLocaleString()}`, name];
            }}
          />
          <Legend />
          <Bar dataKey="amount" fill="#3b82f6" name="Amount" />
          <Bar dataKey="onTime" fill="#10b981" name="On Time" />
          <Bar dataKey="late" fill="#ef4444" name="Late" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis label={{ value: "Amount (ETB)", angle: -90, position: "insideLeft" }} />
        <Tooltip
          formatter={(value: number) => [`ETB ${value.toLocaleString()}`, "Amount"]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="Payment Amount"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}



