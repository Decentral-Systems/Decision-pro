/**
 * Customer Timeline Component
 * Shows timeline of interactions, decisions, and events
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Timeline component - using simple div structure
import { 
  CreditCard, 
  FileText, 
  AlertTriangle, 
  User, 
  DollarSign,
  Calendar,
  Link as LinkIcon
} from "lucide-react";
import { safeFormatDate } from "@/lib/utils/format";
import Link from "next/link";

export interface TimelineEvent {
  id: string;
  type: "credit_decision" | "loan_application" | "payment" | "interaction" | "compliance" | "case";
  title: string;
  description: string;
  timestamp: string;
  status?: "approved" | "rejected" | "pending" | "completed";
  amount?: number;
  correlation_id?: string;
  linked_case_id?: string;
  linked_loan_id?: string;
}

interface CustomerTimelineProps {
  events: TimelineEvent[];
  customerId?: string;
}

export function CustomerTimeline({ events, customerId }: CustomerTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>No timeline events available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "credit_decision":
        return <CreditCard className="h-4 w-4" />;
      case "loan_application":
        return <FileText className="h-4 w-4" />;
      case "payment":
        return <DollarSign className="h-4 w-4" />;
      case "interaction":
        return <User className="h-4 w-4" />;
      case "compliance":
        return <AlertTriangle className="h-4 w-4" />;
      case "case":
        return <FileText className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      approved: "default",
      rejected: "destructive",
      pending: "secondary",
      completed: "default",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline of Interactions & Decisions</CardTitle>
        <CardDescription>Complete history of customer interactions and credit decisions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="flex gap-4 pb-4 border-b last:border-0">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  event.type === "credit_decision" ? "bg-blue-100 text-blue-600" :
                  event.type === "loan_application" ? "bg-green-100 text-green-600" :
                  event.type === "payment" ? "bg-purple-100 text-purple-600" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {getIcon(event.type)}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{event.title}</span>
                    {getStatusBadge(event.status)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {safeFormatDate(event.timestamp, "PPp", "Unknown")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {event.amount && (
                    <span>Amount: {event.amount.toLocaleString()} ETB</span>
                  )}
                  {event.correlation_id && (
                    <Badge variant="outline" className="text-xs font-mono">
                      ID: {event.correlation_id.substring(0, 8)}...
                    </Badge>
                  )}
                  {event.linked_case_id && (
                    <Link href={`/cases/${event.linked_case_id}`} className="flex items-center gap-1 hover:underline">
                      <LinkIcon className="h-3 w-3" />
                      Case {event.linked_case_id}
                    </Link>
                  )}
                  {event.linked_loan_id && (
                    <Link href={`/loans/${event.linked_loan_id}`} className="flex items-center gap-1 hover:underline">
                      <LinkIcon className="h-3 w-3" />
                      Loan {event.linked_loan_id}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

