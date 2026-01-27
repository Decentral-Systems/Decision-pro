/**
 * Role-Based Access Control (RBAC) Permissions
 */
import { UserRole } from "@/types/user";

export enum Permission {
  // Credit scoring permissions
  CREATE_CREDIT_SCORE = "create_credit_score",
  VIEW_CREDIT_SCORE = "view_credit_score",
  APPROVE_LOAN = "approve_loan",
  REJECT_LOAN = "reject_loan",

  // Default prediction permissions
  VIEW_DEFAULT_PREDICTION = "view_default_prediction",
  MANAGE_RISK_MODELS = "manage_risk_models",

  // Administrative permissions
  MANAGE_USERS = "manage_users",
  VIEW_AUDIT_LOGS = "view_audit_logs",
  MANAGE_SYSTEM_CONFIG = "manage_system_config",

  // Compliance permissions
  VIEW_COMPLIANCE_REPORTS = "view_compliance_reports",
  EXPORT_DATA = "export_data",
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.CREDIT_ANALYST]: [
    Permission.CREATE_CREDIT_SCORE,
    Permission.VIEW_CREDIT_SCORE,
    Permission.APPROVE_LOAN,
    Permission.REJECT_LOAN,
    Permission.VIEW_DEFAULT_PREDICTION,
  ],
  [UserRole.RISK_MANAGER]: [
    Permission.VIEW_CREDIT_SCORE,
    Permission.VIEW_DEFAULT_PREDICTION,
    Permission.MANAGE_RISK_MODELS,
    Permission.VIEW_COMPLIANCE_REPORTS,
  ],
  [UserRole.COMPLIANCE_OFFICER]: [
    Permission.VIEW_CREDIT_SCORE,
    Permission.VIEW_DEFAULT_PREDICTION,
    Permission.VIEW_COMPLIANCE_REPORTS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.EXPORT_DATA,
  ],
  [UserRole.CUSTOMER_SERVICE]: [Permission.VIEW_CREDIT_SCORE],
  [UserRole.READ_ONLY]: [
    Permission.VIEW_CREDIT_SCORE,
    Permission.VIEW_DEFAULT_PREDICTION,
  ],
};

export function hasPermission(
  userRoles: UserRole[],
  permission: Permission
): boolean {
  return userRoles.some((role) =>
    ROLE_PERMISSIONS[role]?.includes(permission)
  );
}

export function hasAnyRole(userRoles: UserRole[], allowedRoles: UserRole[]): boolean {
  return userRoles.some((role) => allowedRoles.includes(role));
}









