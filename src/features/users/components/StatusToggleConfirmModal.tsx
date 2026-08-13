import type { User } from '../types'
import AdminDialog from './AdminDialog'

type StatusToggleConfirmModalProps = {
  open: boolean
  user: User | null
  loading?: boolean
  onClose: () => void
  onConfirm: () => void
}

function ButtonSpinner({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <span
      className={[
        'h-4 w-4 animate-spin rounded-full border-2',
        tone === 'light' ? 'border-white/35 border-t-white' : 'border-line border-t-primary-accent',
      ].join(' ')}
    />
  )
}

export default function StatusToggleConfirmModal({
  open,
  user,
  loading = false,
  onClose,
  onConfirm,
}: StatusToggleConfirmModalProps) {
  const willDeactivate = user?.status === 'active'
  const actionLabel = willDeactivate ? 'Deactivate' : 'Activate'

  const footer = (
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
        type="button"
        onClick={onConfirm}
        disabled={loading}
        className={[
          'inline-flex cursor-pointer items-center justify-center gap-2 border px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 rounded-md',
          willDeactivate
            ? 'border-danger bg-danger hover:bg-danger-hover'
            : 'border-primary bg-primary hover:bg-primary-hover',
        ].join(' ')}
      >
        {loading ? <ButtonSpinner /> : null}
        {loading ? `${actionLabel}...` : actionLabel}
      </button>
    </div>
  )

  return (
    <AdminDialog
      open={open}
      title={`${actionLabel} User`}
      description={
        willDeactivate
          ? 'This user will no longer be able to access the system.'
          : 'This user will regain access to the system.'
      }
      footer={footer}
      maxWidthClassName="max-w-xl"
      closeDisabled={loading}
      onClose={onClose}
    >
      <div className="space-y-4 text-sm leading-6 text-body">
        {user ? (
          <p>
            User: <span className="font-medium text-ink">{user.full_name}</span> ({user.email})
          </p>
        ) : null}

        <div
          className={[
            'border px-4 py-3',
            willDeactivate
              ? 'border-danger-border-soft bg-danger-bg-soft text-danger-text'
              : 'border-success-border bg-success-bg text-primary-accent',
          ].join(' ')}
        >
          {willDeactivate
            ? 'Active sessions may continue until their token expires.'
            : 'The account can sign in again after activation.'}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted" role="status" aria-live="polite">
            <ButtonSpinner tone="dark" />
            Updating user access...
          </div>
        ) : null}
      </div>
    </AdminDialog>
  )
}
