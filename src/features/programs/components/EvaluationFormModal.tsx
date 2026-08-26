import { useState, type FormEvent } from 'react'
import AdminDialog from '@/features/users/components/AdminDialog'
import type { ApiValidationErrors } from '@/shared/api/http'
import { EVAL_TYPE_LABELS, type EvalType, type Evaluation, type EvaluationPayload } from '../types'

type EvaluationFormModalProps = {
  open: boolean
  activityTitle: string | null
  evaluation: Evaluation | null
  loading: boolean
  errorMessage: string | null
  apiErrors?: ApiValidationErrors
  onClose: () => void
  onSubmit: (payload: EvaluationPayload) => void
}

const inputClassName =
  'w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

const selectClassName = `${inputClassName} cursor-pointer`
const labelClassName = 'mb-2 block text-sm font-medium text-ink'
const fieldErrorClassName = 'mt-1 text-xs text-danger-strong'

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

function toStringValue(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value)
}

/**
 * Encodes a pre/post evaluation summary (spec Module 5b §5).
 *
 * <p>This records **counts, not individual responses** — the filled instruments stay on paper and
 * are optionally scanned in afterwards.
 *
 * <p>The F/M split may sum to less than the respondent count: respondents who declined to state a
 * sex are counted in the total and in neither bucket. The form says so and previews the remainder,
 * rather than forcing the numbers to reconcile and inventing data. It may never *exceed* the total,
 * which the server rejects with both field names.
 */
export default function EvaluationFormModal({
  open,
  activityTitle,
  evaluation,
  loading,
  errorMessage,
  apiErrors,
  onClose,
  onSubmit,
}: EvaluationFormModalProps) {
  const [evalType, setEvalType] = useState<EvalType>(evaluation?.evalType ?? 'post')
  const [respondentCount, setRespondentCount] = useState(toStringValue(evaluation?.respondentCount))
  const [femaleCount, setFemaleCount] = useState(toStringValue(evaluation?.femaleCount))
  const [maleCount, setMaleCount] = useState(toStringValue(evaluation?.maleCount))
  const [avgRating, setAvgRating] = useState(toStringValue(evaluation?.avgRating))
  const [notes, setNotes] = useState(evaluation?.notes ?? '')

  const fieldError = (field: string): string | undefined => apiErrors?.[field]?.[0]

  const respondents = Number(respondentCount || 0)
  const female = Number(femaleCount || 0)
  const male = Number(maleCount || 0)
  const unspecified = respondents - female - male

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      evalType,
      respondentCount: respondents,
      femaleCount: female,
      maleCount: male,
      avgRating: avgRating.trim() === '' ? null : Number(avgRating),
      notes: notes.trim() || null,
    })
  }

  return (
    <AdminDialog
      open={open}
      title={evaluation ? 'Edit Evaluation' : 'Encode Evaluation'}
      description={
        activityTitle
          ? `Summary of the evaluation forms collected for "${activityTitle}".`
          : 'Summary of the evaluation forms collected for this activity.'
      }
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
            form="evaluation-form"
            disabled={loading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Saving...' : evaluation ? 'Save Changes' : 'Encode Evaluation'}
          </button>
        </div>
      }
    >
      <form id="evaluation-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMessage ? (
          <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="evaluation-type" className={labelClassName}>
              Evaluation type
            </label>
            <select
              id="evaluation-type"
              value={evalType}
              disabled={loading}
              onChange={(event) => setEvalType(event.target.value as EvalType)}
              className={selectClassName}
            >
              {(Object.keys(EVAL_TYPE_LABELS) as EvalType[]).map((value) => (
                <option key={value} value={value}>
                  {EVAL_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
            {fieldError('evalType') ? (
              <p className={fieldErrorClassName}>{fieldError('evalType')}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-alt">
                A post-activity evaluation is required before the program can be completed.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="evaluation-rating" className={labelClassName}>
              Average rating (optional)
            </label>
            <input
              id="evaluation-rating"
              type="number"
              min={1}
              max={5}
              step="0.01"
              value={avgRating}
              disabled={loading}
              onChange={(event) => setAvgRating(event.target.value)}
              placeholder="1.00 – 5.00"
              className={inputClassName}
            />
            {fieldError('avgRating') ? (
              <p className={fieldErrorClassName}>{fieldError('avgRating')}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="evaluation-respondents" className={labelClassName}>
              Respondents
            </label>
            <input
              id="evaluation-respondents"
              type="number"
              min={0}
              value={respondentCount}
              disabled={loading}
              onChange={(event) => setRespondentCount(event.target.value)}
              className={inputClassName}
            />
            {fieldError('respondentCount') ? (
              <p className={fieldErrorClassName}>{fieldError('respondentCount')}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="evaluation-female" className={labelClassName}>
              Female
            </label>
            <input
              id="evaluation-female"
              type="number"
              min={0}
              value={femaleCount}
              disabled={loading}
              onChange={(event) => setFemaleCount(event.target.value)}
              className={inputClassName}
            />
            {fieldError('femaleCount') ? (
              <p className={fieldErrorClassName}>{fieldError('femaleCount')}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="evaluation-male" className={labelClassName}>
              Male
            </label>
            <input
              id="evaluation-male"
              type="number"
              min={0}
              value={maleCount}
              disabled={loading}
              onChange={(event) => setMaleCount(event.target.value)}
              className={inputClassName}
            />
            {fieldError('maleCount') ? (
              <p className={fieldErrorClassName}>{fieldError('maleCount')}</p>
            ) : null}
          </div>
        </div>

        <div
          className={[
            'rounded-md border px-4 py-3 text-sm',
            unspecified < 0
              ? 'border-danger-border bg-danger-bg text-danger-text'
              : 'border-divider bg-row-hover text-body',
          ].join(' ')}
        >
          {unspecified < 0 ? (
            <p>
              {female} female + {male} male exceeds the {respondents} respondents recorded. Reduce a
              count, or raise the respondent total.
            </p>
          ) : unspecified > 0 ? (
            <p>
              {unspecified} respondent{unspecified === 1 ? '' : 's'} did not state a sex. That is
              recorded as-is — it is not counted as female or male.
            </p>
          ) : (
            <p>The female and male counts account for every respondent.</p>
          )}
        </div>

        <div>
          <label htmlFor="evaluation-notes" className={labelClassName}>
            Notes (optional)
          </label>
          <textarea
            id="evaluation-notes"
            value={notes}
            rows={3}
            disabled={loading}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Summary of the feedback received."
            className={inputClassName}
          />
        </div>
      </form>
    </AdminDialog>
  )
}
