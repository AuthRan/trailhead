import type { Application, SortDirection, SortKey, SortState } from './types'
import { STAGES } from './types'

export const STORAGE_KEY = 'trailhead:applications'
export const SORT_STORAGE_KEY = 'trailhead:sort'
const STORAGE_VERSION = 1

const SORT_KEYS: readonly SortKey[] = [
  'updatedAt',
  'company',
  'role',
  'stage',
  'appliedOn',
]
const SORT_DIRECTIONS: readonly SortDirection[] = ['asc', 'desc']

interface PersistedShape {
  version: number
  applications: Application[]
}

/** Structural check for a stored record. Exported so an imported backup is held
 * to the same shape as anything already persisted. */
export function isApplication(value: unknown): value is Application {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Partial<Application>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.company === 'string' &&
    typeof candidate.role === 'string' &&
    typeof candidate.stage === 'string' &&
    (STAGES as readonly string[]).includes(candidate.stage) &&
    Array.isArray(candidate.tags) &&
    Array.isArray(candidate.events)
  )
}

/** Reads persisted applications. Returns `null` when nothing is stored or the
 * stored payload is unusable, which the caller treats as "seed a fresh
 * workspace" rather than an error. */
export function loadApplications(): Application[] | null {
  let raw: string | null = null

  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). Fall back to
    // in-memory state instead of breaking the app.
    return null
  }

  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedShape>
    if (parsed.version !== STORAGE_VERSION) return null
    if (!Array.isArray(parsed.applications)) return null

    const applications = parsed.applications.filter(isApplication)
    return applications.length === parsed.applications.length ? applications : null
  } catch {
    return null
  }
}

export function saveApplications(applications: Application[]): void {
  const payload: PersistedShape = { version: STORAGE_VERSION, applications }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota exceeded or storage blocked — the session stays usable, it just
    // will not survive a reload.
  }
}

export function clearApplications(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to do; the key is already unreachable.
  }
}

/** Reads the remembered sort. Returns `null` when nothing is stored or the
 * stored value no longer names a real column, so the caller falls back to its
 * own default rather than sorting by something that no longer exists. */
export function loadSort(): SortState | null {
  let raw: string | null = null

  try {
    raw = window.localStorage.getItem(SORT_STORAGE_KEY)
  } catch {
    return null
  }

  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<SortState>
    if (!SORT_KEYS.includes(parsed.key as SortKey)) return null
    if (!SORT_DIRECTIONS.includes(parsed.direction as SortDirection)) return null

    return { key: parsed.key as SortKey, direction: parsed.direction as SortDirection }
  } catch {
    return null
  }
}

export function saveSort(sort: SortState): void {
  try {
    window.localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sort))
  } catch {
    // Sorting still works for this session; it just will not be remembered.
  }
}
