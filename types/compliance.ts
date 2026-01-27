/**
 * Compliance types
 */

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  rule_type: "salary_rule" | "interest_rate" | "loan_limit" | "term_limit" | "other";
  status: "compliant" | "non_compliant" | "warning";
  severity: "low" | "medium" | "high" | "critical";
  last_checked: string;
}

export interface ComplianceReport {
  report_id: string;
  generated_at: string;
  period_start: string;
  period_end: string;
  overall_status: "compliant" | "non_compliant" | "review_required";
  rules_checked: number;
  rules_passed: number;
  rules_failed: number;
  violations: ComplianceViolation[];
  recommendations: string[];
}

export interface ComplianceViolation {
  id: string;
  rule_id: string;
  rule_name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  loan_id?: string;
  customer_id?: string;
  detected_at: string;
  resolved_at?: string;
  status: "open" | "resolved" | "under_review";
}

export interface ComplianceMetrics {
  total_checks: number;
  compliance_rate: number;
  violations_count: number;
  critical_violations: number;
  resolution_rate: number;
  average_resolution_time_hours: number;
}

export interface ComplianceData {
  metrics: ComplianceMetrics;
  recent_violations: ComplianceViolation[];
  rules: ComplianceRule[];
  latest_report?: ComplianceReport;
}


