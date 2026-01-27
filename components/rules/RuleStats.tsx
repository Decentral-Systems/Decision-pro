"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Activity, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface RuleStatsProps {
  execution_count?: number;
  success_count?: number;
  failure_count?: number;
  match_count?: number;
  action_execution_count?: number;
  compact?: boolean;
}

export function RuleStats({
  execution_count = 0,
  success_count = 0,
  failure_count = 0,
  match_count = 0,
  action_execution_count = 0,
  compact = false,
}: RuleStatsProps) {
  const successRate = execution_count > 0 ? (success_count / execution_count) * 100 : 0;
  const matchRate = execution_count > 0 ? (match_count / execution_count) * 100 : 0;

  if (compact) {
    // Compact horizontal layout for table cells
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-help">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  {execution_count.toLocaleString()}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-xs">
                <div className="font-semibold">Total Executions</div>
                <div>Matches: {match_count.toLocaleString()}</div>
                <div>Actions: {action_execution_count.toLocaleString()}</div>
              </div>
            </TooltipContent>
          </Tooltip>
          
          {execution_count > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-help",
                  matchRate >= 50 ? "bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50" : "bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50"
                )}>
                  {matchRate >= 50 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  )}
                  <span className={cn(
                    "text-xs font-semibold",
                    matchRate >= 50 ? "text-green-700 dark:text-green-300" : "text-orange-700 dark:text-orange-300"
                  )}>
                    {matchRate.toFixed(0)}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1 text-xs">
                  <div className="font-semibold">Match Rate</div>
                  <div>{match_count.toLocaleString()} / {execution_count.toLocaleString()} executions</div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  // Standard vertical layout with better spacing
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2 min-w-[140px]">
        {/* Executions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-help">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Executions</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {execution_count.toLocaleString()}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <div className="font-semibold">Total Rule Executions</div>
              <div>This rule has been evaluated {execution_count.toLocaleString()} times</div>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Match Rate */}
        {execution_count > 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center justify-between gap-2 px-2 py-1.5 rounded-md transition-colors cursor-help",
                matchRate >= 50 
                  ? "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30" 
                  : "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30"
              )}>
                <div className="flex items-center gap-2">
                  {matchRate >= 50 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  )}
                  <span className="text-xs text-muted-foreground">Match Rate</span>
                </div>
                <span className={cn(
                  "text-sm font-semibold",
                  matchRate >= 50 ? "text-green-700 dark:text-green-300" : "text-orange-700 dark:text-orange-300"
                )}>
                  {matchRate.toFixed(1)}%
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-xs">
                <div className="font-semibold">Match Rate</div>
                <div>{match_count.toLocaleString()} matches out of {execution_count.toLocaleString()} executions</div>
                <div>Rate: {matchRate.toFixed(2)}%</div>
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-muted/30">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Match Rate</span>
            </div>
            <span className="text-sm font-semibold text-muted-foreground">—</span>
          </div>
        )}

        {/* Quick Stats Row */}
        <div className="flex items-center gap-1.5 pt-1 border-t">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="text-xs px-1.5 py-0.5 cursor-help hover:bg-accent transition-colors"
              >
                <Target className="h-3 w-3 mr-1" />
                {match_count.toLocaleString()}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs font-semibold">Matches: {match_count.toLocaleString()}</div>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className="text-xs px-1.5 py-0.5 cursor-help hover:bg-accent transition-colors"
              >
                <Zap className="h-3 w-3 mr-1" />
                {action_execution_count.toLocaleString()}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs font-semibold">Actions Executed: {action_execution_count.toLocaleString()}</div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
