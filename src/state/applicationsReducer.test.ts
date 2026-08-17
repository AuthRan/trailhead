import { describe, expect, it } from 'vitest'
import {
  applicationsReducer,
  initialApplicationsState,
  type ApplicationsState,
} from './applicationsReducer'
import { createSeedApplications } from '../lib/seed'

const seeded = createSeedApplications(new Date('2026-06-15T12:00:00.000Z'))

function ready(overrides: Partial<ApplicationsState> = {}): ApplicationsState {
  return {
    ...initialApplicationsState,
    status: 'ready',
    items: seeded.slice(0, 4),
    pendingRequestId: 1,
    ...overrides,
  }
}

describe('fetch lifecycle', () => {
  it('marks the store as loading and remembers the request', () => {
    const next = applicationsReducer(initialApplicationsState, {
      type: 'fetch/started',
      requestId: 7,
    })

    expect(next.status).toBe('loading')
    expect(next.pendingRequestId).toBe(7)
  })

  it('accepts the result of the newest request', () => {
    const loading = applicationsReducer(initialApplicationsState, {
      type: 'fetch/started',
      requestId: 2,
    })
    const next = applicationsReducer(loading, {
      type: 'fetch/succeeded',
      requestId: 2,
      items: seeded,
    })

    expect(next.status).toBe('ready')
    expect(next.items).toHaveLength(seeded.length)
  })

  it('ignores a stale response that arrives after a newer request started', () => {
    const first = applicationsReducer(initialApplicationsState, {
      type: 'fetch/started',
      requestId: 1,
    })
    const second = applicationsReducer(first, { type: 'fetch/started', requestId: 2 })

    const late = applicationsReducer(second, {
      type: 'fetch/succeeded',
      requestId: 1,
      items: seeded,
    })

    expect(late).toBe(second)
    expect(late.items).toHaveLength(0)
  })

  it('ignores a stale failure', () => {
    const state = ready({ pendingRequestId: 5 })
    const next = applicationsReducer(state, {
      type: 'fetch/failed',
      requestId: 4,
      message: 'boom',
    })

    expect(next).toBe(state)
  })

  it('records the error for the current request', () => {
    const state = ready({ pendingRequestId: 5 })
    const next = applicationsReducer(state, {
      type: 'fetch/failed',
      requestId: 5,
      message: 'boom',
    })

    expect(next.status).toBe('error')
    expect(next.error).toBe('boom')
  })

  it('drops selections for rows that are no longer in the result', () => {
    const state = ready({ selectedIds: [seeded[0].id, seeded[5].id] })
    const next = applicationsReducer(state, {
      type: 'fetch/succeeded',
      requestId: 1,
      items: [seeded[0]],
    })

    expect(next.selectedIds).toEqual([seeded[0].id])
  })
})

describe('mutations', () => {
  it('prepends a created application', () => {
    const state = ready()
    const created = { ...seeded[6], id: 'app_new' }
    const next = applicationsReducer(state, {
      type: 'application/created',
      application: created,
    })

    expect(next.items[0].id).toBe('app_new')
    expect(next.items).toHaveLength(state.items.length + 1)
  })

  it('replaces an updated application in place', () => {
    const state = ready()
    const updated = { ...state.items[2], stage: 'offer' as const }
    const next = applicationsReducer(state, {
      type: 'application/updated',
      application: updated,
    })

    expect(next.items[2].stage).toBe('offer')
    expect(next.items).toHaveLength(state.items.length)
  })

  it('removes applications and their selections together', () => {
    const state = ready({ selectedIds: [seeded[0].id, seeded[1].id] })
    const next = applicationsReducer(state, {
      type: 'applications/removed',
      ids: [seeded[0].id],
    })

    expect(next.items.map((item) => item.id)).not.toContain(seeded[0].id)
    expect(next.selectedIds).toEqual([seeded[1].id])
  })

  it('restores removed applications without duplicating survivors', () => {
    const state = ready()
    const next = applicationsReducer(state, {
      type: 'applications/restored',
      applications: [seeded[0], { ...seeded[9] }],
    })

    expect(next.items).toHaveLength(state.items.length + 1)
    expect(next.items[0].id).toBe(seeded[9].id)
  })
})

describe('selection', () => {
  it('toggles an id on and off', () => {
    const state = ready()
    const selected = applicationsReducer(state, {
      type: 'selection/toggled',
      id: seeded[1].id,
    })
    expect(selected.selectedIds).toEqual([seeded[1].id])

    const deselected = applicationsReducer(selected, {
      type: 'selection/toggled',
      id: seeded[1].id,
    })
    expect(deselected.selectedIds).toEqual([])
  })

  it('replaces the selection, keeping only visible rows', () => {
    const state = ready()
    const next = applicationsReducer(state, {
      type: 'selection/replaced',
      ids: [seeded[0].id, seeded[11].id],
    })

    expect(next.selectedIds).toEqual([seeded[0].id])
  })

  it('returns the same state when clearing an empty selection', () => {
    const state = ready()
    expect(applicationsReducer(state, { type: 'selection/cleared' })).toBe(state)
  })
})
