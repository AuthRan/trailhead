import { createContext, use } from 'react'

export type ToastTone = 'info' | 'success' | 'danger'

export interface ToastAction {
  label: string
  onAction: () => void
}

export interface Toast {
  id: string
  message: string
  tone: ToastTone
  action?: ToastAction
}

export interface ToastOptions {
  tone?: ToastTone
  action?: ToastAction
  /** Milliseconds before the toast dismisses itself. */
  duration?: number
}

export interface ToastApi {
  toasts: Toast[]
  showToast: (message: string, options?: ToastOptions) => string
  dismissToast: (id: string) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToasts(): ToastApi {
  const api = use(ToastContext)
  if (!api) throw new Error('useToasts must be used inside a ToastProvider')
  return api
}
