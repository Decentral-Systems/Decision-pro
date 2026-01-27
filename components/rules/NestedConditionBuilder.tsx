/**
 * Nested Condition Builder Component
 * Supports condition groups with AND/OR logic at group level
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Layers,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ConditionGroup, RuleCondition, LogicalOperator } from "@/types/rules";
import { ConditionBuilder } from "./ConditionBuilder";
import { cn } from "@/lib/utils";

interface NestedConditionBuilderProps {
  groups: ConditionGroup[];
  onGroupsChange: (groups: ConditionGroup[]) => void;
  availableFields?: string[];
  className?: string;
}

export function NestedConditionBuilder({
  groups,
  onGroupsChange,
  availableFields,
  className,
}: NestedConditionBuilderProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const addGroup = () => {
    const newGroup: ConditionGroup = {
      id: `group_${Date.now()}`,
      conditions: [],
      logical_operator: "AND",
    };
    onGroupsChange([...groups, newGroup]);
    setExpandedGroups(new Set([...expandedGroups, newGroup.id!]));
  };

  const deleteGroup = (groupId: string) => {
    onGroupsChange(groups.filter((g) => g.id !== groupId));
    const newExpanded = new Set(expandedGroups);
    newExpanded.delete(groupId);
    setExpandedGroups(newExpanded);
  };

  const updateGroup = (groupId: string, updates: Partial<ConditionGroup>) => {
    onGroupsChange(
      groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
    );
  };

  const updateGroupLogicalOperator = (
    groupId: string,
    operator: LogicalOperator
  ) => {
    updateGroup(groupId, { logical_operator: operator });
  };

  const updateGroupConditions = (
    groupId: string,
    conditions: RuleCondition[]
  ) => {
    updateGroup(groupId, { conditions });
  };

  const addNestedGroup = (parentGroupId: string) => {
    const newNestedGroup: ConditionGroup = {
      id: `nested_${Date.now()}`,
      conditions: [],
      logical_operator: "AND",
    };

    onGroupsChange(
      groups.map((g) => {
        if (g.id === parentGroupId) {
          return {
            ...g,
            groups: [...(g.groups || []), newNestedGroup],
          };
        }
        return g;
      })
    );
  };

  const deleteNestedGroup = (parentGroupId: string, nestedGroupId: string) => {
    onGroupsChange(
      groups.map((g) => {
        if (g.id === parentGroupId) {
          return {
            ...g,
            groups: g.groups?.filter((ng) => ng.id !== nestedGroupId) || [],
          };
        }
        return g;
      })
    );
  };

  const updateNestedGroup = (
    parentGroupId: string,
    nestedGroupId: string,
    updates: Partial<ConditionGroup>
  ) => {
    onGroupsChange(
      groups.map((g) => {
        if (g.id === parentGroupId) {
          return {
            ...g,
            groups: g.groups?.map((ng) =>
              ng.id === nestedGroupId ? { ...ng, ...updates } : ng
            ) || [],
          };
        }
        return g;
      })
    );
  };

  const renderGroup = (group: ConditionGroup, level: number = 0) => {
    const isExpanded = expandedGroups.has(group.id || "");
    const indentClass = level > 0 ? `ml-${level * 4}` : "";

    return (
      <Card key={group.id} className={cn("mb-4", indentClass)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleGroup(group.id || "")}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <Layers className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">
                Condition Group {group.id?.split("_")[1] || ""}
              </CardTitle>
              <Badge variant="outline" className="ml-2">
                {group.conditions.length} condition{group.conditions.length !== 1 ? "s" : ""}
                {group.groups && group.groups.length > 0 && (
                  <span className="ml-1">
                    , {group.groups.length} nested group{group.groups.length !== 1 ? "s" : ""}
                  </span>
                )}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <Button
                  variant={group.logical_operator === "AND" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateGroupLogicalOperator(group.id || "", "AND")}
                  className="h-7 text-xs"
                >
                  AND
                </Button>
                <Button
                  variant={group.logical_operator === "OR" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateGroupLogicalOperator(group.id || "", "OR")}
                  className="h-7 text-xs"
                >
                  OR
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteGroup(group.id || "")}
                className="h-7 w-7 p-0 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-4">
            {/* Conditions in this group */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Conditions
              </Label>
              <ConditionBuilder
                conditions={group.conditions}
                logicalOperator={group.logical_operator}
                onConditionsChange={(conditions) =>
                  updateGroupConditions(group.id || "", conditions)
                }
                onLogicalOperatorChange={(operator) =>
                  updateGroupLogicalOperator(group.id || "", operator)
                }
                availableFields={availableFields}
              />
            </div>

            {/* Nested Groups */}
            {group.groups && group.groups.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">
                    Nested Groups
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addNestedGroup(group.id || "")}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Nested Group
                  </Button>
                </div>
                {group.groups.map((nestedGroup) => (
                  <div key={nestedGroup.id} className="ml-4">
                    {renderGroup(nestedGroup, level + 1)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        deleteNestedGroup(group.id || "", nestedGroup.id || "")
                      }
                      className="h-7 text-xs text-destructive mt-2"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remove Nested Group
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Nested Group Button */}
            {(!group.groups || group.groups.length === 0) && (
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addNestedGroup(group.id || "")}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Nested Group
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Condition Groups</Label>
        <Button variant="outline" size="sm" onClick={addGroup}>
          <Plus className="h-4 w-4 mr-2" />
          Add Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card className="p-6 border-dashed">
          <CardContent className="p-0 text-center">
            <p className="text-sm text-muted-foreground">
              No condition groups added. Click "Add Group" to create a new condition group.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => renderGroup(group))}
        </div>
      )}

      {/* Top-level logical operator between groups */}
      {groups.length > 1 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Label className="text-xs text-muted-foreground">
            Combine groups with:
          </Label>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              AND
            </Button>
            <Button variant="default" size="sm" className="h-7 text-xs">
              OR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
