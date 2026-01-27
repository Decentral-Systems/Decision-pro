/**
 * Service Health Dashboard Component
 * Displays connectivity status for all required services
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Activity,
  Wifi,
  WifiOff,
  Server,
} from "lucide-react";
import { CircuitState } from "@/lib/utils/circuitBreaker";
import { getCircuitBreaker } from "@/lib/utils/circuitBreaker";
import { gracefulDegradationService } from "@/lib/services/graceful-degradation";
import { useApiHealth } from "@/lib/api/hooks/useApiHealth";
import { cn } from "@/lib/utils/cn";

interface ServiceInfo {
  name: string;
  displayName: string;
  endpoint: string;
  description: string;
  critical: boolean;
}

const SERVICES: ServiceInfo[] = [
  {
    name: "api-gateway",
    displayName: "API Gateway",
    endpoint: "/health",
    description: "Central API routing and authentication",
    critical: true,
  },
  {
    name: "credit-scoring",
    displayName: "Credit Scoring Service",
    endpoint: "/api/v1/credit-scoring/health",
    description: "ML model ensemble for credit scoring",
    critical: true,
  },
  {
    name: "customer-360",
    displayName: "Customer 360 Service",
    endpoint: "/api/intelligence/customer360",
    description: "Comprehensive customer data aggregation",
    critical: true,
  },
  {
    name: "rules-engine",
    displayName: "Rules Engine",
    endpoint: "/api/v1/product-rules/rules/evaluate",
    description: "Business rules and loan terms calculation",
    critical: true,
  },
  {
    name: "default-prediction",
    displayName: "Default Prediction Service",
    endpoint: "/api/v1/default-prediction/health",
    description: "Survival analysis and default risk prediction",
    critical: false,
  },
  {
    name: "audit",
    displayName: "Audit Service",
    endpoint: "/api/v1/audit/events",
    description: "Audit trail and compliance logging",
    critical: false,
  },
];

interface ServiceHealthDashboardProps {
  className?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ServiceHealthDashboard({
  className,
  showDetails = true,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: ServiceHealthDashboardProps) {
  const [serviceStatuses, setServiceStatuses] = useState<Map<string, any>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // General API health check
  const { isOnline: apiGatewayOnline, isChecking } = useApiHealth(autoRefresh, refreshInterval);

  const checkServiceHealth = async () => {
    setIsRefreshing(true);
    const statuses = new Map();

    for (const service of SERVICES) {
      const breaker = getCircuitBreaker(service.endpoint);
      const circuitState = breaker.getState();
      const failureCount = breaker.getFailureCount();
      const status = gracefulDegradationService.getServiceStatus(service.name);

      statuses.set(service.name, {
        ...status,
        circuitState,
        failureCount,
        hasFallback: gracefulDegradationService.hasFallback(service.name),
      });
    }

    setServiceStatuses(statuses);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkServiceHealth();

    if (autoRefresh) {
      const interval = setInterval(checkServiceHealth, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getStatusIcon = (status: any) => {
    if (status.circuitState === CircuitState.OPEN) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (status.circuitState === CircuitState.HALF_OPEN) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  };

  const getStatusBadge = (status: any) => {
    if (status.circuitState === CircuitState.OPEN) {
      return (
        <Badge variant="destructive" className="gap-1">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      );
    }
    if (status.circuitState === CircuitState.HALF_OPEN) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Activity className="h-3 w-3" />
          Recovering
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1 bg-green-500">
        <Wifi className="h-3 w-3" />
        Online
      </Badge>
    );
  };

  const criticalServices = SERVICES.filter((s) => s.critical);
  const criticalStatuses = Array.from(serviceStatuses.entries())
    .filter(([name]) => criticalServices.some((s) => s.name === name))
    .map(([, status]) => status);

  const allCriticalOnline = criticalStatuses.every(
    (s) => s.circuitState === CircuitState.CLOSED
  );
  const anyCriticalOffline = criticalStatuses.some(
    (s) => s.circuitState === CircuitState.OPEN
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Service Health Dashboard
            </CardTitle>
            <CardDescription>
              Real-time connectivity status for all backend services
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkServiceHealth}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <Alert variant={allCriticalOnline ? "default" : anyCriticalOffline ? "destructive" : "default"}>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">
                  {allCriticalOnline
                    ? "All Critical Services Online"
                    : anyCriticalOffline
                    ? "Critical Services Offline"
                    : "Services Recovering"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Last checked: {lastRefresh.toLocaleTimeString()}
                </div>
              </div>
              <Badge variant={allCriticalOnline ? "default" : "destructive"}>
                {criticalStatuses.filter((s) => s.circuitState === CircuitState.CLOSED).length} /{" "}
                {criticalStatuses.length} Online
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        {/* Service List */}
        {showDetails && (
          <div className="space-y-2">
            {SERVICES.map((service) => {
              const status = serviceStatuses.get(service.name);
              if (!status) return null;

              return (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{service.displayName}</span>
                        {service.critical && (
                          <Badge variant="outline" className="text-xs">
                            Critical
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {service.description}
                      </div>
                      {status.failureCount > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {status.failureCount} recent failure{status.failureCount !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(status)}
                    {status.hasFallback && (
                      <Badge variant="outline" className="text-xs">
                        Fallback Available
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Service Dependency Map */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-semibold mb-2">Service Dependencies</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>API Gateway → All Services</div>
              <div>Credit Scoring → Rules Engine, Customer 360</div>
              <div>Rules Engine → Customer 360</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
