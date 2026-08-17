import { beforeEach, describe, expect, it } from 'vitest'
import {
  createApplication,
  deleteApplications,
  getApplication,
  isAbortError,
  listApplications,
  resetApiCache,
  restoreApplications,
  setLatencyRange,
  updateApplication,
} from './applicationsApi'
import type { ListParams } from './applicationsApi'
import { EMPTY_FILTERS } from '../lib/types'
import type { ApplicationDraft } from '../lib/types'

const params: ListParams = {
  filters: EMPTY_FILTERS,
  sort: { key: 'updatedAt', direction: 'desc' },
}

const draft: ApplicationDraft = {
  company: 'Ridgeway',
  role: 'Frontend Engineer',
  location: 'Remote (EU)',
  remote: true,
  stage: 'saved',
  salaryMin: null,
  salaryMax: null,
  currency: 'EUR',
  source: 'Referral',
  tags: ['react'],
  url: '',
  notes: '',
  appliedOn: null,
}

beforeEach(() => {
  resetApiCache()
  setLatencyRange(0, 0)
})

describe('listApplications', () => {
  it('seeds a fresh workspace', async () => {
    const applications = await listApplications(params)
    expect(applications).toHaveLength(12)
  })

  it('applies filters and sorting', async () => {
    const applications = await listApplications({
      filters: { ...EMPTY_FILTERS, stages: ['offer'] },
      sort: { key: 'company', direction: 'asc' },
    })

    expect(applications.map((application) => application.company)).toEqual([
      'Vellum Health',
    ])
  })

  it('rejects with an abort error when cancelled', async () => {
    setLatencyRange(50, 50)
    const controller = new AbortController()
    const pending = listApplications(params, controller.signal)
    controller.abort()

    await expect(pending).rejects.toSatisfy(isAbortError)
  })

  it('rejects immediately for an already-aborted signal', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(listApplications(params, controller.signal)).rejects.toSatisfy(
      isAbortError,
    )
  })
})

describe('mutations', () => {
  it('creates an application with a creation event', async () => {
    const created = await createApplication(draft)

    expect(created.id).toBeTruthy()
    expect(created.events).toHaveLength(1)
    expect(created.events[0].kind).toBe('created')
    expect(await listApplications(params)).toHaveLength(13)
  })

  it('records an activity event when the stage changes', async () => {
    const created = await createApplication(draft)
    const updated = await updateApplication(created.id, { stage: 'applied' })

    expect(updated.stage).toBe('applied')
    expect(updated.events.at(-1)).toMatchObject({
      kind: 'stage',
      from: 'saved',
      to: 'applied',
    })
  })

  it('does not add an event when the stage is unchanged', async () => {
    const created = await createApplication(draft)
    const updated = await updateApplication(created.id, { notes: 'Chased today' })

    expect(updated.events).toHaveLength(1)
    expect(updated.notes).toBe('Chased today')
  })

  it('throws when updating a missing application', async () => {
    await expect(updateApplication('app_missing', { stage: 'offer' })).rejects.toThrow(
      /no longer exists/,
    )
  })

  it('deletes and restores applications', async () => {
    const all = await listApplications(params)
    const [first, second] = all

    await deleteApplications([first.id, second.id])
    expect(await listApplications(params)).toHaveLength(all.length - 2)

    await restoreApplications([first, second])
    const restored = await listApplications(params)
    expect(restored).toHaveLength(all.length)
    expect(await getApplication(first.id)).not.toBeNull()
  })

  it('does not duplicate an application that still exists on restore', async () => {
    const [first] = await listApplications(params)

    const restored = await restoreApplications([first])
    expect(restored).toHaveLength(0)
    expect(await listApplications(params)).toHaveLength(12)
  })
})
