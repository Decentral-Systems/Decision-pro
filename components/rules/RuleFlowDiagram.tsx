"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { RuleCondition, RuleAction, LogicalOperator } from "@/types/rules";
import { cn } from "@/lib/utils";

interface RuleFlowDiagramProps {
  conditions: RuleCondition[];
  actions: RuleAction[];
  logicalOperator: LogicalOperator;
  className?: string;
}

interface ConditionNodeProps {
  condition: RuleCondition;
  index: number;
  isLast: boolean;
}

function ConditionNode({ condition, index, isLast }: ConditionNodeProps) {
  const getOperatorSymbol = (op: string) => {
    const symbols: Record<string, string> = {
      equals: "=",
      not_equals: "≠",
      greater_than: ">",
      less_than: "<",
      greater_than_or_equal: "≥",
      less_than_or_equal: "≤",
      in: "∈",
      not_in: "∉",
      contains: "⊃",
      regex: "~",
    };
    return symbols[op] || op;
  };

  return (
    <div className="flex items-center gap-2">
      <Card className="p-3 min-w-[200px]">
        <CardContent className="p-0">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                #{index + 1}
              </Badge>
              <span className="text-xs text-muted-foreground">Condition</span>
            </div>
            <div className="font-medium text-sm">{condition.field}</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                {getOperatorSymbol(condition.operator)}
              </span>
              <Badge variant="secondary" className="text-xs">
                {String(condition.value)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      {!isLast && (
        <div className="flex flex-col items-center">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

interface ActionNodeProps {
  action: RuleAction;
  index: number;
}

function ActionNode({ action, index }: ActionNodeProps) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case "approve":
      case "auto_approve":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "reject":
      case "auto_reject":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "require_review":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <Card className="p-3 min-w-[180px] bg-primary/5 border-primary/20">
      <CardContent className="p-0">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              Action #{index + 1}
            </Badge>
            {getActionIcon(action.type)}
          </div>
          <div className="font-medium text-sm capitalize">
            {action.type.replace(/_/g, " ")}
          </div>
          {action.value && (
            <div className="text-xs text-muted-foreground">
              Value: {String(action.value)}
            </div>
          )}
          {action.calculation && (
            <div className="text-xs text-muted-foreground font-mono">
              {action.calculation}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function RuleFlowDiagram({
  conditions,
  actions,
  logicalOperator,
  className,
}: RuleFlowDiagramProps) {
  if (conditions.length === 0 && actions.length === 0) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle className="text-sm">Rule Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Add conditions and actions to see the flow diagram
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Rule Flow</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {logicalOperator}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Conditions Section */}
        {conditions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold">Conditions</h4>
              <Badge variant="outline" className="text-xs">
                {conditions.length}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
              {conditions.map((condition, index) => (
                <ConditionNode
                  key={index}
                  condition={condition}
                  index={index}
                  isLast={index === conditions.length - 1}
                />
              ))}
            </div>
            {conditions.length > 1 && (
              <div className="text-center">
                <Badge variant="outline" className="text-xs">
                  All conditions must match ({logicalOperator})
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Flow Arrow */}
        {conditions.length > 0 && actions.length > 0 && (
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-px bg-border" />
              <ArrowRight className="h-6 w-6 text-primary rotate-90" />
              <div className="h-8 w-px bg-border" />
            </div>
          </div>
        )}

        {/* Actions Section */}
        {actions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold">Actions</h4>
              <Badge variant="outline" className="text-xs">
                {actions.length}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
              {actions.map((action, index) => (
                <ActionNode key={index} action={action} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              <span className="font-medium">Flow:</span> If{" "}
              {conditions.length > 0
                ? `${conditions.length} condition${conditions.length > 1 ? "s" : ""} match`
                : "conditions match"}{" "}
              → Execute {actions.length} action{actions.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

