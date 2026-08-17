import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ListPage } from '../routes/ListPage'
import { renderWithProviders } from '../test/utils'
import { resetApiCache, setLatencyRange } from '../data/applicationsApi'

beforeEach(() => {
  resetApiCache()
  setLatencyRange(0, 0)
})

async function renderList() {
  const view = renderWithProviders(<ListPage />)
  await screen.findByRole('checkbox', { name: /Select Vellum Health/ })
  return view
}

describe('BulkActionsBar', () => {
  it('stays hidden until something is selected', async () => {
    const { user } = await renderList()
    expect(
      screen.queryByRole('region', { name: 'Selection actions' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /Select Vellum Health/ }))

    expect(screen.getByRole('region', { name: 'Selection actions' })).toBeInTheDocument()
    expect(screen.getByText('1 application selected')).toBeInTheDocument()
  })

  it('pluralises the selection count', async () => {
    const { user } = await renderList()

    await user.click(screen.getByRole('checkbox', { name: 'Select all applications' }))
    expect(screen.getByText('12 applications selected')).toBeInTheDocument()
  })

  it('moves every selected application to a new stage', async () => {
    const { user } = await renderList()

    await user.click(screen.getByRole('checkbox', { name: /Select Studio Kestrel/ }))
    await user.click(screen.getByRole('checkbox', { name: /Select Brightsound/ }))

    await user.selectOptions(
      screen.getByLabelText('Move selected to stage'),
      'applied',
    )

    await waitFor(() =>
      expect(screen.getByText('Moved 2 applications to Applied')).toBeInTheDocument(),
    )
    expect(
      screen.queryByRole('region', { name: 'Selection actions' }),
    ).not.toBeInTheDocument()
  })

  it('deletes the selection and offers an undo that restores it', async () => {
    const { user } = await renderList()

    await user.click(screen.getByRole('checkbox', { name: /Select Vellum Health/ }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() =>
      expect(screen.queryByText('Vellum Health')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Deleted 1 application')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Undo' }))

    await waitFor(() => expect(screen.getByText('Vellum Health')).toBeInTheDocument())
  })

  it('clears the selection without touching the data', async () => {
    const { user } = await renderList()

    await user.click(screen.getByRole('checkbox', { name: /Select Vellum Health/ }))
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(
      screen.queryByRole('region', { name: 'Selection actions' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Vellum Health')).toBeInTheDocument()
  })
})
