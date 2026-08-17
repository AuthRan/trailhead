import type { Stage } from '../lib/types'
import { STAGE_LABELS } from '../lib/types'

interface StageBadgeProps {
  stage: Stage
  /** Set on dense surfaces where the label is already implied by context. */
  compact?: boolean
}

export function StageBadge({ stage, compact = false }: StageBadgeProps) {
  return (
    <span className={`stage-badge stage-badge--${stage}`}>
      <span className="stage-badge__dot" aria-hidden="true" />
      {compact ? (
        <span className="visually-hidden">{STAGE_LABELS[stage]}</span>
      ) : (
        STAGE_LABELS[stage]
      )}
    </span>
  )
}
