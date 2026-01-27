"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { safeFormatDate } from "@/lib/utils/format";
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle2,
  Clock
} from "lucide-react";

interface CustomerRealtimeDashboardProps {
  customerId: string;
  data?: any;
  isLoading?: boolean;
}

export function CustomerRealtimeDashboard({
  customerId,
  data,
  isLoading,
}: CustomerRealtimeDashboardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Real-Time Dashboard</CardTitle>
          <CardDescription>Loading customer data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Real-Time Dashboard</CardTitle>
          <CardDescription>No data available for {customerId}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please check the customer ID and try again.</p>
        </CardContent>
      </Card>
    );
  }

  // Extract data from various possible structures
  const customer = data.customer || data;
  const credit = data.credit || data;
  const risk = data.risk || data;
  const profile = data.profile || data;

  const creditScore = credit?.score || credit?.credit_score || customer?.credit_score || 0;
  const riskLevel = risk?.level || risk?.risk_level || customer?.risk_level || "unknown";
  const riskScore = risk?.score || risk?.risk_score || 0;
  const availableCredit = credit?.available_credit || credit?.availableCredit || 0;
  const lastScoreDate = credit?.last_score_date || credit?.lastScoreDate || customer?.last_score_date;
  const totalLoans = data?.loans?.length || 0;
  const activeLoans = data?.loans?.filter((l: any) => l.status === "active").length || 0;

  // Format risk level badge
  const getRiskBadgeVariant = (level: string) => {
    const lower = level.toLowerCase();
    if (lower.includes("low") || lower === "low") return "default";
    if (lower.includes("medium") || lower === "medium") return "secondary";
    if (lower.includes("high") || lower === "high") return "destructive";
    return "outline";
  };

  const getRiskColor = (level: string) => {
    const lower = level.toLowerCase();
    if (lower.includes("low") || lower === "low") return "text-green-600";
    if (lower.includes("medium") || lower === "medium") return "text-yellow-600";
    if (lower.includes("high") || lower === "high") return "text-red-600";
    return "text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Customer Real-Time Dashboard</CardTitle>
            <CardDescription>
              Live scoring data for {customerId}
            </CardDescription>
          </div>
          <Badge variant={getRiskBadgeVariant(riskLevel)}>
            {riskLevel.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Credit Score */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Credit Score</p>
                  <p className="text-2xl font-bold">{creditScore || "—"}</p>
                </div>
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              {creditScore >= 700 && (
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Good</span>
                </div>
              )}
              {creditScore < 600 && creditScore > 0 && (
                <div className="flex items-center gap-1 mt-2 text-red-600">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-xs">Needs Attention</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Score */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
                  <p className={`text-2xl font-bold ${getRiskColor(riskLevel)}`}>
                    {riskScore ? (riskScore * 100).toFixed(1) : "—"}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {riskLevel.replace("_", " ")}
              </p>
            </CardContent>
          </Card>

          {/* Available Credit */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Credit</p>
                  <p className="text-2xl font-bold">
                    {availableCredit ? `ETB ${availableCredit.toLocaleString()}` : "—"}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Active Loans */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Loans</p>
                  <p className="text-2xl font-bold">
                    {activeLoans} / {totalLoans}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {totalLoans} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Score History */}
          {credit?.history && Array.isArray(credit.history) && credit.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Score History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {credit.history.slice(0, 5).map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{entry.score || entry.credit_score}</p>
                        <p className="text-xs text-muted-foreground">
                          {safeFormatDate(entry.date, "MMM dd, yyyy", "N/A")}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {entry.risk_level || entry.riskLevel || "N/A"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Alerts */}
          {risk?.alerts && Array.isArray(risk.alerts) && risk.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {risk.alerts.slice(0, 5).map((alert: any, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-2 border rounded">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.type || "Alert"}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.message || alert.description || "No description"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Profile Summary */}
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {profile.full_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{profile.full_name}</span>
                    </div>
                  )}
                  {profile.phone_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{profile.phone_number}</span>
                    </div>
                  )}
                  {profile.region && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Region:</span>
                      <span className="font-medium">{profile.region}</span>
                    </div>
                  )}
                  {profile.monthly_income && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Income:</span>
                      <span className="font-medium">ETB {profile.monthly_income.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Last Score Date */}
          {lastScoreDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Last Score Update</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {safeFormatDate(lastScoreDate, "PPpp", "Unknown")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

