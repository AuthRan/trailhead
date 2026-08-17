import { useId } from 'react'
import { SearchInput } from './SearchInput'
import { useApplications, useApplicationsActions } from '../state/ApplicationsContext'
import { STAGES, STAGE_LABELS } from '../lib/types'

const MAX_VISIBLE_TAGS = 8

export function FilterBar() {
  const { filters, items, totalCount, tagFacets, status } = useApplications()
  const { toggleStageFilter, toggleTagFilter, patchFilters, resetFilters } =
    useApplicationsActions()
  const remoteId = useId()

  const hasActiveFilters =
    filters.query !== '' ||
    filters.stages.length > 0 ||
    filters.tags.length > 0 ||
    filters.remoteOnly

  // Tags a person has selected stay visible even if they fall outside the most
  // common ones, so a filter is never hidden behind a truncation.
  const visibleTags = tagFacets
    .slice(0, MAX_VISIBLE_TAGS)
    .concat(
      tagFacets.filter(
        (facet, index) => index >= MAX_VISIBLE_TAGS && filters.tags.includes(facet.tag),
      ),
    )

  return (
    <section className="filter-bar" aria-label="Filters">
      <div className="filter-bar__row">
        <SearchInput />

        <div className="filter-bar__group" role="group" aria-label="Stage">
          {STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              className="chip"
              aria-pressed={filters.stages.includes(stage)}
              onClick={() => toggleStageFilter(stage)}
            >
              {STAGE_LABELS[stage]}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-bar__row">
        <div className="filter-bar__group" role="group" aria-label="Tags">
          {visibleTags.map((facet) => (
            <button
              key={facet.tag}
              type="button"
              className="chip"
              aria-pressed={filters.tags.includes(facet.tag)}
              onClick={() => toggleTagFilter(facet.tag)}
            >
              {facet.tag}
              <span className="chip__count" aria-hidden="true">
                {facet.count}
              </span>
              <span className="visually-hidden">{facet.count} applications</span>
            </button>
          ))}
        </div>

        <div className="checkbox-row">
          <input
            id={remoteId}
            type="checkbox"
            checked={filters.remoteOnly}
            onChange={(event) => patchFilters({ remoteOnly: event.target.checked })}
          />
          <label htmlFor={remoteId}>Remote only</label>
        </div>

        {hasActiveFilters ? (
          <button type="button" className="button button--ghost" onClick={resetFilters}>
            Clear filters
          </button>
        ) : null}
      </div>

      <p className="filter-bar__summary" role="status">
        {status === 'loading'
          ? 'Updating results…'
          : `Showing ${items.length} of ${totalCount} applications`}
      </p>
    </section>
  )
}
