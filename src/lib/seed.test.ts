import { describe, expect, it } from 'vitest'
import { createSeedApplications } from './seed'
import { daysSince } from './date'
import { STAGES } from './types'

const NOW = new Date('2026-06-01T12:00:00.000Z')

describe('createSeedApplications', () => {
  it('is deterministic for a given instant', () => {
    expect(createSeedApplications(NOW)).toEqual(createSeedApplications(NOW))
  })

  it('gives every application a unique id', () => {
    const ids = createSeedApplications(NOW).map((application) => application.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every activity event a unique id', () => {
    const eventIds = createSeedApplications(NOW).flatMap((application) =>
      application.events.map((event) => event.id),
    )

    expect(new Set(eventIds).size).toBe(eventIds.length)
  })

  it('only uses known stages', () => {
    for (const application of createSeedApplications(NOW)) {
      expect(STAGES).toContain(application.stage)
    }
  })

  it('leaves "applied on" empty for applications that were never sent', () => {
    for (const application of createSeedApplications(NOW)) {
      if (application.stage === 'saved') {
        expect(application.appliedOn).toBeNull()
      } else {
        expect(application.appliedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    }
  })

  it('never reports an update older than its own creation', () => {
    for (const application of createSeedApplications(NOW)) {
      expect(Date.parse(application.updatedAt)).toBeGreaterThanOrEqual(
        Date.parse(application.createdAt),
      )
    }
  })

  it('dates the workspace relative to now rather than to a fixed calendar', () => {
    const later = new Date('2027-01-01T12:00:00.000Z')
    const [first] = createSeedApplications(NOW)
    const [firstLater] = createSeedApplications(later)

    // Same age, different absolute dates — a fresh install should always look
    // like a search in progress.
    expect(daysSince(first.createdAt, NOW)).toBe(
      daysSince(firstLater.createdAt, later),
    )
    expect(firstLater.createdAt).not.toBe(first.createdAt)
  })

  it('opens every activity trail with a creation event', () => {
    for (const application of createSeedApplications(NOW)) {
      expect(application.events[0]?.kind).toBe('created')
      expect(application.events[0]?.at).toBe(application.createdAt)
    }
  })

  it('records the move into "applied" for everything that was sent', () => {
    for (const application of createSeedApplications(NOW)) {
      if (application.appliedOn === null) continue

      expect(application.events).toContainEqual(
        expect.objectContaining({ kind: 'stage', from: 'saved', to: 'applied' }),
      )
    }
  })

  it('records a further stage move for applications past "applied"', () => {
    for (const application of createSeedApplications(NOW)) {
      if (application.stage === 'saved' || application.stage === 'applied') continue

      expect(application.events).toContainEqual(
        expect.objectContaining({ kind: 'stage', to: application.stage }),
      )
    }
  })

  it('covers the whole pipeline so the board and funnel have something to show', () => {
    const stages = new Set(
      createSeedApplications(NOW).map((application) => application.stage),
    )

    expect([...stages].sort()).toEqual([...STAGES].sort())
  })
})
