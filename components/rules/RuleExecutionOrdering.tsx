/**
 * Rule Execution Ordering Component
 * Drag-and-drop ordering with dependency tracking and validation
 */

"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  GripVertical,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface RuleOrderItem {
  id: string;
  name: string;
  priority: number;
  dependencies?: string[]; // IDs of rules that must execute before this one
  dependents?: string[]; // IDs of rules that depend on this one
  type?: "product" | "workflow";
}

interface RuleExecutionOrderingProps {
  rules: RuleOrderItem[];
  onOrderChange: (orderedRules: RuleOrderItem[]) => void;
  className?: string;
}

interface SortableRuleItemProps {
  rule: RuleOrderItem;
  index: number;
  allRules: RuleOrderItem[];
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function SortableRuleItem({
  rule,
  index,
  allRules,
  onMoveUp,
  onMoveDown,
}: SortableRuleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Check for dependency violations
  const dependencyViolations = useMemo(() => {
    if (!rule.dependencies || rule.dependencies.length === 0) return [];
    
    const violations: string[] = [];
    rule.dependencies.forEach((depId) => {
      const depIndex = allRules.findIndex((r) => r.id === depId);
      if (depIndex === -1) {
        violations.push(`Dependency "${depId}" not found`);
      } else if (depIndex > index) {
        violations.push(`Dependency "${allRules[depIndex].name}" must execute before this rule`);
      }
    });
    return violations;
  }, [rule, index, allRules]);

  const hasViolations = dependencyViolations.length > 0;
  const canMoveUp = index > 0;
  const canMoveDown = index < allRules.length - 1;

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card
        className={cn(
          "transition-all",
          isDragging && "shadow-lg border-primary",
          hasViolations && "border-destructive"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            {/* Order Number */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
              {index + 1}
            </div>

            {/* Rule Info */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{rule.name}</span>
                <Badge variant="outline" className="text-xs">
                  Priority: {rule.priority}
                </Badge>
                {rule.type && (
                  <Badge variant="secondary" className="text-xs">
                    {rule.type}
                  </Badge>
                )}
              </div>
              
              {/* Dependencies */}
              {rule.dependencies && rule.dependencies.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Depends on: {rule.dependencies.map((depId) => {
                    const dep = allRules.find((r) => r.id === depId);
                    return dep ? dep.name : depId;
                  }).join(", ")}
                </div>
              )}

              {/* Violations */}
              {hasViolations && (
                <Alert variant="destructive" className="mt-2 py-2">
                  <AlertTriangle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    {dependencyViolations.join("; ")}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Move Buttons */}
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="h-6 w-6 p-0"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="h-6 w-6 p-0"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RuleExecutionOrdering({
  rules,
  onOrderChange,
  className,
}: RuleExecutionOrderingProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [orderedRules, setOrderedRules] = useState<RuleOrderItem[]>(rules);

  // Update local state when props change
  useState(() => {
    setOrderedRules(rules);
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedRules.findIndex((r) => r.id === active.id);
      const newIndex = orderedRules.findIndex((r) => r.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(orderedRules, oldIndex, newIndex);
        setOrderedRules(newOrder);
        onOrderChange(newOrder);
      }
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = arrayMove(orderedRules, index, index - 1);
    setOrderedRules(newOrder);
    onOrderChange(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === orderedRules.length - 1) return;
    const newOrder = arrayMove(orderedRules, index, index + 1);
    setOrderedRules(newOrder);
    onOrderChange(newOrder);
  };

  // Validate dependencies
  const validationResults = useMemo(() => {
    const violations: Array<{ ruleId: string; message: string }> = [];
    const warnings: Array<{ ruleId: string; message: string }> = [];

    orderedRules.forEach((rule, index) => {
      if (rule.dependencies && rule.dependencies.length > 0) {
        rule.dependencies.forEach((depId) => {
          const depIndex = orderedRules.findIndex((r) => r.id === depId);
          if (depIndex === -1) {
            violations.push({
              ruleId: rule.id,
              message: `Dependency "${depId}" not found in rule list`,
            });
          } else if (depIndex > index) {
            violations.push({
              ruleId: rule.id,
              message: `Rule "${rule.name}" depends on "${orderedRules[depIndex].name}" which executes later`,
            });
          }
        });
      }
    });

    return { violations, warnings };
  }, [orderedRules]);

  const hasViolations = validationResults.violations.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Rule Execution Order</h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop to reorder rules. Rules execute from top to bottom.
          </p>
        </div>
        {hasViolations && (
          <Badge variant="destructive">
            {validationResults.violations.length} violation
            {validationResults.violations.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Validation Summary */}
      {hasViolations && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-semibold">Dependency Violations Detected:</div>
              <ul className="list-disc list-inside text-sm space-y-1">
                {validationResults.violations.map((v, i) => (
                  <li key={i}>{v.message}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!hasViolations && orderedRules.length > 0 && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            All dependencies are valid. Rules are ready to execute.
          </AlertDescription>
        </Alert>
      )}

      {/* Rules List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedRules.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {orderedRules.length === 0 ? (
              <Card className="p-6 border-dashed">
                <CardContent className="p-0 text-center">
                  <p className="text-sm text-muted-foreground">
                    No rules to order. Add rules first.
                  </p>
                </CardContent>
              </Card>
            ) : (
              orderedRules.map((rule, index) => (
                <SortableRuleItem
                  key={rule.id}
                  rule={rule}
                  index={index}
                  allRules={orderedRules}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Tip:</strong> Rules with dependencies must execute after their dependencies.
          The system will automatically validate the order and highlight any violations.
        </AlertDescription>
      </Alert>
    </div>
  );
}
