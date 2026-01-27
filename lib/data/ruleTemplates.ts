/**
 * Rule Templates Library
 * Pre-built rule templates for common scenarios
 */

import { CustomProductRuleRequest, WorkflowRuleRequest } from "@/types/rules";

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: "eligibility" | "pricing" | "approval" | "limit" | "workflow";
  ruleType: "product" | "workflow";
  template: CustomProductRuleRequest | WorkflowRuleRequest;
}

export const ruleTemplates: RuleTemplate[] = [
  {
    id: "high-income-eligibility",
    name: "High Income Eligibility",
    description: "Eligibility rule for high-income customers (monthly income > 50,000 ETB)",
    category: "eligibility",
    ruleType: "product",
    template: {
      rule_name: "High Income Eligibility",
      product_type: "PersonalLoan",
      rule_description: "Eligibility rule for high-income customers",
      rule_definition: {
        rule_type: "eligibility",
        conditions: [
          { field: "monthly_income", operator: "greater_than", value: 50000 },
          { field: "credit_score", operator: "greater_than_or_equal", value: 650 },
        ],
        logical_operator: "AND",
      },
      rule_actions: [
        { type: "approve", value: true },
      ],
      evaluation_order: 1,
      evaluation_scope: "eligibility",
      is_active: true,
      is_mandatory: false,
    },
  },
  {
    id: "low-risk-pricing",
    name: "Low Risk Pricing",
    description: "Pricing rule for low-risk customers (credit score > 750)",
    category: "pricing",
    ruleType: "product",
    template: {
      rule_name: "Low Risk Pricing",
      product_type: "PersonalLoan",
      rule_description: "Reduced interest rate for low-risk customers",
      rule_definition: {
        rule_type: "pricing",
        conditions: [
          { field: "credit_score", operator: "greater_than", value: 750 },
          { field: "default_probability", operator: "less_than", value: 0.1 },
        ],
        logical_operator: "AND",
      },
      rule_actions: [
        { type: "adjust_interest_rate", multiplier: 0.9 },
      ],
      evaluation_order: 2,
      evaluation_scope: "pricing",
      is_active: true,
      is_mandatory: false,
    },
  },
  {
    id: "auto-approval-workflow",
    name: "Auto Approval Workflow",
    description: "Automatically approve low-risk, small loans",
    category: "workflow",
    ruleType: "workflow",
    template: {
      rule_name: "Auto Approval Workflow",
      rule_description: "Automatically approve low-risk, small loans",
      rule_conditions: {
        conditions: [
          { field: "loan_amount", operator: "less_than", value: 100000 },
          { field: "credit_score", operator: "greater_than", value: 700 },
        ],
        logical_operator: "AND",
      },
      rule_actions: {
        actions: [
          { type: "auto_approve", parameters: {} },
        ],
      },
      rule_type: "approval",
      is_active: true,
      priority: 1,
    },
  },
  {
    id: "minimum-credit-score",
    name: "Minimum Credit Score",
    description: "Reject applications with credit score below 600",
    category: "eligibility",
    ruleType: "product",
    template: {
      rule_name: "Minimum Credit Score",
      product_type: "PersonalLoan",
      rule_description: "Reject applications with credit score below 600",
      rule_definition: {
        rule_type: "eligibility",
        conditions: [
          { field: "credit_score", operator: "less_than", value: 600 },
        ],
        logical_operator: "AND",
      },
      rule_actions: [
        { type: "reject", value: false },
      ],
      evaluation_order: 0,
      evaluation_scope: "eligibility",
      is_active: true,
      is_mandatory: true,
    },
  },
  {
    id: "large-loan-approval",
    name: "Large Loan Approval",
    description: "Require review for loans above 500,000 ETB",
    category: "approval",
    ruleType: "product",
    template: {
      rule_name: "Large Loan Approval",
      product_type: "PersonalLoan",
      rule_description: "Require review for large loans",
      rule_definition: {
        rule_type: "approval",
        conditions: [
          { field: "loan_amount", operator: "greater_than", value: 500000 },
        ],
        logical_operator: "AND",
      },
      rule_actions: [
        { type: "require_review", value: true },
      ],
      evaluation_order: 3,
      evaluation_scope: "approval",
      is_active: true,
      is_mandatory: false,
    },
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: RuleTemplate["category"]): RuleTemplate[] {
  return ruleTemplates.filter(t => t.category === category);
}

/**
 * Get templates by rule type
 */
export function getTemplatesByRuleType(ruleType: "product" | "workflow"): RuleTemplate[] {
  return ruleTemplates.filter(t => t.ruleType === ruleType);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): RuleTemplate | undefined {
  return ruleTemplates.find(t => t.id === id);
}

