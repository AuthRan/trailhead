import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { SearchInput } from './SearchInput'
import { renderWithProviders } from '../test/utils'
import { resetApiCache, setLatencyRange } from '../data/applicationsApi'
import { useApplications, useApplicationsActions } from '../state/ApplicationsContext'

beforeEach(() => {
  resetApiCache()
  setLatencyRange(0, 0)
})

/** Reports the shared query and offers the two ways it can change from
 * elsewhere, so the field's syncing can be observed from outside. */
function FiltersProbe() {
  const { filters } = useApplications()
  const { patchFilters, resetFilters } = useApplicationsActions()

  return (
    <>
      <output data-testid="shared-query">{filters.query}</output>
      <button type="button" onClick={() => patchFilters({ query: 'harbour' })}>
        Set query elsewhere
      </button>
      <button type="button" onClick={resetFilters}>
        Reset filters
      </button>
    </>
  )
}

async function renderSearch() {
  const view = renderWithProviders(
    <>
      <SearchInput />
      <FiltersProbe />
    </>,
  )
  await screen.findByRole('searchbox', { name: 'Search' })
  return view
}

describe('SearchInput', () => {
  it('labels the field', async () => {
    await renderSearch()

    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument()
  })

  it('shows keystrokes immediately, before the query settles', async () => {
    const { user } = await renderSearch()

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'north')

    // The field owns the text, so typing never waits on the debounce.
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('north')
  })

  it('pushes the settled query into the shared filters', async () => {
    const { user } = await renderSearch()

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'north')

    await waitFor(() =>
      expect(screen.getByTestId('shared-query')).toHaveTextContent('north'),
    )
  })

  it('adopts a query set somewhere else', async () => {
    const { user } = await renderSearch()

    await user.click(screen.getByRole('button', { name: 'Set query elsewhere' }))

    await waitFor(() =>
      expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('harbour'),
    )
  })

  it('clears the field when the filters are reset', async () => {
    const { user } = await renderSearch()

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'north')
    await waitFor(() =>
      expect(screen.getByTestId('shared-query')).toHaveTextContent('north'),
    )

    await user.click(screen.getByRole('button', { name: 'Reset filters' }))

    await waitFor(() =>
      expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue(''),
    )
  })

  it('offers a labelled clear button only once there is text', async () => {
    const { user } = await renderSearch()

    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'north')
    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('')
    await waitFor(() =>
      expect(screen.getByTestId('shared-query')).toHaveTextContent(''),
    )
  })
})
