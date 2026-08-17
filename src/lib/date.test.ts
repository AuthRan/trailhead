import { describe, expect, it } from 'vitest'
import { daysBetween, formatDate, formatRelative, toDateInputValue } from './date'

const NOW = new Date('2026-06-15T12:00:00.000Z')

describe('daysBetween', () => {
  it('counts whole days forward', () => {
    expect(daysBetween('2026-06-01T00:00:00.000Z', '2026-06-04T00:00:00.000Z')).toBe(3)
  })

  it('is negative when the range runs backwards', () => {
    expect(daysBetween('2026-06-04T00:00:00.000Z', '2026-06-01T00:00:00.000Z')).toBe(-3)
  })
})

describe('formatRelative', () => {
  it.each([
    ['2026-06-15T09:00:00.000Z', 'today'],
    ['2026-06-14T09:00:00.000Z', 'yesterday'],
    ['2026-06-10T12:00:00.000Z', '5 days ago'],
    ['2026-05-01T12:00:00.000Z', 'last month'],
    ['2026-01-01T12:00:00.000Z', '5 months ago'],
    ['2025-01-01T12:00:00.000Z', 'last year'],
  ])('renders %s as %s', (value, expected) => {
    expect(formatRelative(value, NOW)).toBe(expected)
  })
})

describe('formatDate', () => {
  it('formats an ISO date', () => {
    expect(formatDate('2026-03-12T00:00:00.000Z')).toBe('12 Mar 2026')
  })

  it('renders a dash for missing or unparseable values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('not a date')).toBe('—')
  })
})

describe('toDateInputValue', () => {
  it('produces a yyyy-mm-dd string', () => {
    expect(toDateInputValue(new Date(2026, 2, 5))).toBe('2026-03-05')
  })

  it('returns an empty string for null', () => {
    expect(toDateInputValue(null)).toBe('')
  })
})
