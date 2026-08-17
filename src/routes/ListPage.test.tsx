import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ListPage } from './ListPage'
import { renderWithProviders } from '../test/utils'
import { resetApiCache, setLatencyRange } from '../data/applicationsApi'

beforeEach(() => {
  resetApiCache()
  setLatencyRange(0, 0)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function stubDownload() {
  const createObjectURL = vi.fn(() => 'blob:trailhead')
  vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() })

  const realCreateElement = document.createElement.bind(document)
  const link = realCreateElement('a')
  vi.spyOn(link, 'click').mockImplementation(() => {})
  // Only the download anchor is intercepted — React keeps building real nodes,
  // otherwise a re-render after the download corrupts the tree.
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
    tag === 'a' ? link : realCreateElement(tag),
  )

  return { createObjectURL, link }
}

async function renderListPage() {
  const view = renderWithProviders(<ListPage />)
  await screen.findByText('12 tracked in this workspace')
  return view
}

describe('ListPage export', () => {
  it('offers a CSV export once applications have loaded', async () => {
    await renderListPage()

    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled()
  })

  it('exports the applications currently on screen', async () => {
    const { user } = await renderListPage()
    const { createObjectURL, link } = stubDownload()

    await user.click(screen.getByRole('button', { name: 'Export CSV' }))

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(link.download).toMatch(/^trailhead-\d{4}-\d{2}-\d{2}\.csv$/)
  })

  it('says it is exporting the filtered set once a filter is active', async () => {
    const { user } = await renderListPage()

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'northwind')

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Export these as CSV' }),
      ).toBeInTheDocument(),
    )
  })

  it('backs up the whole workspace, not just the filtered rows', async () => {
    const { user } = await renderListPage()

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'northwind')
    await waitFor(() =>
      expect(screen.getByText('1 of 12 shown')).toBeInTheDocument(),
    )

    const { createObjectURL, link } = stubDownload()
    await user.click(screen.getByRole('button', { name: 'Back up' }))

    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1))
    expect(link.download).toMatch(/^trailhead-backup-\d{4}-\d{2}-\d{2}\.json$/)
    await screen.findByText('Backed up 12 applications')
  })

  it('disables the export when a filter leaves nothing to export', async () => {
    const { user } = await renderListPage()

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'zzzzzzzz')

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'No applications match these filters' }),
      ).toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: 'Export these as CSV' })).toBeDisabled()
  })
})
