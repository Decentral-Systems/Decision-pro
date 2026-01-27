/**
 * User Helper Utilities
 * Provides standardized access to user properties across the application
 */

export interface BaseUser {
  id?: string;
  user_id?: string;
  username?: string;
  email?: string;
  name?: string;
  roles?: string[];
}

/**
 * Get user ID with fallback logic
 * Handles both `id` and `user_id` properties for backwards compatibility
 * @param user - User object from auth context or API
 * @param fallback - Fallback value if no ID found (default: 'system')
 * @returns User ID string
 */
export function getUserId(user: BaseUser | null | undefined, fallback: string = 'system'): string {
  if (!user) return fallback;
  
  // Prefer user_id over id (API standard)
  return user.user_id || user.id || fallback;
}

/**
 * Get user display name with fallback logic
 * @param user - User object from auth context or API
 * @param fallback - Fallback value if no name found (default: 'Unknown User')
 * @returns User display name
 */
export function getUserDisplayName(user: BaseUser | null | undefined, fallback: string = 'Unknown User'): string {
  if (!user) return fallback;
  
  return user.name || user.username || user.email || fallback;
}

/**
 * Get user email with fallback
 * @param user - User object from auth context or API
 * @param fallback - Fallback value if no email found (default: 'no-email')
 * @returns User email
 */
export function getUserEmail(user: BaseUser | null | undefined, fallback: string = 'no-email'): string {
  if (!user) return fallback;
  
  return user.email || fallback;
}

/**
 * Check if user has a specific role
 * @param user - User object from auth context or API
 * @param role - Role to check
 * @returns True if user has the role
 */
export function hasRole(user: BaseUser | null | undefined, role: string): boolean {
  if (!user || !user.roles) return false;
  
  return user.roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 * @param user - User object from auth context or API
 * @param roles - Array of roles to check
 * @returns True if user has any of the roles
 */
export function hasAnyRole(user: BaseUser | null | undefined, roles: string[]): boolean {
  if (!user || !user.roles) return false;
  
  return roles.some(role => user.roles!.includes(role));
}

/**
 * Check if user has all of the specified roles
 * @param user - User object from auth context or API
 * @param roles - Array of roles to check
 * @returns True if user has all of the roles
 */
export function hasAllRoles(user: BaseUser | null | undefined, roles: string[]): boolean {
  if (!user || !user.roles) return false;
  
  return roles.every(role => user.roles!.includes(role));
}

/**
 * Get user initials for avatar display
 * @param user - User object from auth context or API
 * @param fallback - Fallback value if no name found (default: '?')
 * @returns User initials (e.g., "JD" for John Doe)
 */
export function getUserInitials(user: BaseUser | null | undefined, fallback: string = '?'): string {
  if (!user) return fallback;
  
  const name = user.name || user.username || '';
  
  if (!name) return fallback;
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Sanitize user object for logging (removes sensitive data)
 * @param user - User object from auth context or API
 * @returns Sanitized user object safe for logging
 */
export function sanitizeUserForLogging(user: BaseUser | null | undefined): Record<string, any> {
  if (!user) return { user_id: 'anonymous' };
  
  return {
    user_id: getUserId(user),
    username: user.username || 'unknown',
    roles: user.roles || [],
    // Explicitly exclude email and other PII from logs
  };
}
