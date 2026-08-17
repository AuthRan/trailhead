import { useState } from 'react'
import { ApplicationTable } from '../components/ApplicationTable'
import { BulkActionsBar } from '../components/BulkActionsBar'
import { DetailDrawer } from '../components/DetailDrawer'
import { FilterBar } from '../components/FilterBar'
import { useApplications, useApplicationsActions } from '../state/ApplicationsContext'

function LoadingRows() {
  return (
    <ul className="loading-rows" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index} className="table__skeleton" />
      ))}
    </ul>
  )
}

export function ListPage() {
  const { items, status, error, totalCount, filters } = useApplications()
  const { refresh, resetFilters } = useApplicationsActions()
  const [openId, setOpenId] = useState<string | 'new' | null>(null)

  const isFiltered =
    filters.query !== '' ||
    filters.stages.length > 0 ||
    filters.tags.length > 0 ||
    filters.remoteOnly

  const showSkeleton = status === 'loading' && items.length === 0
  const showEmpty = status === 'ready' && items.length === 0

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Applications</h1>
          <p className="page-header__subtitle">
            {isFiltered ? `${items.length} of ${totalCount} shown` : `${totalCount} tracked in this workspace`}
          </p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="button button--primary" onClick={() => setOpenId('new')}>
            Add application
          </button>
        </div>
      </div>

      <FilterBar />
      <BulkActionsBar />

      {status === 'error' ? (
        <div className="error-banner" role="alert">
          <span>{error ?? 'Something went wrong loading your applications.'}</span>
          <button type="button" className="button" onClick={refresh}>
            Try again
          </button>
        </div>
      ) : (
        <section className="panel">
          {showSkeleton ? (
            <div className="panel__body">
              <LoadingRows />
              <p className="visually-hidden" role="status">
                Loading applications
              </p>
            </div>
          ) : showEmpty ? (
            <div className="panel__body empty-state">
              <h2 className="empty-state__title">
                {isFiltered ? 'No applications match these filters' : 'Nothing tracked yet'}
              </h2>
              <p>
                {isFiltered
                  ? 'Try widening the search, or clear the filters to see everything.'
                  : 'Add the first role you are chasing to start building a pipeline.'}
              </p>
              {isFiltered ? (
                <button type="button" className="button" onClick={resetFilters}>
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <ApplicationTable onOpen={setOpenId} />
          )}
        </section>
      )}

      <DetailDrawer openId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}
