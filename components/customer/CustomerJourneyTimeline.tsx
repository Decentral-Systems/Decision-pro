"use client";
import React, { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerJourneyTimeline } from "@/lib/api/hooks/useCustomerJourney";
import type { CustomerJourneyTimelineItem, JourneyStage } from "@/types/customer-journey";
import { formatDate } from "@/lib/utils/customer360Transform";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  UserPlus,
  FileSearch,
  Gift,
  FileText,
  Activity,
  CreditCard,
  Calendar,
  X
} from "lucide-react";

interface CustomerJourneyTimelineProps {
  customerId: string;
}

// Map stages to icons and colors
const STAGE_ICONS: Record<JourneyStage, React.ComponentType<{ className?: string }>> = {
  onboarding: UserPlus,
  assessment: FileSearch,
  recommendation: Gift,
  application: FileText,
  active: Activity,
  repayments: CreditCard,
};

const STAGE_COLORS: Record<JourneyStage, string> = {
  onboarding: "bg-blue-500",
  assessment: "bg-purple-500",
  recommendation: "bg-yellow-500",
  application: "bg-green-500",
  active: "bg-orange-500",
  repayments: "bg-indigo-500",
};

// Human-readable labels for sub-stages
function getSubStageLabel(subStage: string): string {
  return subStage
    .split(".")
    .pop()!
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Get summary from context
function getEventSummary(event: CustomerJourneyTimelineItem): string {
  const { context, subStage } = event;
  
  // Onboarding
  if (subStage === "onboarding.customer_created") {
    const completeness = context.profile_completeness_percentage;
    return completeness ? `Profile ${completeness.toFixed(0)}% complete` : "Customer created";
  }
  
  // Assessment
  if (subStage === "assessment.initial_completed") {
    const score = context.credit_score;
    const risk = context.risk_level;
    return score ? `Score: ${score.toFixed(0)}, Risk: ${risk || "N/A"}` : "Initial assessment completed";
  }
  
  // Application
  if (subStage.startsWith("application.")) {
    if (subStage === "application.loan_submitted") {
      const amount = context.loan_amount;
      const term = context.loan_term_months;
      return amount ? `Loan: ${amount.toLocaleString()} ETB / ${term || "N/A"} months` : "Loan application submitted";
    }
    if (subStage === "application.approved") {
      return `Approved - ${context.decision || "Loan approved"}`;
    }
    if (subStage === "application.rejected") {
      return `Rejected - ${context.decision || "Application rejected"}`;
    }
    if (subStage === "application.purchase_submitted") {
      const amount = context.transaction_amount;
      return amount ? `Purchase: ${amount.toLocaleString()} ETB` : "Purchase initiated";
    }
    if (subStage === "application.bnpl_submitted") {
      const amount = context.transaction_amount;
      return amount ? `BNPL: ${amount.toLocaleString()} ETB` : "BNPL initiated";
    }
  }
  
  // Repayments
  if (subStage.startsWith("repayments.")) {
    if (subStage === "repayments.in_good_standing") {
      return "All payments on time";
    }
    if (subStage === "repayments.late") {
      const amount = context.payment_amount;
      return amount ? `Late payment: ${amount.toLocaleString()} ETB` : "Payment late";
    }
    if (subStage === "repayments.in_collections") {
      return "Account in collections";
    }
    if (subStage === "repayments.closed_normal") {
      return "Loan fully repaid";
    }
    if (subStage === "repayments.closed_default") {
      return "Loan defaulted";
    }
  }
  
  // Default fallback
  return getSubStageLabel(subStage);
}

export function CustomerJourneyTimeline({ customerId }: CustomerJourneyTimelineProps) {
  const [dateFilter, setDateFilter] = useState<{ from?: string; to?: string }>({});
  const { data: events, isLoading, error, refetch } = useCustomerJourneyTimeline(
    customerId,
    dateFilter.from || dateFilter.to ? {
      from_date: dateFilter.from,
      to_date: dateFilter.to,
    } : undefined
  );
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Journey Timeline</CardTitle>
            <CardDescription>Complete journey history for this customer</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Journey Timeline</CardTitle>
          <CardDescription>Complete journey history for this customer</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Error loading journey timeline: {error instanceof Error ? error.message : "Unknown error"}</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Journey Timeline</CardTitle>
          <CardDescription>Complete journey history for this customer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No journey events yet for this customer</p>
            <p className="text-sm mt-2">Journey events will appear here as the customer progresses through the platform</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group events by stage
  const eventsByStage = events.reduce((acc, event) => {
    if (!acc[event.stage]) {
      acc[event.stage] = [];
    }
    acc[event.stage].push(event);
    return acc;
  }, {} as Record<JourneyStage, CustomerJourneyTimelineItem[]>);

  // Define canonical stage order
  const stageOrder: JourneyStage[] = [
    "onboarding",
    "assessment",
    "recommendation",
    "application",
    "active",
    "repayments",
  ];

  // Get current stage from latest event
  const latestEvent = events[events.length - 1];
  const currentStage = latestEvent?.stage || "onboarding";

  const clearDateFilter = () => {
    setDateFilter({});
  };

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer Journey Timeline</CardTitle>
              <CardDescription>Complete journey history for this customer</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFilter.from || ""}
                  onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateFilter.to || ""}
                  onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                />
              </div>
            </div>
            {(dateFilter.from || dateFilter.to) && (
              <Button variant="ghost" size="sm" onClick={clearDateFilter}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Stage Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Journey Stage</CardTitle>
          <CardDescription>Latest milestone in customer journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {latestEvent && (() => {
              const Icon = STAGE_ICONS[latestEvent.stage];
              return Icon ? <Icon className={`h-8 w-8 ${STAGE_COLORS[latestEvent.stage].replace('bg-', 'text-')}`} /> : null;
            })()}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge className={STAGE_COLORS[currentStage]}>{currentStage}</Badge>
                <span className="text-sm text-muted-foreground">
                  {getSubStageLabel(latestEvent.subStage)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Last milestone: {formatDate(latestEvent.timestamp)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline by Stage */}
      <Card>
        <CardHeader>
          <CardTitle>Journey Timeline</CardTitle>
          <CardDescription>Complete event history grouped by journey stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {stageOrder.map((stage) => {
              const stageEvents = eventsByStage[stage] || [];
              if (stageEvents.length === 0) {
                return null;
              }

              const Icon = STAGE_ICONS[stage];
              const isCurrentStage = stage === currentStage;

              return (
                <div key={stage} className="relative">
                  {/* Stage Header */}
                  <div className="flex items-center gap-3 mb-4">
                    {Icon && (
                      <div className={`p-2 rounded-lg ${STAGE_COLORS[stage]} bg-opacity-10`}>
                        <Icon className={`h-5 w-5 ${STAGE_COLORS[stage].replace('bg-', 'text-')}`} />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold capitalize">{stage}</h3>
                        <Badge variant="outline">{stageEvents.length} event{stageEvents.length !== 1 ? 's' : ''}</Badge>
                        {isCurrentStage && <Badge variant="default">Current</Badge>}
                      </div>
                    </div>
                  </div>

                  {/* Stage Events */}
                  <div className="ml-12 space-y-4">
                    {stageEvents.map((event, index) => {
                      const isExpanded = expandedEvents.has(event.eventId);
                      const isLastInStage = index === stageEvents.length - 1;

                      return (
                        <div key={event.eventId} className="relative">
                          {/* Timeline connector */}
                          {!isLastInStage && (
                            <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border" />
                          )}

                          {/* Event dot */}
                          <div className="flex items-start gap-4">
                            <div className={`relative z-10 mt-1 ${STAGE_COLORS[stage]} w-3 h-3 rounded-full`} />

                            {/* Event content */}
                            <div className="flex-1 pb-4">
                              <button
                                onClick={() => toggleEventExpanded(event.eventId)}
                                className="text-left w-full hover:bg-muted/50 rounded-lg p-3 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium">{getSubStageLabel(event.subStage)}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {event.channel}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {getEventSummary(event)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(event.timestamp)}
                                    </p>
                                  </div>
                                  <div className="ml-4">
                                    {isExpanded ? (
                                      <Circle className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              </button>

                              {/* Expanded details */}
                              {isExpanded && (
                                <div className="mt-2 ml-3 p-4 bg-muted/30 rounded-lg border">
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground">Action:</span>
                                      <p className="text-sm">{event.action}</p>
                                    </div>
                                    {event.userId && (
                                      <div>
                                        <span className="text-xs font-medium text-muted-foreground">User:</span>
                                        <p className="text-sm">{event.userId}</p>
                                      </div>
                                    )}
                                    {Object.keys(event.context).length > 0 && (
                                      <div>
                                        <span className="text-xs font-medium text-muted-foreground">Context:</span>
                                        <pre className="text-xs mt-1 p-2 bg-background rounded overflow-auto max-h-48">
                                          {JSON.stringify(event.context, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

