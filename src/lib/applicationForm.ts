import { toDateInputValue } from './date'
import type { Application, ApplicationDraft, Stage } from './types'

/** Form state is all strings because that is what inputs hand back. Parsing
 * happens once, on the way out. */
export interface ApplicationFormValues {
  company: string
  role: string
  location: string
  remote: boolean
  stage: Stage
  salaryMin: string
  salaryMax: string
  currency: string
  source: string
  tags: string
  url: string
  notes: string
  appliedOn: string
}

export type ApplicationFormErrors = Partial<
  Record<keyof ApplicationFormValues, string>
>

export const EMPTY_FORM_VALUES: ApplicationFormValues = {
  company: '',
  role: '',
  location: '',
  remote: false,
  stage: 'saved',
  salaryMin: '',
  salaryMax: '',
  currency: 'EUR',
  source: '',
  tags: '',
  url: '',
  notes: '',
  appliedOn: '',
}

export function applicationToFormValues(
  application: Application,
): ApplicationFormValues {
  return {
    company: application.company,
    role: application.role,
    location: application.location,
    remote: application.remote,
    stage: application.stage,
    salaryMin: application.salaryMin === null ? '' : String(application.salaryMin),
    salaryMax: application.salaryMax === null ? '' : String(application.salaryMax),
    currency: application.currency,
    source: application.source,
    tags: application.tags.join(', '),
    url: application.url,
    notes: application.notes,
    appliedOn: toDateInputValue(application.appliedOn),
  }
}

export function parseTags(value: string): string[] {
  const seen = new Set<string>()

  return value
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => {
      if (!tag || seen.has(tag)) return false
      seen.add(tag)
      return true
    })
}

function parseAmount(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = Number(trimmed.replace(/[\s,]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

export function formValuesToDraft(values: ApplicationFormValues): ApplicationDraft {
  return {
    company: values.company.trim(),
    role: values.role.trim(),
    location: values.location.trim(),
    remote: values.remote,
    stage: values.stage,
    salaryMin: parseAmount(values.salaryMin),
    salaryMax: parseAmount(values.salaryMax),
    currency: values.currency.trim() || 'EUR',
    source: values.source.trim(),
    tags: parseTags(values.tags),
    url: values.url.trim(),
    notes: values.notes.trim(),
    appliedOn: values.appliedOn || null,
  }
}

const AMOUNT_PATTERN = /^[\d\s,]+$/

export function validateApplicationForm(
  values: ApplicationFormValues,
): ApplicationFormErrors {
  const errors: ApplicationFormErrors = {}

  if (!values.company.trim()) {
    errors.company = 'Add the company name.'
  }

  if (!values.role.trim()) {
    errors.role = 'Add the role title.'
  }

  for (const key of ['salaryMin', 'salaryMax'] as const) {
    const raw = values[key].trim()
    if (raw && !AMOUNT_PATTERN.test(raw)) {
      errors[key] = 'Use digits only, e.g. 75000.'
    }
  }

  const min = parseAmount(values.salaryMin)
  const max = parseAmount(values.salaryMax)
  if (
    min !== null &&
    max !== null &&
    !errors.salaryMin &&
    !errors.salaryMax &&
    min > max
  ) {
    errors.salaryMax = 'The top of the range must be at least the bottom.'
  }

  if (values.url.trim()) {
    try {
      const parsed = new URL(values.url.trim())
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        errors.url = 'Links must start with http:// or https://'
      }
    } catch {
      errors.url = 'That does not look like a link.'
    }
  }

  // A stage past "saved" implies the application was actually sent.
  if (values.stage !== 'saved' && !values.appliedOn) {
    errors.appliedOn = 'Add the date you applied, or move this back to Saved.'
  }

  return errors
}

export function hasErrors(errors: ApplicationFormErrors): boolean {
  return Object.keys(errors).length > 0
}

export function valuesAreEqual(
  a: ApplicationFormValues,
  b: ApplicationFormValues,
): boolean {
  return (Object.keys(a) as (keyof ApplicationFormValues)[]).every(
    (key) => a[key] === b[key],
  )
}
