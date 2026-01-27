"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Calendar,
  Timer
} from "lucide-react";

export interface WorkflowStage {
  stage: string;
  name: string;
  status: "completed" | "current" | "pending";
  completed_at?: string;
  estimated_time?: number; // in hours
}

interface WorkflowStageTimelineProps {
  stages: WorkflowStage[];
  currentStage: string;
  workflowStatus: string;
}

export function WorkflowStageTimeline({
  stages,
  currentStage,
  workflowStatus,
}: WorkflowStageTimelineProps) {
  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "current":
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "current":
        return "bg-blue-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "current":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const formatDuration = (hours?: number) => {
    if (!hours) return "N/A";
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const calculateTimeSpent = (completedAt?: string, previousCompletedAt?: string) => {
    if (!completedAt) return null;
    
    const endTime = new Date(completedAt);
    const startTime = previousCompletedAt ? new Date(previousCompletedAt) : null;
    
    if (!startTime) return null;
    
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    return diffHours;
  };

  // Default stage estimates if not provided
  const defaultEstimates: Record<string, number> = {
    initial_review: 2,
    credit_assessment: 4,
    compliance_check: 1,
    automated_decision: 0.5,
    risk_review: 3,
    final_approval: 1,
  };

  const completedStages = stages.filter(s => s.status === "completed");
  const currentStageIndex = stages.findIndex(s => s.stage === currentStage);
  const totalStages = stages.length;
  const progressPercentage = currentStageIndex >= 0 ? ((currentStageIndex + 1) / totalStages) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Workflow Timeline
        </CardTitle>
        <CardDescription>
          Track the progress of the approval workflow through each stage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span className="text-muted-foreground">
                {completedStages.length} of {totalStages} stages completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Started</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
              <span>Final Approval</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
            
            <div className="space-y-6">
              {stages.map((stage, index) => {
                const isLast = index === stages.length - 1;
                const previousStage = index > 0 ? stages[index - 1] : null;
                const timeSpent = calculateTimeSpent(stage.completed_at, previousStage?.completed_at);
                const estimatedTime = stage.estimated_time || defaultEstimates[stage.stage] || 2;
                
                return (
                  <div key={stage.stage} className="relative flex items-start">
                    {/* Stage icon */}
                    <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-200 rounded-full">
                      {getStageIcon(stage.status)}
                    </div>
                    
                    {/* Stage content */}
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium capitalize">
                            {stage.name || stage.stage.replace(/_/g, " ")}
                          </h4>
                          {getStatusBadge(stage.status)}
                        </div>
                        {stage.completed_at && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(stage.completed_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      {/* Stage details */}
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {stage.status === "completed" && timeSpent && (
                          <div className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            <span>Completed in {formatDuration(timeSpent)}</span>
                            {timeSpent > estimatedTime && (
                              <span className="text-orange-500">
                                ({formatDuration(timeSpent - estimatedTime)} over estimate)
                              </span>
                            )}
                          </div>
                        )}
                        
                        {stage.status === "current" && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Clock className="h-3 w-3" />
                            <span>In progress (Est. {formatDuration(estimatedTime)})</span>
                          </div>
                        )}
                        
                        {stage.status === "pending" && (
                          <div className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            <span>Estimated {formatDuration(estimatedTime)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Stage description based on type */}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {getStageDescription(stage.stage)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {completedStages.length}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {stages.filter(s => s.status === "current").length}
                </div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-600">
                  {stages.filter(s => s.status === "pending").length}
                </div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {formatDuration(
                    stages.reduce((total, stage) => {
                      return total + (stage.estimated_time || defaultEstimates[stage.stage] || 2);
                    }, 0)
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Est. Total</div>
              </div>
            </div>
          </div>

          {/* Workflow Status */}
          {workflowStatus && (
            <div className="flex items-center justify-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {workflowStatus === "approved" && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {workflowStatus === "rejected" && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {workflowStatus === "pending" && <Clock className="h-4 w-4 text-blue-500" />}
                  <span className="text-sm font-medium">
                    Workflow Status: {workflowStatus.charAt(0).toUpperCase() + workflowStatus.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getStageDescription(stage: string): string {
  const descriptions: Record<string, string> = {
    initial_review: "Basic application review and completeness check",
    credit_assessment: "Credit scoring and risk evaluation using ML models",
    compliance_check: "NBE regulatory compliance validation",
    automated_decision: "Rules engine evaluation and automated decision",
    risk_review: "Manual risk assessment and portfolio impact analysis",
    final_approval: "Final approval decision and documentation",
  };
  
  return descriptions[stage] || "Processing stage in the approval workflow";
}