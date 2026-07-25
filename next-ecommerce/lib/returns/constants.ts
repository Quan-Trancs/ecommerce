export type ReturnReason =
  | 'DAMAGED'
  | 'WRONG_ITEM'
  | 'NOT_AS_DESCRIBED'
  | 'CHANGED_MIND'
  | 'OTHER'

export const RETURN_REASONS: Array<{ value: ReturnReason; label: string }> = [
  { value: 'DAMAGED', label: 'Damaged or defective' },
  { value: 'WRONG_ITEM', label: 'Wrong item received' },
  { value: 'NOT_AS_DESCRIBED', label: 'Not as described' },
  { value: 'CHANGED_MIND', label: 'Changed mind' },
  { value: 'OTHER', label: 'Other' },
]
