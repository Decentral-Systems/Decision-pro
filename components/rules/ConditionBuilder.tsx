"use client";

import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  GripVertical,
  X,
} from "lucide-react";
import { RuleCondition, RuleOperator } from "@/types/rules";
import { getOperatorsForField, inferFieldType } from "@/lib/utils/ruleHelpers";
import { cn } from "@/lib/utils";

interface ConditionBuilderProps {
  conditions: RuleCondition[];
  logicalOperator: "AND" | "OR";
  onConditionsChange: (conditions: RuleCondition[]) => void;
  onLogicalOperatorChange: (operator: "AND" | "OR") => void;
  availableFields?: string[];
  className?: string;
}

interface SortableConditionItemProps {
  condition: RuleCondition;
  index: number;
  onUpdate: (index: number, condition: RuleCondition) => void;
  onDelete: (index: number) => void;
  availableFields?: string[];
}

function SortableConditionItem({
  condition,
  index,
  onUpdate,
  onDelete,
  availableFields = [],
}: SortableConditionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `condition-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldType = inferFieldType(condition.field);
  const operators = getOperatorsForField(fieldType);

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card
        className={cn(
          "p-3 transition-all",
          isDragging && "shadow-lg border-primary"
        )}
      >
        <CardContent className="p-0 space-y-3">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-4 w-4" />
            </button>

            <div className="flex-1 grid grid-cols-12 gap-2">
              {/* Field */}
              <div className="col-span-4">
                <Label className="text-xs">Field</Label>
                <Select
                  value={condition.field}
                  onValueChange={(value) =>
                    onUpdate(index, { ...condition, field: value })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.length > 0 ? (
                      availableFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="monthly_income">Monthly Income</SelectItem>
                        <SelectItem value="credit_score">Credit Score</SelectItem>
                        <SelectItem value="loan_amount">Loan Amount</SelectItem>
                        <SelectItem value="employment_status">Employment Status</SelectItem>
                        <SelectItem value="age">Age</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Operator */}
              <div className="col-span-3">
                <Label className="text-xs">Operator</Label>
                <Select
                  value={condition.operator}
                  onValueChange={(value: RuleOperator) =>
                    onUpdate(index, { ...condition, operator: value })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op} value={op}>
                        {op.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value */}
              <div className="col-span-4">
                <Label className="text-xs">Value</Label>
                <Input
                  type={fieldType === "number" ? "number" : "text"}
                  value={condition.value ?? ""}
                  onChange={(e) =>
                    onUpdate(index, {
                      ...condition,
                      value:
                        fieldType === "number"
                          ? parseFloat(e.target.value) || 0
                          : e.target.value,
                    })
                  }
                  className="h-8 text-xs"
                  placeholder="Enter value"
                />
              </div>

              {/* Delete Button */}
              <div className="col-span-1 flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(index)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ConditionBuilder({
  conditions,
  logicalOperator,
  onConditionsChange,
  onLogicalOperatorChange,
  availableFields,
  className,
}: ConditionBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = conditions.findIndex(
        (_, i) => `condition-${i}` === active.id
      );
      const newIndex = conditions.findIndex(
        (_, i) => `condition-${i}` === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        onConditionsChange(arrayMove(conditions, oldIndex, newIndex));
      }
    }
  };

  const handleAddCondition = () => {
    onConditionsChange([
      ...conditions,
      {
        field: availableFields?.[0] || "monthly_income",
        operator: "greater_than",
        value: "",
      },
    ]);
  };

  const handleUpdateCondition = (index: number, condition: RuleCondition) => {
    const updated = [...conditions];
    updated[index] = condition;
    onConditionsChange(updated);
  };

  const handleDeleteCondition = (index: number) => {
    onConditionsChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Logical Operator Selector */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Conditions</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Logical Operator:</span>
          <div className="flex gap-1">
            <Button
              variant={logicalOperator === "AND" ? "default" : "outline"}
              size="sm"
              onClick={() => onLogicalOperatorChange("AND")}
              className="h-7 text-xs"
            >
              AND
            </Button>
            <Button
              variant={logicalOperator === "OR" ? "default" : "outline"}
              size="sm"
              onClick={() => onLogicalOperatorChange("OR")}
              className="h-7 text-xs"
            >
              OR
            </Button>
          </div>
        </div>
      </div>

      {/* Conditions List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={conditions.map((_, i) => `condition-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {conditions.length === 0 ? (
              <Card className="p-6 border-dashed">
                <CardContent className="p-0 text-center">
                  <p className="text-sm text-muted-foreground">
                    No conditions added. Click "Add Condition" to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              conditions.map((condition, index) => (
                <SortableConditionItem
                  key={`condition-${index}`}
                  condition={condition}
                  index={index}
                  onUpdate={handleUpdateCondition}
                  onDelete={handleDeleteCondition}
                  availableFields={availableFields}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Condition Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAddCondition}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Condition
      </Button>
    </div>
  );
}

