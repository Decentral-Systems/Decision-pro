"use client";

import { RuleCondition, WorkflowRuleCondition } from "@/types/rules";
import { formatRuleCondition, getOperatorSymbol } from "@/lib/utils/ruleHelpers";
import { Badge } from "@/components/ui/badge";

interface RuleConditionsDisplayProps {
  conditions: (RuleCondition | WorkflowRuleCondition)[];
  logicalOperator?: "AND" | "OR";
  compact?: boolean;
}

export function RuleConditionsDisplay({ conditions, logicalOperator = "AND", compact = false }: RuleConditionsDisplayProps) {
  if (!conditions || conditions.length === 0) {
    return <span className="text-muted-foreground text-sm">No conditions</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {conditions.map((condition, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <Badge variant="outline" className="text-xs">
              {logicalOperator}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs font-mono">
            {formatRuleCondition(condition)}
          </Badge>
        </div>
      ))}
    </div>
  );
}

