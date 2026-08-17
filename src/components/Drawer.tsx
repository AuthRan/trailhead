import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

interface DrawerProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** A right-hand panel that behaves like a modal dialog: it takes focus while
 * it is open, keeps Tab inside itself, closes on Escape, and hands focus back
 * to whatever opened it. */
export function Drawer({ open, title, onClose, children, footer }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return

    openerRef.current = document.activeElement as HTMLElement | null

    const panel = panelRef.current
    const firstFocusable = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(firstFocusable ?? panel)?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panel) return

      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      openerRef.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="drawer-root">
      <div
        className="drawer__backdrop"
        role="presentation"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="drawer__header">
          <h2 id={titleId} className="drawer__title">
            {title}
          </h2>

          <button
            type="button"
            className="drawer__close"
            onClick={onClose}
            aria-label="Close panel"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="drawer__body">{children}</div>

        {footer ? <footer className="drawer__footer">{footer}</footer> : null}
      </div>
    </div>
  )
}
