/**
 * User and authentication types
 */

export enum UserRole {
  ADMIN = "admin",
  ANALYST = "analyst",
  CREDIT_ANALYST = "credit_analyst",
  LOAN_OFFICER = "loan_officer",
  SENIOR_CREDIT_ANALYST = "senior_credit_analyst",
  RISK_MANAGER = "risk_manager",
  SENIOR_RISK_MANAGER = "senior_risk_manager",
  COMPLIANCE_OFFICER = "compliance_officer",
  CUSTOMER_SERVICE = "customer_service",
  READ_ONLY = "read_only",
  SYSTEM = "system",
}

export interface User {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
  roles: UserRole[];
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user_info: User;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  accessToken: string;
}

