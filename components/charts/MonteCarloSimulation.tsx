"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { 
  ComposedChart, 
  Line, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar
} from "recharts";
import { Play, Pause, RotateCcw, Download, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SimulationResult {
  outcome: number;
  frequency: number;
  percentile: number;
}

interface SimulationPath {
  step: number;
  values: number[];
}

interface MonteCarloSimulationProps {
  baseValue: number;
  volatility: number;
  timeHorizon: number;
  numSimulations?: number;
  title?: string;
  description?: string;
  valueLabel?: string;
  className?: string;
  onSimulationComplete?: (results: SimulationSummary) => void;
}

interface SimulationSummary {
  mean: number;
  median: number;
  std: number;
  percentile5: number;
  percentile25: number;
  percentile75: number;
  percentile95: number;
  worstCase: number;
  bestCase: number;
  probabilityOfLoss: number;
}

/**
 * Monte Carlo Simulation Component
 * 
 * Visualizes Monte Carlo simulation paths and outcome distributions
 */
export function MonteCarloSimulation({
  baseValue,
  volatility,
  timeHorizon,
  numSimulations = 1000,
  title = "Monte Carlo Simulation",
  description = "Risk distribution analysis through random sampling",
  valueLabel = "Value",
  className,
  onSimulationComplete,
}: MonteCarloSimulationProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [simCount, setSimCount] = useState(numSimulations);
  const [viewMode, setViewMode] = useState<"paths" | "distribution">("distribution");
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [simulationData, setSimulationData] = useState<{
    paths: SimulationPath[];
    distribution: SimulationResult[];
    summary: SimulationSummary | null;
  }>({ paths: [], distribution: [], summary: null });

  // Run simulation
  const runSimulation = async () => {
    setIsRunning(true);
    setProgress(0);

    const paths: number[][] = [];
    const outcomes: number[] = [];

    // Simulate paths in batches for responsiveness
    const batchSize = 100;
    const numBatches = Math.ceil(simCount / batchSize);

    for (let batch = 0; batch < numBatches; batch++) {
      const batchPaths = simulateBatch(
        baseValue,
        volatility,
        timeHorizon,
        Math.min(batchSize, simCount - batch * batchSize)
      );

      batchPaths.forEach(path => {
        paths.push(path);
        outcomes.push(path[path.length - 1]);
      });

      setProgress(((batch + 1) / numBatches) * 100);
      
      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Calculate distribution
    const sortedOutcomes = [...outcomes].sort((a, b) => a - b);
    const bins = 50;
    const min = sortedOutcomes[0];
    const max = sortedOutcomes[sortedOutcomes.length - 1];
    const binWidth = (max - min) / bins;

    const distribution: SimulationResult[] = [];
    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = outcomes.filter(v => v >= binStart && v < binEnd).length;
      distribution.push({
        outcome: (binStart + binEnd) / 2,
        frequency: count,
        percentile: (i / bins) * 100,
      });
    }

    // Calculate summary statistics
    const mean = outcomes.reduce((a, b) => a + b, 0) / outcomes.length;
    const variance = outcomes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / outcomes.length;
    const std = Math.sqrt(variance);

    const getPercentile = (p: number) => sortedOutcomes[Math.floor((p / 100) * sortedOutcomes.length)];

    const summary: SimulationSummary = {
      mean,
      median: getPercentile(50),
      std,
      percentile5: getPercentile(5),
      percentile25: getPercentile(25),
      percentile75: getPercentile(75),
      percentile95: getPercentile(95),
      worstCase: sortedOutcomes[0],
      bestCase: sortedOutcomes[sortedOutcomes.length - 1],
      probabilityOfLoss: outcomes.filter(v => v < baseValue).length / outcomes.length,
    };

    // Sample paths for visualization (show 50 paths max)
    const sampledPaths: SimulationPath[] = [];
    const pathsToShow = Math.min(50, paths.length);
    const step = Math.floor(paths.length / pathsToShow);
    
    for (let i = 0; i < timeHorizon + 1; i++) {
      const values: number[] = [];
      for (let j = 0; j < pathsToShow; j++) {
        values.push(paths[j * step][i]);
      }
      sampledPaths.push({ step: i, values });
    }

    setSimulationData({ paths: sampledPaths, distribution, summary });
    setIsRunning(false);
    setProgress(100);

    if (onSimulationComplete) {
      onSimulationComplete(summary);
    }
  };

  const reset = () => {
    setSimulationData({ paths: [], distribution: [], summary: null });
    setProgress(0);
  };

  const handleExport = () => {
    if (!simulationData.summary) return;

    const csvContent = [
      "Monte Carlo Simulation Results",
      `Base Value,${baseValue}`,
      `Volatility,${(volatility * 100).toFixed(1)}%`,
      `Time Horizon,${timeHorizon}`,
      `Simulations,${simCount}`,
      "",
      "Summary Statistics",
      `Mean,${simulationData.summary.mean.toFixed(2)}`,
      `Median,${simulationData.summary.median.toFixed(2)}`,
      `Std Dev,${simulationData.summary.std.toFixed(2)}`,
      `5th Percentile,${simulationData.summary.percentile5.toFixed(2)}`,
      `95th Percentile,${simulationData.summary.percentile95.toFixed(2)}`,
      `Worst Case,${simulationData.summary.worstCase.toFixed(2)}`,
      `Best Case,${simulationData.summary.bestCase.toFixed(2)}`,
      `Probability of Loss,${(simulationData.summary.probabilityOfLoss * 100).toFixed(1)}%`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monte-carlo-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { summary } = simulationData;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Number of Simulations</Label>
                    <Input
                      type="number"
                      value={simCount}
                      onChange={(e) => setSimCount(parseInt(e.target.value) || 1000)}
                      min={100}
                      max={10000}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confidence Level: {confidenceLevel}%</Label>
                    <Slider
                      value={[confidenceLevel]}
                      onValueChange={(v) => setConfidenceLevel(v[0])}
                      min={80}
                      max={99}
                      step={1}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant={isRunning ? "secondary" : "default"}
              size="sm"
              onClick={isRunning ? () => setIsRunning(false) : runSimulation}
              disabled={isRunning && progress > 0 && progress < 100}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Run
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={reset} disabled={isRunning}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport} 
              disabled={!summary}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Running simulations...</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Input Parameters */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Base Value</p>
            <p className="font-medium">{baseValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Volatility</p>
            <p className="font-medium">{(volatility * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Time Horizon</p>
            <p className="font-medium">{timeHorizon} periods</p>
          </div>
        </div>

        {/* Summary Statistics */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Mean" value={summary.mean.toFixed(0)} />
            <StatCard label="Median" value={summary.median.toFixed(0)} />
            <StatCard 
              label="Std Deviation" 
              value={summary.std.toFixed(0)}
              sublabel={`${((summary.std / summary.mean) * 100).toFixed(1)}% CV`}
            />
            <StatCard 
              label="Prob. of Loss" 
              value={`${(summary.probabilityOfLoss * 100).toFixed(1)}%`}
              color={summary.probabilityOfLoss > 0.2 ? "#ef4444" : "#22c55e"}
            />
          </div>
        )}

        {/* Confidence Interval */}
        {summary && (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{confidenceLevel}% Confidence Interval</span>
              <Badge variant="outline">
                {summary.percentile5.toFixed(0)} - {summary.percentile95.toFixed(0)}
              </Badge>
            </div>
            <div className="relative h-8 bg-muted rounded-full overflow-hidden">
              {/* Full range */}
              <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-muted-foreground">
                <span>{summary.worstCase.toFixed(0)}</span>
                <span>{summary.bestCase.toFixed(0)}</span>
              </div>
              {/* Confidence interval */}
              <div 
                className="absolute h-full bg-blue-500/50"
                style={{
                  left: `${((summary.percentile5 - summary.worstCase) / (summary.bestCase - summary.worstCase)) * 100}%`,
                  width: `${((summary.percentile95 - summary.percentile5) / (summary.bestCase - summary.worstCase)) * 100}%`,
                }}
              />
              {/* Mean marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-600"
                style={{
                  left: `${((summary.mean - summary.worstCase) / (summary.bestCase - summary.worstCase)) * 100}%`,
                }}
              />
              {/* Base value marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-500"
                style={{
                  left: `${((baseValue - summary.worstCase) / (summary.bestCase - summary.worstCase)) * 100}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-600 rounded" />
                <span>Mean</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-amber-500 rounded" />
                <span>Base Value</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500/50 rounded" />
                <span>CI Range</span>
              </div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        {simulationData.distribution.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant={viewMode === "distribution" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("distribution")}
            >
              Distribution
            </Button>
            <Button
              variant={viewMode === "paths" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("paths")}
            >
              Sample Paths
            </Button>
          </div>
        )}

        {/* Charts */}
        {simulationData.distribution.length > 0 && (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === "distribution" ? (
                <BarChart 
                  data={simulationData.distribution}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="outcome" 
                    tickFormatter={(v) => v.toFixed(0)}
                    label={{ value: valueLabel, position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [value, name === "frequency" ? "Count" : name]}
                    labelFormatter={(label) => `${valueLabel}: ${label.toFixed(0)}`}
                  />
                  {summary && (
                    <>
                      <ReferenceLine x={summary.mean} stroke="#3b82f6" strokeWidth={2} label="Mean" />
                      <ReferenceLine x={baseValue} stroke="#f59e0b" strokeDasharray="5 5" label="Base" />
                      <ReferenceLine x={summary.percentile5} stroke="#ef4444" strokeDasharray="3 3" />
                      <ReferenceLine x={summary.percentile95} stroke="#22c55e" strokeDasharray="3 3" />
                    </>
                  )}
                  <Bar dataKey="frequency" fill="#3b82f6" fillOpacity={0.7} />
                </BarChart>
              ) : (
                <ComposedChart 
                  data={simulationData.paths}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="step" 
                    label={{ value: 'Time Period', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: valueLabel, angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <ReferenceLine y={baseValue} stroke="#f59e0b" strokeDasharray="5 5" />
                  {/* Render sample paths */}
                  {simulationData.paths[0]?.values.map((_, pathIndex) => (
                    <Line
                      key={pathIndex}
                      type="monotone"
                      dataKey={`values[${pathIndex}]`}
                      stroke={`hsl(${(pathIndex * 7) % 360}, 70%, 50%)`}
                      strokeWidth={1}
                      strokeOpacity={0.3}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* No data state */}
        {simulationData.distribution.length === 0 && !isRunning && (
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No simulation data</p>
              <Button onClick={runSimulation}>
                <Play className="h-4 w-4 mr-1" />
                Run Simulation
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper Components
function StatCard({ 
  label, 
  value, 
  sublabel,
  color,
}: { 
  label: string; 
  value: string;
  sublabel?: string;
  color?: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      {sublabel && (
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  );
}

// Simulation helper
function simulateBatch(
  baseValue: number,
  volatility: number,
  timeHorizon: number,
  numPaths: number
): number[][] {
  const paths: number[][] = [];
  const dt = 1 / 12; // Monthly time step
  const drift = 0; // Assume zero drift for simplicity

  for (let i = 0; i < numPaths; i++) {
    const path = [baseValue];
    let value = baseValue;

    for (let t = 0; t < timeHorizon; t++) {
      // Geometric Brownian Motion
      const randomShock = gaussianRandom() * Math.sqrt(dt);
      value = value * Math.exp((drift - 0.5 * volatility * volatility) * dt + volatility * randomShock);
      path.push(value);
    }

    paths.push(path);
  }

  return paths;
}

// Box-Muller transform for Gaussian random numbers
function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export default MonteCarloSimulation;


