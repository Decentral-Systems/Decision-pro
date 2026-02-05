"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useEvaluateRules, useEvaluateWorkflow } from "@/lib/api/hooks/useRules";
import { useToast } from "@/hooks/use-toast";
import { RuleEvaluationResult } from "@/types/rules";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RuleTesterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruleType: "product" | "workflow";
  productType?: string;
}

export function RuleTesterDialog({
  open,
  onOpenChange,
  ruleType,
  productType,
}: RuleTesterDialogProps) {
  const { toast } = useToast();
  const evaluateRules = useEvaluateRules();
  const evaluateWorkflow = useEvaluateWorkflow();
  const [testData, setTestData] = useState<Record<string, any>>({
    customer_id: "",
    loan_amount: "",
    monthly_income: "",
    credit_score: "",
    default_probability: "",
  });
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    try {
      setIsLoading(true);
      setResults(null);

      const applicationData: Record<string, any> = {};
      Object.entries(testData).forEach(([key, value]) => {
        if (value) {
          // Try to parse as number if it looks like a number
          const numValue = Number(value);
          applicationData[key] = isNaN(numValue) ? value : numValue;
        }
      });

      let result;
      if (ruleType === "product") {
        result = await evaluateRules.mutateAsync({
          product_type: productType || "PersonalLoan",
          application_data: applicationData,
        });
      } else {
        result = await evaluateWorkflow.mutateAsync({
          application_data: applicationData,
          product_type: productType,
        });
      }

      setResults(result);
      toast({
        title: "Success",
        description: "Rule evaluation completed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to evaluate rules",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Rules</DialogTitle>
          <DialogDescription>
            Test rules against sample application data to see how they evaluate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <Label>Application Data</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test_customer_id">Customer ID</Label>
                <Input
                  id="test_customer_id"
                  value={testData.customer_id}
                  onChange={(e) =>
                    setTestData({ ...testData, customer_id: e.target.value })
                  }
                  placeholder="CUST001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_loan_amount">Loan Amount</Label>
                <Input
                  id="test_loan_amount"
                  type="number"
                  value={testData.loan_amount}
                  onChange={(e) =>
                    setTestData({ ...testData, loan_amount: e.target.value })
                  }
                  placeholder="100000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_monthly_income">Monthly Income</Label>
                <Input
                  id="test_monthly_income"
                  type="number"
                  value={testData.monthly_income}
                  onChange={(e) =>
                    setTestData({ ...testData, monthly_income: e.target.value })
                  }
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_credit_score">Credit Score</Label>
                <Input
                  id="test_credit_score"
                  type="number"
                  value={testData.credit_score}
                  onChange={(e) =>
                    setTestData({ ...testData, credit_score: e.target.value })
                  }
                  placeholder="750"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_default_prob">Default Probability</Label>
                <Input
                  id="test_default_prob"
                  type="number"
                  step="0.01"
                  value={testData.default_probability}
                  onChange={(e) =>
                    setTestData({ ...testData, default_probability: e.target.value })
                  }
                  placeholder="0.15"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="test_custom_data">Custom Data (JSON)</Label>
              <Textarea
                id="test_custom_data"
                placeholder='{"field": "value"}'
                rows={3}
                onChange={(e) => {
                  try {
                    const custom = JSON.parse(e.target.value);
                    setTestData({ ...testData, ...custom });
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
              />
            </div>
          </div>

          <Button onClick={handleTest} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Test
              </>
            )}
          </Button>

          {results && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Evaluation Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {results.evaluated_rules && (
                    <div>
                      <Label className="mb-2 block">Evaluated Rules ({results.evaluated_rules.length})</Label>
                      <div className="space-y-2">
                        {results.evaluated_rules.map((rule: RuleEvaluationResult, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{rule.rule_name}</div>
                              {rule.matched_conditions && rule.matched_conditions.length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  Matched: {rule.matched_conditions.join(", ")}
                                </div>
                              )}
                            </div>
                            {rule.matched ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Matched
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Not Matched
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.final_result && (
                    <div>
                      <Label className="mb-2 block">Final Result</Label>
                      <pre className="p-3 bg-muted rounded text-sm overflow-auto">
                        {JSON.stringify(results.final_result, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

