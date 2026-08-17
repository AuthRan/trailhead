import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createId } from '../lib/id'
import { ToastContext, type Toast, type ToastApi, type ToastOptions } from './ToastContext'

const DEFAULT_DURATION = 6000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }

    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = createId('toast')
      const toast: Toast = {
        id,
        message,
        tone: options.tone ?? 'info',
        action: options.action,
      }

      setToasts((current) => [...current, toast])

      const duration = options.duration ?? DEFAULT_DURATION
      if (duration > 0) {
        timersRef.current.set(
          id,
          setTimeout(() => {
            timersRef.current.delete(id)
            setToasts((current) => current.filter((entry) => entry.id !== id))
          }, duration),
        )
      }

      return id
    },
    [],
  )

  // Toast timers outlive individual renders, so they are cleared together when
  // the provider goes away.
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    }
  }, [])

  const value = useMemo<ToastApi>(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast],
  )

  return <ToastContext value={value}>{children}</ToastContext>
}
