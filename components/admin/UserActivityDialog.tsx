"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserActivity } from "@/lib/api/hooks/useUsers";
import { AuditLogsTable } from "./AuditLogsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface UserActivityDialogProps {
  userId: string | null;
  userName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserActivityDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: UserActivityDialogProps) {
  const { data, isLoading, error } = useUserActivity(userId, {
    page: 1,
    page_size: 20,
  });

  if (!userId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>User Activity Log</DialogTitle>
          <DialogDescription>
            Activity history for {userName || `User ${userId}`}
            {data?.total !== undefined && ` (${data.total} total entries)`}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[calc(90vh-100px)] overflow-y-auto">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load user activity. Please try again later.
              </AlertDescription>
            </Alert>
          )}
          {!isLoading && !error && data && (
            <div className="space-y-4">
              {data.items && data.items.length > 0 ? (
                <AuditLogsTable data={data.items} isLoading={false} />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No activity found for this user.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          {!isLoading && !error && !data && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  User activity data is not available.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}



