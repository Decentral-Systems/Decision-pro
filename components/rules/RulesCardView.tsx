"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CustomProductRule, WorkflowRule } from "@/types/rules";
import { RuleConditionsDisplay } from "./RuleConditionsDisplay";
import { RuleActionsDisplay } from "./RuleActionsDisplay";
import { RuleStats } from "./RuleStats";
import { cn } from "@/lib/utils";

interface RulesCardViewProps {
  rules: (CustomProductRule | WorkflowRule)[];
  ruleType: "product" | "workflow";
  onEdit?: (rule: CustomProductRule | WorkflowRule) => void;
  onDelete?: (ruleId: number) => void;
  onDuplicate?: (rule: CustomProductRule | WorkflowRule) => void;
  onEvaluate?: (rule: CustomProductRule | WorkflowRule) => void;
  onToggleActive?: (ruleId: number, isActive: boolean) => void;
  className?: string;
}

export function RulesCardView({
  rules,
  ruleType,
  onEdit,
  onDelete,
  onDuplicate,
  onEvaluate,
  onToggleActive,
  className,
}: RulesCardViewProps) {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const toggleCard = (ruleId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedCards(newExpanded);
  };

  if (rules.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No rules found
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {rules.map((rule) => {
        const isProductRule = ruleType === "product";
        const isExpanded = expandedCards.has(rule.id);
        const conditions = isProductRule
          ? (rule as CustomProductRule).rule_definition?.conditions || []
          : (rule as WorkflowRule).rule_conditions?.conditions || [];
        const actions = isProductRule
          ? (rule as CustomProductRule).rule_actions || []
          : (rule as WorkflowRule).rule_actions?.actions || [];

        return (
          <Card key={rule.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                  {rule.rule_description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {rule.rule_description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {rule.is_active ? (
                    <Badge variant="default" className="bg-green-500">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                          onClick={() => onToggleActive(rule.id, rule.is_active)}
                        >
                          {rule.is_active ? (
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
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {isProductRule && (
                  <div>
                    <p className="text-muted-foreground">Product Type</p>
                    <Badge variant="outline">
                      {(rule as CustomProductRule).product_type}
                    </Badge>
                  </div>
                )}
                {isProductRule && (
                  <div>
                    <p className="text-muted-foreground">Scope</p>
                    <Badge variant="outline">
                      {(rule as CustomProductRule).evaluation_scope}
                    </Badge>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Conditions</p>
                  <p className="font-medium">{conditions.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Actions</p>
                  <p className="font-medium">{actions.length}</p>
                </div>
              </div>

              {/* Expandable Details */}
              {isExpanded && (
                <div className="space-y-4 pt-4 border-t">
                  {/* Conditions */}
                  {conditions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Conditions</h4>
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
                  )}

                  {/* Actions */}
                  {actions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Actions</h4>
                      <RuleActionsDisplay actions={actions} />
                    </div>
                  )}

                  {/* Stats */}
                  {isProductRule && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Statistics</h4>
                      <RuleStats
                        execution_count={(rule as CustomProductRule).evaluation_count}
                        match_count={(rule as CustomProductRule).match_count}
                        action_execution_count={
                          (rule as CustomProductRule).action_execution_count
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Expand/Collapse Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCard(rule.id)}
                className="w-full"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show More
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

