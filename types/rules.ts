/**
 * Rules Engine Type Definitions
 * TypeScript interfaces for all rule types matching backend Pydantic models
 */

// Common types
export type RuleOperator = 
  | "equals" 
  | "not_equals" 
  | "greater_than" 
  | "less_than" 
  | "greater_than_or_equal" 
  | "less_than_or_equal" 
  | "in" 
  | "not_in" 
  | "contains" 
  | "regex";

export type LogicalOperator = "AND" | "OR";

// Custom Product Rules
export interface RuleCondition {
  field: string;
  operator: RuleOperator;
  value: any;
}

export interface ConditionGroup {
  id?: string;
  conditions: RuleCondition[];
  logical_operator: LogicalOperator;
  groups?: ConditionGroup[]; // Nested groups
}

export interface RuleDefinition {
  rule_type: "eligibility" | "limit_calculation" | "pricing" | "approval";
  conditions: RuleCondition[];
  logical_operator: LogicalOperator;
  condition_groups?: ConditionGroup[]; // Support for nested condition groups
}

export interface RuleAction {
  type: "set_limit" | "adjust_interest_rate" | "approve" | "reject" | "require_review";
  value?: any;
  calculation?: string;
  multiplier?: number;
  condition?: string;
}

export interface CustomProductRule {
  id: number;
  rule_name: string;
  product_type: string;
  rule_description?: string;
  rule_definition: RuleDefinition;
  rule_actions: RuleAction[];
  evaluation_order: number;
  evaluation_scope: "all" | "eligibility" | "scoring" | "pricing" | "approval";
  is_active: boolean;
  is_mandatory: boolean;
  validation_script?: string;
  error_message?: string;
  evaluation_count: number;
  match_count: number;
  action_execution_count: number;
  created_at: string;
  updated_at: string;
}

export interface CustomProductRuleRequest {
  rule_name: string;
  product_type: string;
  rule_description?: string;
  rule_definition: RuleDefinition;
  rule_actions: RuleAction[];
  evaluation_order?: number;
  evaluation_scope?: "all" | "eligibility" | "scoring" | "pricing" | "approval";
  is_active?: boolean;
  is_mandatory?: boolean;
  validation_script?: string;
  error_message?: string;
}

// Workflow Automation Rules
export interface WorkflowRuleCondition {
  field: string;
  operator: RuleOperator;
  value: any;
}

export interface WorkflowRuleConditions {
  conditions: WorkflowRuleCondition[];
  logical_operator: LogicalOperator;
}

export interface WorkflowRuleAction {
  type: "auto_approve" | "auto_reject" | "require_review" | "notify" | "limit_adjustment" | "custom";
  parameters: Record<string, any>;
}

export interface WorkflowRuleActions {
  actions: WorkflowRuleAction[];
}

export interface WorkflowRule {
  id: number;
  rule_name: string;
  rule_description?: string;
  rule_conditions: WorkflowRuleConditions;
  rule_actions: WorkflowRuleActions;
  rule_type: "approval" | "rejection" | "review" | "notification" | "limit_adjustment" | "custom";
  product_type?: string;
  customer_segment?: string;
  priority: number;
  is_active: boolean;
  execution_order: number;
  validation_script?: string;
  error_handling: "continue" | "stop" | "rollback";
  execution_count: number;
  success_count: number;
  failure_count: number;
  last_executed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRuleRequest {
  rule_name: string;
  rule_description?: string;
  rule_conditions: WorkflowRuleConditions;
  rule_actions: WorkflowRuleActions;
  rule_type: "approval" | "rejection" | "review" | "notification" | "limit_adjustment" | "custom";
  product_type?: string;
  customer_segment?: string;
  priority?: number;
  is_active?: boolean;
  execution_order?: number;
  validation_script?: string;
  error_handling?: "continue" | "stop" | "rollback";
}

// Risk Appetite Configuration
export interface RiskParameters {
  max_credit_score_threshold?: number;
  min_credit_score_threshold?: number;
  max_default_probability?: number;
  max_fraud_score?: number;
  max_risk_score?: number;
  risk_tolerance_level?: "conservative" | "moderate" | "aggressive";
}

export interface LimitAdjustments {
  base_multiplier: number;
  risk_adjustment_factors: {
    low_risk: number;
    medium_risk: number;
    high_risk: number;
    critical_risk: number;
  };
  max_limit_etb?: number;
  min_limit_etb?: number;
}

export interface InterestRateAdjustments {
  base_rate: number;
  risk_premiums: {
    low_risk: number;
    medium_risk: number;
    high_risk: number;
    critical_risk: number;
  };
}

export interface ApprovalRules {
  auto_approve_conditions?: {
    min_credit_score?: number;
    max_default_prob?: number;
    max_fraud_score?: number;
  };
  auto_reject_conditions?: {
    max_credit_score?: number;
    min_default_prob?: number;
    min_fraud_score?: number;
  };
}

export interface RiskAppetiteConfig {
  id: number;
  config_name: string;
  config_type: "product" | "segment" | "global" | "custom";
  product_type?: string;
  customer_segment?: string;
  risk_parameters: RiskParameters;
  limit_adjustments: LimitAdjustments;
  interest_rate_adjustments?: InterestRateAdjustments;
  approval_rules?: ApprovalRules;
  is_active: boolean;
  priority: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface RiskAppetiteConfigRequest {
  config_name: string;
  config_type: "product" | "segment" | "global" | "custom";
  product_type?: string;
  customer_segment?: string;
  risk_parameters: RiskParameters;
  limit_adjustments: LimitAdjustments;
  interest_rate_adjustments?: InterestRateAdjustments;
  approval_rules?: ApprovalRules;
  is_active?: boolean;
  priority?: number;
  description?: string;
}

// Approval Workflow Rules
export interface ApprovalLevel {
  level: number;
  name: string;
  min_credit_score: number;
  max_loan_amount: number;
  required_approvers: number;
  auto_approve?: boolean;
  auto_reject?: boolean;
  escalation_threshold?: number;
}

export interface ApprovalWorkflowRule {
  levels: ApprovalLevel[];
}

export interface ApprovalWorkflowRuleRequest {
  levels: ApprovalLevel[];
}

// Rule Evaluation
export interface RuleEvaluationRequest {
  product_type: string;
  application_data: Record<string, any>;
  evaluation_scope?: "all" | "eligibility" | "scoring" | "pricing" | "approval";
}

export interface WorkflowEvaluationRequest {
  application_data: Record<string, any>;
  product_type?: string;
  customer_segment?: string;
}

export interface RuleEvaluationResult {
  rule_id: number;
  rule_name: string;
  matched: boolean;
  matched_conditions: string[];
  actions_executed: Array<{
    type: string;
    parameters?: Record<string, any>;
  }>;
  result?: Record<string, any>;
}

export interface RuleEvaluationResponse {
  evaluated_rules: RuleEvaluationResult[];
  matched_rules: RuleEvaluationResult[];
  final_result: {
    limits?: Record<string, any>;
    pricing?: Record<string, any>;
    decision?: string;
    flags?: string[];
  };
}

// API Response types
export interface RulesListResponse<T> {
  rules?: T[];
  configs?: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

