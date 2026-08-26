import { useState, type FormEvent } from 'react'
import AdminDialog from '@/features/users/components/AdminDialog'
import { PROGRAM_DOC_TYPE_OPTIONS, type ProgramDocType } from '../types'

type ProgramDocumentUploadModalProps = {
  open: boolean
  loading: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (file: File, docType: ProgramDocType) => void
}

/** Matches the server's limit (`LocalDiskStorageService.MAX_SIZE_BYTES`). */
const MAX_SIZE_BYTES = 10 * 1024 * 1024

const inputClassName =
  'w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors file:mr-3 file:cursor-pointer file:border-0 file:bg-transparent file:text-sm file:text-primary-accent focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint rounded-md'

const selectClassName =
  'w-full cursor-pointer border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint rounded-md'

const labelClassName = 'mb-2 block text-sm font-medium text-ink'

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

export default function ProgramDocumentUploadModal({
  open,
  loading,
  errorMessage,
  onClose,
  onSubmit,
}: ProgramDocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<ProgramDocType>('letter_request')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) {
      setLocalError('Please choose a file to upload.')
      return
    }
    // Checked client-side against the same limit the API enforces, so an oversized file fails
    // before it is uploaded rather than after (UI guidelines §6.13).
    if (file.size > MAX_SIZE_BYTES) {
      setLocalError('That file is larger than the 10 MB limit.')
      return
    }
    setLocalError(null)
    onSubmit(file, docType)
  }

  return (
    <AdminDialog
      open={open}
      title="Attach document"
      description="Accepted types: PDF, DOCX, XLSX, JPG, PNG. Maximum size 10 MB."
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
            form="program-document-upload-form"
            disabled={loading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      }
    >
      <form id="program-document-upload-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMessage || localError ? (
          <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
            {errorMessage ?? localError}
          </div>
        ) : null}

        <div>
          <label htmlFor="program-document-type" className={labelClassName}>
            Document type
          </label>
          <select
            id="program-document-type"
            value={docType}
            disabled={loading}
            onChange={(event) => setDocType(event.target.value as ProgramDocType)}
            className={selectClassName}
          >
            {PROGRAM_DOC_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="program-document-file" className={labelClassName}>
            File
          </label>
          <input
            id="program-document-file"
            type="file"
            accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
            disabled={loading}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
              setLocalError(null)
            }}
            className={inputClassName}
          />
        </div>
      </form>
    </AdminDialog>
  )
}
