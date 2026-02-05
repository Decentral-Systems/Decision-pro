"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";


import { Input } from "@/components/ui/input";
import { GitCompare, X } from "lucide-react";

export interface ComparisonPeriod {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  color?: string;
}

interface ComparisonModeProps {
  onCompare: (periods: ComparisonPeriod[]) => void;
  defaultPeriods?: ComparisonPeriod[];
  className?: string;
}

/**
 * Component for enabling comparison mode between different time periods
 */
export function ComparisonMode({
  onCompare,
  defaultPeriods = [],
  className,
}: ComparisonModeProps) {
  const [enabled, setEnabled] = useState(defaultPeriods.length > 0);
  const [periods, setPeriods] = useState<ComparisonPeriod[]>(
    defaultPeriods.length > 0
      ? defaultPeriods
      : [
          {
            id: "current",
            label: "Current Period",
            startDate: "",
            endDate: "",
            color: "#3b82f6",
          },
          {
            id: "previous",
            label: "Previous Period",
            startDate: "",
            endDate: "",
            color: "#10b981",
          },
        ]
  );

  const handlePeriodChange = (
    id: string,
    field: keyof ComparisonPeriod,
    value: string
  ) => {
    setPeriods((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const addPeriod = () => {
    const newPeriod: ComparisonPeriod = {
      id: `period-${Date.now()}`,
      label: `Period ${periods.length + 1}`,
      startDate: "",
      endDate: "",
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    };
    setPeriods([...periods, newPeriod]);
  };

  const removePeriod = (id: string) => {
    if (periods.length > 2) {
      setPeriods(periods.filter((p) => p.id !== id));
    }
  };

  const handleApply = () => {
    if (enabled) {
      onCompare(periods);
    }
  };

  if (!enabled) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5" />
                Comparison Mode
              </CardTitle>
              <CardDescription>
                Compare metrics across different time periods
              </CardDescription>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Comparison Mode
            </CardTitle>
            <CardDescription>
              Compare metrics across different time periods
            </CardDescription>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {periods.map((period, index) => (
            <div
              key={period.id}
              className="p-4 border rounded-lg space-y-3"
              style={{
                borderLeftColor: period.color,
                borderLeftWidth: "4px",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: period.color }}
                  />
                  <Label className="font-medium">{period.label}</Label>
                </div>
                {periods.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePeriod(period.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    value={period.startDate}
                    onChange={(e) =>
                      handlePeriodChange(period.id, "startDate", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">End Date</Label>
                  <Input
                    type="date"
                    value={period.endDate}
                    onChange={(e) =>
                      handlePeriodChange(period.id, "endDate", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={addPeriod} className="flex-1">
            Add Period
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply Comparison
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
