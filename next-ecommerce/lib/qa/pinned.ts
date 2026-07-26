/** Inbox query: `?pinned=1` shows only pinned unanswered Q&A. */
export function parsePinnedFilter(value?: string | null): boolean {
  const v = (value || '').trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export function filterQuestionsByPinned<T extends { pinned: boolean }>(
  items: T[],
  pinnedOnly: boolean
): T[] {
  if (!pinnedOnly) return items
  return items.filter((item) => item.pinned)
}

export function countPinnedQuestions<T extends { pinned: boolean }>(
  items: T[]
): number {
  return items.reduce((n, item) => n + (item.pinned ? 1 : 0), 0)
}
