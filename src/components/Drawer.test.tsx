import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Drawer } from './Drawer'

function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open panel
      </button>
      <button type="button">Outside control</button>

      <Drawer
        open={open}
        title="Northwind Labs"
        onClose={() => {
          setOpen(false)
          onClose()
        }}
        footer={<button type="button">Save</button>}
      >
        <label>
          Notes
          <input />
        </label>
      </Drawer>
    </>
  )
}

describe('Drawer', () => {
  it('renders nothing while closed', () => {
    render(<Harness />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('exposes itself as a labelled modal dialog', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Open panel' }))

    const dialog = screen.getByRole('dialog', { name: 'Northwind Labs' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('moves focus into the panel on open', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Open panel' }))

    expect(screen.getByRole('dialog')).toContainElement(
      document.activeElement as HTMLElement,
    )
  })

  it('keeps Tab inside the panel', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Open panel' }))

    const dialog = screen.getByRole('dialog')
    for (let step = 0; step < 6; step += 1) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
  })

  it('wraps backwards from the first control to the last', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Open panel' }))

    screen.getByRole('button', { name: 'Close panel' }).focus()
    await user.tab({ shift: true })

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }))
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Open panel' }))

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes when the backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { container } = render(<Harness onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Open panel' }))

    const backdrop = container.querySelector('.drawer__backdrop')
    await user.click(backdrop!)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('returns focus to the control that opened it', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const opener = screen.getByRole('button', { name: 'Open panel' })
    await user.click(opener)
    await user.keyboard('{Escape}')

    expect(document.activeElement).toBe(opener)
  })

  it('restores page scrolling when it closes', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Open panel' }))
    expect(document.body.style.overflow).toBe('hidden')

    await user.keyboard('{Escape}')
    expect(document.body.style.overflow).toBe('')
  })
})
