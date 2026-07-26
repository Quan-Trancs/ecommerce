/** Unanswered Q&A aging thresholds (hours since asked). */
export const QA_SLA_WARN_HOURS = 24
export const QA_SLA_OVERDUE_HOURS = 72

export type QaAgingLevel = 'ok' | 'warn' | 'overdue'

export type QaAgingInfo = {
  level: QaAgingLevel
  hoursOpen: number
  label: string
  badgeLabel: string
}

export function hoursSince(createdAt: string | Date, now = Date.now()): number {
  const t = new Date(createdAt).getTime()
  if (!Number.isFinite(t)) return 0
  return Math.max(0, (now - t) / 3_600_000)
}

export function formatOpenDuration(hoursOpen: number): string {
  if (hoursOpen < 1) return 'just now'
  if (hoursOpen < 24) {
    const h = Math.floor(hoursOpen)
    return `${h}h open`
  }
  const days = Math.floor(hoursOpen / 24)
  const remH = Math.floor(hoursOpen % 24)
  if (days < 7) {
    return remH > 0 ? `${days}d ${remH}h open` : `${days}d open`
  }
  return `${days}d open`
}

export function getQaAging(
  createdAt: string | Date,
  now = Date.now()
): QaAgingInfo {
  const hoursOpen = hoursSince(createdAt, now)
  const label = formatOpenDuration(hoursOpen)
  if (hoursOpen >= QA_SLA_OVERDUE_HOURS) {
    return { level: 'overdue', hoursOpen, label, badgeLabel: 'Overdue' }
  }
  if (hoursOpen >= QA_SLA_WARN_HOURS) {
    return { level: 'warn', hoursOpen, label, badgeLabel: 'Aging' }
  }
  return { level: 'ok', hoursOpen, label, badgeLabel: 'On track' }
}

export function summarizeQaAging(
  createdAts: Array<string | Date>,
  now = Date.now()
): { overdue: number; aging: number; onTrack: number } {
  let overdue = 0
  let aging = 0
  let onTrack = 0
  for (const createdAt of createdAts) {
    const level = getQaAging(createdAt, now).level
    if (level === 'overdue') overdue++
    else if (level === 'warn') aging++
    else onTrack++
  }
  return { overdue, aging, onTrack }
}
