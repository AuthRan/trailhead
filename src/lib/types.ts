/** Ordered pipeline stages. The order is meaningful: it drives the board
 * columns, the funnel chart, and the "furthest stage reached" calculation. */
export const STAGES = [
  'saved',
  'applied',
  'screen',
  'onsite',
  'offer',
  'rejected',
] as const

export type Stage = (typeof STAGES)[number]

/** Stages an application passes through while it is still alive. */
export const PIPELINE_STAGES = STAGES.filter(
  (stage): stage is Exclude<Stage, 'rejected'> => stage !== 'rejected',
)

export const STAGE_LABELS: Record<Stage, string> = {
  saved: 'Saved',
  applied: 'Applied',
  screen: 'Phone screen',
  onsite: 'Onsite',
  offer: 'Offer',
  rejected: 'Rejected',
}

/** Short labels for space-constrained surfaces such as board columns. */
export const STAGE_SHORT_LABELS: Record<Stage, string> = {
  saved: 'Saved',
  applied: 'Applied',
  screen: 'Screen',
  onsite: 'Onsite',
  offer: 'Offer',
  rejected: 'Rejected',
}

export type ActivityKind = 'created' | 'stage' | 'note' | 'edited'

export interface ActivityEvent {
  id: string
  /** ISO 8601 timestamp. */
  at: string
  kind: ActivityKind
  /** Present on `stage` events. */
  from?: Stage
  to?: Stage
  /** Present on `note` events. */
  note?: string
}

export interface Application {
  id: string
  company: string
  role: string
  location: string
  remote: boolean
  stage: Stage
  /** Annual base salary range in whole units of `currency`. */
  salaryMin: number | null
  salaryMax: number | null
  currency: string
  /** Where the role was found, e.g. "Referral", "LinkedIn". */
  source: string
  tags: string[]
  url: string
  notes: string
  /** ISO date (yyyy-mm-dd) the application was sent, null while saved. */
  appliedOn: string | null
  createdAt: string
  updatedAt: string
  events: ActivityEvent[]
}

/** The subset of an application a person edits directly. Everything else
 * (timestamps, activity trail) is maintained by the reducer. */
export type ApplicationDraft = Omit<
  Application,
  'id' | 'createdAt' | 'updatedAt' | 'events'
>

export type SortKey = 'updatedAt' | 'company' | 'role' | 'stage' | 'appliedOn'
export type SortDirection = 'asc' | 'desc'

export interface SortState {
  key: SortKey
  direction: SortDirection
}

export interface Filters {
  query: string
  stages: Stage[]
  tags: string[]
  remoteOnly: boolean
}

export const EMPTY_FILTERS: Filters = {
  query: '',
  stages: [],
  tags: [],
  remoteOnly: false,
}
