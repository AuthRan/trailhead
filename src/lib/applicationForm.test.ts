import { describe, expect, it } from 'vitest'
import {
  applicationToFormValues,
  EMPTY_FORM_VALUES,
  formValuesToDraft,
  hasErrors,
  parseTags,
  validateApplicationForm,
  valuesAreEqual,
  type ApplicationFormValues,
} from './applicationForm'
import { createSeedApplications } from './seed'

const [northwind] = createSeedApplications(new Date('2026-06-15T12:00:00.000Z'))

function values(overrides: Partial<ApplicationFormValues> = {}): ApplicationFormValues {
  return { ...EMPTY_FORM_VALUES, company: 'Acme', role: 'Engineer', ...overrides }
}

describe('applicationToFormValues', () => {
  it('flattens an application into editable strings', () => {
    const form = applicationToFormValues(northwind)

    expect(form.company).toBe('Northwind Labs')
    expect(form.tags).toBe('react, design-systems')
    expect(form.salaryMin).toBe('85000')
    expect(form.appliedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('renders absent salaries as empty fields', () => {
    const form = applicationToFormValues({
      ...northwind,
      salaryMin: null,
      salaryMax: null,
      appliedOn: null,
    })

    expect(form.salaryMin).toBe('')
    expect(form.salaryMax).toBe('')
    expect(form.appliedOn).toBe('')
  })
})

describe('parseTags', () => {
  it('splits, trims, lowercases, and de-duplicates', () => {
    expect(parseTags(' React , react,  Design-Systems , ')).toEqual([
      'react',
      'design-systems',
    ])
  })

  it('returns nothing for an empty field', () => {
    expect(parseTags('   ')).toEqual([])
  })
})

describe('formValuesToDraft', () => {
  it('parses amounts and trims text', () => {
    const draft = formValuesToDraft(
      values({ company: '  Acme  ', salaryMin: '70 000', salaryMax: '85,000' }),
    )

    expect(draft.company).toBe('Acme')
    expect(draft.salaryMin).toBe(70000)
    expect(draft.salaryMax).toBe(85000)
  })

  it('falls back to a default currency', () => {
    expect(formValuesToDraft(values({ currency: '  ' })).currency).toBe('EUR')
  })

  it('turns an empty applied date into null', () => {
    expect(formValuesToDraft(values()).appliedOn).toBeNull()
  })
})

describe('validateApplicationForm', () => {
  it('accepts a minimal application', () => {
    expect(hasErrors(validateApplicationForm(values()))).toBe(false)
  })

  it('requires a company and a role', () => {
    const errors = validateApplicationForm(values({ company: ' ', role: '' }))

    expect(errors.company).toBeTruthy()
    expect(errors.role).toBeTruthy()
  })

  it('rejects non-numeric salaries', () => {
    expect(validateApplicationForm(values({ salaryMin: 'lots' })).salaryMin).toBeTruthy()
  })

  it('rejects an inverted salary range', () => {
    const errors = validateApplicationForm(
      values({ salaryMin: '90000', salaryMax: '70000' }),
    )

    expect(errors.salaryMax).toMatch(/at least/)
  })

  it('accepts a range where the ends are equal', () => {
    expect(
      validateApplicationForm(values({ salaryMin: '70000', salaryMax: '70000' })),
    ).toEqual({})
  })

  it('rejects links that are not http', () => {
    expect(validateApplicationForm(values({ url: 'not a link' })).url).toBeTruthy()
    expect(
      validateApplicationForm(values({ url: 'javascript:alert(1)' })).url,
    ).toBeTruthy()
    expect(
      validateApplicationForm(values({ url: 'https://example.com/role' })).url,
    ).toBeUndefined()
  })

  it('requires an applied date once the application has been sent', () => {
    expect(validateApplicationForm(values({ stage: 'screen' })).appliedOn).toBeTruthy()
    expect(
      validateApplicationForm(values({ stage: 'screen', appliedOn: '2026-05-01' }))
        .appliedOn,
    ).toBeUndefined()
  })
})

describe('valuesAreEqual', () => {
  it('detects an untouched form', () => {
    expect(valuesAreEqual(values(), values())).toBe(true)
  })

  it('detects a single changed field', () => {
    expect(valuesAreEqual(values(), values({ notes: 'chased' }))).toBe(false)
  })
})
