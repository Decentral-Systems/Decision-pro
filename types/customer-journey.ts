/**
 * Customer Journey Types
 * Type definitions for customer journey tracking and management
 */

export type JourneyStage =
  | "onboarding"
  | "assessment"
  | "recommendation"
  | "application"
  | "active"
  | "repayments";

export type JourneySubStage =
  // Onboarding
  | "onboarding.customer_created"
  // Assessment
  | "assessment.initial_completed"
  | "assessment.realtime_score_generated"
  | "assessment.realtime_default_update"
  | "assessment.realtime_risk_band_upgraded"
  | "assessment.realtime_risk_band_downgraded"
  // Recommendation
  | "recommendation.offer_generated"
  | "recommendation.offer_presented"
  | "recommendation.offer_modified"
  // Application
  | "application.loan_submitted"
  | "application.purchase_submitted"
  | "application.bnpl_submitted"
  | "application.under_review"
  | "application.approved"
  | "application.rejected"
  // Active
  | "active.on_track"
  | "active.early_warning"
  | "active.at_risk"
  | "active.restructured"
  // Repayments
  | "repayments.in_good_standing"
  | "repayments.late"
  | "repayments.in_collections"
  | "repayments.closed_normal"
  | "repayments.closed_default"
  | "repayments.closed_restructured";

export interface JourneyEvent {
  eventId: string;
  customerId: string;
  userId?: string | null;
  sessionId?: string | null;
  stage: JourneyStage;
  subStage: JourneySubStage;
  action: string;
  channel: string;
  timestamp: string;
  context: Record<string, any>;
}

export type CustomerJourneyTimelineItem = JourneyEvent;

export interface CustomerJourneyStageStats {
  stage: string;
  customerCount: number;
  percentageOfTotal: number;
  avgDurationFromPreviousStageSeconds?: number | null;
}

export interface CustomerJourneyFunnelEdge {
  fromStage: string;
  toStage: string;
  count: number;
  conversionRate: number;
}

export interface CustomerJourneyBottleneck {
  stage: string;
  description: string;
  impact: "low" | "medium" | "high";
  recommendation: string;
}

export interface CustomerJourneyInsights {
  stages: CustomerJourneyStageStats[];
  conversionFunnel: CustomerJourneyFunnelEdge[];
  bottlenecks: CustomerJourneyBottleneck[];
  metadata?: Record<string, any> | null;
}

export interface JourneyEventTrackedResponse {
  success: boolean;
  eventId: string;
  timestamp: string;
}

// Helper type for journey timeline filters
export interface JourneyTimelineFilters {
  from?: string;
  to?: string;
  limit?: number;
}

// Helper type for journey statistics filters
export interface JourneyStatisticsFilters {
  from?: string;
  to?: string;
  productType?: string;
  riskBand?: string;
  channel?: string;
}











