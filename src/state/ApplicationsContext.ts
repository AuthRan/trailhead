import { createContext, use } from 'react'
import type {
  Application,
  ApplicationDraft,
  Filters,
  SortKey,
  SortState,
} from '../lib/types'
import type { LoadStatus } from './applicationsReducer'

export interface ApplicationsSnapshot {
  status: LoadStatus
  items: Application[]
  error: string | null
  selectedIds: string[]
  filters: Filters
  sort: SortState
}

export interface ApplicationsActions {
  patchFilters: (patch: Partial<Filters>) => void
  resetFilters: () => void
  toggleStageFilter: (stage: Filters['stages'][number]) => void
  toggleTagFilter: (tag: string) => void
  setSort: (sort: SortState) => void
  /** Sorts by `key`, flipping direction when the key is already active. */
  toggleSort: (key: SortKey) => void
  refresh: () => void
  createApplication: (draft: ApplicationDraft) => Promise<Application>
  updateApplication: (
    id: string,
    patch: Partial<ApplicationDraft>,
  ) => Promise<Application>
  /** Resolves with the removed records so a caller can offer an undo. */
  removeApplications: (ids: string[]) => Promise<Application[]>
  restoreApplications: (applications: Application[]) => Promise<void>
  toggleSelection: (id: string) => void
  replaceSelection: (ids: string[]) => void
  clearSelection: () => void
}

export const ApplicationsStateContext = createContext<ApplicationsSnapshot | null>(null)
export const ApplicationsActionsContext = createContext<ApplicationsActions | null>(null)

export function useApplications(): ApplicationsSnapshot {
  const snapshot = use(ApplicationsStateContext)
  if (!snapshot) {
    throw new Error('useApplications must be used inside an ApplicationsProvider')
  }
  return snapshot
}

export function useApplicationsActions(): ApplicationsActions {
  const actions = use(ApplicationsActionsContext)
  if (!actions) {
    throw new Error('useApplicationsActions must be used inside an ApplicationsProvider')
  }
  return actions
}
