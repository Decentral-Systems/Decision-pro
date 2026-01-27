/**
 * Rule Import/Export Utilities
 * Handles JSON import/export, validation, and backup/restore
 */

import {
  CustomProductRule,
  CustomProductRuleRequest,
  WorkflowRule,
  WorkflowRuleRequest,
  RiskAppetiteConfig,
  RiskAppetiteConfigRequest,
} from "@/types/rules";
import { validateCustomProductRule } from "@/lib/validations/ruleValidation";

export interface ExportData {
  version: string;
  exportedAt: string;
  productRules: CustomProductRule[];
  workflowRules: WorkflowRule[];
  riskAppetiteConfigs: RiskAppetiteConfig[];
}

export interface ImportResult {
  success: boolean;
  imported: {
    productRules: number;
    workflowRules: number;
    riskAppetiteConfigs: number;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Export rules to JSON
 */
export function exportRulesToJSON(
  productRules: CustomProductRule[],
  workflowRules: WorkflowRule[],
  riskAppetiteConfigs: RiskAppetiteConfig[]
): string {
  const exportData: ExportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    productRules,
    workflowRules,
    riskAppetiteConfigs,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Download rules as JSON file
 */
export function downloadRulesAsFile(
  productRules: CustomProductRule[],
  workflowRules: WorkflowRule[],
  riskAppetiteConfigs: RiskAppetiteConfig[],
  filename: string = `rules-export-${new Date().toISOString().split("T")[0]}.json`
): void {
  const json = exportRulesToJSON(productRules, workflowRules, riskAppetiteConfigs);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate imported JSON
 */
export function parseImportedJSON(json: string): {
  valid: boolean;
  data?: ExportData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(json);
    
    // Validate structure
    if (!parsed.version || !parsed.exportedAt) {
      return {
        valid: false,
        error: "Invalid export format: missing version or exportedAt",
      };
    }

    const data: ExportData = {
      version: parsed.version,
      exportedAt: parsed.exportedAt,
      productRules: parsed.productRules || [],
      workflowRules: parsed.workflowRules || [],
      riskAppetiteConfigs: parsed.riskAppetiteConfigs || [],
    };

    return { valid: true, data };
  } catch (error: any) {
    return {
      valid: false,
      error: `Invalid JSON: ${error.message}`,
    };
  }
}

/**
 * Validate imported rules
 */
export function validateImportedRules(data: ExportData): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let productRulesCount = 0;
  let workflowRulesCount = 0;
  let riskAppetiteConfigsCount = 0;

  // Validate product rules
  data.productRules.forEach((rule, index) => {
    try {
      const validation = validateCustomProductRule(rule as any);
      if (validation.valid) {
        productRulesCount++;
      } else {
        errors.push(`Product Rule ${index + 1}: ${validation.errors.join(", ")}`);
      }
      if (validation.warnings.length > 0) {
        warnings.push(`Product Rule ${index + 1}: ${validation.warnings.join(", ")}`);
      }
    } catch (error: any) {
      errors.push(`Product Rule ${index + 1}: ${error.message}`);
    }
  });

  // Validate workflow rules (basic validation)
  data.workflowRules.forEach((rule, index) => {
    if (!rule.rule_name || !rule.rule_type) {
      errors.push(`Workflow Rule ${index + 1}: Missing required fields`);
    } else {
      workflowRulesCount++;
    }
  });

  // Validate risk appetite configs (basic validation)
  data.riskAppetiteConfigs.forEach((config, index) => {
    if (!config.config_name || !config.config_type) {
      errors.push(`Risk Appetite Config ${index + 1}: Missing required fields`);
    } else {
      riskAppetiteConfigsCount++;
    }
  });

  return {
    success: errors.length === 0,
    imported: {
      productRules: productRulesCount,
      workflowRules: workflowRulesCount,
      riskAppetiteConfigs: riskAppetiteConfigsCount,
    },
    errors,
    warnings,
  };
}

/**
 * Convert imported rules to request format
 */
export function convertToRequestFormat(data: ExportData): {
  productRules: CustomProductRuleRequest[];
  workflowRules: WorkflowRuleRequest[];
  riskAppetiteConfigs: RiskAppetiteConfigRequest[];
} {
  const productRules: CustomProductRuleRequest[] = data.productRules.map(rule => ({
    rule_name: rule.rule_name,
    product_type: rule.product_type,
    rule_description: rule.rule_description,
    rule_definition: rule.rule_definition,
    rule_actions: rule.rule_actions,
    evaluation_order: rule.evaluation_order,
    evaluation_scope: rule.evaluation_scope,
    is_active: rule.is_active,
    is_mandatory: rule.is_mandatory,
    validation_script: rule.validation_script,
    error_message: rule.error_message,
  }));

  const workflowRules: WorkflowRuleRequest[] = data.workflowRules.map(rule => ({
    rule_name: rule.rule_name,
    rule_description: rule.rule_description,
    rule_conditions: rule.rule_conditions,
    rule_actions: rule.rule_actions,
    rule_type: rule.rule_type,
    is_active: rule.is_active,
    priority: rule.priority,
  }));

  const riskAppetiteConfigs: RiskAppetiteConfigRequest[] = data.riskAppetiteConfigs.map(config => ({
    config_name: config.config_name,
    config_type: config.config_type,
    product_type: config.product_type,
    customer_segment: config.customer_segment,
    risk_parameters: config.risk_parameters,
    limit_adjustments: config.limit_adjustments,
    is_active: config.is_active,
    priority: config.priority,
  }));

  return {
    productRules,
    workflowRules,
    riskAppetiteConfigs,
  };
}

