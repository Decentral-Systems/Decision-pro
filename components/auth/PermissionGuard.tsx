"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { hasPermission, hasAnyRole, Permission } from "@/lib/auth/permissions";
import { UserRole } from "@/types/user";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

interface PermissionGuardProps {
  permission?: Permission;
  roles?: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showError?: boolean;
}

/**
 * Permission Guard Component
 * Renders children only if user has required permission or role
 */
export function PermissionGuard({
  permission,
  roles,
  children,
  fallback,
  showError = true,
}: PermissionGuardProps) {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, don't show anything
  if (!isAuthenticated || !user) {
    return fallback || null;
  }

  // Check permission if specified
  if (permission && !hasPermission(user.roles, permission)) {
    return (
      fallback || (
        showError ? (
          <Alert variant="destructive" className="my-4">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to access this resource.
              <br />
              Required permission: <code className="text-xs">{permission}</code>
            </AlertDescription>
          </Alert>
        ) : null
      )
    );
  }

  // Check roles if specified
  if (roles && !hasAnyRole(user.roles, roles)) {
    return (
      fallback || (
        showError ? (
          <Alert variant="destructive" className="my-4">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have the required role to access this resource.
              <br />
              Required roles: <code className="text-xs">{roles.join(", ")}</code>
            </AlertDescription>
          </Alert>
        ) : null
      )
    );
  }

  // User has required permissions/roles, render children
  return <>{children}</>;
}

/**
 * Hook to check if user has permission
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return hasPermission(user.roles, permission);
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useRole(roles: UserRole[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return hasAnyRole(user.roles, roles);
}
