/**
 * Scheduled Exports Utility
 * Handles scheduled exports and email export functionality
 */

import { exportToCSV, exportToExcel, exportToPDF, exportToJSON } from "./exportHelpers";

export interface ScheduledExportConfig {
  id: string;
  name: string;
  type: "csv" | "excel" | "pdf" | "json";
  schedule: "daily" | "weekly" | "monthly" | "custom";
  time?: string; // HH:MM format
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  emailRecipients: string[];
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

const SCHEDULED_EXPORTS_KEY = "scheduled_exports";

/**
 * Save scheduled export configuration
 */
export async function saveScheduledExport(config: ScheduledExportConfig): Promise<void> {
  if (typeof window === "undefined") return;
  
  try {
    const url = config.id 
      ? `/api/export/scheduled/${config.id}`
      : '/api/export/scheduled';
    
    const method = config.id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to save scheduled export');
    }
  } catch (error) {
    // Fallback to localStorage if API fails
    console.warn('API save failed, using localStorage fallback:', error);
    const existing = getScheduledExports();
    const index = existing.findIndex((e) => e.id === config.id);
    
    if (index >= 0) {
      existing[index] = config;
    } else {
      existing.push(config);
    }
    
    localStorage.setItem(SCHEDULED_EXPORTS_KEY, JSON.stringify(existing));
  }
}

/**
 * Get all scheduled exports
 */
export async function getScheduledExports(): Promise<ScheduledExportConfig[]> {
  if (typeof window === "undefined") return [];
  
  try {
    const response = await fetch('/api/export/scheduled');
    
    if (response.ok) {
      const result = await response.json();
      return result.data || [];
    }
  } catch (error) {
    // Fallback to localStorage if API fails
    console.warn('API fetch failed, using localStorage fallback:', error);
  }
  
  // Fallback to localStorage
  const stored = localStorage.getItem(SCHEDULED_EXPORTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Delete scheduled export
 */
export async function deleteScheduledExport(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  
  try {
    const response = await fetch(`/api/export/scheduled/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete scheduled export');
    }
  } catch (error) {
    // Fallback to localStorage if API fails
    console.warn('API delete failed, using localStorage fallback:', error);
    const existing = getScheduledExports();
    const filtered = existing.filter((e) => e.id !== id);
    localStorage.setItem(SCHEDULED_EXPORTS_KEY, JSON.stringify(filtered));
  }
}

/**
 * Calculate next run time for scheduled export
 */
export function calculateNextRun(config: ScheduledExportConfig): string {
  const now = new Date();
  const next = new Date(now);

  switch (config.schedule) {
    case "daily":
      if (config.time) {
        const [hours, minutes] = config.time.split(":").map(Number);
        next.setHours(hours, minutes, 0, 0);
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
      } else {
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
      }
      break;

    case "weekly":
      if (config.dayOfWeek !== undefined) {
        const daysUntilNext = (config.dayOfWeek - now.getDay() + 7) % 7 || 7;
        next.setDate(now.getDate() + daysUntilNext);
        if (config.time) {
          const [hours, minutes] = config.time.split(":").map(Number);
          next.setHours(hours, minutes, 0, 0);
        } else {
          next.setHours(0, 0, 0, 0);
        }
      } else {
        next.setDate(now.getDate() + 7);
      }
      break;

    case "monthly":
      if (config.dayOfMonth !== undefined) {
        next.setMonth(now.getMonth() + 1);
        next.setDate(config.dayOfMonth);
        if (config.time) {
          const [hours, minutes] = config.time.split(":").map(Number);
          next.setHours(hours, minutes, 0, 0);
        } else {
          next.setHours(0, 0, 0, 0);
        }
      } else {
        next.setMonth(now.getMonth() + 1);
        next.setDate(1);
      }
      break;

    default:
      return "";
  }

  return next.toISOString();
}

/**
 * Email export utility
 * Calls backend API to send emails with export attachments
 */
export async function emailExport(
  data: any[],
  filename: string,
  recipients: string[],
  format: "csv" | "excel" | "pdf" | "json" = "pdf",
  subject?: string,
  message?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/export/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients,
        filename,
        format,
        subject: subject || `Credit Score Export - ${filename}`,
        message: message || `Please find attached the credit score export.`,
        data,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Email export failed' }));
      throw new Error(errorData.message || 'Email export failed');
    }

    const result = await response.json();
    return {
      success: result.success,
      message: result.message || `Export emailed to ${recipients.join(", ")}`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to email export",
    };
  }
}

/**
 * Check if scheduled exports need to run
 */
export function checkScheduledExports(): ScheduledExportConfig[] {
  const scheduled = getScheduledExports().filter((e) => e.enabled);
  const now = new Date();
  const due: ScheduledExportConfig[] = [];

  scheduled.forEach((config) => {
    if (!config.nextRun) {
      config.nextRun = calculateNextRun(config);
      saveScheduledExport(config);
    }

    const nextRunDate = new Date(config.nextRun);
    if (nextRunDate <= now) {
      due.push(config);
    }
  });

  return due;
}

