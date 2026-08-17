import { daysSince } from './date'
import type { Application, Stage } from './types'
import { PIPELINE_STAGES, STAGES } from './types'

const STAGE_INDEX = new Map<Stage, number>(STAGES.map((stage, index) => [stage, index]))

/** An application that was rejected still reached whatever stage it got to, so
 * the funnel reads the activity trail rather than the current stage alone. */
export function furthestStage(application: Application): Exclude<Stage, 'rejected'> {
  const visited: Stage[] = [
    'saved',
    ...application.events
      .filter((event) => event.kind === 'stage' && event.to)
      .map((event) => event.to as Stage),
    application.stage,
  ]

  let furthest: Exclude<Stage, 'rejected'> = 'saved'
  for (const stage of visited) {
    if (stage === 'rejected') continue
    if ((STAGE_INDEX.get(stage) ?? 0) > (STAGE_INDEX.get(furthest) ?? 0)) {
      furthest = stage
    }
  }

  return furthest
}

export interface FunnelStep {
  stage: Exclude<Stage, 'rejected'>
  /** Applications that reached this stage at any point. */
  reached: number
  /** Share of the previous step that made it here, 0–1. The first step is 1. */
  conversion: number
}

export function buildFunnel(applications: Application[]): FunnelStep[] {
  const reachedCounts = new Map<Stage, number>()

  for (const application of applications) {
    const furthest = furthestStage(application)
    const furthestIndex = STAGE_INDEX.get(furthest) ?? 0

    for (const stage of PIPELINE_STAGES) {
      if ((STAGE_INDEX.get(stage) ?? 0) <= furthestIndex) {
        reachedCounts.set(stage, (reachedCounts.get(stage) ?? 0) + 1)
      }
    }
  }

  let previous = 0
  return PIPELINE_STAGES.map((stage, index) => {
    const reached = reachedCounts.get(stage) ?? 0
    const conversion = index === 0 || previous === 0 ? 1 : reached / previous
    previous = reached
    return { stage, reached, conversion }
  })
}

/** Days without activity before an in-flight application counts as stalled. */
export const STALE_AFTER_DAYS = 21

export function isStalled(
  application: Application,
  now: Date = new Date(),
  thresholdDays: number = STALE_AFTER_DAYS,
): boolean {
  if (application.stage === 'saved' || application.stage === 'rejected') return false
  if (application.stage === 'offer') return false

  return daysSince(application.updatedAt, now) >= thresholdDays
}

export function findStalled(
  applications: Application[],
  now: Date = new Date(),
  thresholdDays: number = STALE_AFTER_DAYS,
): Application[] {
  return applications
    .filter((application) => isStalled(application, now, thresholdDays))
    .sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt))
}

export interface PipelineSummary {
  total: number
  /** Sent and not yet rejected. */
  active: number
  saved: number
  rejected: number
  offers: number
  /** Share of sent applications that reached a phone screen or beyond, 0–1. */
  responseRate: number
  stalled: number
}

export function summarize(
  applications: Application[],
  now: Date = new Date(),
): PipelineSummary {
  const sent = applications.filter(
    (application) => furthestStage(application) !== 'saved',
  )
  const responded = sent.filter(
    (application) => (STAGE_INDEX.get(furthestStage(application)) ?? 0) >= 2,
  )

  return {
    total: applications.length,
    active: applications.filter(
      (application) => application.stage !== 'rejected' && application.stage !== 'saved',
    ).length,
    saved: applications.filter((application) => application.stage === 'saved').length,
    rejected: applications.filter((application) => application.stage === 'rejected')
      .length,
    offers: applications.filter((application) => application.stage === 'offer').length,
    responseRate: sent.length === 0 ? 0 : responded.length / sent.length,
    stalled: findStalled(applications, now).length,
  }
}

export interface SourceBreakdown {
  source: string
  total: number
  responded: number
}

/** Which channels actually produce conversations, not just submissions. */
export function breakdownBySource(applications: Application[]): SourceBreakdown[] {
  const bySource = new Map<string, SourceBreakdown>()

  for (const application of applications) {
    const entry = bySource.get(application.source) ?? {
      source: application.source,
      total: 0,
      responded: 0,
    }

    entry.total += 1
    if ((STAGE_INDEX.get(furthestStage(application)) ?? 0) >= 2) {
      entry.responded += 1
    }

    bySource.set(application.source, entry)
  }

  return [...bySource.values()].sort(
    (a, b) => b.total - a.total || a.source.localeCompare(b.source),
  )
}
