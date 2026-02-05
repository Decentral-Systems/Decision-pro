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
  Plus,
  Clock,
} from "lucide-react";
import { CustomProductRule, WorkflowRule } from "@/types/rules";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface RulesTimelineViewProps {
  rules: (CustomProductRule | WorkflowRule)[];
  ruleType: "product" | "workflow";
  onEdit?: (rule: CustomProductRule | WorkflowRule) => void;
  onDelete?: (ruleId: number) => void;
  onDuplicate?: (rule: CustomProductRule | WorkflowRule) => void;
  onEvaluate?: (rule: CustomProductRule | WorkflowRule) => void;
  onToggleActive?: (ruleId: number, isActive: boolean) => void;
  className?: string;
}

interface TimelineEvent {
  type: "created" | "updated" | "activated" | "deactivated";
  timestamp: string;
  rule: CustomProductRule | WorkflowRule;
}

export function RulesTimelineView({
  rules,
  ruleType,
  onEdit,
  onDelete,
  onDuplicate,
  onEvaluate,
  onToggleActive,
  className,
}: RulesTimelineViewProps) {
  // Create timeline events from rules
  const events: TimelineEvent[] = rules.flatMap((rule) => {
    const events: TimelineEvent[] = [];
    
    // Created event
    if (rule.created_at) {
      events.push({
        type: "created",
        timestamp: rule.created_at,
        rule,
      });
    }

    // Updated event
    if (rule.updated_at && rule.updated_at !== rule.created_at) {
      events.push({
        type: "updated",
        timestamp: rule.updated_at,
        rule,
      });
    }

    // Status events (based on current state)
    events.push({
      type: rule.is_active ? "activated" : "deactivated",
      timestamp: rule.updated_at || rule.created_at,
      rule,
    });

    return events;
  });

  // Sort by timestamp (newest first)
  events.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Group by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.timestamp);
    const dateKey = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "created":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "updated":
        return <Edit className="h-4 w-4 text-blue-500" />;
      case "activated":
        return <ToggleRight className="h-4 w-4 text-green-500" />;
      case "deactivated":
        return <ToggleLeft className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventLabel = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "created":
        return "Created";
      case "updated":
        return "Updated";
      case "activated":
        return "Activated";
      case "deactivated":
        return "Deactivated";
    }
  };

  if (rules.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No rules found
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date} className="space-y-4">
          {/* Date Header */}
          <div className="flex items-center gap-2 sticky top-0 bg-background z-10 py-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">{date}</h3>
            <Badge variant="outline" className="text-xs">
              {dateEvents.length} event{dateEvents.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Timeline Events */}
          <div className="space-y-3 pl-6 border-l-2 border-muted">
            {dateEvents.map((event, index) => (
              <Card key={`${event.rule.id}-${event.type}-${index}`} className="ml-4">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Event Icon */}
                    <div className="mt-1">{getEventIcon(event.type)}</div>

                    {/* Event Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {getEventLabel(event.type)}: {event.rule.rule_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.timestamp), "PPp")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {event.rule.is_active ? (
                            <Badge variant="default" className="bg-green-500 text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
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
                                <DropdownMenuItem onClick={() => onEdit(event.rule)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {onDuplicate && (
                                <DropdownMenuItem onClick={() => onDuplicate(event.rule)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                              )}
                              {onEvaluate && (
                                <DropdownMenuItem onClick={() => onEvaluate(event.rule)}>
                                  <Play className="mr-2 h-4 w-4" />
                                  Test
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {onToggleActive && (
                                <DropdownMenuItem
                                  onClick={() => onToggleActive(event.rule.id, event.rule.is_active)}
                                >
                                  {event.rule.is_active ? (
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
                                  onClick={() => onDelete(event.rule.id)}
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

                      {/* Rule Details */}
                      {event.type === "created" || event.type === "updated" ? (
                        <div className="text-xs text-muted-foreground space-y-1">
                          {ruleType === "product" && (
                            <div className="flex items-center gap-2">
                              <span>Product:</span>
                              <Badge variant="outline" className="text-xs">
                                {(event.rule as CustomProductRule).product_type}
                              </Badge>
                            </div>
                          )}
                          {event.rule.rule_description && (
                            <div>{event.rule.rule_description}</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

