import { useCallback, useState } from 'react'
import { DetailDrawer } from '../components/DetailDrawer'
import { StageBadge } from '../components/StageBadge'
import { formatRelative } from '../lib/date'
import { STAGES, STAGE_SHORT_LABELS, type Application, type Stage } from '../lib/types'
import { useApplications, useApplicationsActions } from '../state/ApplicationsContext'
import { useToasts } from '../state/ToastContext'

function BoardCard({
  application,
  onOpen,
  onMove,
  moving,
}: {
  application: Application
  onOpen: (id: string) => void
  onMove: (application: Application, direction: -1 | 1) => void
  moving: boolean
}) {
  const stageIndex = STAGES.indexOf(application.stage)

  return (
    <article className="board-card">
      <button type="button" className="board-card__open" onClick={() => onOpen(application.id)}>
        <strong>{application.company}</strong>
        <span>{application.role}</span>
      </button>
      <div className="board-card__meta">
        <span>{application.remote ? 'Remote' : application.location}</span>
        <span>Updated {formatRelative(application.updatedAt)}</span>
      </div>
      <div className="board-card__actions" aria-label={`Move ${application.company}`}>
        <button
          type="button"
          className="button button--small"
          disabled={moving || stageIndex === 0}
          onClick={() => onMove(application, -1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="button button--small"
          disabled={moving || stageIndex === STAGES.length - 1}
          onClick={() => onMove(application, 1)}
        >
          Next
        </button>
      </div>
    </article>
  )
}

export function BoardPage() {
  const { items, status, error } = useApplications()
  const { updateApplication, refresh } = useApplicationsActions()
  const { showToast } = useToasts()
  const [openId, setOpenId] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)

  const moveApplication = useCallback(
    async (application: Application, direction: -1 | 1) => {
      const index = STAGES.indexOf(application.stage)
      const nextStage = STAGES[index + direction] as Stage | undefined
      if (!nextStage || movingId) return

      setMovingId(application.id)
      try {
        await updateApplication(application.id, { stage: nextStage })
        showToast(`${application.company} moved to ${STAGE_SHORT_LABELS[nextStage]}`, {
          tone: 'success',
        })
      } catch {
        showToast(`Could not move ${application.company}`, { tone: 'danger' })
      } finally {
        setMovingId(null)
      }
    },
    [movingId, showToast, updateApplication],
  )

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Board</h1>
          <p className="page-header__subtitle">Move applications through your pipeline.</p>
        </div>
      </div>

      {status === 'error' ? (
        <div className="error-banner" role="alert">
          <span>{error ?? 'Something went wrong loading your applications.'}</span>
          <button type="button" className="button" onClick={refresh}>Try again</button>
        </div>
      ) : status === 'loading' && items.length === 0 ? (
        <p role="status" className="page-header__subtitle">Loading applications…</p>
      ) : (
        <section className="board" aria-label="Application pipeline" aria-busy={movingId !== null}>
          {STAGES.map((stage) => {
            const applications = items.filter((item) => item.stage === stage)
            return (
              <section key={stage} className="board__column" aria-labelledby={`stage-${stage}`}>
                <header className="board__column-header">
                  <h2 id={`stage-${stage}`}><StageBadge stage={stage} /></h2>
                  <span className="board__count">{applications.length}</span>
                </header>
                <div className="board__cards">
                  {applications.map((application) => (
                    <BoardCard
                      key={application.id}
                      application={application}
                      onOpen={setOpenId}
                      onMove={moveApplication}
                      moving={movingId !== null}
                    />
                  ))}
                  {applications.length === 0 ? <p className="board__empty">No applications</p> : null}
                </div>
              </section>
            )
          })}
        </section>
      )}

      <DetailDrawer openId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}
