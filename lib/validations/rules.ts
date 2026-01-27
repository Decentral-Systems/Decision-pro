/**
 * Zod validation schemas for Rules Engine
 */
import { z } from "zod";

// Common schemas
export const ruleOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "greater_than",
  "less_than",
  "greater_than_or_equal",
  "less_than_or_equal",
  "in",
  "not_in",
  "contains",
  "regex",
]);

export const logicalOperatorSchema = z.enum(["AND", "OR"]);

export const ruleConditionSchema = z.object({
  field: z.string().min(1, "Field is required"),
  operator: ruleOperatorSchema,
  value: z.any(),
});

export const ruleDefinitionSchema = z.object({
  rule_type: z.enum(["eligibility", "limit_calculation", "pricing", "approval"]),
  conditions: z.array(ruleConditionSchema).min(1, "At least one condition is required"),
  logical_operator: logicalOperatorSchema.default("AND"),
});

export const ruleActionSchema = z.object({
  type: z.enum(["set_limit", "adjust_interest_rate", "approve", "reject", "require_review"]),
  value: z.any().optional(),
  calculation: z.string().optional(),
  multiplier: z.number().optional(),
  condition: z.string().optional(),
});

// Custom Product Rule schemas
export const customProductRuleRequestSchema = z.object({
  rule_name: z.string().min(1, "Rule name is required").max(100),
  product_type: z.string().min(1, "Product type is required"),
  rule_description: z.string().optional(),
  rule_definition: ruleDefinitionSchema,
  rule_actions: z.array(ruleActionSchema).min(1, "At least one action is required"),
  evaluation_order: z.number().int().min(0).default(0),
  evaluation_scope: z.enum(["all", "eligibility", "scoring", "pricing", "approval"]).default("all"),
  is_active: z.boolean().default(true),
  is_mandatory: z.boolean().default(false),
  validation_script: z.string().optional(),
  error_message: z.string().optional(),
  depends_on: z.array(z.number().int().positive()).optional(),
});

// Workflow Rule schemas
export const workflowRuleConditionSchema = z.object({
  field: z.string().min(1, "Field is required"),
  operator: ruleOperatorSchema,
  value: z.any(),
});

export const workflowRuleConditionsSchema = z.object({
  conditions: z.array(workflowRuleConditionSchema).min(1, "At least one condition is required"),
  logical_operator: logicalOperatorSchema.default("AND"),
});

export const workflowRuleActionSchema = z.object({
  type: z.enum(["auto_approve", "auto_reject", "require_review", "notify", "limit_adjustment", "custom"]),
  parameters: z.record(z.any()),
});

export const workflowRuleActionsSchema = z.object({
  actions: z.array(workflowRuleActionSchema).min(1, "At least one action is required"),
});

export const workflowRuleRequestSchema = z.object({
  rule_name: z.string().min(1, "Rule name is required").max(100),
  rule_description: z.string().optional(),
  rule_conditions: workflowRuleConditionsSchema,
  rule_actions: workflowRuleActionsSchema,
  rule_type: z.enum(["approval", "rejection", "review", "notification", "limit_adjustment", "custom"]),
  product_type: z.string().optional(),
  customer_segment: z.string().optional(),
  priority: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  execution_order: z.number().int().min(0).default(0),
  validation_script: z.string().optional(),
  error_handling: z.enum(["continue", "stop", "rollback"]).default("continue"),
});

// Risk Appetite Configuration schemas
export const riskParametersSchema = z.object({
  max_credit_score_threshold: z.number().min(300).max(850).optional(),
  min_credit_score_threshold: z.number().min(300).max(850).optional(),
  max_default_probability: z.number().min(0).max(1).optional(),
  max_fraud_score: z.number().min(0).max(100).optional(),
  max_risk_score: z.number().min(0).max(1).optional(),
  risk_tolerance_level: z.enum(["conservative", "moderate", "aggressive"]).optional(),
});

export const limitAdjustmentsSchema = z.object({
  base_multiplier: z.number().min(0.1).max(2.0).default(1.0),
  risk_adjustment_factors: z.object({
    low_risk: z.number(),
    medium_risk: z.number(),
    high_risk: z.number(),
    critical_risk: z.number(),
  }),
  max_limit_etb: z.number().min(0).optional(),
  min_limit_etb: z.number().min(0).optional(),
});

export const interestRateAdjustmentsSchema = z.object({
  base_rate: z.number().min(0.12).max(0.25).default(0.15),
  risk_premiums: z.object({
    low_risk: z.number(),
    medium_risk: z.number(),
    high_risk: z.number(),
    critical_risk: z.number(),
  }),
});

export const approvalRulesSchema = z.object({
  auto_approve_conditions: z
    .object({
      min_credit_score: z.number().optional(),
      max_default_prob: z.number().optional(),
      max_fraud_score: z.number().optional(),
    })
    .optional(),
  auto_reject_conditions: z
    .object({
      max_credit_score: z.number().optional(),
      min_default_prob: z.number().optional(),
      min_fraud_score: z.number().optional(),
    })
    .optional(),
});

export const riskAppetiteConfigRequestSchema = z.object({
  config_name: z.string().min(1, "Config name is required").max(100),
  config_type: z.enum(["product", "segment", "global", "custom"]),
  product_type: z.string().optional(),
  customer_segment: z.string().optional(),
  risk_parameters: riskParametersSchema,
  limit_adjustments: limitAdjustmentsSchema,
  interest_rate_adjustments: interestRateAdjustmentsSchema.optional(),
  approval_rules: approvalRulesSchema.optional(),
  is_active: z.boolean().default(true),
  priority: z.number().int().min(0).default(0),
  description: z.string().optional(),
  depends_on: z.array(z.number().int().positive()).optional(),
});

// Approval Workflow Rule schemas
export const approvalLevelSchema = z.object({
  level: z.number().int().min(1),
  name: z.string().min(1, "Name is required"),
  min_credit_score: z.number().min(0).max(1000),
  max_loan_amount: z.number().min(0),
  required_approvers: z.number().int().min(0),
  auto_approve: z.boolean().optional(),
  auto_reject: z.boolean().optional(),
  escalation_threshold: z.number().min(0).max(1).optional(),
});

export const approvalWorkflowRuleRequestSchema = z.object({
  levels: z.array(approvalLevelSchema).min(1, "At least one approval level is required"),
});

// Rule Evaluation schemas
export const ruleEvaluationRequestSchema = z.object({
  product_type: z.string().min(1, "Product type is required"),
  application_data: z.record(z.any()),
  evaluation_scope: z.enum(["all", "eligibility", "scoring", "pricing", "approval"]).optional(),
});

export const workflowEvaluationRequestSchema = z.object({
  application_data: z.record(z.any()),
  product_type: z.string().optional(),
  customer_segment: z.string().optional(),
});

