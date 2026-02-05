"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Pause, 
  Play, 
  Square,
  Clock,
  AlertCircle
} from "lucide-react";
import { BatchProgress } from "@/lib/utils/batchProcessor";

interface BatchProgressIndicatorProps {
  progress: BatchProgress | null;
  isProcessing: boolean;
  isPaused?: boolean;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  className?: string;
}

/**
 * BatchProgressIndicator Component
 * 
 * Shows the progress of batch processing with stats and controls
 */
export function BatchProgressIndicator({
  progress,
  isProcessing,
  isPaused = false,
  onCancel,
  onPause,
  onResume,
  className,
}: BatchProgressIndicatorProps) {
  if (!progress && !isProcessing) {
    return null;
  }

  const formatTime = (ms: number | null): string => {
    if (ms === null) return '--:--';
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const displayProgress = progress || {
    total: 0,
    completed: 0,
    successful: 0,
    failed: 0,
    percentage: 0,
    estimatedTimeRemaining: null,
    currentChunk: 0,
    totalChunks: 0,
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isProcessing && !isPaused && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              {isPaused && (
                <Pause className="h-5 w-5 text-yellow-500" />
              )}
              {!isProcessing && displayProgress.completed === displayProgress.total && displayProgress.total > 0 && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              <span className="font-medium">
                {isProcessing 
                  ? isPaused 
                    ? "Processing Paused" 
                    : "Processing..." 
                  : displayProgress.total > 0 
                    ? "Processing Complete" 
                    : "Ready to Process"
                }
              </span>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2">
              {isProcessing && onPause && onResume && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isPaused ? onResume : onPause}
                >
                  {isPaused ? (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </>
                  )}
                </Button>
              )}
              {isProcessing && onCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  className="text-red-600 hover:text-red-700"
                >
                  <Square className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={displayProgress.percentage} 
              className="h-3"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {displayProgress.completed} of {displayProgress.total} items
              </span>
              <span>
                {Math.round(displayProgress.percentage)}%
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <StatItem
              icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
              label="Successful"
              value={displayProgress.successful}
              className="text-green-600"
            />
            <StatItem
              icon={<XCircle className="h-4 w-4 text-red-500" />}
              label="Failed"
              value={displayProgress.failed}
              className="text-red-600"
            />
            <StatItem
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              label="ETA"
              value={formatTime(displayProgress.estimatedTimeRemaining)}
              isText
            />
            <StatItem
              icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
              label="Chunk"
              value={`${displayProgress.currentChunk + 1}/${displayProgress.totalChunks}`}
              isText
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  className?: string;
  isText?: boolean;
}

function StatItem({ icon, label, value, className, isText }: StatItemProps) {
  return (
    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/30">
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <span className={cn(
        "font-semibold",
        isText ? "text-sm" : "text-lg",
        className
      )}>
        {value}
      </span>
    </div>
  );
}

/**
 * Compact progress indicator for inline use
 */
interface CompactProgressProps {
  progress: BatchProgress | null;
  isProcessing: boolean;
  className?: string;
}

export function CompactProgressIndicator({
  progress,
  isProcessing,
  className,
}: CompactProgressProps) {
  if (!progress && !isProcessing) {
    return null;
  }

  const displayProgress = progress || { percentage: 0, completed: 0, total: 0 };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
      <Progress value={displayProgress.percentage} className="flex-1 h-2" />
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {displayProgress.completed}/{displayProgress.total}
      </span>
    </div>
  );
}

export default BatchProgressIndicator;


