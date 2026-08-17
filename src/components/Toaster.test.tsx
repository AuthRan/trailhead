import { render, screen, waitForElementToBeRemoved, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Toaster } from './Toaster'
import { ToastProvider } from '../state/ToastProvider'
import { useToasts } from '../state/ToastContext'
import type { ToastOptions } from '../state/ToastContext'

/** Buttons that raise the toasts a test needs, so the Toaster is exercised
 * through the same API the app uses. */
function ToastTrigger({
  label,
  message,
  options,
}: {
  label: string
  message: string
  options?: ToastOptions
}) {
  const { showToast } = useToasts()

  return (
    <button type="button" onClick={() => showToast(message, options)}>
      {label}
    </button>
  )
}

function renderToaster(trigger: React.ReactNode) {
  const view = render(
    <ToastProvider>
      {trigger}
      <Toaster />
    </ToastProvider>,
  )

  return { ...view, user: userEvent.setup() }
}

describe('Toaster', () => {
  it('exposes a labelled, polite notification region', () => {
    renderToaster(null)

    const region = screen.getByRole('region', { name: 'Notifications' })
    expect(within(region).getByRole('list')).toHaveAttribute('aria-live', 'polite')
  })

  it('starts empty', () => {
    renderToaster(null)

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('shows a raised toast', async () => {
    const { user } = renderToaster(
      <ToastTrigger label="Raise" message="Application saved" />,
    )

    await user.click(screen.getByRole('button', { name: 'Raise' }))

    expect(screen.getByText('Application saved')).toBeInTheDocument()
  })

  it('stacks several toasts in the order they were raised', async () => {
    const { user } = renderToaster(
      <>
        <ToastTrigger label="First" message="One deleted" />
        <ToastTrigger label="Second" message="Two deleted" />
      </>,
    )

    await user.click(screen.getByRole('button', { name: 'First' }))
    await user.click(screen.getByRole('button', { name: 'Second' }))

    expect(
      screen.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual([expect.stringContaining('One deleted'), expect.stringContaining('Two deleted')])
  })

  it('carries the tone through to the toast class', async () => {
    const { user } = renderToaster(
      <ToastTrigger label="Raise" message="Gone" options={{ tone: 'danger' }} />,
    )

    await user.click(screen.getByRole('button', { name: 'Raise' }))

    expect(screen.getByRole('listitem')).toHaveClass('toast--danger')
  })

  it('names the dismiss button after the toast it closes', async () => {
    const { user } = renderToaster(
      <ToastTrigger label="Raise" message="Application saved" />,
    )

    await user.click(screen.getByRole('button', { name: 'Raise' }))

    expect(
      screen.getByRole('button', { name: 'Dismiss notification: Application saved' }),
    ).toBeInTheDocument()
  })

  it('dismisses a toast on request', async () => {
    const { user } = renderToaster(
      <ToastTrigger label="Raise" message="Application saved" />,
    )

    await user.click(screen.getByRole('button', { name: 'Raise' }))
    await user.click(
      screen.getByRole('button', { name: 'Dismiss notification: Application saved' }),
    )

    expect(screen.queryByText('Application saved')).not.toBeInTheDocument()
  })

  it('runs the action and closes the toast when the action is taken', async () => {
    const onAction = vi.fn()
    const { user } = renderToaster(
      <ToastTrigger
        label="Raise"
        message="3 applications deleted"
        options={{ action: { label: 'Undo', onAction } }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Raise' }))
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(onAction).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('3 applications deleted')).not.toBeInTheDocument()
  })

  it('offers no action button when the toast has no action', async () => {
    const { user } = renderToaster(
      <ToastTrigger label="Raise" message="Application saved" />,
    )

    await user.click(screen.getByRole('button', { name: 'Raise' }))

    const toast = screen.getByRole('listitem')
    // Only the dismiss control belongs to a toast without an action.
    expect(within(toast).getAllByRole('button')).toHaveLength(1)
  })

  it('dismisses itself once its duration elapses', async () => {
    const { user } = renderToaster(
      <ToastTrigger label="Raise" message="Application saved" options={{ duration: 50 }} />,
    )

    await user.click(screen.getByRole('button', { name: 'Raise' }))
    const toast = screen.getByText('Application saved')

    await waitForElementToBeRemoved(toast)
  })

  it('stays until dismissed when given no duration', async () => {
    const { user } = renderToaster(
      <ToastTrigger label="Raise" message="Application saved" options={{ duration: 0 }} />,
    )

    await user.click(screen.getByRole('button', { name: 'Raise' }))

    // A toast carrying an undo affordance must not vanish on its own.
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(screen.getByText('Application saved')).toBeInTheDocument()
  })
})
