import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetApiCache, setLatencyRange } from '../data/applicationsApi'
import { renderWithProviders } from '../test/utils'
import { StatsPage } from './StatsPage'

beforeEach(() => {
  resetApiCache()
  setLatencyRange(0, 0)
})

describe('StatsPage', () => {
  it('shows summary, funnel, and follow-up information for the workspace', async () => {
    renderWithProviders(<StatsPage />)

    await waitFor(() => expect(screen.getByText('Meridian Analytics')).toBeInTheDocument())
    expect(screen.getByText('Pipeline funnel')).toBeInTheDocument()
    expect(screen.getByText('Source performance')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Needs follow-up' })).toBeInTheDocument()
  })
})
