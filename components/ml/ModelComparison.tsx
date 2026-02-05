"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

interface ModelMetrics {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc_roc: number;
  latency_ms?: number;
}

interface ModelComparisonProps {
  models: ModelMetrics[];
  onModelSelect?: (modelName: string) => void;
}

export function ModelComparison({ models, onModelSelect }: ModelComparisonProps) {
  const [selectedModel1, setSelectedModel1] = useState<string>("");
  const [selectedModel2, setSelectedModel2] = useState<string>("");

  const model1 = models.find((m) => m.model_name === selectedModel1);
  const model2 = models.find((m) => m.model_name === selectedModel2);

  const compareMetric = (metric: keyof ModelMetrics, higherIsBetter: boolean = true) => {
    if (!model1 || !model2) return null;
    const val1 = model1[metric] as number;
    const val2 = model2[metric] as number;
    const diff = val1 - val2;
    const isBetter = higherIsBetter ? diff > 0 : diff < 0;
    return { diff, isBetter, val1, val2 };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Model Comparison
        </CardTitle>
        <CardDescription>
          Compare performance metrics between different models
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Model 1</Label>
            <Select value={selectedModel1} onValueChange={setSelectedModel1}>
              <SelectTrigger>
                <SelectValue placeholder="Select first model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.model_name} value={model.model_name}>
                    {model.model_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Model 2</Label>
            <Select value={selectedModel2} onValueChange={setSelectedModel2}>
              <SelectTrigger>
                <SelectValue placeholder="Select second model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.model_name} value={model.model_name}>
                    {model.model_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {model1 && model2 && (
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{model1.model_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">{model1.accuracy.toFixed(4)}</div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{model2.model_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">{model2.accuracy.toFixed(4)}</div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </CardContent>
              </Card>
            </div>

            {/* Metrics Comparison Table */}
            <div className="space-y-2">
              <h4 className="font-semibold">Metrics Comparison</h4>
              <div className="border rounded-md">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left text-sm font-medium">Metric</th>
                      <th className="p-2 text-center text-sm font-medium">{model1.model_name}</th>
                      <th className="p-2 text-center text-sm font-medium">{model2.model_name}</th>
                      <th className="p-2 text-center text-sm font-medium">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: "accuracy", label: "Accuracy", higherIsBetter: true },
                      { key: "precision", label: "Precision", higherIsBetter: true },
                      { key: "recall", label: "Recall", higherIsBetter: true },
                      { key: "f1_score", label: "F1 Score", higherIsBetter: true },
                      { key: "auc_roc", label: "AUC-ROC", higherIsBetter: true },
                    ].map(({ key, label, higherIsBetter }) => {
                      const comparison = compareMetric(
                        key as keyof ModelMetrics,
                        higherIsBetter
                      );
                      if (!comparison) return null;

                      return (
                        <tr key={key} className="border-t">
                          <td className="p-2 text-sm">{label}</td>
                          <td className="p-2 text-center text-sm">
                            {comparison.val1.toFixed(4)}
                          </td>
                          <td className="p-2 text-center text-sm">
                            {comparison.val2.toFixed(4)}
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {comparison.isBetter ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <span
                                className={`text-sm ${
                                  comparison.isBetter ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {comparison.diff > 0 ? "+" : ""}
                                {comparison.diff.toFixed(4)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {(!model1 || !model2) && (
          <div className="text-center py-8 text-muted-foreground">
            Select two models to compare their performance metrics
          </div>
        )}
      </CardContent>
    </Card>
  );
}

