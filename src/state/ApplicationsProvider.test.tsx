import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { ApplicationsProvider } from './ApplicationsProvider'
import { useApplications, useApplicationsActions } from './ApplicationsContext'
import { resetApiCache, setLatencyRange } from '../data/applicationsApi'
import { SORT_STORAGE_KEY } from '../lib/storage'

function wrapper({ children }: { children: ReactNode }) {
  return <ApplicationsProvider>{children}</ApplicationsProvider>
}

function renderStore() {
  return renderHook(
    () => ({ store: useApplications(), actions: useApplicationsActions() }),
    { wrapper },
  )
}

beforeEach(() => {
  resetApiCache()
  setLatencyRange(0, 0)
})

describe('ApplicationsProvider', () => {
  it('loads the seeded applications', async () => {
    const { result } = renderStore()

    await waitFor(() => expect(result.current.store.status).toBe('ready'))
    expect(result.current.store.items).toHaveLength(12)
  })

  it('narrows the list when a stage filter is applied', async () => {
    const { result } = renderStore()
    await waitFor(() => expect(result.current.store.status).toBe('ready'))

    act(() => {
      result.current.actions.toggleStageFilter('offer')
    })

    await waitFor(() => expect(result.current.store.items).toHaveLength(1))
    expect(result.current.store.items[0].company).toBe('Vellum Health')
  })

  it('flips the sort direction when the same column is toggled twice', async () => {
    const { result } = renderStore()
    await waitFor(() => expect(result.current.store.status).toBe('ready'))

    act(() => {
      result.current.actions.toggleSort('company')
    })
    await waitFor(() => expect(result.current.store.sort).toEqual({
      key: 'company',
      direction: 'asc',
    }))

    act(() => {
      result.current.actions.toggleSort('company')
    })
    await waitFor(() => expect(result.current.store.sort.direction).toBe('desc'))
    await waitFor(() =>
      expect(result.current.store.items[0].company).toBe('Vellum Health'),
    )
  })

  it('drops a selection once the row leaves the filtered result', async () => {
    const { result } = renderStore()
    await waitFor(() => expect(result.current.store.status).toBe('ready'))

    const saved = result.current.store.items.find((item) => item.stage === 'saved')!
    act(() => {
      result.current.actions.toggleSelection(saved.id)
    })
    expect(result.current.store.selectedIds).toEqual([saved.id])

    act(() => {
      result.current.actions.toggleStageFilter('offer')
    })

    await waitFor(() => expect(result.current.store.selectedIds).toEqual([]))
  })

  it('removes applications and restores them again', async () => {
    const { result } = renderStore()
    await waitFor(() => expect(result.current.store.status).toBe('ready'))

    const target = result.current.store.items[0]
    let removed: Awaited<ReturnType<typeof result.current.actions.removeApplications>> = []

    await act(async () => {
      removed = await result.current.actions.removeApplications([target.id])
    })

    expect(removed.map((item) => item.id)).toEqual([target.id])
    expect(result.current.store.items).toHaveLength(11)

    await act(async () => {
      await result.current.actions.restoreApplications(removed)
    })

    expect(result.current.store.items).toHaveLength(12)
    expect(result.current.store.items[0].id).toBe(target.id)
  })

  it('creates an application and shows it at the top of the list', async () => {
    const { result } = renderStore()
    await waitFor(() => expect(result.current.store.status).toBe('ready'))

    await act(async () => {
      await result.current.actions.createApplication({
        company: 'Ridgeway',
        role: 'Frontend Engineer',
        location: 'Remote (EU)',
        remote: true,
        stage: 'saved',
        salaryMin: null,
        salaryMax: null,
        currency: 'EUR',
        source: 'Referral',
        tags: [],
        url: '',
        notes: '',
        appliedOn: null,
      })
    })

    expect(result.current.store.items[0].company).toBe('Ridgeway')
  })

  it('updates an application in place', async () => {
    const { result } = renderStore()
    await waitFor(() => expect(result.current.store.status).toBe('ready'))

    const target = result.current.store.items.find((item) => item.stage === 'saved')!

    await act(async () => {
      await result.current.actions.updateApplication(target.id, { stage: 'applied' })
    })

    const updated = result.current.store.items.find((item) => item.id === target.id)!
    expect(updated.stage).toBe('applied')
    expect(updated.events.at(-1)).toMatchObject({ kind: 'stage', to: 'applied' })
  })
})

describe('remembered sort', () => {
  it('defaults to most recently updated', async () => {
    const { result } = renderStore()
    await waitFor(() => expect(result.current.store.status).toBe('ready'))

    expect(result.current.store.sort).toEqual({ key: 'updatedAt', direction: 'desc' })
  })

  it('remembers a sort for the next session', async () => {
    const { result, unmount } = renderStore()
    await waitFor(() => expect(result.current.store.status).toBe('ready'))

    act(() => {
      result.current.actions.setSort({ key: 'company', direction: 'asc' })
    })
    await waitFor(() =>
      expect(result.current.store.sort).toEqual({ key: 'company', direction: 'asc' }),
    )
    unmount()

    // A fresh provider stands in for a reload.
    const next = renderStore()
    await waitFor(() => expect(next.result.current.store.status).toBe('ready'))

    expect(next.result.current.store.sort).toEqual({ key: 'company', direction: 'asc' })
    expect(next.result.current.store.items[0].company).toBe('Brightsound')
  })

  it('falls back to the default when the stored sort is unusable', async () => {
    window.localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify({ key: 'salary' }))

    const { result } = renderStore()
    await waitFor(() => expect(result.current.store.status).toBe('ready'))

    expect(result.current.store.sort).toEqual({ key: 'updatedAt', direction: 'desc' })
  })
})
