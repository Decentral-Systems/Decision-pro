"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Treemap,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
} from "lucide-react";

interface DrillDownLevel {
  id: string;
  name: string;
  data: any[];
  level: number;
  parent?: string;
}

interface DrillDownChartProps {
  data: any[];
  title?: string;
  description?: string;
  onDrillDown?: (dataPoint: any, level: number) => void;
  onDrillUp?: () => void;
  chartType?: "bar" | "pie" | "treemap";
  valueKey?: string;
  nameKey?: string;
  colorScheme?: string[];
  className?: string;
}

const DEFAULT_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
  "#8dd1e1",
];

export function DrillDownChart({
  data = [],
  title = "Drill Down Analysis",
  description = "Click on data points to drill down for detailed analysis",
  onDrillDown,
  onDrillUp,
  chartType = "bar",
  valueKey = "value",
  nameKey = "name",
  colorScheme = DEFAULT_COLORS,
  className = "",
}: DrillDownChartProps) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [drillPath, setDrillPath] = useState<DrillDownLevel[]>([
    {
      id: "root",
      name: "Overview",
      data: data,
      level: 0,
    },
  ]);
  const [selectedChartType, setSelectedChartType] = useState(chartType);

  const currentData = drillPath[currentLevel]?.data || [];

  const handleDrillDown = (dataPoint: any, index: number) => {
    // Generate mock drill-down data based on the selected item
    const drillDownData = generateDrillDownData(dataPoint, currentLevel + 1);
    
    const newLevel: DrillDownLevel = {
      id: `${dataPoint[nameKey]}_${currentLevel + 1}`,
      name: dataPoint[nameKey],
      data: drillDownData,
      level: currentLevel + 1,
      parent: drillPath[currentLevel].id,
    };

    const newPath = [...drillPath.slice(0, currentLevel + 1), newLevel];
    setDrillPath(newPath);
    setCurrentLevel(currentLevel + 1);

    if (onDrillDown) {
      onDrillDown(dataPoint, currentLevel + 1);
    }
  };

  const handleDrillUp = () => {
    if (currentLevel > 0) {
      setCurrentLevel(currentLevel - 1);
      if (onDrillUp) {
        onDrillUp();
      }
    }
  };

  const generateDrillDownData = (parentItem: any, level: number) => {
    // Generate mock drill-down data based on the parent item
    const baseValue = parentItem[valueKey] || 100;
    const categories = getDrillDownCategories(level);
    
    return categories.map((category, index) => ({
      [nameKey]: category,
      [valueKey]: Math.floor(baseValue * (0.1 + Math.random() * 0.4)),
      percentage: Math.floor(10 + Math.random() * 30),
      trend: Math.random() > 0.5 ? "up" : "down",
      change: (Math.random() * 20 - 10).toFixed(1),
    }));
  };

  const getDrillDownCategories = (level: number) => {
    const categories = [
      ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024"],
      ["January", "February", "March", "April", "May", "June"],
      ["Week 1", "Week 2", "Week 3", "Week 4"],
      ["Product A", "Product B", "Product C", "Product D"],
      ["Region North", "Region South", "Region East", "Region West"],
    ];
    return categories[level % categories.length] || categories[0];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value}%`;
  };

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={currentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey={nameKey} 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: any, name: string) => [
            typeof value === "number" ? formatCurrency(value) : value,
            name,
          ]}
          labelFormatter={(label) => `Category: ${label}`}
        />
        <Legend />
        <Bar
          dataKey={valueKey}
          fill={colorScheme[0]}
          cursor="pointer"
          onClick={(data, index) => handleDrillDown(data, index)}
        >
          {currentData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colorScheme[index % colorScheme.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={currentData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={120}
          fill="#8884d8"
          dataKey={valueKey}
          onClick={(data, index) => handleDrillDown(data, index)}
          cursor="pointer"
        >
          {currentData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colorScheme[index % colorScheme.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: any) => [formatCurrency(value), "Value"]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderTreemap = () => (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        data={currentData}
        dataKey={valueKey}
        ratio={4 / 3}
        stroke="#fff"
        fill={colorScheme[0]}
        content={({ root, depth, x, y, width, height, index, name, value }) => (
          <g>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              style={{
                fill: colorScheme[index % colorScheme.length],
                stroke: "#fff",
                strokeWidth: 2,
                cursor: "pointer",
              }}
              onClick={() => {
                const dataPoint = currentData.find(item => item[nameKey] === name);
                if (dataPoint) handleDrillDown(dataPoint, index);
              }}
            />
            {width > 60 && height > 40 && (
              <>
                <text
                  x={x + width / 2}
                  y={y + height / 2 - 10}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {name}
                </text>
                <text
                  x={x + width / 2}
                  y={y + height / 2 + 10}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="10"
                >
                  {formatCurrency(value)}
                </text>
              </>
            )}
          </g>
        )}
      />
    </ResponsiveContainer>
  );

  const renderChart = () => {
    switch (selectedChartType) {
      case "pie":
        return renderPieChart();
      case "treemap":
        return renderTreemap();
      default:
        return renderBarChart();
    }
  };

  const currentLevelInfo = drillPath[currentLevel];
  const canDrillUp = currentLevel > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              {title}
              {currentLevelInfo && currentLevel > 0 && (
                <Badge variant="secondary">
                  Level {currentLevel}: {currentLevelInfo.name}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedChartType} onValueChange={setSelectedChartType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Bar Chart
                  </div>
                </SelectItem>
                <SelectItem value="pie">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4" />
                    Pie Chart
                  </div>
                </SelectItem>
                <SelectItem value="treemap">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Treemap
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {canDrillUp && (
              <Button variant="outline" size="sm" onClick={handleDrillUp}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Drill Up
              </Button>
            )}
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {drillPath.length > 1 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {drillPath.map((level, index) => (
              <React.Fragment key={level.id}>
                <button
                  className={`hover:text-foreground ${
                    index === currentLevel ? "text-foreground font-medium" : ""
                  }`}
                  onClick={() => setCurrentLevel(index)}
                >
                  {level.name}
                </button>
                {index < drillPath.length - 1 && (
                  <ArrowRight className="h-3 w-3" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {currentData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No data available for this level</p>
          </div>
        ) : (
          <>
            {renderChart()}
            
            {/* Data Summary */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold">Total Items</div>
                <div className="text-muted-foreground">{currentData.length}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">Total Value</div>
                <div className="text-muted-foreground">
                  {formatCurrency(
                    currentData.reduce((sum, item) => sum + (item[valueKey] || 0), 0)
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold">Average</div>
                <div className="text-muted-foreground">
                  {formatCurrency(
                    currentData.reduce((sum, item) => sum + (item[valueKey] || 0), 0) /
                    (currentData.length || 1)
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold">Drill Level</div>
                <div className="text-muted-foreground">Level {currentLevel}</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default DrillDownChart;