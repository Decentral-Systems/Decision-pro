"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSettingsHistory } from "@/lib/api/hooks/useSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export function SettingsHistory() {
  const [page, setPage] = React.useState(0);
  const limit = 20;
  const { data: historyData, isLoading, error } = useSettingsHistory({
    limit,
    offset: page * limit,
  });

  const history = historyData?.history || [];
  const total = historyData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !historyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settings History</CardTitle>
          <CardDescription>History of settings changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {error ? "Failed to load settings history" : "No history available"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings History</CardTitle>
        <CardDescription>
          History of settings changes with version tracking ({total} total entries)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No settings history available
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Changed At</TableHead>
                  <TableHead>Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Badge variant="outline">{entry.version}</Badge>
                    </TableCell>
                    <TableCell>{entry.changed_by || "System"}</TableCell>
                    <TableCell>
                      <div>
                        {entry.changed_at
                          ? new Date(entry.changed_at).toLocaleString()
                          : "N/A"}
                      </div>
                      {entry.changed_at && (
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.changed_at), {
                            addSuffix: true,
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.changes && entry.changes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {entry.changes.slice(0, 3).map((change: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {change}
                            </Badge>
                          ))}
                          {entry.changes.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{entry.changes.length - 3} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No changes listed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
