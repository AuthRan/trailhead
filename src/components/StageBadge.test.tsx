import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StageBadge } from './StageBadge'
import { STAGES, STAGE_LABELS } from '../lib/types'

describe('StageBadge', () => {
  it('shows the full stage label by default', () => {
    render(<StageBadge stage="onsite" />)

    expect(screen.getByText('Onsite')).toBeInTheDocument()
  })

  it('keeps the label readable by assistive tech when compact', () => {
    const { container } = render(<StageBadge stage="screen" compact />)

    // Compact hides the text visually, but the stage must still be announced —
    // colour alone is not an acceptable status cue.
    const label = screen.getByText('Phone screen')
    expect(label).toHaveClass('visually-hidden')
    expect(container.textContent).toContain('Phone screen')
  })

  it('marks the colour dot as decorative', () => {
    const { container } = render(<StageBadge stage="offer" />)

    expect(container.querySelector('.stage-badge__dot')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('carries a per-stage modifier class for every stage', () => {
    for (const stage of STAGES) {
      const { container, unmount } = render(<StageBadge stage={stage} />)

      expect(container.querySelector('.stage-badge')).toHaveClass(
        `stage-badge--${stage}`,
      )
      unmount()
    }
  })

  it('renders a label for every stage in the pipeline', () => {
    for (const stage of STAGES) {
      const { unmount } = render(<StageBadge stage={stage} />)

      expect(screen.getByText(STAGE_LABELS[stage])).toBeInTheDocument()
      unmount()
    }
  })
})
