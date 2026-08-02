import { useState } from 'react'
import AdminDialog from '@/features/users/components/AdminDialog'
import type { SignatoryOverrides } from '../types'

type Qf23ReportModalProps = {
  open: boolean
  loading: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (overrides: SignatoryOverrides) => void
}

const inputClassName =
  'w-full border border-[#cad5c7] bg-white px-4 py-3 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]'

/** Signatory block of the EXTN-QF-23 form; each line defaults to the role holder when left blank. */
const SIGNATORY_FIELDS = [
  { key: 'preparedBy', label: 'Prepared by', hint: 'Extension coordinator who ran the assessment' },
  { key: 'notedBy', label: 'Noted by', hint: 'Campus extension coordinator' },
  { key: 'recommendingApproval', label: 'Recommending approval', hint: 'Campus administrator' },
  { key: 'approvedBy', label: 'Approved by', hint: 'Approving authority' },
] as const

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

export default function Qf23ReportModal({
  open,
  loading,
  errorMessage,
  onClose,
  onSubmit,
}: Qf23ReportModalProps) {
  const [values, setValues] = useState<Record<string, string>>({
    preparedBy: '',
    notedBy: '',
    recommendingApproval: '',
    approvedBy: '',
  })

  const handleSubmit = () => {
    const trimmed = (key: string) => {
      const value = values[key]?.trim()
      return value ? value : null
    }

    onSubmit({
      preparedBy: trimmed('preparedBy'),
      notedBy: trimmed('notedBy'),
      recommendingApproval: trimmed('recommendingApproval'),
      approvedBy: trimmed('approvedBy'),
    })
  }

  return (
    <AdminDialog
      open={open}
      title="Generate EXTN-QF-23 report"
      description="The report is pre-filled with the finalized results. Narrative sections are marked as placeholders for you to complete in Word."
      maxWidthClassName="max-w-3xl"
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
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Generating...' : 'Generate report'}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {errorMessage ? (
          <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">{errorMessage}</div>
        ) : null}

        <div className="border border-[#d8e1d4] bg-[#f7faf6] px-4 py-3 text-sm text-[#7b6542]">
          Leave a field blank to use the current holder of that role. Every generated copy is archived —
          regenerating never overwrites an earlier version.
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {SIGNATORY_FIELDS.map((field) => (
            <div key={field.key}>
              <label htmlFor={`qf23-${field.key}`} className="mb-2 block text-sm font-medium text-[#123524]">
                {field.label}
              </label>
              <input
                id={`qf23-${field.key}`}
                type="text"
                value={values[field.key]}
                disabled={loading}
                placeholder="Use role holder"
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.key]: event.target.value }))
                }
                className={inputClassName}
              />
              <p className="mt-1.5 text-xs text-[#6a7f6d]">{field.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminDialog>
  )
}
