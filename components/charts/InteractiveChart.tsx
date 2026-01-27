"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
  ReferenceArea,
  ComposedChart,
  Scatter,
  ScatterChart,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BarChart3,
  LineChart as LineChartIcon,
  Activity,
  Settings,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  Palette,
  TrendingUp,
  TrendingDown,
  Zap,
} from "lucide-react";

interface DataSeries {
  key: string;
  name: string;
  color: string;
  type: "line" | "bar" | "area";
  visible: boolean;
  yAxisId?: "left" | "right";
}

interface InteractiveChartProps {
  data: any[];
  title?: string;
  description?: string;
  xAxisKey?: string;
  series?: DataSeries[];
  chartType?: "line" | "bar" | "area" | "composed" | "scatter";
  enableBrush?: boolean;
  enableZoom?: boolean;
  enableAnimation?: boolean;
  enableGrid?: boolean;
  enableLegend?: boolean;
  enableTooltip?: boolean;
  height?: number;
  className?: string;
  onDataPointClick?: (data: any, index: number) => void;
  onRangeSelect?: (startIndex: number, endIndex: number) => void;
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

const CHART_TYPES = [
  { value: "line", label: "Line Chart", icon: LineChartIcon },
  { value: "bar", label: "Bar Chart", icon: BarChart3 },
  { value: "area", label: "Area Chart", icon: Activity },
  { value: "composed", label: "Composed Chart", icon: BarChart3 },
  { value: "scatter", label: "Scatter Plot", icon: Activity },
];

export function InteractiveChart({
  data = [],
  title = "Interactive Chart",
  description = "Interactive data visualization with customizable options",
  xAxisKey = "name",
  series = [],
  chartType = "line",
  enableBrush = true,
  enableZoom = true,
  enableAnimation = true,
  enableGrid = true,
  enableLegend = true,
  enableTooltip = true,
  height = 400,
  className = "",
  onDataPointClick,
  onRangeSelect,
}: InteractiveChartProps) {
  const [currentChartType, setCurrentChartType] = useState(chartType);
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>(
    series.reduce((acc, s) => ({ ...acc, [s.key]: s.visible }), {})
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);
  const [zoomDomain, setZoomDomain] = useState<{ x1?: number; x2?: number; y1?: number; y2?: number } | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ startIndex?: number; endIndex?: number } | null>(null);
  
  // Chart configuration state
  const [chartConfig, setChartConfig] = useState({
    showGrid: enableGrid,
    showLegend: enableLegend,
    showTooltip: enableTooltip,
    showBrush: enableBrush,
    enableAnimation: enableAnimation,
    strokeWidth: 2,
    dotSize: 4,
  });

  // Generate default series if none provided
  const defaultSeries = useMemo(() => {
    if (series.length > 0) return series;
    
    if (data.length === 0) return [];
    
    const sampleItem = data[0];
    const numericKeys = Object.keys(sampleItem).filter(
      key => key !== xAxisKey && typeof sampleItem[key] === "number"
    );
    
    return numericKeys.slice(0, 5).map((key, index) => ({
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
      color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      type: "line" as const,
      visible: true,
      yAxisId: index % 2 === 0 ? "left" : "right",
    }));
  }, [data, series, xAxisKey]);

  const activeSeries = defaultSeries.filter(s => visibleSeries[s.key] !== false);

  const toggleSeriesVisibility = (seriesKey: string) => {
    setVisibleSeries(prev => ({
      ...prev,
      [seriesKey]: !prev[seriesKey]
    }));
  };

  const handleBrushChange = useCallback((brushData: any) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      setBrushDomain([brushData.startIndex, brushData.endIndex]);
      setSelectedRange({ startIndex: brushData.startIndex, endIndex: brushData.endIndex });
      
      if (onRangeSelect) {
        onRangeSelect(brushData.startIndex, brushData.endIndex);
      }
    }
  }, [onRangeSelect]);

  const handleDataPointClick = useCallback((data: any, index: number) => {
    if (onDataPointClick) {
      onDataPointClick(data, index);
    }
  }, [onDataPointClick]);

  const formatTooltipValue = (value: any, name: string) => {
    if (typeof value === "number") {
      return [
        new Intl.NumberFormat("en-ET", {
          style: "currency",
          currency: "ETB",
          minimumFractionDigits: 0,
        }).format(value),
        name,
      ];
    }
    return [value, name];
  };

  const renderChart = () => {
    const commonProps = {
      data: data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    const xAxisProps = {
      dataKey: xAxisKey,
      tick: { fontSize: 12 },
      domain: zoomDomain ? [zoomDomain.x1, zoomDomain.x2] : undefined,
    };

    const yAxisProps = {
      tick: { fontSize: 12 },
      domain: zoomDomain ? [zoomDomain.y1, zoomDomain.y2] : undefined,
    };

    const tooltipProps = chartConfig.showTooltip ? {
      formatter: formatTooltipValue,
      labelFormatter: (label: any) => `${xAxisKey}: ${label}`,
    } : false;

    switch (currentChartType) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {chartConfig.showTooltip && <Tooltip {...tooltipProps} />}
            {chartConfig.showLegend && <Legend />}
            {activeSeries.map((series, index) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.name}
                fill={series.color}
                onClick={handleDataPointClick}
                cursor="pointer"
              />
            ))}
            {chartConfig.showBrush && (
              <Brush
                dataKey={xAxisKey}
                height={30}
                stroke={DEFAULT_COLORS[0]}
                onChange={handleBrushChange}
              />
            )}
          </BarChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {chartConfig.showTooltip && <Tooltip {...tooltipProps} />}
            {chartConfig.showLegend && <Legend />}
            {activeSeries.map((series, index) => (
              <Area
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.name}
                stroke={series.color}
                fill={series.color}
                fillOpacity={0.3}
                strokeWidth={chartConfig.strokeWidth}
                onClick={handleDataPointClick}
              />
            ))}
            {chartConfig.showBrush && (
              <Brush
                dataKey={xAxisKey}
                height={30}
                stroke={DEFAULT_COLORS[0]}
                onChange={handleBrushChange}
              />
            )}
          </AreaChart>
        );

      case "composed":
        return (
          <ComposedChart {...commonProps}>
            {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis {...xAxisProps} />
            <YAxis yAxisId="left" {...yAxisProps} />
            <YAxis yAxisId="right" orientation="right" {...yAxisProps} />
            {chartConfig.showTooltip && <Tooltip {...tooltipProps} />}
            {chartConfig.showLegend && <Legend />}
            {activeSeries.map((series, index) => {
              if (series.type === "bar") {
                return (
                  <Bar
                    key={series.key}
                    yAxisId={series.yAxisId || "left"}
                    dataKey={series.key}
                    name={series.name}
                    fill={series.color}
                    onClick={handleDataPointClick}
                  />
                );
              } else if (series.type === "area") {
                return (
                  <Area
                    key={series.key}
                    yAxisId={series.yAxisId || "left"}
                    type="monotone"
                    dataKey={series.key}
                    name={series.name}
                    stroke={series.color}
                    fill={series.color}
                    fillOpacity={0.3}
                    strokeWidth={chartConfig.strokeWidth}
                    onClick={handleDataPointClick}
                  />
                );
              } else {
                return (
                  <Line
                    key={series.key}
                    yAxisId={series.yAxisId || "left"}
                    type="monotone"
                    dataKey={series.key}
                    name={series.name}
                    stroke={series.color}
                    strokeWidth={chartConfig.strokeWidth}
                    dot={{ r: chartConfig.dotSize }}
                    onClick={handleDataPointClick}
                  />
                );
              }
            })}
            {chartConfig.showBrush && (
              <Brush
                dataKey={xAxisKey}
                height={30}
                stroke={DEFAULT_COLORS[0]}
                onChange={handleBrushChange}
              />
            )}
          </ComposedChart>
        );

      case "scatter":
        return (
          <ScatterChart {...commonProps}>
            {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {chartConfig.showTooltip && <Tooltip {...tooltipProps} />}
            {chartConfig.showLegend && <Legend />}
            {activeSeries.map((series, index) => (
              <Scatter
                key={series.key}
                dataKey={series.key}
                name={series.name}
                fill={series.color}
                onClick={handleDataPointClick}
              />
            ))}
          </ScatterChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {chartConfig.showTooltip && <Tooltip {...tooltipProps} />}
            {chartConfig.showLegend && <Legend />}
            {activeSeries.map((series, index) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.name}
                stroke={series.color}
                strokeWidth={chartConfig.strokeWidth}
                dot={{ r: chartConfig.dotSize }}
                onClick={handleDataPointClick}
                connectNulls={false}
                animationDuration={chartConfig.enableAnimation ? 1000 : 0}
              />
            ))}
            {chartConfig.showBrush && (
              <Brush
                dataKey={xAxisKey}
                height={30}
                stroke={DEFAULT_COLORS[0]}
                onChange={handleBrushChange}
              />
            )}
          </LineChart>
        );
    }
  };

  const chartHeight = isFullscreen ? 600 : height;

  return (
    <Card className={`${className} ${isFullscreen ? "fixed inset-4 z-50 overflow-auto" : ""}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {title}
              {selectedRange && (
                <Badge variant="secondary">
                  Range: {selectedRange.startIndex} - {selectedRange.endIndex}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Chart Type Selector */}
            <Select value={currentChartType} onValueChange={setCurrentChartType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Settings Popover */}
            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Chart Settings</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-grid">Show Grid</Label>
                      <Switch
                        id="show-grid"
                        checked={chartConfig.showGrid}
                        onCheckedChange={(checked) =>
                          setChartConfig(prev => ({ ...prev, showGrid: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-legend">Show Legend</Label>
                      <Switch
                        id="show-legend"
                        checked={chartConfig.showLegend}
                        onCheckedChange={(checked) =>
                          setChartConfig(prev => ({ ...prev, showLegend: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-brush">Show Brush</Label>
                      <Switch
                        id="show-brush"
                        checked={chartConfig.showBrush}
                        onCheckedChange={(checked) =>
                          setChartConfig(prev => ({ ...prev, showBrush: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable-animation">Enable Animation</Label>
                      <Switch
                        id="enable-animation"
                        checked={chartConfig.enableAnimation}
                        onCheckedChange={(checked) =>
                          setChartConfig(prev => ({ ...prev, enableAnimation: checked }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Stroke Width</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={chartConfig.strokeWidth}
                      onChange={(e) =>
                        setChartConfig(prev => ({ ...prev, strokeWidth: parseInt(e.target.value) || 2 }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Dot Size</Label>
                    <Input
                      type="number"
                      min="2"
                      max="10"
                      value={chartConfig.dotSize}
                      onChange={(e) =>
                        setChartConfig(prev => ({ ...prev, dotSize: parseInt(e.target.value) || 4 }))
                      }
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Fullscreen Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Series Visibility Controls */}
        {defaultSeries.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {defaultSeries.map((series) => (
              <Button
                key={series.key}
                variant={visibleSeries[series.key] !== false ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSeriesVisibility(series.key)}
                className="h-8"
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: series.color }}
                />
                {visibleSeries[series.key] !== false ? (
                  <Eye className="h-3 w-3 mr-1" />
                ) : (
                  <EyeOff className="h-3 w-3 mr-1" />
                )}
                {series.name}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            {renderChart()}
          </ResponsiveContainer>
        )}
        
        {/* Chart Statistics */}
        {data.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold">Data Points</div>
              <div className="text-muted-foreground">{data.length}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Visible Series</div>
              <div className="text-muted-foreground">{activeSeries.length}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Chart Type</div>
              <div className="text-muted-foreground capitalize">{currentChartType}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Selected Range</div>
              <div className="text-muted-foreground">
                {selectedRange ? `${selectedRange.endIndex! - selectedRange.startIndex! + 1} points` : "All"}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default InteractiveChart;