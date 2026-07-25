/**
 * Quiet-hours helpers for order-note emails.
 * Hours are 0–23 in the account's IANA timezone.
 * Window may wrap midnight (e.g. 22→8).
 */

export type QuietHoursPrefs = {
  enabled: boolean
  startHour: number
  endHour: number
  timezone: string
}

export function clampHour(value: unknown, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  const hour = Math.trunc(n)
  if (hour < 0 || hour > 23) return fallback
  return hour
}

export function normalizeTimezone(value?: string | null): string {
  const trimmed = (value || '').trim() || 'UTC'
  try {
    // Throws RangeError for invalid IANA zones.
    Intl.DateTimeFormat('en-US', { timeZone: trimmed }).format(new Date())
    return trimmed
  } catch {
    return 'UTC'
  }
}

export function hourInTimezone(date: Date, timezone: string): number {
  const tz = normalizeTimezone(timezone)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date)
  const hourPart = parts.find((p) => p.type === 'hour')
  return clampHour(hourPart?.value, 0)
}

/**
 * True when `now` falls inside [start, end) in the given timezone.
 * If start === end, quiet hours are treated as off (no full-day block).
 */
export function isInQuietHours(
  prefs: QuietHoursPrefs,
  now: Date = new Date()
): boolean {
  if (!prefs.enabled) return false
  const start = clampHour(prefs.startHour, 22)
  const end = clampHour(prefs.endHour, 8)
  if (start === end) return false

  const hour = hourInTimezone(now, prefs.timezone)
  if (start < end) {
    return hour >= start && hour < end
  }
  // Wraps midnight: e.g. 22 → 8
  return hour >= start || hour < end
}

export function formatHourLabel(hour: number): string {
  const h = clampHour(hour, 0)
  const suffix = h < 12 ? 'AM' : 'PM'
  const twelve = h % 12 === 0 ? 12 : h % 12
  return `${twelve}:00 ${suffix}`
}
