"use client";

import { RuleAction, WorkflowRuleAction } from "@/types/rules";
import { Badge } from "@/components/ui/badge";
import { formatValue } from "@/lib/utils/ruleHelpers";

interface RuleActionsDisplayProps {
  actions: (RuleAction | WorkflowRuleAction)[];
  compact?: boolean;
}

export function RuleActionsDisplay({ actions, compact = false }: RuleActionsDisplayProps) {
  if (!actions || actions.length === 0) {
    return <span className="text-muted-foreground text-sm">No actions</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, index) => (
        <div key={index} className="flex items-center gap-2">
          <Badge variant="default" className="text-xs">
            {action.type}
          </Badge>
          {"parameters" in action && action.parameters && Object.keys(action.parameters).length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({Object.entries(action.parameters)
                .map(([key, value]) => `${key}: ${formatValue(value)}`)
                .join(", ")})
            </span>
          )}
          {"value" in action && action.value !== undefined && (
            <span className="text-xs text-muted-foreground">= {formatValue(action.value)}</span>
          )}
          {"multiplier" in action && action.multiplier !== undefined && (
            <span className="text-xs text-muted-foreground">× {action.multiplier}</span>
          )}
        </div>
      ))}
    </div>
  );
}

