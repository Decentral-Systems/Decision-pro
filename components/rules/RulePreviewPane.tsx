"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { CustomProductRuleRequest, WorkflowRuleRequest } from "@/types/rules";
import { cn } from "@/lib/utils";

interface RulePreviewPaneProps {
  ruleData?: CustomProductRuleRequest | WorkflowRuleRequest;
  ruleType: "product" | "workflow";
  validationErrors?: Record<string, string>;
  className?: string;
}

export function RulePreviewPane({
  ruleData,
  ruleType,
  validationErrors = {},
  className,
}: RulePreviewPaneProps) {
  if (!ruleData) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle className="text-sm">Rule Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Start building your rule to see a preview
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasErrors = Object.keys(validationErrors).length > 0;
  const isValid = !hasErrors && ruleData;

  // Extract rule information
  const ruleName =
    "rule_name" in ruleData ? ruleData.rule_name : "Unnamed Rule";
  const description =
    "rule_description" in ruleData
      ? ruleData.rule_description
      : "No description";

  // Count conditions and actions
  const conditionCount =
    ruleType === "product"
      ? (ruleData as CustomProductRuleRequest).rule_definition?.conditions
          ?.length || 0
      : (ruleData as WorkflowRuleRequest).rule_conditions?.conditions
          ?.length || 0;

  const actionCount =
    ruleType === "product"
      ? (ruleData as CustomProductRuleRequest).rule_actions?.length || 0
      : (ruleData as WorkflowRuleRequest).rule_actions?.actions?.length || 0;

  const logicalOperator =
    ruleType === "product"
      ? (ruleData as CustomProductRuleRequest).rule_definition
          ?.logical_operator || "AND"
      : (ruleData as WorkflowRuleRequest).rule_conditions
          ?.logical_operator || "AND";

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Rule Preview</CardTitle>
          {isValid ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Valid
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {Object.keys(validationErrors).length} Error(s)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rule Summary */}
        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-semibold mb-1">Rule Name</h4>
            <p className="text-sm text-muted-foreground">
              {ruleName || "Unnamed Rule"}
            </p>
          </div>
          {description && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          )}
        </div>

        {/* Rule Structure */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Rule Structure</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{conditionCount}</Badge>
              <span className="text-muted-foreground">Conditions</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{actionCount}</Badge>
              <span className="text-muted-foreground">Actions</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Logical Operator:</span>
            <Badge variant="secondary">{logicalOperator}</Badge>
          </div>
        </div>

        {/* Validation Errors */}
        {hasErrors && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-destructive">
              Validation Errors
            </h4>
            <div className="space-y-1">
              {Object.entries(validationErrors).map(([field, error]) => (
                <div
                  key={field}
                  className="text-xs text-destructive flex items-start gap-2"
                >
                  <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">{field}:</span> {error}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JSON Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">JSON Preview</h4>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
            {JSON.stringify(ruleData, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

