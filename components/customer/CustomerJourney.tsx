"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Customer360Data } from "@/lib/utils/customer360Transform";
import { formatDate } from "@/lib/utils/customer360Transform";
import { CheckCircle2, Circle, Clock, TrendingUp } from "lucide-react";

interface CustomerJourneyProps {
  data: Customer360Data;
}

const JOURNEY_STAGES = [
  { id: "awareness", name: "Awareness", description: "Customer becomes aware of services" },
  { id: "consideration", name: "Consideration", description: "Customer evaluates options" },
  { id: "application", name: "Application", description: "Customer submits application" },
  { id: "approval", name: "Approval", description: "Application reviewed and approved" },
  { id: "onboarding", name: "Onboarding", description: "Customer completes setup" },
  { id: "active", name: "Active", description: "Customer actively using services" },
  { id: "advocacy", name: "Advocacy", description: "Customer recommends to others" },
];

export function CustomerJourney({ data }: CustomerJourneyProps) {
  const journey = data.journey || {};
  const engagement = data.engagement || {};

  const currentStage = journey.current_stage || journey.stage || "awareness";
  const engagementScore = engagement.score || engagement.engagement_score || 0;
  const touchpoints = engagement.touchpoints || journey.total_touchpoints || 0;
  const milestones = journey.milestones || [];
  const lastInteraction = journey.last_interaction_date || engagement.last_interaction || "";

  const currentStageIndex = JOURNEY_STAGES.findIndex((s) => s.id === currentStage) || 0;
  const journeyProgress = ((currentStageIndex + 1) / JOURNEY_STAGES.length) * 100;

  return (
    <div className="space-y-6">
      {/* Journey Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {currentStage.replace(/_/g, " ")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Journey stage</p>
            <div className="mt-2">
              <Progress value={journeyProgress} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Engagement Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(engagementScore * 100).toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of 100</p>
            <div className="mt-2">
              <Progress value={engagementScore * 100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Touchpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{touchpoints}</div>
            <p className="text-xs text-muted-foreground mt-1">Customer interactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Journey Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Journey Stages</CardTitle>
          <CardDescription>Progress through the customer journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {JOURNEY_STAGES.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const isUpcoming = index > currentStageIndex;

              return (
                <div key={stage.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : isCurrent ? (
                      <Clock className="h-6 w-6 text-blue-600" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                    {index < JOURNEY_STAGES.length - 1 && (
                      <div
                        className={`w-0.5 h-8 mt-1 ${
                          isCompleted ? "bg-green-600" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{stage.name}</h4>
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                      </div>
                      {isCurrent && (
                        <Badge variant="default">Current</Badge>
                      )}
                      {isCompleted && (
                        <Badge variant="secondary">Completed</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Journey Milestones */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Journey Milestones</CardTitle>
            <CardDescription>Key events and achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones
                .sort((a: any, b: any) => {
                  const dateA = new Date(a.date || a.timestamp || 0).getTime();
                  const dateB = new Date(b.date || b.timestamp || 0).getTime();
                  return dateB - dateA;
                })
                .map((milestone: any, index: number) => (
                  <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{milestone.title || milestone.name || "Milestone"}</h4>
                        {milestone.date && (
                          <span className="text-sm text-muted-foreground">
                            {formatDate(milestone.date || milestone.timestamp)}
                          </span>
                        )}
                      </div>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                      )}
                      {milestone.stage && (
                        <Badge variant="outline" className="mt-2">
                          {milestone.stage}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engagement Details */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Details</CardTitle>
          <CardDescription>Customer interaction and engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Interaction</span>
              <span className="font-medium">
                {lastInteraction ? formatDate(lastInteraction) : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Engagement Level</span>
              <Badge
                variant={
                  engagementScore >= 0.8 ? "default" : engagementScore >= 0.6 ? "secondary" : "outline"
                }
              >
                {engagementScore >= 0.8
                  ? "High"
                  : engagementScore >= 0.6
                  ? "Medium"
                  : "Low"}
              </Badge>
            </div>
            {engagement.points && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reward Points</span>
                <span className="font-medium">{engagement.points}</span>
              </div>
            )}
            {engagement.level && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Gamification Level</span>
                <Badge variant="outline">{engagement.level}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



