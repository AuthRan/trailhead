import { useId, useState } from 'react'
import { useApplications, useApplicationsActions } from '../state/ApplicationsContext'
import { useToasts } from '../state/ToastContext'
import { STAGES, STAGE_LABELS } from '../lib/types'
import type { Stage } from '../lib/types'

export function BulkActionsBar() {
  const { selectedIds } = useApplications()
  const { updateApplication, removeApplications, restoreApplications, clearSelection } =
    useApplicationsActions()
  const { showToast } = useToasts()
  const stageSelectId = useId()
  const [busy, setBusy] = useState(false)

  if (selectedIds.length === 0) return null

  const count = selectedIds.length
  const noun = count === 1 ? 'application' : 'applications'

  async function moveToStage(stage: Stage) {
    setBusy(true)
    try {
      // The updates are independent, so they go out together rather than
      // waiting on each other.
      await Promise.all(selectedIds.map((id) => updateApplication(id, { stage })))
      showToast(`Moved ${count} ${noun} to ${STAGE_LABELS[stage]}`, {
        tone: 'success',
      })
      clearSelection()
    } catch {
      showToast('Could not update every application', { tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }

  async function removeSelected() {
    setBusy(true)
    try {
      const removed = await removeApplications(selectedIds)
      showToast(`Deleted ${removed.length} ${noun}`, {
        tone: 'danger',
        action: {
          label: 'Undo',
          onAction: () => {
            void restoreApplications(removed)
          },
        },
      })
    } catch {
      showToast('Could not delete the selected applications', { tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bulk-bar" role="region" aria-label="Selection actions">
      <p className="bulk-bar__count">
        {count} {noun} selected
      </p>

      <div className="bulk-bar__actions">
        <label className="visually-hidden" htmlFor={stageSelectId}>
          Move selected to stage
        </label>
        <select
          id={stageSelectId}
          className="select"
          value=""
          disabled={busy}
          onChange={(event) => {
            const stage = event.target.value as Stage
            if (stage) void moveToStage(stage)
          }}
        >
          <option value="">Move to…</option>
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="button button--danger"
          disabled={busy}
          onClick={() => void removeSelected()}
        >
          Delete
        </button>

        <button
          type="button"
          className="button button--ghost"
          disabled={busy}
          onClick={clearSelection}
        >
          Clear selection
        </button>
      </div>
    </div>
  )
}
