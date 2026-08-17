import { useId, useMemo, useState } from 'react'
import { ApplicationForm } from './ApplicationForm'
import { Drawer } from './Drawer'
import { StageBadge } from './StageBadge'
import { applicationToFormValues, EMPTY_FORM_VALUES } from '../lib/applicationForm'
import { formatRelative } from '../lib/date'
import { useApplications, useApplicationsActions } from '../state/ApplicationsContext'
import { useToasts } from '../state/ToastContext'
import type { ApplicationDraft } from '../lib/types'

interface DetailDrawerProps {
  /** The application being edited, or `'new'` to create one. `null` closes it. */
  openId: string | 'new' | null
  onClose: () => void
}

export function DetailDrawer({ openId, onClose }: DetailDrawerProps) {
  const { items } = useApplications()
  const { createApplication, updateApplication } = useApplicationsActions()
  const { showToast } = useToasts()
  const formId = useId()
  const [saving, setSaving] = useState(false)

  const application = useMemo(
    () => (openId && openId !== 'new' ? items.find((item) => item.id === openId) : null),
    [items, openId],
  )

  const creating = openId === 'new'
  // An id that no longer resolves means the record was deleted from under the
  // panel; closing is friendlier than showing an empty shell.
  const open = creating || Boolean(application)

  const initialValues = useMemo(
    () => (application ? applicationToFormValues(application) : EMPTY_FORM_VALUES),
    [application],
  )

  async function handleSubmit(draft: ApplicationDraft) {
    setSaving(true)
    try {
      if (creating) {
        await createApplication(draft)
        showToast(`Added ${draft.company}`, { tone: 'success' })
      } else if (application) {
        await updateApplication(application.id, draft)
        showToast(`Saved ${draft.company}`, { tone: 'success' })
      }
      onClose()
    } catch {
      showToast('Could not save this application', { tone: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      title={creating ? 'New application' : (application?.company ?? '')}
      onClose={onClose}
      footer={
        <>
          <button
            type="submit"
            form={formId}
            className="button button--primary"
            disabled={saving}
          >
            {creating ? 'Add application' : 'Save changes'}
          </button>
          <button type="button" className="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <span className="drawer__footer-spacer" />
        </>
      }
    >
      {application ? (
        <div className="detail-meta">
          <StageBadge stage={application.stage} />
          <span>{application.role}</span>
          <span>Updated {formatRelative(application.updatedAt)}</span>
        </div>
      ) : null}

      {/* Remounting per record keeps each application's edits in their own
          form state instead of leaking between rows. */}
      <ApplicationForm
        key={openId ?? 'closed'}
        formId={formId}
        initialValues={initialValues}
        onSubmit={handleSubmit}
      />
    </Drawer>
  )
}
