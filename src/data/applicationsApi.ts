import { createId } from '../lib/id'
import { loadApplications, saveApplications } from '../lib/storage'
import { createSeedApplications } from '../lib/seed'
import { filterApplications, sortApplications } from '../lib/filter'
import type {
  Application,
  ApplicationDraft,
  Filters,
  SortState,
  Stage,
} from '../lib/types'

/** The app talks to its own storage through this module so every read looks
 * like a request: it is asynchronous, it can be cancelled, and it does not
 * resolve instantly. Swapping in a real server later means changing only this
 * file. */

export class AbortError extends Error {
  constructor() {
    super('The operation was aborted')
    this.name = 'AbortError'
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

let minLatencyMs = 140
let maxLatencyMs = 420

/** Test hook: pin the simulated latency so a suite can control ordering. */
export function setLatencyRange(min: number, max: number): void {
  minLatencyMs = min
  maxLatencyMs = max
}

function nextLatency(): number {
  if (maxLatencyMs <= minLatencyMs) return minLatencyMs
  return minLatencyMs + Math.random() * (maxLatencyMs - minLatencyMs)
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new AbortError())
      return
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    function onAbort() {
      clearTimeout(timer)
      reject(new AbortError())
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

let cache: Application[] | null = null

function readAll(): Application[] {
  if (cache === null) {
    cache = loadApplications() ?? createSeedApplications()
    saveApplications(cache)
  }

  return cache
}

function writeAll(applications: Application[]): Application[] {
  cache = applications
  saveApplications(applications)
  return applications
}

/** Test hook: drop the in-memory cache so the next read re-seeds. */
export function resetApiCache(): void {
  cache = null
}

export interface ListParams {
  filters: Filters
  sort: SortState
}

export async function listApplications(
  params: ListParams,
  signal?: AbortSignal,
): Promise<Application[]> {
  await delay(nextLatency(), signal)
  const all = readAll()
  return sortApplications(filterApplications(all, params.filters), params.sort)
}

export async function getApplication(
  id: string,
  signal?: AbortSignal,
): Promise<Application | null> {
  await delay(nextLatency(), signal)
  return readAll().find((application) => application.id === id) ?? null
}

export async function createApplication(
  draft: ApplicationDraft,
  signal?: AbortSignal,
): Promise<Application> {
  await delay(nextLatency(), signal)

  const now = new Date().toISOString()
  const application: Application = {
    ...draft,
    id: createId('app'),
    createdAt: now,
    updatedAt: now,
    events: [{ id: createId('evt'), at: now, kind: 'created' }],
  }

  writeAll([application, ...readAll()])
  return application
}

export async function updateApplication(
  id: string,
  patch: Partial<ApplicationDraft>,
  signal?: AbortSignal,
): Promise<Application> {
  await delay(nextLatency(), signal)

  const all = readAll()
  const existing = all.find((application) => application.id === id)
  if (!existing) throw new Error(`Application ${id} no longer exists`)

  const now = new Date().toISOString()
  const stageChanged = patch.stage !== undefined && patch.stage !== existing.stage
  const updated: Application = {
    ...existing,
    ...patch,
    updatedAt: now,
    events: stageChanged
      ? [
          ...existing.events,
          {
            id: createId('evt'),
            at: now,
            kind: 'stage',
            from: existing.stage,
            to: patch.stage as Stage,
          },
        ]
      : existing.events,
  }

  writeAll(all.map((application) => (application.id === id ? updated : application)))
  return updated
}

export async function deleteApplications(
  ids: string[],
  signal?: AbortSignal,
): Promise<string[]> {
  await delay(nextLatency(), signal)

  const removing = new Set(ids)
  writeAll(readAll().filter((application) => !removing.has(application.id)))
  return ids
}

/** Restores previously deleted records, keeping the original ordering stable
 * enough for an undo affordance to feel lossless. */
export async function restoreApplications(
  applications: Application[],
  signal?: AbortSignal,
): Promise<Application[]> {
  await delay(nextLatency(), signal)

  const existing = readAll()
  const known = new Set(existing.map((application) => application.id))
  const restored = applications.filter((application) => !known.has(application.id))

  writeAll([...restored, ...existing])
  return restored
}
