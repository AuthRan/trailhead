import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetApiCache, setLatencyRange } from '../data/applicationsApi'
import { renderWithProviders } from '../test/utils'
import { BoardPage } from './BoardPage'

beforeEach(() => {
  resetApiCache()
  setLatencyRange(0, 0)
})

describe('BoardPage', () => {
  it('groups applications into every pipeline stage', async () => {
    renderWithProviders(<BoardPage />)

    await waitFor(() => expect(screen.getByText('Northwind Labs')).toBeInTheDocument())
    expect(screen.queryAllByText('No applications')).toHaveLength(0)
    expect(screen.getByRole('heading', { name: 'Saved' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Rejected' })).toBeInTheDocument()
  })

  it('moves an application to its next stage', async () => {
    const { user } = renderWithProviders(<BoardPage />)

    await waitFor(() => expect(screen.getByText('Northwind Labs')).toBeInTheDocument())
    const card = screen.getByText('Northwind Labs').closest('article')!
    await user.click(within(card).getByRole('button', { name: 'Next' }))

    await waitFor(() => expect(screen.getByText(/Northwind Labs moved to Offer/)).toBeInTheDocument())
    expect(screen.getByText('Northwind Labs').closest('article')).toBeInTheDocument()
  })
})
