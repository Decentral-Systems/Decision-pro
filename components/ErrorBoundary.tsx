"use client";
import React, { Component, ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, WifiOff, RefreshCw } from "lucide-react";
import { isNetworkError } from "@/lib/utils/network-aware-retry";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isNetworkError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private networkCheckInterval?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isNetworkError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Detect if this is a network error
    const isNetworkErr = isNetworkError(error);
    return { hasError: true, error, isNetworkError: isNetworkErr };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);

    // If it's a network error, set up network monitoring
    if (isNetworkError(error)) {
      this.startNetworkMonitoring();
    }
  }

  componentWillUnmount() {
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
    }
  }

  startNetworkMonitoring = () => {
    // Check network status periodically
    this.networkCheckInterval = setInterval(() => {
      if (
        typeof window !== "undefined" &&
        navigator.onLine &&
        this.state.isNetworkError
      ) {
        // Network recovered - allow retry
        console.log("[ErrorBoundary] Network recovered, allowing retry");
      }
    }, 2000);
  };

  handleRetry = () => {
    // For network errors, just reset state (don't force reload)
    // For other errors, reload the page
    if (this.state.isNetworkError) {
      // Check if network is back online
      if (typeof window !== "undefined" && navigator.onLine) {
        this.setState({
          hasError: false,
          error: undefined,
          isNetworkError: false,
        });
        if (this.networkCheckInterval) {
          clearInterval(this.networkCheckInterval);
        }
      } else {
        // Still offline - show message
        alert(
          "Network is still offline. Please check your connection and try again."
        );
      }
    } else {
      // Non-network error - reload page
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetworkErr = this.state.isNetworkError;
      const isOnline = typeof window !== "undefined" ? navigator.onLine : true;

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                {isNetworkErr ? (
                  <WifiOff className="h-5 w-5 text-destructive" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                <CardTitle>
                  {isNetworkErr ? "Network Error" : "Something went wrong"}
                </CardTitle>
              </div>
              <CardDescription>
                {isNetworkErr
                  ? "Unable to connect to the server. Please check your network connection."
                  : "An unexpected error occurred. Please try again."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="rounded-md bg-muted p-4">
                  <p className="font-mono text-sm text-muted-foreground">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {isNetworkErr && (
                <div className="rounded-md border border-border bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    {isOnline
                      ? "✓ Network connection detected. You can try again."
                      : "✗ No network connection. Please check your internet connection."}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  disabled={isNetworkErr && !isOnline}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {isNetworkErr ? "Try Again" : "Reload Page"}
                </Button>
                {!isNetworkErr && (
                  <Button
                    onClick={() => (window.location.href = "/dashboard")}
                    variant="outline"
                    className="flex-1"
                  >
                    Go to Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
