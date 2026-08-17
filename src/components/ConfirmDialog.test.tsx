import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

function setup(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()

  const view = render(
    <ConfirmDialog
      open
      title="Discard changes?"
      description="Your edits to this application have not been saved."
      confirmLabel="Discard"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  )

  return { ...view, onConfirm, onCancel, user: userEvent.setup() }
}

describe('ConfirmDialog', () => {
  it('renders nothing while closed', () => {
    setup({ open: false })

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('exposes the title and description to assistive tech', () => {
    setup()

    const dialog = screen.getByRole('alertdialog', { name: 'Discard changes?' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription(
      'Your edits to this application have not been saved.',
    )
  })

  it('takes focus on the confirm button so the keyboard lands in the dialog', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Discard' })).toHaveFocus()
  })

  it('confirms and cancels through the buttons', async () => {
    const { user, onConfirm, onCancel } = setup()

    await user.click(screen.getByRole('button', { name: 'Discard' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('cancels on Escape', async () => {
    const { user, onCancel } = setup()

    await user.keyboard('{Escape}')

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('cancels when the backdrop is clicked', async () => {
    const { container, user, onCancel } = setup()

    const backdrop = container.querySelector('.confirm__backdrop')
    await user.click(backdrop!)

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('accepts a custom cancel label', () => {
    setup({ cancelLabel: 'Keep editing' })

    expect(screen.getByRole('button', { name: 'Keep editing' })).toBeInTheDocument()
  })

  it('marks a destructive confirm with the danger tone', () => {
    setup({ tone: 'danger' })

    expect(screen.getByRole('button', { name: 'Discard' })).toHaveClass(
      'button--danger',
    )
  })

  it('stops listening for Escape once unmounted', async () => {
    const { unmount, user, onCancel } = setup()

    unmount()
    await user.keyboard('{Escape}')

    expect(onCancel).not.toHaveBeenCalled()
  })
})
