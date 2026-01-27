/**
 * Comprehensive Rule Validation
 * Validates rules for conflicts, field references, circular dependencies, and priorities
 */

import {
  CustomProductRule,
  CustomProductRuleRequest,
  WorkflowRule,
  WorkflowRuleRequest,
  RuleCondition,
  RuleDefinition,
  RuleAction,
} from "@/types/rules";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RuleConflict {
  ruleId1: number;
  ruleId2: number;
  conflictType: "contradictory" | "overlapping" | "priority";
  description: string;
}

/**
 * Validate a custom product rule request
 */
export function validateCustomProductRule(
  rule: CustomProductRuleRequest,
  existingRules?: CustomProductRule[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!rule.rule_name || rule.rule_name.trim().length === 0) {
    errors.push("Rule name is required");
  } else if (rule.rule_name.length > 100) {
    errors.push("Rule name must be 100 characters or less");
  }

  if (!rule.product_type || rule.product_type.trim().length === 0) {
    errors.push("Product type is required");
  }

  // Validate rule definition
  if (!rule.rule_definition) {
    errors.push("Rule definition is required");
  } else {
    const definitionErrors = validateRuleDefinition(rule.rule_definition);
    errors.push(...definitionErrors);
  }

  // Validate rule actions
  if (!rule.rule_actions || rule.rule_actions.length === 0) {
    errors.push("At least one action is required");
  } else {
    const actionErrors = validateRuleActions(rule.rule_actions);
    errors.push(...actionErrors);
  }

  // Validate evaluation order
  if (rule.evaluation_order !== undefined && rule.evaluation_order < 0) {
    errors.push("Evaluation order must be 0 or greater");
  }

  // Check for conflicts with existing rules
  if (existingRules) {
    const conflicts = detectRuleConflicts(rule, existingRules);
    if (conflicts.length > 0) {
      warnings.push(...conflicts.map(c => c.description));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate rule definition
 */
export function validateRuleDefinition(definition: RuleDefinition): string[] {
  const errors: string[] = [];

  if (!definition.rule_type) {
    errors.push("Rule type is required");
  }

  if (!definition.conditions || definition.conditions.length === 0) {
    errors.push("At least one condition is required");
  } else {
    definition.conditions.forEach((condition, index) => {
      if (!condition.field || condition.field.trim().length === 0) {
        errors.push(`Condition ${index + 1}: Field name is required`);
      }
      
      if (!condition.operator) {
        errors.push(`Condition ${index + 1}: Operator is required`);
      }
      
      if (condition.value === undefined || condition.value === null || condition.value === "") {
        errors.push(`Condition ${index + 1}: Value is required`);
      }
    });
  }

  if (!definition.logical_operator || !["AND", "OR"].includes(definition.logical_operator)) {
    errors.push("Logical operator must be AND or OR");
  }

  return errors;
}

/**
 * Validate rule actions
 */
export function validateRuleActions(actions: RuleAction[]): string[] {
  const errors: string[] = [];

  actions.forEach((action, index) => {
    if (!action.type) {
      errors.push(`Action ${index + 1}: Action type is required`);
    }

    // Validate action-specific requirements
    if (action.type === "set_limit") {
      if (!action.value && !action.calculation) {
        errors.push(`Action ${index + 1}: set_limit requires either value or calculation`);
      }
    }

    if (action.type === "adjust_interest_rate") {
      if (action.multiplier === undefined && !action.calculation) {
        errors.push(`Action ${index + 1}: adjust_interest_rate requires either multiplier or calculation`);
      }
    }
  });

  return errors;
}

/**
 * Detect conflicts between rules
 */
export function detectRuleConflicts(
  newRule: CustomProductRuleRequest | WorkflowRuleRequest,
  existingRules: (CustomProductRule | WorkflowRule)[]
): RuleConflict[] {
  const conflicts: RuleConflict[] = [];

  existingRules.forEach((existingRule) => {
    // Check for contradictory conditions
    const contradictory = detectContradictoryConditions(newRule, existingRule);
    if (contradictory) {
      conflicts.push({
        ruleId1: existingRule.id,
        ruleId2: -1, // New rule doesn't have ID yet
        conflictType: "contradictory",
        description: `Rule "${existingRule.rule_name}" has contradictory conditions with this rule`,
      });
    }

    // Check for overlapping conditions
    const overlapping = detectOverlappingConditions(newRule, existingRule);
    if (overlapping) {
      conflicts.push({
        ruleId1: existingRule.id,
        ruleId2: -1,
        conflictType: "overlapping",
        description: `Rule "${existingRule.rule_name}" has overlapping conditions with this rule`,
      });
    }
  });

  return conflicts;
}

/**
 * Detect contradictory conditions between two rules
 */
function detectContradictoryConditions(
  rule1: CustomProductRuleRequest | WorkflowRuleRequest,
  rule2: CustomProductRule | WorkflowRule
): boolean {
  const conditions1 = getRuleConditions(rule1);
  const conditions2 = getRuleConditions(rule2);

  // Check if any condition in rule1 contradicts a condition in rule2
  for (const cond1 of conditions1) {
    for (const cond2 of conditions2) {
      if (cond1.field === cond2.field) {
        // Same field, check if operators contradict
        if (areOperatorsContradictory(cond1.operator, cond1.value, cond2.operator, cond2.value)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Detect overlapping conditions
 */
function detectOverlappingConditions(
  rule1: CustomProductRuleRequest | WorkflowRuleRequest,
  rule2: CustomProductRule | WorkflowRule
): boolean {
  const conditions1 = getRuleConditions(rule1);
  const conditions2 = getRuleConditions(rule2);

  // Check if rules have same product type and similar conditions
  const productType1 = "product_type" in rule1 ? rule1.product_type : undefined;
  const productType2 = "product_type" in rule2 ? rule2.product_type : undefined;

  if (productType1 && productType2 && productType1 === productType2) {
    // Check if conditions overlap significantly
    const matchingFields = conditions1.filter(c1 => 
      conditions2.some(c2 => c1.field === c2.field)
    );
    
    return matchingFields.length >= 2; // At least 2 matching fields
  }

  return false;
}

/**
 * Check if two operators are contradictory
 */
function areOperatorsContradictory(
  op1: string,
  val1: any,
  op2: string,
  val2: any
): boolean {
  // Simple contradiction detection
  if (op1 === "equals" && op2 === "not_equals" && val1 === val2) {
    return true;
  }
  
  if (op1 === "not_equals" && op2 === "equals" && val1 === val2) {
    return true;
  }
  
  if (op1 === "greater_than" && op2 === "less_than" && Number(val1) >= Number(val2)) {
    return true;
  }
  
  if (op1 === "less_than" && op2 === "greater_than" && Number(val1) <= Number(val2)) {
    return true;
  }

  return false;
}

/**
 * Get conditions from a rule
 */
function getRuleConditions(
  rule: CustomProductRuleRequest | WorkflowRuleRequest | CustomProductRule | WorkflowRule
): RuleCondition[] {
  if ("rule_definition" in rule && rule.rule_definition) {
    return rule.rule_definition.conditions || [];
  }
  
  if ("rule_conditions" in rule && rule.rule_conditions) {
    return rule.rule_conditions.conditions || [];
  }
  
  return [];
}

/**
 * Validate field references exist
 */
export function validateFieldReferences(
  rule: CustomProductRuleRequest | WorkflowRuleRequest,
  availableFields: string[]
): string[] {
  const errors: string[] = [];
  const conditions = getRuleConditions(rule);

  conditions.forEach((condition, index) => {
    if (condition.field && !availableFields.includes(condition.field)) {
      errors.push(
        `Condition ${index + 1}: Field "${condition.field}" is not available. Available fields: ${availableFields.join(", ")}`
      );
    }
  });

  return errors;
}

/**
 * Validate rule priorities
 */
export function validateRulePriorities(
  rules: (CustomProductRule | WorkflowRule)[]
): string[] {
  const errors: string[] = [];
  const priorityMap = new Map<number, number[]>();

  rules.forEach((rule) => {
    const priority = "priority" in rule ? rule.priority : rule.evaluation_order;
    if (priorityMap.has(priority)) {
      priorityMap.get(priority)!.push(rule.id);
    } else {
      priorityMap.set(priority, [rule.id]);
    }
  });

  // Check for duplicate priorities
  priorityMap.forEach((ruleIds, priority) => {
    if (ruleIds.length > 1) {
      errors.push(
        `Multiple rules have the same priority ${priority}: ${ruleIds.join(", ")}`
      );
    }
  });

  return errors;
}

/**
 * Validate circular dependencies (for future use)
 */
export function validateCircularDependencies(
  rules: (CustomProductRule | WorkflowRule)[]
): string[] {
  const errors: string[] = [];
  // TODO: Implement circular dependency detection when dependency system is added
  return errors;
}

/**
 * Comprehensive validation for all rules
 */
export function validateAllRules(
  rules: (CustomProductRule | WorkflowRule)[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate priorities
  const priorityErrors = validateRulePriorities(rules);
  errors.push(...priorityErrors);

  // Check for conflicts between all rules
  rules.forEach((rule1, index1) => {
    rules.slice(index1 + 1).forEach((rule2) => {
      const conflicts = detectRuleConflicts(rule1 as any, [rule2]);
      if (conflicts.length > 0) {
        warnings.push(
          `Conflict between "${rule1.rule_name}" and "${rule2.rule_name}": ${conflicts[0].description}`
        );
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

