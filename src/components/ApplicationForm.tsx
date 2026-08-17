import { useEffect, useId, useState } from 'react'
import {
  formValuesToDraft,
  hasErrors,
  validateApplicationForm,
  valuesAreEqual,
  type ApplicationFormErrors,
  type ApplicationFormValues,
} from '../lib/applicationForm'
import { STAGES, STAGE_LABELS } from '../lib/types'
import type { ApplicationDraft, Stage } from '../lib/types'

interface ApplicationFormProps {
  /** Lets the drawer footer host the submit button outside the form element. */
  formId: string
  initialValues: ApplicationFormValues
  onSubmit: (draft: ApplicationDraft) => void | Promise<void>
  onDirtyChange?: (dirty: boolean) => void
}

export function ApplicationForm({
  formId,
  initialValues,
  onSubmit,
  onDirtyChange,
}: ApplicationFormProps) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<ApplicationFormErrors>({})
  const [showAllErrors, setShowAllErrors] = useState(false)
  const fieldId = useId()

  // Dirtiness is a comparison, not a second source of truth, so it is derived
  // on every render rather than stored.
  const dirty = !valuesAreEqual(values, initialValues)

  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  function update<K extends keyof ApplicationFormValues>(
    key: K,
    value: ApplicationFormValues[K],
  ) {
    setValues((current) => {
      const next = { ...current, [key]: value }
      // Once a message is on screen it should clear as soon as the field is
      // right, without waiting for another submit.
      setErrors((currentErrors) =>
        showAllErrors || currentErrors[key] ? validateApplicationForm(next) : currentErrors,
      )
      return next
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateApplicationForm(values)
    setErrors(nextErrors)
    setShowAllErrors(true)

    if (hasErrors(nextErrors)) {
      const firstInvalid = Object.keys(nextErrors)[0]
      document.getElementById(`${fieldId}-${firstInvalid}`)?.focus()
      return
    }

    void onSubmit(formValuesToDraft(values))
  }

  function describedBy(key: keyof ApplicationFormValues): string | undefined {
    return errors[key] ? `${fieldId}-${key}-error` : undefined
  }

  function errorFor(key: keyof ApplicationFormValues) {
    if (!errors[key]) return null

    return (
      <p className="field__error" id={`${fieldId}-${key}-error`}>
        <span aria-hidden="true">⚠</span> {errors[key]}
      </p>
    )
  }

  return (
    <form id={formId} className="form-grid" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label className="field__label" htmlFor={`${fieldId}-company`}>
          Company
        </label>
        <input
          id={`${fieldId}-company`}
          className="input"
          value={values.company}
          onChange={(event) => update('company', event.target.value)}
          aria-invalid={errors.company ? true : undefined}
          aria-describedby={describedBy('company')}
          required
        />
        {errorFor('company')}
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`${fieldId}-role`}>
          Role
        </label>
        <input
          id={`${fieldId}-role`}
          className="input"
          value={values.role}
          onChange={(event) => update('role', event.target.value)}
          aria-invalid={errors.role ? true : undefined}
          aria-describedby={describedBy('role')}
          required
        />
        {errorFor('role')}
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`${fieldId}-stage`}>
          Stage
        </label>
        <select
          id={`${fieldId}-stage`}
          className="select"
          value={values.stage}
          onChange={(event) => update('stage', event.target.value as Stage)}
        >
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`${fieldId}-appliedOn`}>
          Applied on
        </label>
        <input
          id={`${fieldId}-appliedOn`}
          className="input"
          type="date"
          value={values.appliedOn}
          onChange={(event) => update('appliedOn', event.target.value)}
          aria-invalid={errors.appliedOn ? true : undefined}
          aria-describedby={describedBy('appliedOn')}
        />
        {errorFor('appliedOn')}
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`${fieldId}-location`}>
          Location
        </label>
        <input
          id={`${fieldId}-location`}
          className="input"
          value={values.location}
          onChange={(event) => update('location', event.target.value)}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`${fieldId}-source`}>
          Source
        </label>
        <input
          id={`${fieldId}-source`}
          className="input"
          value={values.source}
          placeholder="Referral, LinkedIn, job board…"
          onChange={(event) => update('source', event.target.value)}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`${fieldId}-salaryMin`}>
          Salary from
        </label>
        <input
          id={`${fieldId}-salaryMin`}
          className="input"
          inputMode="numeric"
          value={values.salaryMin}
          onChange={(event) => update('salaryMin', event.target.value)}
          aria-invalid={errors.salaryMin ? true : undefined}
          aria-describedby={describedBy('salaryMin')}
        />
        {errorFor('salaryMin')}
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`${fieldId}-salaryMax`}>
          Salary to
        </label>
        <input
          id={`${fieldId}-salaryMax`}
          className="input"
          inputMode="numeric"
          value={values.salaryMax}
          onChange={(event) => update('salaryMax', event.target.value)}
          aria-invalid={errors.salaryMax ? true : undefined}
          aria-describedby={describedBy('salaryMax')}
        />
        {errorFor('salaryMax')}
      </div>

      <div className="field form-grid__full">
        <label className="field__label" htmlFor={`${fieldId}-url`}>
          Link
        </label>
        <input
          id={`${fieldId}-url`}
          className="input"
          type="url"
          value={values.url}
          placeholder="https://"
          onChange={(event) => update('url', event.target.value)}
          aria-invalid={errors.url ? true : undefined}
          aria-describedby={describedBy('url')}
        />
        {errorFor('url')}
      </div>

      <div className="field form-grid__full">
        <label className="field__label" htmlFor={`${fieldId}-tags`}>
          Tags
        </label>
        <input
          id={`${fieldId}-tags`}
          className="input"
          value={values.tags}
          onChange={(event) => update('tags', event.target.value)}
          aria-describedby={`${fieldId}-tags-hint`}
        />
        <p className="field__hint" id={`${fieldId}-tags-hint`}>
          Separate tags with commas.
        </p>
      </div>

      <div className="checkbox-row form-grid__full">
        <input
          id={`${fieldId}-remote`}
          type="checkbox"
          checked={values.remote}
          onChange={(event) => update('remote', event.target.checked)}
        />
        <label htmlFor={`${fieldId}-remote`}>This role can be done remotely</label>
      </div>

      <div className="field form-grid__full">
        <label className="field__label" htmlFor={`${fieldId}-notes`}>
          Notes
        </label>
        <textarea
          id={`${fieldId}-notes`}
          className="textarea"
          value={values.notes}
          onChange={(event) => update('notes', event.target.value)}
        />
      </div>
    </form>
  )
}
