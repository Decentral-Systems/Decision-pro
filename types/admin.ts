/**
 * Admin types
 */

import { UserRole } from "./user";

export interface User {
  user_id: string;
  username: string;
  email: string;
  full_name?: string;
  roles: UserRole[];
  is_active: boolean;
  is_locked?: boolean;
  created_at: string;
  last_login?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  roles: UserRole[];
}

export interface UpdateUserRequest {
  email?: string;
  full_name?: string;
  roles?: UserRole[];
  is_active?: boolean;
}

export interface AuditLogEntry {
  id: string;
  user_id?: string;
  username?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  status: "success" | "failure" | "error";
}

export interface AuditLogFilters {
  start_date?: string;
  end_date?: string;
  user_id?: string;
  action?: string;
  resource_type?: string;
  status?: "success" | "failure" | "error";
  search?: string;
  correlation_id?: string;
}


