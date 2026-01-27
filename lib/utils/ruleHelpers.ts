/**
 * Utility functions for Rules Engine
 */
import { RuleCondition, RuleOperator, RuleAction, WorkflowRuleCondition } from "@/types/rules";

/**
 * Format a rule condition for display
 */
export function formatRuleCondition(condition: RuleCondition | WorkflowRuleCondition): string {
  const { field, operator, value } = condition;
  const operatorSymbol = getOperatorSymbol(operator);
  
  if (operator === "in" || operator === "not_in") {
    const valueList = Array.isArray(value) ? value.join(", ") : String(value);
    return `${field} ${operatorSymbol} [${valueList}]`;
  }
  
  return `${field} ${operatorSymbol} ${formatValue(value)}`;
}

/**
 * Get operator symbol for display
 */
export function getOperatorSymbol(operator: RuleOperator): string {
  const symbols: Record<RuleOperator, string> = {
    equals: "==",
    not_equals: "!=",
    greater_than: ">",
    less_than: "<",
    greater_than_or_equal: ">=",
    less_than_or_equal: "<=",
    in: "in",
    not_in: "not in",
    contains: "contains",
    regex: "matches",
  };
  return symbols[operator] || operator;
}

/**
 * Format value for display
 */
export function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (Array.isArray(value)) {
    return `[${value.map(formatValue).join(", ")}]`;
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Parse rule condition from string (for editing)
 */
export function parseRuleCondition(conditionString: string): RuleCondition | null {
  // This is a simplified parser - in production, you might want a more robust solution
  try {
    // Example: "credit_score >= 700"
    const match = conditionString.match(/^(\w+)\s*(>=|<=|==|!=|>|<|in|not in|contains|matches)\s*(.+)$/);
    if (match) {
      const [, field, operator, valueStr] = match;
      let value: any = valueStr.trim();
      
      // Try to parse as number
      if (!isNaN(Number(value))) {
        value = Number(value);
      } else if (value === "true" || value === "false") {
        value = value === "true";
      } else if (value.startsWith("[") && value.endsWith("]")) {
        // Array value
        value = value.slice(1, -1).split(",").map((v) => v.trim());
      } else {
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, "");
      }
      
      const operatorMap: Record<string, RuleOperator> = {
        ">=": "greater_than_or_equal",
        "<=": "less_than_or_equal",
        "==": "equals",
        "!=": "not_equals",
        ">": "greater_than",
        "<": "less_than",
        "in": "in",
        "not in": "not_in",
        "contains": "contains",
        "matches": "regex",
      };
      
      return {
        field,
        operator: operatorMap[operator] || "equals",
        value,
      };
    }
  } catch (error) {
    console.error("Failed to parse rule condition:", error);
  }
  return null;
}

/**
 * Validate rule conditions
 * @deprecated Use validateRuleDefinition from ruleValidation.ts instead
 */
export function validateRuleConditions(conditions: RuleCondition[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!conditions || conditions.length === 0) {
    errors.push("At least one condition is required");
    return { valid: false, errors };
  }
  
  conditions.forEach((condition, index) => {
    if (!condition.field) {
      errors.push(`Condition ${index + 1}: Field is required`);
    }
    if (!condition.operator) {
      errors.push(`Condition ${index + 1}: Operator is required`);
    }
    if (condition.value === undefined || condition.value === null) {
      errors.push(`Condition ${index + 1}: Value is required`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate rule actions
 */
export function validateRuleActions(actions: RuleAction[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!actions || actions.length === 0) {
    errors.push("At least one action is required");
    return { valid: false, errors };
  }
  
  actions.forEach((action, index) => {
    if (!action.type) {
      errors.push(`Action ${index + 1}: Type is required`);
    }
    
    // Validate action-specific requirements
    if (action.type === "set_limit" && !action.value && !action.calculation) {
      errors.push(`Action ${index + 1}: set_limit requires either value or calculation`);
    }
    if (action.type === "adjust_interest_rate" && action.adjustment === undefined) {
      errors.push(`Action ${index + 1}: adjust_interest_rate requires adjustment value`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}

/**
 * Get available operators for a field type
 */
export function getOperatorsForField(fieldType: "string" | "number" | "boolean" | "array"): RuleOperator[] {
  const allOperators: RuleOperator[] = [
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
  ];
  
  switch (fieldType) {
    case "number":
      return [
        "equals",
        "not_equals",
        "greater_than",
        "less_than",
        "greater_than_or_equal",
        "less_than_or_equal",
        "in",
        "not_in",
      ];
    case "string":
      return ["equals", "not_equals", "contains", "regex", "in", "not_in"];
    case "boolean":
      return ["equals", "not_equals"];
    case "array":
      return ["in", "not_in", "contains"];
    default:
      return allOperators;
  }
}

/**
 * Get available actions for a rule type
 */
export function getActionsForRuleType(
  ruleType: "eligibility" | "limit_calculation" | "pricing" | "approval"
): string[] {
  const actionMap: Record<string, string[]> = {
    eligibility: ["approve", "reject", "require_review"],
    limit_calculation: ["set_limit"],
    pricing: ["adjust_interest_rate"],
    approval: ["approve", "reject", "require_review"],
  };
  
  return actionMap[ruleType] || [];
}

/**
 * Format rule evaluation result for display
 */
export function formatRuleEvaluationResult(result: any): string {
  if (!result) return "No result";
  
  if (result.matched) {
    const actions = result.actions_executed || [];
    const actionDescriptions = actions.map((action: any) => {
      if (action.type === "set_limit") {
        return `Set limit to ${action.parameters?.value || action.value}`;
      }
      if (action.type === "adjust_interest_rate") {
        return `Adjust interest rate by ${action.parameters?.adjustment || action.adjustment}`;
      }
      return action.type;
    });
    
    return `Matched - Actions: ${actionDescriptions.join(", ")}`;
  }
  
  return "Not matched";
}

/**
 * Get field type from field name (heuristic)
 */
export function inferFieldType(fieldName: string): "string" | "number" | "boolean" | "array" {
  const lowerField = fieldName.toLowerCase();
  
  if (lowerField.includes("score") || lowerField.includes("amount") || lowerField.includes("income") || lowerField.includes("rate") || lowerField.includes("probability")) {
    return "number";
  }
  
  if (lowerField.includes("is_") || lowerField.includes("has_") || lowerField.startsWith("active") || lowerField.startsWith("enabled")) {
    return "boolean";
  }
  
  if (lowerField.includes("list") || lowerField.includes("array") || lowerField.includes("tags")) {
    return "array";
  }
  
  return "string";
}

/**
 * Clone a rule (for duplication)
 */
export function cloneRule<T extends { id?: number; rule_name?: string; config_name?: string }>(rule: T): Omit<T, "id"> {
  const cloned = { ...rule };
  delete (cloned as any).id;
  
  if (cloned.rule_name) {
    cloned.rule_name = `${cloned.rule_name} (Copy)`;
  }
  if (cloned.config_name) {
    cloned.config_name = `${cloned.config_name} (Copy)`;
  }
  
  return cloned;
}

