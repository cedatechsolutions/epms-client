import { useId, useState } from 'react'
import AdminDialog from '@/features/users/components/AdminDialog'
import { formatDecimal } from '../lib/format'
import { DECISION_LABELS, DECISION_REQUIRES_NOTE, type DecisionKind, type Recommendation } from '../types'

type DecisionModalProps = {
  open: boolean
  decision: DecisionKind
  recommendation: Recommendation | null
  loading: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (note: string | null) => void
}

const textareaClassName =
  'w-full border border-[#cad5c7] bg-white px-4 py-3 text-sm leading-6 text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]'

const DECISION_COPY: Record<DecisionKind, { title: string; description: string; noteLabel: string; hint: string }> = {
  accept: {
    title: 'Accept recommendation',
    description: 'The program type is recorded as approved for this assessment.',
    noteLabel: 'Note (optional)',
    hint: 'Anything a reviewer should know about why this fits.',
  },
  modify: {
    title: 'Accept with changes',
    description: 'The program type is approved but will be adapted before it runs.',
    noteLabel: 'What will change? (optional)',
    hint: 'Describe the adjustment — scope, duration, target sector.',
  },
  reject: {
    title: 'Reject recommendation',
    description: 'The program type is recorded as not suitable for this community.',
    noteLabel: 'Reason for rejecting',
    hint: 'Required. This is kept as the audit trail for the decision.',
  },
}

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

/**
 * Records a ruling on one recommendation. A note is optional for accept/modify and required for
 * reject — the client check is UX only; the server returns 422 either way.
 */
export default function DecisionModal({
  open,
  decision,
  recommendation,
  loading,
  errorMessage,
  onClose,
  onSubmit,
}: DecisionModalProps) {
  const noteId = useId()
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState(false)

  const copy = DECISION_COPY[decision]
  const noteRequired = DECISION_REQUIRES_NOTE[decision]
  const noteMissing = noteRequired && note.trim().length === 0
  const destructive = decision === 'reject'

  const handleSubmit = () => {
    setTouched(true)
    if (noteMissing) return
    onSubmit(note.trim() === '' ? null : note.trim())
  }

  return (
    <AdminDialog
      open={open}
      title={copy.title}
      description={copy.description}
      maxWidthClassName="max-w-xl"
      closeDisabled={loading}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer border border-[#d8e1d4] bg-white px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={[
              'inline-flex cursor-pointer items-center justify-center gap-2 border px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60',
              destructive
                ? 'border-[#9f2f2f] bg-[#9f2f2f] hover:bg-[#832424]'
                : 'border-[#1f5d3b] bg-[#1f5d3b] hover:bg-[#18492e]',
            ].join(' ')}
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Saving...' : DECISION_LABELS[decision]}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {recommendation ? (
          <div className="border border-[#d8e1d4] bg-[#f7faf6] px-4 py-3">
            <p className="text-sm font-medium text-[#123524]">{recommendation.programTypeName}</p>
            <p className="mt-1 text-xs text-[#6a7f6d]">
              Rank #{recommendation.rank} · Match score {formatDecimal(recommendation.matchScore)} / 100
            </p>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">
            {errorMessage}
          </div>
        ) : null}

        <div>
          <label htmlFor={noteId} className="mb-2 block text-sm font-medium text-[#123524]">
            {copy.noteLabel}
          </label>
          <textarea
            id={noteId}
            rows={4}
            value={note}
            disabled={loading}
            onChange={(event) => setNote(event.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={copy.hint}
            className={textareaClassName}
          />
          {touched && noteMissing ? (
            <p className="mt-2 text-sm text-[#8a2d2d]">A reason is required when rejecting a recommendation.</p>
          ) : (
            <p className="mt-2 text-xs text-[#6a7f6d]">{copy.hint}</p>
          )}
        </div>

        <div className="border border-[#ead7d7] bg-[#fff7f7] px-4 py-3 text-sm text-[#8a2d2d]">
          A decision cannot be changed once recorded. Regenerating the recommendations for this
          assessment keeps decided entries exactly as they are.
        </div>
      </div>
    </AdminDialog>
  )
}
