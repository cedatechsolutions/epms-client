import { useState, type FormEvent } from 'react'
import AdminDialog from '@/features/users/components/AdminDialog'
import { DOC_TYPE_OPTIONS, type DocType } from '../types'

type DocumentUploadModalProps = {
  open: boolean
  loading: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (file: File, docType: DocType) => void
}

const inputClassName =
  'w-full border border-[#cad5c7] bg-white px-4 py-3 text-sm text-[#123524] outline-none transition-colors file:mr-3 file:cursor-pointer file:border-0 file:bg-transparent file:text-sm file:text-[#1f5d3b] focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6]'

const selectClassName =
  'w-full cursor-pointer border border-[#cad5c7] bg-white px-4 py-3 text-sm text-[#123524] outline-none transition-colors focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6]'

const labelClassName = 'mb-2 block text-sm font-medium text-[#123524]'

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

export default function DocumentUploadModal({
  open,
  loading,
  errorMessage,
  onClose,
  onSubmit,
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<DocType>('moa')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) {
      setLocalError('Please choose a file to upload.')
      return
    }
    setLocalError(null)
    onSubmit(file, docType)
  }

  return (
    <AdminDialog
      open={open}
      title="Upload document"
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
            className="cursor-pointer border border-[#d8e1d4] bg-white px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="document-upload-form"
            disabled={loading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      }
    >
      <form id="document-upload-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMessage || localError ? (
          <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">
            {errorMessage ?? localError}
          </div>
        ) : null}

        <div>
          <label htmlFor="document-type" className={labelClassName}>
            Document type
          </label>
          <select
            id="document-type"
            value={docType}
            disabled={loading}
            onChange={(event) => setDocType(event.target.value as DocType)}
            className={selectClassName}
          >
            {DOC_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="document-file" className={labelClassName}>
            File
          </label>
          <input
            id="document-file"
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
