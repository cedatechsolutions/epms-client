import type { User } from '../types'
import AdminDialog from './AdminDialog'

type DeleteUserModalProps = {
  open: boolean
  user: User | null
  loading?: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

export default function DeleteUserModal({
  open,
  user,
  loading = false,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
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
        onClick={() => void onConfirm()}
        disabled={loading}
        className="inline-flex cursor-pointer items-center justify-center gap-2 border border-danger bg-danger px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
      >
        {loading ? <ButtonSpinner /> : null}
        {loading ? 'Deleting...' : 'Delete User'}
      </button>
    </div>
  )

  return (
    <AdminDialog
      open={open}
      title="Delete User"
      description="This action removes the selected record from the user management table."
      footer={footer}
      maxWidthClassName="max-w-xl"
      closeDisabled={loading}
      onClose={onClose}
    >
      <div className="space-y-4 text-sm leading-6 text-body">
        <p>
          {user
            ? `Delete ${user.full_name} (${user.email}) from the user management module.`
            : 'Delete this user record.'}
        </p>
        <div className="rounded-md border border-danger-border-soft bg-danger-bg-soft px-4 py-3 text-danger-text">
          This cannot be undone from the current screen.
        </div>
      </div>
    </AdminDialog>
  )
}
