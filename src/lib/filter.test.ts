import { describe, expect, it } from 'vitest'
import {
  collectTags,
  filterApplications,
  matchesQuery,
  sortApplications,
} from './filter'
import { createSeedApplications } from './seed'
import { EMPTY_FILTERS } from './types'
import type { Application } from './types'

const NOW = new Date('2026-06-15T12:00:00.000Z')
const applications = createSeedApplications(NOW)

function companies(list: Application[]): string[] {
  return list.map((application) => application.company)
}

describe('matchesQuery', () => {
  const [northwind] = applications

  it('matches an empty query', () => {
    expect(matchesQuery(northwind, '   ')).toBe(true)
  })

  it('matches case-insensitively across fields', () => {
    expect(matchesQuery(northwind, 'NORTHWIND')).toBe(true)
    expect(matchesQuery(northwind, 'berlin')).toBe(true)
    expect(matchesQuery(northwind, 'design-systems')).toBe(true)
  })

  it('requires every term to match', () => {
    expect(matchesQuery(northwind, 'northwind berlin')).toBe(true)
    expect(matchesQuery(northwind, 'northwind lisbon')).toBe(false)
  })
})

describe('filterApplications', () => {
  it('returns everything with empty filters', () => {
    expect(filterApplications(applications, EMPTY_FILTERS)).toHaveLength(
      applications.length,
    )
  })

  it('filters by stage', () => {
    const result = filterApplications(applications, {
      ...EMPTY_FILTERS,
      stages: ['offer', 'onsite'],
    })

    expect(companies(result)).toEqual(['Northwind Labs', 'Vellum Health', 'Tessellate'])
  })

  it('requires all selected tags to be present', () => {
    const result = filterApplications(applications, {
      ...EMPTY_FILTERS,
      tags: ['react', 'accessibility'],
    })

    expect(companies(result)).toEqual(['Vellum Health', 'Orchard Systems'])
  })

  it('filters to remote roles', () => {
    const result = filterApplications(applications, {
      ...EMPTY_FILTERS,
      remoteOnly: true,
    })

    expect(result.every((application) => application.remote)).toBe(true)
    expect(result.length).toBeLessThan(applications.length)
  })

  it('combines a query with the other filters', () => {
    const result = filterApplications(applications, {
      ...EMPTY_FILTERS,
      query: 'engineer',
      stages: ['screen'],
      remoteOnly: true,
    })

    expect(companies(result)).toEqual(['Cobalt Interactive'])
  })
})

describe('sortApplications', () => {
  it('sorts by company name ascending', () => {
    const result = sortApplications(applications, { key: 'company', direction: 'asc' })

    expect(companies(result).slice(0, 3)).toEqual([
      'Brightsound',
      'Cobalt Interactive',
      'Fathom Six',
    ])
  })

  it('sorts by pipeline stage order, not alphabetically', () => {
    const result = sortApplications(applications, { key: 'stage', direction: 'asc' })

    expect(result[0].stage).toBe('saved')
    expect(result[result.length - 1].stage).toBe('rejected')
  })

  it('keeps applications without an applied date last in both directions', () => {
    const ascending = sortApplications(applications, {
      key: 'appliedOn',
      direction: 'asc',
    })
    const descending = sortApplications(applications, {
      key: 'appliedOn',
      direction: 'desc',
    })

    expect(ascending[ascending.length - 1].appliedOn).toBeNull()
    expect(descending[descending.length - 1].appliedOn).toBeNull()
  })

  it('does not mutate the input array', () => {
    const original = [...applications]
    sortApplications(applications, { key: 'company', direction: 'desc' })

    expect(applications).toEqual(original)
  })
})

describe('collectTags', () => {
  it('counts tags and orders by frequency', () => {
    const tags = collectTags(applications)

    expect(tags[0]).toEqual({ tag: 'react', count: 7 })
    expect(tags.map((entry) => entry.tag)).toContain('accessibility')
  })
})
