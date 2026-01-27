"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeFormatDate } from "@/lib/utils/format";
import { AlertTriangle } from "lucide-react";

interface ScoreEntry {
  customer_id: string;
  score: number;
  risk_category: "low" | "medium" | "high" | "very_high";
  timestamp: string;
  loan_amount?: number;
  correlation_id?: string;
  is_anomaly?: boolean;
  latency?: number;
}

interface ScoreFeedProps {
  scores: ScoreEntry[];
  maxEntries?: number;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "low":
      return "default";
    case "medium":
      return "secondary";
    case "high":
      return "destructive";
    case "very_high":
      return "destructive";
    default:
      return "outline";
  }
};

export function ScoreFeed({ scores, maxEntries = 50 }: ScoreFeedProps) {
  const displayedScores = scores.slice(0, maxEntries);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Score Feed</CardTitle>
        <CardDescription>Real-time credit scoring activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {displayedScores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scores yet. Scores will appear here as they are processed.
            </div>
          ) : (
            displayedScores.map((score, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{score.customer_id}</span>
                      <Badge variant={getRiskColor(score.risk_category) as any}>
                        {score.risk_category}
                      </Badge>
                      {score.is_anomaly && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Anomaly
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {safeFormatDate(score.timestamp, "PPp", "Unknown time")}
                      {score.loan_amount && (
                        <span className="ml-2">• Loan: {score.loan_amount.toLocaleString()} ETB</span>
                      )}
                      {score.correlation_id && (
                        <Badge variant="outline" className="ml-2 text-xs font-mono">
                          ID: {score.correlation_id.substring(0, 8)}...
                        </Badge>
                      )}
                      {score.latency && (
                        <span className="ml-2 text-xs">• {score.latency}ms</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold">{score.score}</div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}


