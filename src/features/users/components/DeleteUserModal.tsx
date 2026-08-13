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
        className="cursor-pointer border border-[#d8e1d4] bg-white px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => void onConfirm()}
        disabled={loading}
        className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#9f2f2f] bg-[#9f2f2f] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#832424] disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
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
      <div className="space-y-4 text-sm leading-6 text-[#506552]">
        <p>
          {user
            ? `Delete ${user.full_name} (${user.email}) from the user management module.`
            : 'Delete this user record.'}
        </p>
        <div className="border border-[#ead7d7] bg-[#fff7f7] px-4 py-3 text-[#8a2d2d]">
          This cannot be undone from the current screen.
        </div>
      </div>
    </AdminDialog>
  )
}
