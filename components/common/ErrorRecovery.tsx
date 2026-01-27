"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, AlertTriangle, XCircle, Info, LifeBuoy, Trash2, User, Wifi } from "lucide-react";
import { cn } from "@/lib/utils/index";
import { SupportTicketDialog, SupportTicketContext } from "./SupportTicketDialog";

export interface ErrorRecoveryProps {
  error: Error | { message?: string; statusCode?: number; correlationId?: string } | null;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
  variant?: "default" | "destructive" | "warning";
  title?: string;
  showDetails?: boolean;
}

export function ErrorRecovery({
  error,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
  variant = "default",
  title,
  showDetails = false,
}: ErrorRecoveryProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [supportTicketOpen, setSupportTicketOpen] = useState(false);

  if (!error) return null;

  const errorMessage = error.message || "An unexpected error occurred";
  const statusCode = (error as any).statusCode;
  const correlationId = (error as any).correlationId;

  const getErrorType = () => {
    if (statusCode) {
      if (statusCode >= 500) return "server";
      if (statusCode === 404) return "not_found";
      if (statusCode === 403) return "forbidden";
      if (statusCode === 401) return "unauthorized";
      if (statusCode >= 400) return "client";
    }
    return "unknown";
  };

  const getErrorIcon = () => {
    const errorType = getErrorType();
    switch (errorType) {
      case "server":
        return <XCircle className="h-4 w-4" />;
      case "not_found":
      case "forbidden":
      case "unauthorized":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getErrorVariant = (): "default" | "destructive" => {
    if (variant === "destructive") return "destructive";
    const errorType = getErrorType();
    if (errorType === "server" || errorType === "unknown") return "destructive";
    return "default";
  };

  const getErrorMessage = () => {
    const errorType = getErrorType();
    switch (errorType) {
      case "server":
        return "Server error. Please try again in a moment.";
      case "not_found":
        return "The requested resource was not found.";
      case "forbidden":
        return "You don't have permission to access this resource.";
      case "unauthorized":
        return "Authentication required. Please log in again.";
      case "client":
        return "Invalid request. Please check your input and try again.";
      default:
        return errorMessage;
    }
  };

  const calculateRetryDelay = (attempt: number) => {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * Math.pow(2, attempt), 30000);
  };

  const handleRetry = async () => {
    if (!onRetry || retryCount >= maxRetries) return;

    setIsRetrying(true);
    
    // Exponential backoff delay
    const delay = calculateRetryDelay(retryCount);
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const canRetry = onRetry && retryCount < maxRetries;

  // Build support ticket context
  const supportContext: SupportTicketContext = {
    correlationId,
    errorDetails: errorMessage,
    errorMessage: errorMessage,
    statusCode,
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof window !== "undefined" ? navigator.userAgent : undefined,
  };

  // Get error-specific recovery suggestions
  const getRecoverySuggestions = () => {
    const errorType = getErrorType();
    const suggestions: Array<{ action: string; description: string; icon: React.ReactNode; onClick?: () => void }> = [];

    switch (errorType) {
      case "server":
        suggestions.push(
          {
            action: "Clear Cache",
            description: "Clear browser cache and cookies",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: () => {
              if (typeof window !== "undefined" && window.caches) {
                caches.keys().then((names) => {
                  names.forEach((name) => caches.delete(name));
                });
              }
            },
          },
          {
            action: "Refresh Session",
            description: "Refresh your authentication session",
            icon: <RefreshCw className="h-4 w-4" />,
            onClick: () => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            },
          }
        );
        break;
      case "unauthorized":
        suggestions.push({
          action: "Re-authenticate",
          description: "Please log in again",
          icon: <User className="h-4 w-4" />,
          onClick: () => {
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
          },
        });
        break;
      case "not_found":
        suggestions.push({
          action: "Go to Home",
          description: "Return to the main page",
          icon: <Info className="h-4 w-4" />,
          onClick: () => {
            if (typeof window !== "undefined") {
              window.location.href = "/";
            }
          },
        });
        break;
      default:
        suggestions.push(
          {
            action: "Check Network",
            description: "Verify your internet connection",
            icon: <Wifi className="h-4 w-4" />,
          },
          {
            action: "Refresh Page",
            description: "Reload the current page",
            icon: <RefreshCw className="h-4 w-4" />,
            onClick: () => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            },
          }
        );
    }

    return suggestions;
  };

  const recoverySuggestions = getRecoverySuggestions();

  return (
    <>
      <Alert variant={getErrorVariant()}>
        <div className="flex items-start gap-4">
          {getErrorIcon()}
          <div className="flex-1 space-y-2">
            <AlertTitle>{title || "Error"}</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>{getErrorMessage()}</p>
                
                {showDetails && (
                  <div className="text-xs space-y-1 mt-2">
                    {statusCode && (
                      <div>
                        <span className="font-medium">Status Code:</span> {statusCode}
                      </div>
                    )}
                    {correlationId && (
                      <div>
                        <span className="font-medium">Correlation ID:</span> {correlationId}
                      </div>
                    )}
                    {retryCount > 0 && (
                      <div>
                        <span className="font-medium">Retry Attempt:</span> {retryCount} / {maxRetries}
                      </div>
                    )}
                  </div>
                )}

                {/* Recovery Suggestions */}
                {recoverySuggestions.length > 0 && (
                  <div className="pt-2 border-t mt-3">
                    <div className="text-xs font-medium mb-2">Recovery Options:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {recoverySuggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={suggestion.onClick}
                          className="justify-start text-xs h-auto py-2"
                        >
                          {suggestion.icon}
                          <span className="ml-2 text-left">
                            <div className="font-medium">{suggestion.action}</div>
                            <div className="text-xs text-muted-foreground">
                              {suggestion.description}
                            </div>
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {canRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      disabled={isRetrying}
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", isRetrying && "animate-spin")} />
                      {isRetrying ? "Retrying..." : `Retry${retryCount > 0 ? ` (${retryCount}/${maxRetries})` : ""}`}
                    </Button>
                  )}

                  {retryCount >= maxRetries && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSupportTicketOpen(true)}
                    >
                      <LifeBuoy className="h-4 w-4 mr-2" />
                      Report Issue
                    </Button>
                  )}

                  {retryCount > 0 && retryCount < maxRetries && (
                    <span className="text-xs text-muted-foreground">
                      Next retry in {Math.round(calculateRetryDelay(retryCount) / 1000)}s
                    </span>
                  )}
                </div>

                {retryCount >= maxRetries && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      Maximum retry attempts reached. Please report this issue or contact support.
                    </p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Support Ticket Dialog */}
      <SupportTicketDialog
        open={supportTicketOpen}
        onOpenChange={setSupportTicketOpen}
        context={supportContext}
      />
    </>
  );
}

