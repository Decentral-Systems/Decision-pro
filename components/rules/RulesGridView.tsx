"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Play,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { CustomProductRule, WorkflowRule } from "@/types/rules";
import { RuleConditionsDisplay } from "./RuleConditionsDisplay";
import { RuleActionsDisplay } from "./RuleActionsDisplay";
import { RuleStats } from "./RuleStats";
import { cn } from "@/lib/utils";

interface RulesGridViewProps {
  rules: (CustomProductRule | WorkflowRule)[];
  ruleType: "product" | "workflow";
  onEdit?: (rule: CustomProductRule | WorkflowRule) => void;
  onDelete?: (ruleId: number) => void;
  onDuplicate?: (rule: CustomProductRule | WorkflowRule) => void;
  onEvaluate?: (rule: CustomProductRule | WorkflowRule) => void;
  onToggleActive?: (ruleId: number, isActive: boolean) => void;
  className?: string;
}

export function RulesGridView({
  rules,
  ruleType,
  onEdit,
  onDelete,
  onDuplicate,
  onEvaluate,
  onToggleActive,
  className,
}: RulesGridViewProps) {
  if (rules.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No rules found
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
        className
      )}
    >
      {rules.map((rule) => {
        const isProductRule = ruleType === "product";
        const ruleName = rule.rule_name;
        const isActive = rule.is_active;
        const conditions = isProductRule
          ? (rule as CustomProductRule).rule_definition?.conditions || []
          : (rule as WorkflowRule).rule_conditions?.conditions || [];
        const actions = isProductRule
          ? (rule as CustomProductRule).rule_actions || []
          : (rule as WorkflowRule).rule_actions?.actions || [];

        return (
          <Card
            key={rule.id}
            className="hover:shadow-md transition-shadow group"
          >
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{ruleName}</h3>
                  {isProductRule && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {(rule as CustomProductRule).product_type}
                    </Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(rule)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDuplicate && (
                      <DropdownMenuItem onClick={() => onDuplicate(rule)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                    )}
                    {onEvaluate && (
                      <DropdownMenuItem onClick={() => onEvaluate(rule)}>
                        <Play className="mr-2 h-4 w-4" />
                        Test
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {onToggleActive && (
                      <DropdownMenuItem
                        onClick={() => onToggleActive(rule.id, isActive)}
                      >
                        {isActive ? (
                          <>
                            <ToggleLeft className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(rule.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                {isActive ? (
                  <Badge variant="default" className="bg-green-500 text-xs">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>

              {/* Conditions Preview */}
              {conditions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {conditions.length} condition{conditions.length !== 1 ? "s" : ""}
                  </p>
                  <div className="text-xs">
                    <RuleConditionsDisplay
                      conditions={conditions}
                      logicalOperator={
                        isProductRule
                          ? (rule as CustomProductRule).rule_definition
                              ?.logical_operator || "AND"
                          : (rule as WorkflowRule).rule_conditions
                              ?.logical_operator || "AND"
                      }
                    />
                  </div>
                </div>
              )}

              {/* Actions Preview */}
              {actions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {actions.length} action{actions.length !== 1 ? "s" : ""}
                  </p>
                  <div className="text-xs">
                    <RuleActionsDisplay actions={actions} />
                  </div>
                </div>
              )}

              {/* Stats */}
              {isProductRule && (
                <div className="pt-2 border-t">
                  <RuleStats
                    execution_count={(rule as CustomProductRule).evaluation_count}
                    match_count={(rule as CustomProductRule).match_count}
                    action_execution_count={
                      (rule as CustomProductRule).action_execution_count
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

