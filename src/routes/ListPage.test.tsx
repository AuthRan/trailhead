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

  const link = document.createElement('a')
  vi.spyOn(link, 'click').mockImplementation(() => {})
  vi.spyOn(document, 'createElement').mockReturnValue(link)

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
