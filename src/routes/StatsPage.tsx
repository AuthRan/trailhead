import { useMemo } from 'react'
import { StageBadge } from '../components/StageBadge'
import { formatRelative } from '../lib/date'
import { breakdownBySource, buildFunnel, findStalled, summarize } from '../lib/stats'
import { STAGE_SHORT_LABELS } from '../lib/types'
import { useApplications, useApplicationsActions } from '../state/ApplicationsContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

function percent(value: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 0 }).format(value)
}

export function StatsPage() {
  useDocumentTitle('Stats')

  const { items, status, error } = useApplications()
  const { refresh } = useApplicationsActions()
  const { summary, funnel, sources, stalled } = useMemo(
    () => ({
      summary: summarize(items),
      funnel: buildFunnel(items),
      sources: breakdownBySource(items),
      stalled: findStalled(items),
    }),
    [items],
  )

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Stats</h1>
          <p className="page-header__subtitle">Where your search is converting and slowing down.</p>
        </div>
      </div>

      {status === 'error' ? (
        <div className="error-banner" role="alert">
          <span>{error ?? 'Something went wrong loading statistics.'}</span>
          <button type="button" className="button" onClick={refresh}>Try again</button>
        </div>
      ) : null}
      {status === 'loading' && items.length === 0 ? <p role="status">Loading statistics…</p> : null}

      <div className="stats-summary" aria-label="Pipeline summary">
        <article className="stat-card"><span>Total tracked</span><strong>{summary.total}</strong></article>
        <article className="stat-card"><span>Active applications</span><strong>{summary.active}</strong></article>
        <article className="stat-card"><span>Response rate</span><strong>{percent(summary.responseRate)}</strong></article>
        <article className="stat-card"><span>Needs follow-up</span><strong>{summary.stalled}</strong></article>
      </div>

      <div className="stats-grid">
        <section className="panel">
          <header className="panel__header"><h2 className="panel__title">Pipeline funnel</h2></header>
          <div className="panel__body funnel">
            {funnel.map((step) => (
              <div className="funnel__row" key={step.stage}>
                <div className="funnel__label"><span>{STAGE_SHORT_LABELS[step.stage]}</span><strong>{step.reached}</strong></div>
                <div className="funnel__track" aria-hidden="true"><span style={{ width: `${summary.total ? (step.reached / summary.total) * 100 : 0}%` }} /></div>
                <span className="funnel__conversion">{step.stage === 'saved' ? 'Starting point' : `${percent(step.conversion)} conversion`}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <header className="panel__header"><h2 className="panel__title">Source performance</h2></header>
          <div className="panel__body">
            {sources.length ? <ul className="source-list">{sources.map((source) => (
              <li key={source.source}><span>{source.source}</span><span>{source.total} tracked · {percent(source.total ? source.responded / source.total : 0)} response</span></li>
            ))}</ul> : <p className="page-header__subtitle">Add applications to see source performance.</p>}
          </div>
        </section>

        <section className="panel stats-grid__wide">
          <header className="panel__header"><h2 className="panel__title">Needs follow-up</h2></header>
          <div className="panel__body">
            {stalled.length ? <ul className="stalled-list">{stalled.map((application) => (
              <li key={application.id}><div><strong>{application.company}</strong><span>{application.role}</span></div><StageBadge stage={application.stage} /><span>Updated {formatRelative(application.updatedAt)}</span></li>
            ))}</ul> : <p className="page-header__subtitle">No active applications have gone quiet for 21 days.</p>}
          </div>
        </section>
      </div>
    </>
  )
}
