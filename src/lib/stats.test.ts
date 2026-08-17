import { describe, expect, it } from 'vitest'
import {
  breakdownBySource,
  buildFunnel,
  findStalled,
  furthestStage,
  isStalled,
  summarize,
} from './stats'
import { createSeedApplications } from './seed'
import type { Application } from './types'

const NOW = new Date('2026-06-15T12:00:00.000Z')
const applications = createSeedApplications(NOW)

function byCompany(company: string): Application {
  const found = applications.find((application) => application.company === company)
  if (!found) throw new Error(`no seed application for ${company}`)
  return found
}

describe('furthestStage', () => {
  it('returns the current stage for a live application', () => {
    expect(furthestStage(byCompany('Northwind Labs'))).toBe('onsite')
  })

  it('remembers the stage a rejected application reached', () => {
    // Ledgerbird was rejected after applying, so it still counts as "applied".
    expect(furthestStage(byCompany('Ledgerbird'))).toBe('applied')
  })

  it('treats a saved application as having reached nothing', () => {
    expect(furthestStage(byCompany('Studio Kestrel'))).toBe('saved')
  })
})

describe('buildFunnel', () => {
  const funnel = buildFunnel(applications)

  it('covers every pipeline stage in order', () => {
    expect(funnel.map((step) => step.stage)).toEqual([
      'saved',
      'applied',
      'screen',
      'onsite',
      'offer',
    ])
  })

  it('never increases as the pipeline narrows', () => {
    for (let index = 1; index < funnel.length; index += 1) {
      expect(funnel[index].reached).toBeLessThanOrEqual(funnel[index - 1].reached)
    }
  })

  it('counts every application at the first step', () => {
    expect(funnel[0].reached).toBe(applications.length)
    expect(funnel[0].conversion).toBe(1)
  })

  it('expresses conversion relative to the previous step', () => {
    const applied = funnel[1]
    const screened = funnel[2]

    expect(screened.conversion).toBeCloseTo(screened.reached / applied.reached, 10)
  })

  it('returns zeroed steps for an empty pipeline', () => {
    expect(buildFunnel([]).every((step) => step.reached === 0)).toBe(true)
  })
})

describe('isStalled', () => {
  it('flags in-flight applications with no recent activity', () => {
    expect(isStalled(byCompany('Meridian Analytics'), NOW)).toBe(true)
  })

  it('ignores saved, rejected, and offer-stage applications', () => {
    expect(isStalled(byCompany('Studio Kestrel'), NOW)).toBe(false)
    expect(isStalled(byCompany('Fathom Six'), NOW)).toBe(false)
    expect(isStalled(byCompany('Vellum Health'), NOW)).toBe(false)
  })

  it('respects a custom threshold', () => {
    const orchard = byCompany('Orchard Systems')

    expect(isStalled(orchard, NOW)).toBe(false)
    expect(isStalled(orchard, NOW, 3)).toBe(true)
  })
})

describe('findStalled', () => {
  it('orders the most neglected application first', () => {
    const stalled = findStalled(applications, NOW)

    expect(stalled.length).toBeGreaterThan(0)
    expect(stalled[0].company).toBe('Meridian Analytics')
  })
})

describe('summarize', () => {
  const summary = summarize(applications, NOW)

  it('counts the pipeline', () => {
    expect(summary.total).toBe(12)
    expect(summary.saved).toBe(2)
    expect(summary.rejected).toBe(2)
    expect(summary.offers).toBe(1)
    expect(summary.active).toBe(8)
  })

  it('reports a response rate between zero and one', () => {
    expect(summary.responseRate).toBeGreaterThan(0)
    expect(summary.responseRate).toBeLessThanOrEqual(1)
  })

  it('handles an empty pipeline without dividing by zero', () => {
    expect(summarize([], NOW).responseRate).toBe(0)
  })
})

describe('breakdownBySource', () => {
  it('ranks sources by volume and tracks responses', () => {
    const breakdown = breakdownBySource(applications)

    expect(breakdown[0].total).toBeGreaterThanOrEqual(breakdown[1].total)
    const referral = breakdown.find((entry) => entry.source === 'Referral')
    expect(referral).toMatchObject({ total: 3, responded: 2 })
  })
})
