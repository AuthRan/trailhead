const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Whole days between two instants, floored. Negative when `to` precedes
 * `from`. */
export function daysBetween(from: string | Date, to: string | Date): number {
  const start = from instanceof Date ? from : new Date(from)
  const end = to instanceof Date ? to : new Date(to)
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY)
}

export function daysSince(value: string | Date, now: Date = new Date()): number {
  return daysBetween(value, now)
}

/** Human phrasing for a past instant: "today", "3 days ago", "2 months ago". */
export function formatRelative(value: string, now: Date = new Date()): string {
  const days = daysSince(value, now)

  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`

  const months = Math.floor(days / 30)
  if (months === 1) return 'last month'
  if (months < 12) return `${months} months ago`

  const years = Math.floor(days / 365)
  return years === 1 ? 'last year' : `${years} years ago`
}

/** Medium-form absolute date, e.g. "12 Mar 2026". */
export function formatDate(value: string | null): string {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** `yyyy-mm-dd` in local time, suitable for a date input's value. */
export function toDateInputValue(value: string | Date | null): string {
  if (!value) return ''

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
