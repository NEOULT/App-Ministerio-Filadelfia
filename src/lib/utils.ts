import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse an ISO datetime string from the backend that represents a date (e.g. "2025-11-05T00:00:00.000Z")
 * and return a local Date object using the date components (year, month, day) so it doesn't shift
 * when converted to local timezone. Returns null for invalid input.
 */
export function parseISODateAsLocal(iso?: string): Date | null {
  if (!iso) return null
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/) // capture YYYY-MM-DD
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  return new Date(y, mo, d)
}

export function formatDateStringForDisplay(iso?: string, locale = 'es-ES', options?: Intl.DateTimeFormatOptions) {
  const dt = parseISODateAsLocal(iso)
  if (!dt) return '-'
  return dt.toLocaleDateString(locale, options)
}
