"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCustomerActivityLog } from "@/lib/api/hooks/useCustomers";
import { Activity, Calendar, User, FileText, CreditCard, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils/customer360Transform";

interface CustomerActivityTimelineProps {
  customerId: string;
}

export function CustomerActivityTimeline({ customerId }: CustomerActivityTimelineProps) {
  const { data, isLoading, error } = useCustomerActivityLog(customerId);

  const activities = data?.items || [];

  const getActivityIcon = (activityType: string) => {
    switch (activityType?.toLowerCase()) {
      case "credit_score":
      case "credit_assessment":
        return <CreditCard className="h-4 w-4" />;
      case "note":
      case "comment":
        return <FileText className="h-4 w-4" />;
      case "status_change":
        return <CheckCircle className="h-4 w-4" />;
      case "error":
      case "warning":
        return <AlertCircle className="h-4 w-4" />;
      case "login":
      case "access":
        return <User className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType?.toLowerCase()) {
      case "credit_score":
      case "credit_assessment":
        return "bg-blue-500";
      case "note":
      case "comment":
        return "bg-green-500";
      case "status_change":
        return "bg-purple-500";
      case "error":
      case "warning":
        return "bg-red-500";
      case "login":
      case "access":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading activity log...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading activity log: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
        <CardDescription>Recent activities and interactions for this customer</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity recorded yet.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-6">
              {activities.map((activity: any, index: number) => {
                const activityType = activity.type || activity.activity_type || "general";
                const icon = getActivityIcon(activityType);
                const color = getActivityColor(activityType);
                
                return (
                  <div key={activity.id || index} className="relative flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full ${color} text-white`}>
                      {icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{activity.title || activity.description || "Activity"}</h4>
                          <Badge variant="outline" className="text-xs">
                            {activityType}
                          </Badge>
                        </div>
                        {activity.timestamp && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(activity.timestamp)}
                          </div>
                        )}
                      </div>
                      
                      {activity.description && (
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      )}
                      
                      {activity.details && (
                        <div className="mt-2 rounded-md bg-muted p-3 text-sm">
                          <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(activity.details, null, 2)}</pre>
                        </div>
                      )}
                      
                      {activity.user && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {activity.user}
                        </div>
                      )}
                      
                      {activity.status && (
                        <div className="flex items-center gap-2 mt-2">
                          {activity.status === "success" && (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Success
                            </Badge>
                          )}
                          {activity.status === "pending" && (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {activity.status === "failed" && (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

