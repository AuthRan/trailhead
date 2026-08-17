import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { renderWithProviders } from './test/utils'
import { resetApiCache, setLatencyRange } from './data/applicationsApi'

beforeEach(() => {
  resetApiCache()
  setLatencyRange(0, 0)
})

describe('App routing', () => {
  it('shows the applications list at the index route', async () => {
    renderWithProviders(<App />, { route: '/' })

    expect(
      await screen.findByRole('heading', { name: 'Applications', level: 1 }),
    ).toBeInTheDocument()
  })

  it('shows the board at /board', async () => {
    renderWithProviders(<App />, { route: '/board' })

    expect(await screen.findByRole('heading', { name: 'Board', level: 1 })).toBeInTheDocument()
  })

  it('shows the statistics at /stats', async () => {
    renderWithProviders(<App />, { route: '/stats' })

    expect(await screen.findByRole('heading', { name: 'Stats', level: 1 })).toBeInTheDocument()
  })

  it('falls back to the not-found page for an unknown route', async () => {
    renderWithProviders(<App />, { route: '/nope' })

    expect(
      await screen.findByRole('heading', { name: 'That page does not exist' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to applications' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('offers every view from a labelled navigation landmark', async () => {
    renderWithProviders(<App />, { route: '/' })
    await screen.findByRole('heading', { name: 'Applications', level: 1 })

    const nav = screen.getByRole('navigation', { name: 'Views' })
    expect(within(nav).getAllByRole('link')).toHaveLength(3)
    for (const label of ['List', 'Board', 'Stats']) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument()
    }
  })

  it('marks the active view for assistive tech', async () => {
    renderWithProviders(<App />, { route: '/board' })
    await screen.findByRole('heading', { name: 'Board', level: 1 })

    const nav = screen.getByRole('navigation', { name: 'Views' })
    expect(within(nav).getByRole('link', { name: 'Board' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(nav).getByRole('link', { name: 'List' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('lets a keyboard reader skip the header', async () => {
    renderWithProviders(<App />, { route: '/' })
    await screen.findByRole('heading', { name: 'Applications', level: 1 })

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#main',
    )
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
  })
})
