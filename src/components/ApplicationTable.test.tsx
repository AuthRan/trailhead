import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApplicationTable } from './ApplicationTable'
import { renderWithProviders } from '../test/utils'
import { resetApiCache, setLatencyRange } from '../data/applicationsApi'

beforeEach(() => {
  resetApiCache()
  setLatencyRange(0, 0)
})

async function renderTable(onOpen = vi.fn()) {
  const view = renderWithProviders(<ApplicationTable onOpen={onOpen} />)
  await waitFor(() => expect(screen.getAllByRole('row').length).toBeGreaterThan(1))
  return { ...view, onOpen }
}

function bodyRows() {
  const [, ...rows] = screen.getAllByRole('row')
  return rows
}

describe('ApplicationTable', () => {
  it('renders a row per application', async () => {
    await renderTable()
    expect(bodyRows()).toHaveLength(12)
  })

  it('marks the active sort column for assistive technology', async () => {
    const { user } = await renderTable()

    const companyHeader = screen.getByRole('columnheader', { name: /Company/ })
    expect(companyHeader).toHaveAttribute('aria-sort', 'none')

    await user.click(within(companyHeader).getByRole('button'))
    await waitFor(() => expect(companyHeader).toHaveAttribute('aria-sort', 'ascending'))

    await user.click(within(companyHeader).getByRole('button'))
    await waitFor(() => expect(companyHeader).toHaveAttribute('aria-sort', 'descending'))
  })

  it('reorders rows when a column is sorted', async () => {
    const { user } = await renderTable()

    await user.click(
      within(screen.getByRole('columnheader', { name: /Company/ })).getByRole('button'),
    )

    await waitFor(() =>
      expect(bodyRows()[0]).toHaveTextContent('Brightsound'),
    )
  })

  it('selects and deselects a single row', async () => {
    const { user } = await renderTable()

    const checkbox = screen.getByRole('checkbox', {
      name: 'Select Vellum Health — Senior Software Engineer, Web',
    })

    await user.click(checkbox)
    expect(checkbox).toBeChecked()

    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('selects every row from the header checkbox and clears it again', async () => {
    const { user } = await renderTable()

    const selectAll = screen.getByRole('checkbox', { name: 'Select all applications' })
    await user.click(selectAll)

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.every((checkbox) => (checkbox as HTMLInputElement).checked)).toBe(
      true,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Clear selection' }))
    expect(
      screen
        .getAllByRole('checkbox')
        .every((checkbox) => !(checkbox as HTMLInputElement).checked),
    ).toBe(true)
  })

  it('shows a partial selection as indeterminate', async () => {
    const { user } = await renderTable()

    const selectAll = screen.getByRole('checkbox', {
      name: 'Select all applications',
    }) as HTMLInputElement
    expect(selectAll.indeterminate).toBe(false)

    await user.click(
      screen.getByRole('checkbox', { name: /Select Vellum Health/ }),
    )

    await waitFor(() => expect(selectAll.indeterminate).toBe(true))
  })

  it('opens an application from its company button', async () => {
    const { user, onOpen } = await renderTable()

    await user.click(screen.getByRole('button', { name: /Vellum Health/ }))

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onOpen).toHaveBeenCalledWith(expect.stringContaining('app_seed_'))
  })

  it('flags applications with no recent activity', async () => {
    await renderTable()

    const meridian = bodyRows().find((row) =>
      within(row).queryByText('Meridian Analytics'),
    )
    expect(meridian).toBeDefined()
    expect(within(meridian!).getByText(/No reply/)).toBeInTheDocument()
  })
})
