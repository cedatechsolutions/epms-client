import { useState, type FormEvent } from 'react'
import AdminDialog from '@/features/users/components/AdminDialog'
import { formatCurrency } from '../lib/format'
import type { StageActionPayload } from '../types'

/** Which stage button opened this dialog. `submit` is stage 1 and takes no payload. */
export type StageActionKind = 'submit' | 'note' | 'recommend' | 'approve' | 'return'

type StageActionModalProps = {
  open: boolean
  kind: StageActionKind
  programTitle: string
  /** Shown beside the approved-budget field so the approver sees what was asked for. */
  budgetRequested: number | null
  loading: boolean
  errorMessage: string | null
  onClose: () => void
  onConfirm: (payload: StageActionPayload | null) => void
}

const inputClassName =
  'w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

const labelClassName = 'mb-2 block text-sm font-medium text-ink'

const COPY: Record<StageActionKind, { title: string; description: string; confirm: string; busy: string }> = {
  submit: {
    title: 'Submit for review',
    description:
      'The proposal moves to the extension coordinator and can no longer be edited while it is under review.',
    confirm: 'Submit Proposal',
    busy: 'Submitting...',
  },
  note: {
    title: 'Note and endorse',
    description: 'Endorses the proposal to the campus extension coordinator (stage 3 of 4).',
    confirm: 'Note and Endorse',
    busy: 'Endorsing...',
  },
  recommend: {
    title: 'Recommend for approval',
    description: 'Forwards the proposal to the campus administrator for final approval (stage 4 of 4).',
    confirm: 'Recommend for Approval',
    busy: 'Recommending...',
  },
  approve: {
    title: 'Approve proposal',
    description: 'Final approval. The project may begin once approved.',
    confirm: 'Approve Proposal',
    busy: 'Approving...',
  },
  return: {
    title: 'Return for revision',
    description: 'Sends the proposal back to its author. A reason is required and is recorded in the audit trail.',
    confirm: 'Return Proposal',
    busy: 'Returning...',
  },
}

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

/**
 * Confirmation for one step of the approval chain.
 *
 * <p>A comment is optional when advancing and **required when returning** — the server enforces
 * this with a 422, and the client blocks empty returns up front so the reviewer is not bounced.
 * The approved-budget field appears only on `approve`, where the campus administrator may sign off
 * a different figure than was requested; the other endpoints ignore it.
 */
export default function StageActionModal({
  open,
  kind,
  programTitle,
  budgetRequested,
  loading,
  errorMessage,
  onClose,
  onConfirm,
}: StageActionModalProps) {
  const [comment, setComment] = useState('')
  const [budgetApproved, setBudgetApproved] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const copy = COPY[kind]
  const isReturn = kind === 'return'
  const isApprove = kind === 'approve'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isReturn && comment.trim() === '') {
      setLocalError('A reason is required when returning a proposal.')
      return
    }
    setLocalError(null)

    if (kind === 'submit') {
      onConfirm(null)
      return
    }

    const parsedBudget = budgetApproved.trim() === '' ? null : Number(budgetApproved)
    onConfirm({
      action: isReturn ? 'return' : kind,
      comment: comment.trim() || undefined,
      budgetApproved: isApprove && parsedBudget !== null && Number.isFinite(parsedBudget) ? parsedBudget : null,
    })
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
            className="cursor-pointer border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="stage-action-form"
            disabled={loading}
            className={[
              'inline-flex cursor-pointer items-center justify-center gap-2 border px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 rounded-md',
              isReturn
                ? 'border-danger bg-danger hover:bg-danger-hover'
                : 'border-primary bg-primary hover:bg-primary-hover',
            ].join(' ')}
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? copy.busy : copy.confirm}
          </button>
        </div>
      }
    >
      <form id="stage-action-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMessage || localError ? (
          <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
            {errorMessage ?? localError}
          </div>
        ) : null}

        <div className="rounded-md border border-divider bg-row-hover px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-label">Proposal</p>
          <p className="mt-1 text-sm font-medium text-ink">{programTitle}</p>
        </div>

        {isReturn ? (
          <div className="rounded-md border border-danger-border-soft bg-danger-bg-soft px-4 py-3 text-sm text-danger-text">
            The author sees this reason and must revise before resubmitting.
          </div>
        ) : null}

        {isApprove ? (
          <div>
            <label htmlFor="stage-budget" className={labelClassName}>
              Approved budget (optional)
            </label>
            <input
              id="stage-budget"
              type="number"
              min={0}
              step="0.01"
              value={budgetApproved}
              disabled={loading}
              onChange={(event) => setBudgetApproved(event.target.value)}
              placeholder="0.00"
              className={inputClassName}
            />
            <p className="mt-1 text-xs text-muted-alt">
              Requested: {formatCurrency(budgetRequested)}. Leave blank to approve without setting a
              figure.
            </p>
          </div>
        ) : null}

        {kind !== 'submit' ? (
          <div>
            <label htmlFor="stage-comment" className={labelClassName}>
              {isReturn ? 'Reason for return' : 'Comment (optional)'}
            </label>
            <textarea
              id="stage-comment"
              value={comment}
              rows={4}
              disabled={loading}
              onChange={(event) => {
                setComment(event.target.value)
                setLocalError(null)
              }}
              placeholder={
                isReturn
                  ? 'Explain what needs to change before this can move forward.'
                  : 'Add context for the next reviewer.'
              }
              className={inputClassName}
            />
          </div>
        ) : null}
      </form>
    </AdminDialog>
  )
}
