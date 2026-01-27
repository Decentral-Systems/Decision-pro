/**
 * Customer Alerts Banner Component
 * Shows critical alerts like overdue payments, KYC expiry, etc.
 */

"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Shield, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { safeFormatDate } from "@/lib/utils/format";

export interface CustomerAlert {
  type: "overdue" | "kyc_expiry" | "compliance" | "risk" | "payment_due";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  dueDate?: string;
  amount?: number;
  actionUrl?: string;
}

interface CustomerAlertsBannerProps {
  alerts: CustomerAlert[];
  customerId?: string;
}

export function CustomerAlertsBanner({ alerts, customerId }: CustomerAlertsBannerProps) {
  if (!alerts || alerts.length === 0) return null;

  const criticalAlerts = alerts.filter(a => a.severity === "critical" || a.severity === "high");
  const otherAlerts = alerts.filter(a => a.severity !== "critical" && a.severity !== "high");

  const getIcon = (type: string) => {
    switch (type) {
      case "overdue":
      case "payment_due":
        return <DollarSign className="h-4 w-4" />;
      case "kyc_expiry":
        return <Shield className="h-4 w-4" />;
      case "compliance":
        return <AlertTriangle className="h-4 w-4" />;
      case "risk":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getVariant = (severity: string): "destructive" | "default" => {
    return severity === "critical" || severity === "high" ? "destructive" : "default";
  };

  return (
    <div className="space-y-2">
      {criticalAlerts.map((alert, idx) => (
        <Alert key={idx} variant={getVariant(alert.severity)}>
          {getIcon(alert.type)}
          <AlertTitle className="flex items-center gap-2">
            {alert.title}
            <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
              {alert.severity}
            </Badge>
          </AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              <p>{alert.description}</p>
              {alert.dueDate && (
                <p className="text-xs">
                  Due: {safeFormatDate(alert.dueDate, "PPp", "Unknown")}
                </p>
              )}
              {alert.amount && (
                <p className="text-xs font-medium">
                  Amount: {formatCurrency(alert.amount)}
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      ))}
      {otherAlerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Additional Alerts ({otherAlerts.length})</AlertTitle>
          <AlertDescription>
            {otherAlerts.map((alert, idx) => (
              <div key={idx} className="text-sm">
                {alert.title}: {alert.description}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}



