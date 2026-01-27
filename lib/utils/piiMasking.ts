/**
 * PII Masking Utilities
 * Masks personally identifiable information based on user role
 */

/**
 * Mask phone number - shows only last 4 digits
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "N/A";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length <= 4) return "***-****";
  return `***-***-${cleaned.slice(-4)}`;
}

/**
 * Mask email - shows only first character and domain
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "N/A";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const firstChar = local[0];
  const maskedLocal = `${firstChar}${"*".repeat(Math.max(local.length - 1, 3))}`;
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask ID number - shows only last 4 digits
 */
export function maskIdNumber(id: string | null | undefined): string {
  if (!id) return "N/A";
  if (id.length <= 4) return "****";
  return `****${id.slice(-4)}`;
}

/**
 * Mask bank account - shows only last 4 digits
 */
export function maskBankAccount(account: string | null | undefined): string {
  if (!account) return "N/A";
  if (account.length <= 4) return "****";
  return `****${account.slice(-4)}`;
}

/**
 * Mask address - shows only city and country
 */
export function maskAddress(address: string | null | undefined): string {
  if (!address) return "N/A";
  // Simple masking - in production, parse and mask street details
  const parts = address.split(",");
  if (parts.length <= 2) return "***, " + address;
  return `***, ${parts.slice(-2).join(", ")}`;
}

/**
 * Check if user role should see unmasked PII
 */
export function shouldShowUnmaskedPII(userRole?: string): boolean {
  // Only admin, credit_analyst, and compliance_officer should see unmasked PII
  const rolesWithAccess = ["admin", "credit_analyst", "compliance_officer"];
  return userRole ? rolesWithAccess.includes(userRole.toLowerCase()) : false;
}

