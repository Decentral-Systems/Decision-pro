/**
 * Settings types
 */

export interface SystemSettings {
  auto_refresh_interval: number;
  theme: "light" | "dark" | "system";
  language: string;
  date_format: string;
  timezone: string;
}

export interface APISettings {
  api_timeout: number;
  retry_attempts: number;
  cache_enabled: boolean;
  cache_ttl: number;
}

export interface SecuritySettings {
  session_timeout: number;
  password_min_length: number;
  require_mfa: boolean;
  audit_log_retention_days: number;
}

export interface NotificationSettings {
  notification_email: string;
  notification_enabled: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  credit_score_alerts: boolean;
  risk_alerts: boolean;
  compliance_alerts: boolean;
  system_alerts: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export interface SettingsData {
  system: SystemSettings;
  api: APISettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
}


