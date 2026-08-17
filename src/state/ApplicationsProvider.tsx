import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  createApplication as createApplicationRequest,
  deleteApplications as deleteApplicationsRequest,
  isAbortError,
  listApplications,
  restoreApplications as restoreApplicationsRequest,
  updateApplication as updateApplicationRequest,
} from '../data/applicationsApi'
import { collectTags, type TagCount } from '../lib/filter'
import type {
  Application,
  ApplicationDraft,
  Filters,
  SortKey,
  SortState,
  Stage,
} from '../lib/types'
import { EMPTY_FILTERS } from '../lib/types'
import {
  applicationsReducer,
  initialApplicationsState,
} from './applicationsReducer'
import {
  ApplicationsActionsContext,
  ApplicationsStateContext,
  type ApplicationsActions,
  type ApplicationsSnapshot,
} from './ApplicationsContext'

const DEFAULT_SORT: SortState = { key: 'updatedAt', direction: 'desc' }

function toggleMember<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((entry) => entry !== value)
    : [...list, value]
}

export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(applicationsReducer, initialApplicationsState)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)
  const [reloadToken, setReloadToken] = useState(0)
  const [facets, setFacets] = useState<{ tags: TagCount[]; total: number }>({
    tags: [],
    total: 0,
  })
  /** Bumped whenever a mutation lands, which is the only time facets can go
   * stale — filtering the view does not change the workspace. */
  const [dataVersion, setDataVersion] = useState(0)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    requestIdRef.current += 1
    const requestId = requestIdRef.current

    dispatch({ type: 'fetch/started', requestId })

    listApplications({ filters, sort }, controller.signal)
      .then((items) => {
        dispatch({ type: 'fetch/succeeded', requestId, items })
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        dispatch({
          type: 'fetch/failed',
          requestId,
          message:
            error instanceof Error ? error.message : 'Could not load applications',
        })
      })

    return () => {
      controller.abort()
    }
  }, [filters, sort, reloadToken])

  // Facets describe the whole workspace rather than the filtered view, so they
  // are loaded separately and only refreshed when the data itself changes.
  useEffect(() => {
    const controller = new AbortController()

    listApplications({ filters: EMPTY_FILTERS, sort: DEFAULT_SORT }, controller.signal)
      .then((all) => {
        setFacets({ tags: collectTags(all), total: all.length })
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) setFacets({ tags: [], total: 0 })
      })

    return () => {
      controller.abort()
    }
  }, [reloadToken, dataVersion])

  const patchFilters = useCallback((patch: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...patch }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS)
  }, [])

  const toggleStageFilter = useCallback((stage: Stage) => {
    setFilters((current) => ({ ...current, stages: toggleMember(current.stages, stage) }))
  }, [])

  const toggleTagFilter = useCallback((tag: string) => {
    setFilters((current) => ({ ...current, tags: toggleMember(current.tags, tag) }))
  }, [])

  const toggleSort = useCallback((key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: key === 'updatedAt' || key === 'appliedOn' ? 'desc' : 'asc' },
    )
  }, [])

  const refresh = useCallback(() => {
    setReloadToken((token) => token + 1)
  }, [])

  const markDataChanged = useCallback(() => {
    setDataVersion((version) => version + 1)
  }, [])

  const createApplication = useCallback(
    async (draft: ApplicationDraft) => {
      const application = await createApplicationRequest(draft)
      dispatch({ type: 'application/created', application })
      markDataChanged()
      return application
    },
    [markDataChanged],
  )

  const updateApplication = useCallback(
    async (id: string, patch: Partial<ApplicationDraft>) => {
      const application = await updateApplicationRequest(id, patch)
      dispatch({ type: 'application/updated', application })
      markDataChanged()
      return application
    },
    [markDataChanged],
  )

  const itemsRef = useRef(state.items)
  itemsRef.current = state.items

  const removeApplications = useCallback(
    async (ids: string[]) => {
      const removing = new Set(ids)
      const removed = itemsRef.current.filter((item) => removing.has(item.id))

      await deleteApplicationsRequest(ids)
      dispatch({ type: 'applications/removed', ids })
      markDataChanged()
      return removed
    },
    [markDataChanged],
  )

  const restoreApplications = useCallback(
    async (applications: Application[]) => {
      await restoreApplicationsRequest(applications)
      dispatch({ type: 'applications/restored', applications })
      markDataChanged()
    },
    [markDataChanged],
  )

  const toggleSelection = useCallback((id: string) => {
    dispatch({ type: 'selection/toggled', id })
  }, [])

  const replaceSelection = useCallback((ids: string[]) => {
    dispatch({ type: 'selection/replaced', ids })
  }, [])

  const clearSelection = useCallback(() => {
    dispatch({ type: 'selection/cleared' })
  }, [])

  const snapshot = useMemo<ApplicationsSnapshot>(
    () => ({
      status: state.status,
      items: state.items,
      error: state.error,
      selectedIds: state.selectedIds,
      filters,
      sort,
      tagFacets: facets.tags,
      totalCount: facets.total,
    }),
    [
      state.status,
      state.items,
      state.error,
      state.selectedIds,
      filters,
      sort,
      facets,
    ],
  )

  const actions = useMemo<ApplicationsActions>(
    () => ({
      patchFilters,
      resetFilters,
      toggleStageFilter,
      toggleTagFilter,
      setSort,
      toggleSort,
      refresh,
      createApplication,
      updateApplication,
      removeApplications,
      restoreApplications,
      toggleSelection,
      replaceSelection,
      clearSelection,
    }),
    [
      patchFilters,
      resetFilters,
      toggleStageFilter,
      toggleTagFilter,
      toggleSort,
      refresh,
      createApplication,
      updateApplication,
      removeApplications,
      restoreApplications,
      toggleSelection,
      replaceSelection,
      clearSelection,
    ],
  )

  return (
    <ApplicationsStateContext value={snapshot}>
      <ApplicationsActionsContext value={actions}>{children}</ApplicationsActionsContext>
    </ApplicationsStateContext>
  )
}
