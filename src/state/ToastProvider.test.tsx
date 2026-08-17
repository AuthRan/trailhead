import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from './ToastProvider'
import { useToasts } from './ToastContext'
import { Toaster } from '../components/Toaster'

function Harness() {
  const { showToast } = useToasts()

  return (
    <>
      <button type="button" onClick={() => showToast('Saved Northwind Labs')}>
        plain
      </button>
      <button
        type="button"
        onClick={() =>
          showToast('Deleted 2 applications', {
            tone: 'danger',
            action: { label: 'Undo', onAction: () => showToast('Restored') },
          })
        }
      >
        with undo
      </button>
    </>
  )
}

function renderToaster() {
  return render(
    <ToastProvider>
      <Harness />
      <Toaster />
    </ToastProvider>,
  )
}

beforeEach(() => {
  // `shouldAdvanceTime` keeps user-event's internal delays running on real time
  // while the toast dismissal timers stay under the test's control.
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

describe('toasts', () => {
  it('announces a message in a polite live region', async () => {
    renderToaster()
    await user().click(screen.getByRole('button', { name: 'plain' }))

    const alertList = screen.getByRole('region', { name: 'Notifications' })
    expect(alertList).toBeInTheDocument()
    expect(screen.getByText('Saved Northwind Labs')).toBeInTheDocument()
  })

  it('dismisses itself after the default duration', async () => {
    renderToaster()
    await user().click(screen.getByRole('button', { name: 'plain' }))
    expect(screen.getByText('Saved Northwind Labs')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(6000)
    })

    expect(screen.queryByText('Saved Northwind Labs')).not.toBeInTheDocument()
  })

  it('runs the action and closes the toast', async () => {
    renderToaster()
    await user().click(screen.getByRole('button', { name: 'with undo' }))
    await user().click(screen.getByRole('button', { name: 'Undo' }))

    expect(screen.queryByText('Deleted 2 applications')).not.toBeInTheDocument()
    expect(screen.getByText('Restored')).toBeInTheDocument()
  })

  it('can be dismissed manually', async () => {
    renderToaster()
    await user().click(screen.getByRole('button', { name: 'plain' }))

    await user().click(
      screen.getByRole('button', { name: 'Dismiss notification: Saved Northwind Labs' }),
    )

    expect(screen.queryByText('Saved Northwind Labs')).not.toBeInTheDocument()
  })
})
