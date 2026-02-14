import { parseISO, isValid, format } from "date-fns";

/**
 * Safely parse a date string (UTC ISO or any ISO 8601). Returns null if invalid or null.
 * The returned Date represents the same moment in time; use format() for local display.
 */
export function parseScheduledDate(value: string | null | undefined): Date | null {
  if (value == null || typeof value !== "string" || value.trim() === "") {
    return null;
  }
  let parsed = parseISO(value);
  if (!isValid(parsed)) {
    parsed = new Date(value);
  }
  return isValid(parsed) ? parsed : null;
}

/**
 * Format a date for display, or return fallback if invalid.
 */
export function formatScheduledDate(
  value: string | null | undefined,
  formatFn: (d: Date) => string,
  fallback = "No Date"
): string {
  const d = parseScheduledDate(value);
  return d ? formatFn(d) : fallback;
}

/**
 * Convert a Date (user's local date/time) to a UTC ISO 8601 string for storage.
 * Use this instead of date.toString() to ensure strict UTC storage.
 */
export function toUTCISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Get the user's local timezone short name (e.g. "CST", "EST") for display.
 */
export function getLocalTimezoneShortName(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZoneName: "short",
  }).formatToParts(date);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "local";
}

/**
 * Format a date for display in the user's local timezone with timezone label.
 * e.g. "Feb 14, 2025 at 3:00 PM CST"
 */
export function formatInLocalWithTz(date: Date): string {
  const formatted = format(date, "MMM d, yyyy 'at' h:mm a");
  const tz = getLocalTimezoneShortName(date);
  return `${formatted} ${tz}`;
}
