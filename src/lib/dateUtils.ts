/**
 * Safely parse a date string. Returns null if invalid or null.
 */
export function parseScheduledDate(value: string | null | undefined): Date | null {
  if (value == null || typeof value !== "string" || value.trim() === "") {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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
