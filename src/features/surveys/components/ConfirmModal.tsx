import type { ReactNode } from 'react'
import AdminDialog from '@/features/users/components/AdminDialog'

type ConfirmModalProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  loadingLabel: string
  destructive?: boolean
  loading: boolean
  children?: ReactNode
  onClose: () => void
  onConfirm: () => void
}

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  loadingLabel,
  destructive = false,
  loading,
  children,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const confirmClassName = destructive
    ? 'border-[#9f2f2f] bg-[#9f2f2f] hover:bg-[#832424]'
    : 'border-[#1f5d3b] bg-[#1f5d3b] hover:bg-[#18492e]'

  return (
    <AdminDialog
      open={open}
      title={title}
      description={description}
      maxWidthClassName="max-w-xl"
      closeDisabled={loading}
      onClose={onClose}
      footer={
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
            onClick={onConfirm}
            disabled={loading}
            className={[
              'inline-flex cursor-pointer items-center justify-center gap-2 border px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 rounded-md',
              confirmClassName,
            ].join(' ')}
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      }
    >
      {children}
    </AdminDialog>
  )
}
