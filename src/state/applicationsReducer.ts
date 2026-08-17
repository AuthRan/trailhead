import type { Application } from '../lib/types'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface ApplicationsState {
  status: LoadStatus
  items: Application[]
  error: string | null
  /** Ids selected in the list view, in selection order. */
  selectedIds: string[]
  /** The request whose result the reducer will accept. Anything older is a
   * late response from a superseded query and gets dropped. */
  pendingRequestId: number
}

export const initialApplicationsState: ApplicationsState = {
  status: 'idle',
  items: [],
  error: null,
  selectedIds: [],
  pendingRequestId: 0,
}

export type ApplicationsAction =
  | { type: 'fetch/started'; requestId: number }
  | { type: 'fetch/succeeded'; requestId: number; items: Application[] }
  | { type: 'fetch/failed'; requestId: number; message: string }
  | { type: 'application/created'; application: Application }
  | { type: 'application/updated'; application: Application }
  | { type: 'applications/removed'; ids: string[] }
  | { type: 'applications/restored'; applications: Application[] }
  | { type: 'selection/toggled'; id: string }
  | { type: 'selection/replaced'; ids: string[] }
  | { type: 'selection/cleared' }

function pruneSelection(selectedIds: string[], items: Application[]): string[] {
  const present = new Set(items.map((item) => item.id))
  return selectedIds.filter((id) => present.has(id))
}

export function applicationsReducer(
  state: ApplicationsState,
  action: ApplicationsAction,
): ApplicationsState {
  switch (action.type) {
    case 'fetch/started':
      return {
        ...state,
        status: 'loading',
        error: null,
        pendingRequestId: action.requestId,
      }

    case 'fetch/succeeded': {
      if (action.requestId !== state.pendingRequestId) return state

      return {
        ...state,
        status: 'ready',
        error: null,
        items: action.items,
        selectedIds: pruneSelection(state.selectedIds, action.items),
      }
    }

    case 'fetch/failed': {
      if (action.requestId !== state.pendingRequestId) return state

      return { ...state, status: 'error', error: action.message }
    }

    case 'application/created':
      return {
        ...state,
        items: [action.application, ...state.items],
      }

    case 'application/updated':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.application.id ? action.application : item,
        ),
      }

    case 'applications/removed': {
      const removing = new Set(action.ids)
      const items = state.items.filter((item) => !removing.has(item.id))

      return {
        ...state,
        items,
        selectedIds: pruneSelection(state.selectedIds, items),
      }
    }

    case 'applications/restored': {
      const known = new Set(state.items.map((item) => item.id))
      const restored = action.applications.filter(
        (application) => !known.has(application.id),
      )

      return { ...state, items: [...restored, ...state.items] }
    }

    case 'selection/toggled': {
      const selected = state.selectedIds.includes(action.id)

      return {
        ...state,
        selectedIds: selected
          ? state.selectedIds.filter((id) => id !== action.id)
          : [...state.selectedIds, action.id],
      }
    }

    case 'selection/replaced':
      return { ...state, selectedIds: pruneSelection(action.ids, state.items) }

    case 'selection/cleared':
      return state.selectedIds.length === 0 ? state : { ...state, selectedIds: [] }

    default:
      return state
  }
}
