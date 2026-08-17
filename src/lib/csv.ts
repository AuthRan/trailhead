import type { Application } from './types'
import { STAGE_LABELS } from './types'

/** RFC 4180 columns, in the order they read on screen. */
const COLUMNS = [
  'Company',
  'Role',
  'Location',
  'Remote',
  'Stage',
  'Salary min',
  'Salary max',
  'Currency',
  'Source',
  'Tags',
  'URL',
  'Applied on',
  'Created',
  'Updated',
  'Notes',
] as const

/** Quotes a field only when it needs it: separators, quotes, and newlines are
 * what break a naive reader. */
function escapeField(value: string): string {
  if (!/[",\r\n]/.test(value)) return value
  return `"${value.replaceAll('"', '""')}"`
}

function toRow(application: Application): string[] {
  return [
    application.company,
    application.role,
    application.location,
    application.remote ? 'Yes' : 'No',
    STAGE_LABELS[application.stage],
    application.salaryMin === null ? '' : String(application.salaryMin),
    application.salaryMax === null ? '' : String(application.salaryMax),
    application.currency,
    application.source,
    application.tags.join(', '),
    application.url,
    application.appliedOn ?? '',
    application.createdAt,
    application.updatedAt,
    application.notes,
  ]
}

/** Serialises applications as CSV, header row first. Always emits CRLF line
 * endings so spreadsheet apps on every platform read it back cleanly. */
export function applicationsToCsv(applications: Application[]): string {
  const rows = [
    [...COLUMNS],
    ...applications.map((application) => toRow(application)),
  ]

  return rows.map((row) => row.map(escapeField).join(',')).join('\r\n')
}

/** A filename that sorts chronologically and never collides across days. */
export function csvFilename(now: Date = new Date()): string {
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `trailhead-${now.getFullYear()}-${month}-${day}.csv`
}
