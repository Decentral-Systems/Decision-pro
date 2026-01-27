/**
 * Audit Trail Logger
 * Implements comprehensive audit logging for credit scoring operations
 * Meets NBE regulatory compliance requirements (7-year retention)
 */

import { apiGatewayClient } from "@/lib/api/clients/api-gateway";

export type AuditEventType =
  | "credit_score_calculated"
  | "form_data_modified"
  | "compliance_violation"
  | "compliance_override"
  | "customer_data_accessed"
  | "model_version_changed"
  | "loan_terms_calculated"
  | "batch_processing_started"
  | "batch_processing_completed"
  | "export_generated"
  | "user_action";

export interface AuditEvent {
  event_type: AuditEventType;
  user_id?: string;
  correlation_id?: string;
  customer_id?: string;
  timestamp: string;
  action: string;
  details: Record<string, any>;
  before_value?: any;
  after_value?: any;
  compliance_violations?: Array<{
    rule: string;
    description: string;
    severity: string;
  }>;
  model_version?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditLogResponse {
  success: boolean;
  log_id?: string;
  correlation_id?: string;
  message?: string;
}

class AuditLogger {
  private correlationId: string | null = null;
  private userId: string | null = null;

  /**
   * Generate or get correlation ID for request tracking
   */
  generateCorrelationId(): string {
    if (!this.correlationId) {
      this.correlationId = `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.correlationId;
  }

  /**
   * Set correlation ID (typically from API response)
   */
  setCorrelationId(correlationId: string) {
    this.correlationId = correlationId;
  }

  /**
   * Get current correlation ID
   */
  getCorrelationId(): string | null {
    return this.correlationId;
  }

  /**
   * Set user ID for audit logging
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Log audit event to backend service
   */
  async logEvent(event: Partial<AuditEvent>): Promise<AuditLogResponse> {
    try {
      const correlationId = this.generateCorrelationId();
      const timestamp = new Date().toISOString();

      const auditEvent: AuditEvent = {
        event_type: event.event_type || "user_action",
        user_id: this.userId || event.user_id,
        correlation_id: correlationId,
        customer_id: event.customer_id,
        timestamp,
        action: event.action || "Unknown action",
        details: event.details || {},
        before_value: event.before_value,
        after_value: event.after_value,
        compliance_violations: event.compliance_violations,
        model_version: event.model_version,
        ip_address: typeof window !== "undefined" ? window.location.hostname : undefined,
        user_agent: typeof window !== "undefined" ? navigator.userAgent : undefined,
        ...event,
      };

      // Send to audit service API
      const response = await apiGatewayClient.post<AuditLogResponse>(
        "/api/v1/audit/events",
        auditEvent
      );

      return response;
    } catch (error: any) {
      // Log error but don't block user action
      console.error("Failed to log audit event:", error);
      
      // Return success to prevent blocking user workflow
      // Audit failures should be monitored but not block operations
      return {
        success: false,
        message: error?.message || "Audit logging failed",
      };
    }
  }

  /**
   * Log credit score calculation
   */
  async logCreditScoreCalculation(
    customerId: string,
    creditScore: number,
    riskCategory: string,
    modelVersion?: string,
    additionalData?: Record<string, any>
  ): Promise<AuditLogResponse> {
    return this.logEvent({
      event_type: "credit_score_calculated",
      customer_id: customerId,
      action: "Credit score calculated",
      details: {
        credit_score: creditScore,
        risk_category: riskCategory,
        model_version: modelVersion,
        ...additionalData,
      },
      model_version: modelVersion,
    });
  }

  /**
   * Log form data modification
   */
  async logFormModification(
    customerId: string,
    field: string,
    beforeValue: any,
    afterValue: any,
    reason?: string
  ): Promise<AuditLogResponse> {
    return this.logEvent({
      event_type: "form_data_modified",
      customer_id: customerId,
      action: `Form field modified: ${field}`,
      details: {
        field,
        reason,
      },
      before_value: beforeValue,
      after_value: afterValue,
    });
  }

  /**
   * Log compliance violation
   */
  async logComplianceViolation(
    customerId: string,
    violations: Array<{ rule: string; description: string; severity: string }>,
    loanAmount?: number,
    monthlyIncome?: number
  ): Promise<AuditLogResponse> {
    return this.logEvent({
      event_type: "compliance_violation",
      customer_id: customerId,
      action: "NBE compliance violation detected",
      details: {
        loan_amount: loanAmount,
        monthly_income: monthlyIncome,
        violation_count: violations.length,
      },
      compliance_violations: violations,
    });
  }

  /**
   * Log supervisor override
   */
  async logComplianceOverride(
    customerId: string,
    violations: Array<{ rule: string; description: string; severity: string }>,
    overrideReason: string,
    supervisorId?: string
  ): Promise<AuditLogResponse> {
    return this.logEvent({
      event_type: "compliance_override",
      customer_id: customerId,
      action: "Supervisor override for compliance violation",
      details: {
        override_reason: overrideReason,
        supervisor_id: supervisorId,
        violation_count: violations.length,
      },
      compliance_violations: violations,
    });
  }

  /**
   * Log customer data access
   */
  async logDataAccess(
    customerId: string,
    dataType: string,
    purpose: string
  ): Promise<AuditLogResponse> {
    return this.logEvent({
      event_type: "customer_data_accessed",
      customer_id: customerId,
      action: `Customer data accessed: ${dataType}`,
      details: {
        data_type: dataType,
        purpose,
      },
    });
  }

  /**
   * Log model version change
   */
  async logModelVersionChange(
    oldVersion: string,
    newVersion: string,
    reason?: string
  ): Promise<AuditLogResponse> {
    return this.logEvent({
      event_type: "model_version_changed",
      action: "Model version changed",
      details: {
        old_version: oldVersion,
        new_version: newVersion,
        reason,
      },
      before_value: oldVersion,
      after_value: newVersion,
    });
  }

  /**
   * Batch log multiple events (for performance)
   */
  async logBatchEvents(events: Partial<AuditEvent>[]): Promise<AuditLogResponse[]> {
    const promises = events.map((event) => this.logEvent(event));
    return Promise.all(promises);
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

/**
 * React Hook for audit logging with user context
 * Note: Import useAuth in the component where this hook is used, not here
 */
export function useAuditLogger() {
  // Note: User ID should be set in the component using this hook
  // This avoids importing React hooks in a utility file
  return {
    logEvent: auditLogger.logEvent.bind(auditLogger),
    logCreditScoreCalculation: auditLogger.logCreditScoreCalculation.bind(auditLogger),
    logFormModification: auditLogger.logFormModification.bind(auditLogger),
    logComplianceViolation: auditLogger.logComplianceViolation.bind(auditLogger),
    logComplianceOverride: auditLogger.logComplianceOverride.bind(auditLogger),
    logDataAccess: auditLogger.logDataAccess.bind(auditLogger),
    logModelVersionChange: auditLogger.logModelVersionChange.bind(auditLogger),
    generateCorrelationId: auditLogger.generateCorrelationId.bind(auditLogger),
    setCorrelationId: auditLogger.setCorrelationId.bind(auditLogger),
    getCorrelationId: auditLogger.getCorrelationId.bind(auditLogger),
    setUserId: auditLogger.setUserId.bind(auditLogger),
  };
}
