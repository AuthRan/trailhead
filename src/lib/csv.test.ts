import { describe, expect, it } from 'vitest'
import { applicationsToCsv, csvFilename } from './csv'
import { createSeedApplications } from './seed'
import type { Application } from './types'

const NOW = new Date('2026-06-01T12:00:00.000Z')

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: 'app_1',
    company: 'Northwind Labs',
    role: 'Senior Frontend Engineer',
    location: 'Berlin, DE',
    remote: true,
    stage: 'onsite',
    salaryMin: 85000,
    salaryMax: 105000,
    currency: 'EUR',
    source: 'Referral',
    tags: ['react', 'design-systems'],
    url: 'https://example.com/role',
    notes: 'Referred by Priya.',
    appliedOn: '2026-04-24',
    createdAt: '2026-04-21T09:00:00.000Z',
    updatedAt: '2026-05-29T09:00:00.000Z',
    events: [],
    ...overrides,
  }
}

function rowsOf(csv: string): string[] {
  return csv.split('\r\n')
}

describe('applicationsToCsv', () => {
  it('emits a header row even with nothing to export', () => {
    const csv = applicationsToCsv([])

    expect(rowsOf(csv)).toHaveLength(1)
    expect(csv).toMatch(/^Company,Role,Location,Remote,Stage,/)
  })

  it('writes one row per application', () => {
    const csv = applicationsToCsv(createSeedApplications(NOW))

    expect(rowsOf(csv)).toHaveLength(13)
  })

  it('uses CRLF line endings', () => {
    const csv = applicationsToCsv([makeApplication()])

    expect(csv).toContain('\r\n')
    expect(csv.split('\r\n')).toHaveLength(2)
  })

  it('writes plain fields unquoted', () => {
    const csv = applicationsToCsv([makeApplication({ company: 'Northwind' })])

    expect(rowsOf(csv)[1]).toMatch(/^Northwind,/)
  })

  it('quotes fields containing the separator', () => {
    const csv = applicationsToCsv([makeApplication({ location: 'Berlin, DE' })])

    expect(csv).toContain('"Berlin, DE"')
  })

  it('doubles embedded quotes', () => {
    const csv = applicationsToCsv([
      makeApplication({ notes: 'They called it a "culture fit" round.' }),
    ])

    expect(csv).toContain('"They called it a ""culture fit"" round."')
  })

  it('quotes fields containing newlines without splitting the row', () => {
    const csv = applicationsToCsv([
      makeApplication({ notes: 'First line\nSecond line' }),
    ])

    expect(csv).toContain('"First line\nSecond line"')
    // The embedded newline is LF, so a CRLF split still sees just two rows.
    expect(rowsOf(csv)).toHaveLength(2)
  })

  it('renders the human stage label rather than the internal key', () => {
    const csv = applicationsToCsv([makeApplication({ stage: 'screen' })])

    expect(csv).toContain('Phone screen')
  })

  it('renders remote as yes or no', () => {
    expect(applicationsToCsv([makeApplication({ remote: true })])).toContain(',Yes,')
    expect(applicationsToCsv([makeApplication({ remote: false })])).toContain(',No,')
  })

  it('leaves missing salary and applied dates empty rather than writing null', () => {
    const csv = applicationsToCsv([
      makeApplication({ salaryMin: null, salaryMax: null, appliedOn: null }),
    ])

    expect(csv).not.toContain('null')
    expect(rowsOf(csv)[1]).toContain(',,')
  })

  it('joins tags into one readable field', () => {
    const csv = applicationsToCsv([
      makeApplication({ tags: ['react', 'design-systems'] }),
    ])

    expect(csv).toContain('"react, design-systems"')
  })

  it('exports every column for every seeded application', () => {
    const csv = applicationsToCsv(createSeedApplications(NOW))

    for (const row of rowsOf(csv)) {
      expect(row.length).toBeGreaterThan(0)
    }
    expect(csv).toContain('Northwind Labs')
    expect(csv).toContain('Brightsound')
  })
})

describe('csvFilename', () => {
  it('dates the file so exports sort chronologically', () => {
    expect(csvFilename(new Date(2026, 5, 1))).toBe('trailhead-2026-06-01.csv')
  })

  it('pads single-digit months and days', () => {
    expect(csvFilename(new Date(2026, 0, 9))).toBe('trailhead-2026-01-09.csv')
  })
})
