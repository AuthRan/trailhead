import { memo } from 'react'
import { StageBadge } from './StageBadge'
import { formatDate, formatRelative } from '../lib/date'
import type { Application } from '../lib/types'

interface ApplicationRowProps {
  application: Application
  selected: boolean
  stalled: boolean
  onToggleSelect: (id: string) => void
  onOpen: (id: string) => void
}

function ApplicationRowComponent({
  application,
  selected,
  stalled,
  onToggleSelect,
  onOpen,
}: ApplicationRowProps) {
  return (
    <tr className={selected ? 'table__row table__row--selected' : 'table__row'}>
      <td className="table__cell table__cell--select">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(application.id)}
          aria-label={`Select ${application.company} — ${application.role}`}
        />
      </td>

      <td className="table__cell">
        <button
          type="button"
          className="table__open"
          onClick={() => onOpen(application.id)}
        >
          <span className="table__company">{application.company}</span>
          <span className="table__role">{application.role}</span>
        </button>
      </td>

      <td className="table__cell">
        <StageBadge stage={application.stage} />
      </td>

      <td className="table__cell">
        <span className="table__location">{application.location}</span>
        {application.remote ? <span className="table__pill">Remote</span> : null}
      </td>

      <td className="table__cell">
        <ul className="table__tags">
          {application.tags.map((tag) => (
            <li key={tag} className="table__tag">
              {tag}
            </li>
          ))}
        </ul>
      </td>

      <td className="table__cell table__cell--date">
        {formatDate(application.appliedOn)}
      </td>

      <td className="table__cell table__cell--date">
        <span>{formatRelative(application.updatedAt)}</span>
        {stalled ? (
          <span className="table__flag">
            <span aria-hidden="true">!</span> No reply
          </span>
        ) : null}
      </td>
    </tr>
  )
}

/** Rows are pure functions of their application, so re-rendering the table for
 * a selection change should not re-render every row. */
export const ApplicationRow = memo(ApplicationRowComponent)
