import type { Application, Filters, SortState, Stage } from './types'
import { STAGES } from './types'

/** Fields a free-text query searches, in the order a person would expect them
 * to matter. */
function searchableText(application: Application): string {
  return [
    application.company,
    application.role,
    application.location,
    application.source,
    application.notes,
    application.tags.join(' '),
  ]
    .join(' ')
    .toLowerCase()
}

export function matchesQuery(application: Application, query: string): boolean {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return true

  // Every whitespace-separated term must appear somewhere, so "react berlin"
  // narrows rather than widens the result set.
  const haystack = searchableText(application)
  return trimmed.split(/\s+/).every((term) => haystack.includes(term))
}

export function matchesFilters(application: Application, filters: Filters): boolean {
  if (filters.remoteOnly && !application.remote) return false
  if (filters.stages.length > 0 && !filters.stages.includes(application.stage)) {
    return false
  }
  if (
    filters.tags.length > 0 &&
    !filters.tags.every((tag) => application.tags.includes(tag))
  ) {
    return false
  }

  return matchesQuery(application, filters.query)
}

export function filterApplications(
  applications: Application[],
  filters: Filters,
): Application[] {
  return applications.filter((application) => matchesFilters(application, filters))
}

const STAGE_ORDER = new Map<Stage, number>(STAGES.map((stage, index) => [stage, index]))

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, 'en', { sensitivity: 'base' })
}

/** Missing values always sort last, whichever direction is active — an empty
 * "applied on" is not meaningfully "earliest". */
function compareNullableDates(a: string | null, b: string | null): number | null {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  return null
}

export function sortApplications(
  applications: Application[],
  sort: SortState,
): Application[] {
  const direction = sort.direction === 'asc' ? 1 : -1

  return [...applications].sort((a, b) => {
    switch (sort.key) {
      case 'company': {
        const byCompany = compareStrings(a.company, b.company)
        return (byCompany || compareStrings(a.role, b.role)) * direction
      }
      case 'role':
        return (compareStrings(a.role, b.role) || compareStrings(a.company, b.company)) * direction
      case 'stage': {
        const byStage = (STAGE_ORDER.get(a.stage) ?? 0) - (STAGE_ORDER.get(b.stage) ?? 0)
        return (byStage || compareStrings(a.company, b.company)) * direction
      }
      case 'appliedOn': {
        const nullRank = compareNullableDates(a.appliedOn, b.appliedOn)
        if (nullRank !== null) return nullRank === 0 ? 0 : nullRank
        return (Date.parse(a.appliedOn!) - Date.parse(b.appliedOn!)) * direction
      }
      case 'updatedAt':
      default:
        return (Date.parse(a.updatedAt) - Date.parse(b.updatedAt)) * direction
    }
  })
}

export interface TagCount {
  tag: string
  count: number
}

/** Every tag in use, most-used first, then alphabetical. */
export function collectTags(applications: Application[]): TagCount[] {
  const counts = new Map<string, number>()

  for (const application of applications) {
    for (const tag of application.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || compareStrings(a.tag, b.tag))
}
