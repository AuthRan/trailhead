import { useEffect, useMemo, useRef } from 'react'
import { ApplicationRow } from './ApplicationRow'
import { useApplications, useApplicationsActions } from '../state/ApplicationsContext'
import { isStalled } from '../lib/stats'
import type { SortKey } from '../lib/types'

interface Column {
  key: SortKey | null
  label: string
  className?: string
}

const COLUMNS: Column[] = [
  { key: 'company', label: 'Company' },
  { key: 'stage', label: 'Stage' },
  { key: null, label: 'Location' },
  { key: null, label: 'Tags' },
  { key: 'appliedOn', label: 'Applied', className: 'table__cell--date' },
  { key: 'updatedAt', label: 'Last activity', className: 'table__cell--date' },
]

interface ApplicationTableProps {
  onOpen: (id: string) => void
}

export function ApplicationTable({ onOpen }: ApplicationTableProps) {
  const { items, selectedIds, sort } = useApplications()
  const { toggleSort, toggleSelection, replaceSelection, clearSelection } =
    useApplicationsActions()
  const selectAllRef = useRef<HTMLInputElement>(null)

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allSelected = items.length > 0 && selectedSet.size === items.length
  const someSelected = selectedSet.size > 0 && !allSelected

  // `indeterminate` is a DOM property with no HTML attribute, so it has to be
  // written directly onto the node.
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  // Derived during render: "stalled" only has to be right for the paint the
  // reader is looking at.
  const now = new Date()

  return (
    <div className="table-wrapper">
      <table className="table">
        <caption className="visually-hidden">
          Tracked applications, sorted by {sort.key} {sort.direction === 'asc' ? 'ascending' : 'descending'}
        </caption>

        <thead>
          <tr>
            <th scope="col" className="table__cell--select">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allSelected}
                onChange={() =>
                  allSelected
                    ? clearSelection()
                    : replaceSelection(items.map((item) => item.id))
                }
                aria-label={allSelected ? 'Clear selection' : 'Select all applications'}
              />
            </th>

            {COLUMNS.map((column) => {
              if (!column.key) {
                return (
                  <th key={column.label} scope="col" className={column.className}>
                    {column.label}
                  </th>
                )
              }

              const active = sort.key === column.key
              return (
                <th
                  key={column.label}
                  scope="col"
                  className={column.className}
                  aria-sort={
                    active
                      ? sort.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    type="button"
                    className="table__sort"
                    onClick={() => toggleSort(column.key as SortKey)}
                  >
                    {column.label}
                    <span className="table__sort-icon" aria-hidden="true">
                      {active ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {items.map((application) => (
            <ApplicationRow
              key={application.id}
              application={application}
              selected={selectedSet.has(application.id)}
              stalled={isStalled(application, now)}
              onToggleSelect={toggleSelection}
              onOpen={onOpen}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
