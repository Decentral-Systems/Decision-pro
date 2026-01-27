/**
 * Correlation ID Display Component
 * Shows current correlation ID for traceability
 */

"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCorrelationId, formatCorrelationId } from "@/lib/utils/correlationId";
import { useToast } from "@/hooks/use-toast";

interface CorrelationIdDisplayProps {
  variant?: "default" | "compact" | "minimal";
  showLabel?: boolean;
  copyable?: boolean;
  className?: string;
}

export function CorrelationIdDisplay({
  variant = "default",
  showLabel = true,
  copyable = true,
  className = "",
}: CorrelationIdDisplayProps) {
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const updateCorrelationId = () => {
      setCorrelationId(getCorrelationId());
    };

    updateCorrelationId();
    // Update every second to catch changes
    const interval = setInterval(updateCorrelationId, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!correlationId) {
    return null;
  }

  const handleCopy = async () => {
    if (!correlationId) return;

    try {
      await navigator.clipboard.writeText(correlationId);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Correlation ID copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy correlation ID:", error);
      toast({
        title: "Error",
        description: "Failed to copy correlation ID",
        variant: "destructive",
      });
    }
  };

  const displayId = expanded ? correlationId : formatCorrelationId(correlationId);

  if (variant === "minimal") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`text-xs text-muted-foreground ${className}`}>
              {displayId}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Correlation ID: {correlationId}</p>
            {copyable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="mt-2"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy
              </Button>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && (
          <span className="text-xs text-muted-foreground">Correlation ID:</span>
        )}
        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
          {displayId}
        </code>
        {copyable && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-6 w-6 p-0"
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setExpanded(!expanded)}
          className="h-6 w-6 p-0"
        >
          {expanded ? (
            <EyeOff className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground">
          Correlation ID:
        </span>
      )}
      <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded border">
        {displayId}
      </code>
      {copyable && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="h-8"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy full correlation ID</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setExpanded(!expanded)}
        className="h-8"
      >
        {expanded ? (
          <>
            <EyeOff className="h-4 w-4 mr-1" />
            Collapse
          </>
        ) : (
          <>
            <Eye className="h-4 w-4 mr-1" />
            Expand
          </>
        )}
      </Button>
    </div>
  );
}



