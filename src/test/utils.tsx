import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement, ReactNode } from 'react'
import { ApplicationsProvider } from '../state/ApplicationsProvider'
import { ToastProvider } from '../state/ToastProvider'
import { Toaster } from '../components/Toaster'

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
}

/** Renders a tree with the same providers `main.tsx` mounts, so component tests
 * exercise the real data flow rather than a stubbed one. */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', ...options }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <ToastProvider>
          <ApplicationsProvider>
            {children}
            {/* The shell always mounts the toaster, so tests get it too. */}
            <Toaster />
          </ApplicationsProvider>
        </ToastProvider>
      </MemoryRouter>
    )
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...options }),
  }
}
