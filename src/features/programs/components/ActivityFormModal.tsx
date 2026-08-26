import { useState, type FormEvent } from 'react'
import AdminDialog from '@/features/users/components/AdminDialog'
import type { ApiValidationErrors } from '@/shared/api/http'
import {
  ACTIVITY_STATUS_OPTIONS,
  type ActivityStatus,
  type ProgramActivity,
  type ProgramActivityPayload,
} from '../types'

export type ActivityFormMode = 'create' | 'edit'

type ActivityFormModalProps = {
  open: boolean
  mode: ActivityFormMode
  activity: ProgramActivity | null
  loading: boolean
  errorMessage: string | null
  apiErrors?: ApiValidationErrors
  onClose: () => void
  onSubmit: (payload: ProgramActivityPayload) => void
}

const inputClassName =
  'w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

const selectClassName = `${inputClassName} cursor-pointer`
const labelClassName = 'mb-2 block text-sm font-medium text-ink'
const fieldErrorClassName = 'mt-1 text-xs text-danger-strong'

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

/**
 * Create/edit one session of a program (spec Module 5b §4).
 *
 * <p>Marking an activity **Done** is what starts the parent program, and marking the last one done
 * is what completes it — so the status field carries a note saying so. Those transitions are the
 * server's to make; this form only reports what will happen.
 */
export default function ActivityFormModal({
  open,
  mode,
  activity,
  loading,
  errorMessage,
  apiErrors,
  onClose,
  onSubmit,
}: ActivityFormModalProps) {
  const [title, setTitle] = useState(activity?.title ?? '')
  const [activityDate, setActivityDate] = useState(activity?.activityDate ?? '')
  const [startTime, setStartTime] = useState(activity?.startTime?.slice(0, 5) ?? '')
  const [endTime, setEndTime] = useState(activity?.endTime?.slice(0, 5) ?? '')
  const [venue, setVenue] = useState(activity?.venue ?? '')
  const [status, setStatus] = useState<ActivityStatus>(activity?.status ?? 'scheduled')
  const [notes, setNotes] = useState(activity?.notes ?? '')

  const fieldError = (field: string): string | undefined => apiErrors?.[field]?.[0]

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      title: title.trim(),
      activityDate,
      // <input type="time"> yields HH:mm; the API expects a LocalTime, which accepts HH:mm:ss.
      startTime: startTime ? `${startTime}:00` : null,
      endTime: endTime ? `${endTime}:00` : null,
      venue: venue.trim() || null,
      status,
      notes: notes.trim() || null,
    })
  }

  return (
    <AdminDialog
      open={open}
      title={mode === 'create' ? 'Add Activity' : 'Edit Activity'}
      description="A session of this program — one date, one venue. Attendance is recorded against it."
      maxWidthClassName="max-w-2xl"
      closeDisabled={loading}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="activity-form"
            disabled={loading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Saving...' : mode === 'create' ? 'Add Activity' : 'Save Changes'}
          </button>
        </div>
      }
    >
      <form id="activity-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMessage ? (
          <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
            {errorMessage}
          </div>
        ) : null}

        <div>
          <label htmlFor="activity-title" className={labelClassName}>
            Activity title
          </label>
          <input
            id="activity-title"
            value={title}
            disabled={loading}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Orientation and baseline survey"
            className={inputClassName}
          />
          {fieldError('title') ? <p className={fieldErrorClassName}>{fieldError('title')}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="activity-date" className={labelClassName}>
              Date
            </label>
            <input
              id="activity-date"
              type="date"
              value={activityDate}
              disabled={loading}
              onChange={(event) => setActivityDate(event.target.value)}
              className={inputClassName}
            />
            {fieldError('activityDate') ? (
              <p className={fieldErrorClassName}>{fieldError('activityDate')}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="activity-start" className={labelClassName}>
              Start time (optional)
            </label>
            <input
              id="activity-start"
              type="time"
              value={startTime}
              disabled={loading}
              onChange={(event) => setStartTime(event.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="activity-end" className={labelClassName}>
              End time (optional)
            </label>
            <input
              id="activity-end"
              type="time"
              value={endTime}
              disabled={loading}
              onChange={(event) => setEndTime(event.target.value)}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="activity-venue" className={labelClassName}>
              Venue (optional)
            </label>
            <input
              id="activity-venue"
              value={venue}
              disabled={loading}
              onChange={(event) => setVenue(event.target.value)}
              placeholder="e.g. Barangay Covered Court"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="activity-status" className={labelClassName}>
              Status
            </label>
            <select
              id="activity-status"
              value={status}
              disabled={loading}
              onChange={(event) => setStatus(event.target.value as ActivityStatus)}
              className={selectClassName}
            >
              {ACTIVITY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-alt">
              Marking the first activity <strong>Done</strong> starts the program. Once every activity
              is done or cancelled and a post-activity evaluation is encoded, the program completes
              automatically.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="activity-notes" className={labelClassName}>
            Notes (optional)
          </label>
          <textarea
            id="activity-notes"
            value={notes}
            rows={3}
            disabled={loading}
            onChange={(event) => setNotes(event.target.value)}
            className={inputClassName}
          />
        </div>
      </form>
    </AdminDialog>
  )
}
