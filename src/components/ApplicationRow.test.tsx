import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApplicationRow } from './ApplicationRow'
import type { Application } from '../lib/types'

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: 'app_1',
    company: 'Northwind Labs',
    role: 'Senior Frontend Engineer',
    location: 'Berlin, DE',
    remote: false,
    stage: 'onsite',
    salaryMin: 85000,
    salaryMax: 105000,
    currency: 'EUR',
    source: 'Referral',
    tags: ['react', 'design-systems'],
    url: 'https://example.com/role',
    notes: '',
    appliedOn: '2026-04-24',
    createdAt: '2026-04-21T09:00:00.000Z',
    updatedAt: new Date().toISOString(),
    events: [],
    ...overrides,
  }
}

function renderRow(props: Partial<Parameters<typeof ApplicationRow>[0]> = {}) {
  const onToggleSelect = vi.fn()
  const onOpen = vi.fn()

  const view = render(
    <table>
      <tbody>
        <ApplicationRow
          application={makeApplication()}
          selected={false}
          stalled={false}
          onToggleSelect={onToggleSelect}
          onOpen={onOpen}
          {...props}
        />
      </tbody>
    </table>,
  )

  return { ...view, onToggleSelect, onOpen, user: userEvent.setup() }
}

describe('ApplicationRow', () => {
  it('shows the company, role, and stage', () => {
    renderRow()

    expect(screen.getByText('Northwind Labs')).toBeInTheDocument()
    expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Onsite')).toBeInTheDocument()
  })

  it('opens the application through a real button', async () => {
    const { user, onOpen } = renderRow()

    await user.click(screen.getByRole('button'))

    expect(onOpen).toHaveBeenCalledWith('app_1')
  })

  it('names the selection checkbox after the application it selects', async () => {
    const { user, onToggleSelect } = renderRow()

    const checkbox = screen.getByRole('checkbox', {
      name: 'Select Northwind Labs — Senior Frontend Engineer',
    })
    await user.click(checkbox)

    expect(onToggleSelect).toHaveBeenCalledWith('app_1')
  })

  it('reflects the selected state on the checkbox and the row', () => {
    const { container } = renderRow({ selected: true })

    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(container.querySelector('tr')).toHaveClass('table__row--selected')
  })

  it('flags a remote role', () => {
    renderRow({ application: makeApplication({ remote: true }) })

    expect(screen.getByText('Remote')).toBeInTheDocument()
  })

  it('omits the remote pill for on-site roles', () => {
    renderRow({ application: makeApplication({ remote: false }) })

    expect(screen.queryByText('Remote')).not.toBeInTheDocument()
  })

  it('lists every tag', () => {
    renderRow()

    const tags = screen.getByRole('list')
    expect(within(tags).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'react',
      'design-systems',
    ])
  })

  it('announces a stalled application in text, not by colour alone', () => {
    renderRow({ stalled: true })

    expect(screen.getByText('No reply')).toBeInTheDocument()
  })

  it('does not flag an active application', () => {
    renderRow({ stalled: false })

    expect(screen.queryByText('No reply')).not.toBeInTheDocument()
  })

  it('formats the applied date and shows the update as relative', () => {
    renderRow()

    expect(screen.getByText('24 Apr 2026')).toBeInTheDocument()
    expect(screen.getByText('today')).toBeInTheDocument()
  })

  it('shows a dash when the application was never sent', () => {
    renderRow({ application: makeApplication({ appliedOn: null }) })

    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
