import AdminDialog from '@/features/users/components/AdminDialog'

type DeleteCommunityModalProps = {
  open: boolean
  communityName: string | null
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

export default function DeleteCommunityModal({
  open,
  communityName,
  loading,
  onClose,
  onConfirm,
}: DeleteCommunityModalProps) {
  return (
    <AdminDialog
      open={open}
      title="Delete community"
      description={communityName ? `This will remove ${communityName} from the list.` : undefined}
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
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-danger bg-danger px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Deleting...' : 'Delete community'}
          </button>
        </div>
      }
    >
      <div className="border border-danger-border-soft bg-danger-bg-soft px-4 py-3 text-sm text-danger-text">
        Deleting a community is a soft delete — it is hidden from the list but its historical records
        are preserved. This action cannot be undone from the interface.
      </div>
    </AdminDialog>
  )
}
