import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { FilterBar } from './FilterBar'
import { renderWithProviders } from '../test/utils'
import { resetApiCache, setLatencyRange } from '../data/applicationsApi'

beforeEach(() => {
  resetApiCache()
  setLatencyRange(0, 0)
})

async function renderFilterBar() {
  const view = renderWithProviders(<FilterBar />)
  await screen.findByText('Showing 12 of 12 applications')
  return view
}

describe('FilterBar', () => {
  it('summarises how many applications are visible', async () => {
    await renderFilterBar()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Showing 12 of 12 applications',
    )
  })

  it('narrows the list when a stage chip is pressed', async () => {
    const { user } = await renderFilterBar()

    const stageGroup = screen.getByRole('group', { name: 'Stage' })
    await user.click(within(stageGroup).getByRole('button', { name: 'Offer' }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Showing 1 of 12 applications',
      ),
    )
    expect(within(stageGroup).getByRole('button', { name: 'Offer' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('filters by tag', async () => {
    const { user } = await renderFilterBar()

    const tagGroup = screen.getByRole('group', { name: 'Tags' })
    await user.click(within(tagGroup).getByRole('button', { name: /accessibility/ }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Showing 2 of 12'),
    )
  })

  it('searches after the input settles', async () => {
    const { user } = await renderFilterBar()

    await user.type(screen.getByLabelText('Search'), 'vellum')

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Showing 1 of 12'),
    )
  })

  it('clears every active filter at once', async () => {
    const { user } = await renderFilterBar()

    await user.click(screen.getByLabelText('Remote only'))
    await user.type(screen.getByLabelText('Search'), 'engineer')
    await waitFor(() =>
      expect(screen.getByRole('status')).not.toHaveTextContent('Showing 12 of 12'),
    )

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Showing 12 of 12'),
    )
    expect(screen.getByLabelText('Search')).toHaveValue('')
    expect(screen.getByLabelText('Remote only')).not.toBeChecked()
  })

  it('does not offer a clear control until a filter is active', async () => {
    const { user } = await renderFilterBar()
    expect(
      screen.queryByRole('button', { name: 'Clear filters' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Remote only'))
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument()
  })
})
