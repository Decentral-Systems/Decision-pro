/**
 * Formatting utilities for currency, dates, numbers
 */
import { format } from "date-fns";

export function formatCurrency(
  amount: number,
  currency: string = "ETB"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string, format: "short" | "long" = "short"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (format === "long") {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  }
  
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);
}

export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)}%`;
}

export function formatPhoneNumber(phone: string): string {
  // Format Ethiopian phone numbers: +251XXXXXXXXX or 0XXXXXXXXX
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("251")) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  } else if (cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Safely format a date using date-fns format function
 * Returns a fallback string if the date is invalid, null, or undefined
 */
export function safeFormatDate(
  date: Date | string | null | undefined,
  formatString: string,
  fallback: string = "N/A"
): string {
  if (!date) {
    return fallback;
  }

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }

    return format(dateObj, formatString);
  } catch (error) {
    console.warn("Error formatting date:", error, "Date value:", date);
    return fallback;
  }
}









