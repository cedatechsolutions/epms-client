import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded'
import UndoRoundedIcon from '@mui/icons-material/UndoRounded'
import { formatDateTime } from '../lib/format'
import {
  APPROVAL_ACTION_LABELS,
  APPROVAL_STAGES,
  STAGES_COMPLETED_BY_STATUS,
  type ProgramApproval,
  type ProgramStatus,
} from '../types'

type ApprovalStepperProps = {
  status: ProgramStatus
  approvals: ProgramApproval[]
}

/**
 * The four-stage CvSU signatory chain (spec Module 5 §2), rendered as a vertical stepper with the
 * decision that produced each stage beneath it.
 *
 * <p>Two things are deliberately separate here. The **stepper** reads from `status` alone via
 * `STAGES_COMPLETED_BY_STATUS`, so it always shows where the proposal actually sits. The **trail**
 * beneath reads from `approvals`, which is append-only and keeps returned attempts visible — a
 * proposal that was returned at stage 3 and resubmitted shows both the return and the later
 * approval, because losing that history would misrepresent the audit record.
 *
 * <p>A returned proposal reports zero completed stages: it is back with its author, and showing the
 * earlier stages as still-complete would imply signatures that no longer stand.
 */
export default function ApprovalStepper({ status, approvals }: ApprovalStepperProps) {
  const completed = STAGES_COMPLETED_BY_STATUS[status] ?? 0
  const isReturned = status === 'returned'
  const isCancelled = status === 'cancelled'

  // The most recent decision at each stage, for the "who acted" line under a completed step.
  const latestByStage = new Map<number, ProgramApproval>()
  for (const approval of approvals) {
    latestByStage.set(approval.stage, approval)
  }

  return (
    <div className="space-y-5">
      <ol className="space-y-0">
        {APPROVAL_STAGES.map((stage, index) => {
          const isDone = !isCancelled && stage.stage <= completed
          const isCurrent = !isCancelled && !isReturned && stage.stage === completed + 1
          const decision = isDone ? latestByStage.get(stage.stage) : undefined
          const isLast = index === APPROVAL_STAGES.length - 1

          return (
            <li key={stage.stage} className="flex gap-3">
              <div className="flex flex-col items-center">
                {isDone ? (
                  <CheckCircleRoundedIcon fontSize="small" className="text-primary-accent" />
                ) : (
                  <RadioButtonUncheckedRoundedIcon
                    fontSize="small"
                    className={isCurrent ? 'text-primary-accent' : 'text-muted-soft'}
                  />
                )}
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className={['w-px flex-1', isDone ? 'bg-primary' : 'bg-row-divider'].join(' ')}
                  />
                ) : null}
              </div>

              <div className={isLast ? 'pb-0' : 'pb-5'}>
                <p
                  className={[
                    'text-sm font-medium',
                    isDone || isCurrent ? 'text-ink' : 'text-muted',
                  ].join(' ')}
                >
                  {stage.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-alt">{stage.roleLabel}</p>
                {decision ? (
                  <p className="mt-1 text-xs text-muted-alt">
                    {decision.actedByName ?? 'Unknown user'} · {formatDateTime(decision.actedAt)}
                  </p>
                ) : null}
                {isCurrent ? (
                  <p className="mt-1 text-xs text-warning">Awaiting action</p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>

      {isReturned ? (
        <div className="flex items-start gap-2 rounded-md border border-danger-border-soft bg-danger-bg-soft px-4 py-3 text-sm text-danger-text">
          <UndoRoundedIcon fontSize="small" className="mt-0.5 shrink-0" />
          <p>
            This proposal was returned for revision. Address the reviewer comments below, then submit
            it again — it re-enters the chain at coordinator review.
          </p>
        </div>
      ) : null}

      {isCancelled ? (
        <div className="rounded-md border border-line bg-surface-tint px-4 py-3 text-sm text-muted">
          This proposal was cancelled and is no longer moving through the approval chain.
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-label">
          Decision trail
        </p>
        {approvals.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            No decisions recorded yet. The trail starts when the proposal is submitted.
          </p>
        ) : (
          <ul className="space-y-3">
            {approvals.map((approval) => (
              <li
                key={approval.id}
                className={[
                  'border-l-2 pl-3',
                  approval.action === 'returned' ? 'border-danger' : 'border-primary',
                ].join(' ')}
              >
                <p className="text-sm font-medium text-ink">
                  {APPROVAL_ACTION_LABELS[approval.action] ?? approval.action}
                </p>
                <p className="mt-0.5 text-xs text-muted-alt">
                  Stage {approval.stage} · {approval.actedByName ?? 'Unknown user'} ·{' '}
                  {formatDateTime(approval.actedAt)}
                </p>
                {approval.comment ? (
                  <p className="mt-1.5 rounded-md border border-divider bg-row-hover px-3 py-2 text-sm leading-6 text-body">
                    {approval.comment}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
