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
  'w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

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
            className="cursor-pointer border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Generating...' : 'Generate report'}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {errorMessage ? (
          <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">{errorMessage}</div>
        ) : null}

        <div className="border border-line bg-surface-tint px-4 py-3 text-sm text-warning">
          Leave a field blank to use the current holder of that role. Every generated copy is archived —
          regenerating never overwrites an earlier version.
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {SIGNATORY_FIELDS.map((field) => (
            <div key={field.key}>
              <label htmlFor={`qf23-${field.key}`} className="mb-2 block text-sm font-medium text-ink">
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
              <p className="mt-1.5 text-xs text-muted-alt">{field.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminDialog>
  )
}
