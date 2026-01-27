"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface Loan {
  loan_id?: string;
  loan_amount?: number;
  status?: string;
  loan_type?: string;
  [key: string]: any;
}

interface LoanPortfolioChartProps {
  loans: Loan[];
  chartType?: "pie" | "bar";
  height?: number;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function LoanPortfolioChart({
  loans,
  chartType = "pie",
  height = 400,
}: LoanPortfolioChartProps) {
  if (!loans || loans.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No loan data available
      </div>
    );
  }

  // Prepare data for pie chart (by status)
  const statusData = loans.reduce((acc: Record<string, number>, loan) => {
    const status = loan.status || "unknown";
    acc[status] = (acc[status] || 0) + (loan.loan_amount || 0);
    return acc;
  }, {});

  const pieData = Object.entries(statusData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Number(value),
  }));

  // Prepare data for bar chart (by loan type or status)
  const typeData = loans.reduce((acc: Record<string, number>, loan) => {
    const type = loan.loan_type || loan.status || "unknown";
    acc[type] = (acc[type] || 0) + (loan.loan_amount || 0);
    return acc;
  }, {});

  const barData = Object.entries(typeData).map(([name, value]) => ({
    name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    amount: Number(value),
  }));

  if (chartType === "pie") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [`ETB ${value.toLocaleString()}`, "Amount"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={barData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
        <YAxis label={{ value: "Amount (ETB)", angle: -90, position: "insideLeft" }} />
        <Tooltip formatter={(value: number) => [`ETB ${value.toLocaleString()}`, "Amount"]} />
        <Legend />
        <Bar dataKey="amount" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}



