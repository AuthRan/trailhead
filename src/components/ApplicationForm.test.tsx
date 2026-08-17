import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApplicationForm } from './ApplicationForm'
import { EMPTY_FORM_VALUES } from '../lib/applicationForm'
import type { ApplicationFormValues } from '../lib/applicationForm'

function renderForm(initial: Partial<ApplicationFormValues> = {}) {
  const onSubmit = vi.fn()
  const onDirtyChange = vi.fn()
  const initialValues = { ...EMPTY_FORM_VALUES, ...initial }

  const view = render(
    <>
      <ApplicationForm
        formId="test-form"
        initialValues={initialValues}
        onSubmit={onSubmit}
        onDirtyChange={onDirtyChange}
      />
      {/* The drawer normally hosts the submit button outside the form. */}
      <button type="submit" form="test-form">
        Save
      </button>
    </>,
  )

  return { ...view, onSubmit, onDirtyChange, user: userEvent.setup() }
}

const VALID = {
  company: 'Northwind Labs',
  role: 'Frontend Engineer',
}

describe('ApplicationForm', () => {
  it('labels every field it asks for', () => {
    renderForm()

    expect(screen.getByLabelText('Company')).toBeInTheDocument()
    expect(screen.getByLabelText('Role')).toBeInTheDocument()
    expect(screen.getByLabelText('Stage')).toBeInTheDocument()
    expect(screen.getByLabelText('Applied on')).toBeInTheDocument()
  })

  it('submits a draft once the required fields are filled', async () => {
    const { user, onSubmit } = renderForm()

    await user.type(screen.getByLabelText('Company'), VALID.company)
    await user.type(screen.getByLabelText('Role'), VALID.role)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      company: 'Northwind Labs',
      role: 'Frontend Engineer',
      stage: 'saved',
    })
  })

  it('blocks submission and explains what is missing', async () => {
    const { user, onSubmit } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Add the company name.')).toBeInTheDocument()
    expect(screen.getByText('Add the role title.')).toBeInTheDocument()
  })

  it('moves focus to the first field that needs attention', async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByLabelText('Company')).toHaveFocus()
  })

  it('ties each message to its field for assistive tech', async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    const company = screen.getByLabelText('Company')
    expect(company).toHaveAttribute('aria-invalid', 'true')
    // The warning glyph is decorative, so it stays out of the description.
    expect(company).toHaveAccessibleDescription('Add the company name.')
  })

  it('clears a message as soon as the field is put right', async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Add the company name.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Company'), 'Northwind Labs')

    expect(screen.queryByText('Add the company name.')).not.toBeInTheDocument()
  })

  it('requires a date once the stage says the application was sent', async () => {
    const { user, onSubmit } = renderForm(VALID)

    await user.selectOptions(screen.getByLabelText('Stage'), 'applied')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(
      screen.getByText('Add the date you applied, or move this back to Saved.'),
    ).toBeInTheDocument()
  })

  it('rejects a salary range that runs backwards', async () => {
    const { user, onSubmit } = renderForm({ ...VALID, salaryMin: '90000', salaryMax: '70000' })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(
      screen.getByText('The top of the range must be at least the bottom.'),
    ).toBeInTheDocument()
  })

  it('rejects a link that is not http or https', async () => {
    const { user, onSubmit } = renderForm({ ...VALID, url: 'javascript:alert(1)' })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Links must start with http:// or https://')).toBeInTheDocument()
  })

  it('reports dirtiness only once something actually changed', async () => {
    const { user, onDirtyChange } = renderForm(VALID)

    expect(onDirtyChange).toHaveBeenLastCalledWith(false)

    await user.type(screen.getByLabelText('Company'), '!')
    expect(onDirtyChange).toHaveBeenLastCalledWith(true)
  })

  it('reports clean again when an edit is reversed', async () => {
    const { user, onDirtyChange } = renderForm(VALID)

    const company = screen.getByLabelText('Company')
    await user.type(company, '!')
    await user.keyboard('{Backspace}')

    expect(onDirtyChange).toHaveBeenLastCalledWith(false)
  })
})
