import { useState, type FormEvent } from 'react'
import AdminDialog from '@/features/users/components/AdminDialog'
import type { ApiValidationErrors } from '@/shared/api/http'
import type { ProgramType, ProgramTypePayload, Sector } from '../types'

export type ProgramTypeFormMode = 'create' | 'edit'

type ProgramTypeFormModalProps = {
  open: boolean
  mode: ProgramTypeFormMode
  programType: ProgramType | null
  sectors: Sector[]
  loading: boolean
  errorMessage: string | null
  apiErrors?: ApiValidationErrors
  onClose: () => void
  onSubmit: (payload: ProgramTypePayload) => void
}

const inputClassName =
  'w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'
const labelClassName = 'mb-2 block text-sm font-medium text-ink'
const fieldErrorClassName = 'mt-1 text-xs text-danger-text'
const checkboxClassName = 'h-4 w-4 cursor-pointer accent-primary-accent disabled:cursor-not-allowed disabled:opacity-40'

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

export default function ProgramTypeFormModal({
  open,
  mode,
  programType,
  sectors,
  loading,
  errorMessage,
  apiErrors,
  onClose,
  onSubmit,
}: ProgramTypeFormModalProps) {
  const [name, setName] = useState(programType?.name ?? '')
  const [description, setDescription] = useState(programType?.description ?? '')
  const [defaultDuration, setDefaultDuration] = useState(programType?.defaultDuration ?? '')
  const [active, setActive] = useState(programType?.active ?? true)
  const [sectorIds, setSectorIds] = useState<string[]>(
    (programType?.sectors ?? []).map((sector) => sector.id),
  )

  const fieldError = (field: string): string | undefined => apiErrors?.[field]?.[0]

  const toggleSector = (sectorId: string) => {
    setSectorIds((current) =>
      current.includes(sectorId) ? current.filter((id) => id !== sectorId) : [...current, sectorId],
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      defaultDuration: defaultDuration.trim() || null,
      active,
      sectorIds,
    })
  }

  return (
    <AdminDialog
      open={open}
      title={mode === 'create' ? 'Add Program Type' : 'Edit Program Type'}
      description="Program types are what the engine matches against. Their need weights are set in the scoring matrix."
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
            form="program-type-form"
            disabled={loading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Saving...' : mode === 'create' ? 'Add Program Type' : 'Save Changes'}
          </button>
        </div>
      }
    >
      <form id="program-type-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMessage ? (
          <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">{errorMessage}</div>
        ) : null}

        <div>
          <label htmlFor="program-type-name" className={labelClassName}>
            Program type name *
          </label>
          <input
            id="program-type-name"
            value={name}
            disabled={loading}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Health & Wellness Caravan"
            className={inputClassName}
          />
          {fieldError('name') ? <p className={fieldErrorClassName}>{fieldError('name')}</p> : null}
        </div>

        <div>
          <label htmlFor="program-type-description" className={labelClassName}>
            Description
          </label>
          <textarea
            id="program-type-description"
            value={description}
            rows={3}
            disabled={loading}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Shown on the recommendation card, so write it for a coordinator deciding whether it fits."
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="program-type-duration" className={labelClassName}>
            Typical duration
          </label>
          <input
            id="program-type-duration"
            value={defaultDuration}
            disabled={loading}
            onChange={(event) => setDefaultDuration(event.target.value)}
            placeholder="e.g. 3 months"
            className={inputClassName}
          />
        </div>

        <fieldset>
          <legend className={labelClassName}>Target sectors</legend>
          <p className="mb-3 text-xs text-muted-alt">
            A program type earns a 10% bonus when at least one of these overlaps the assessed
            community&apos;s sectors.
          </p>
          {sectors.length === 0 ? (
            <p className="text-sm text-muted">No sectors are configured.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {sectors.map((sector) => (
                <li key={sector.id}>
                  <label className="flex cursor-pointer items-center gap-3 border border-line px-4 py-2.5 text-sm text-cell transition-colors hover:bg-hover-tint rounded-md">
                    <input
                      type="checkbox"
                      checked={sectorIds.includes(sector.id)}
                      disabled={loading}
                      onChange={() => toggleSector(sector.id)}
                      className={checkboxClassName}
                    />
                    {sector.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <label className="flex cursor-pointer items-center gap-3 border border-line px-4 py-3 text-sm text-cell transition-colors hover:bg-hover-tint rounded-md">
          <input
            type="checkbox"
            checked={active}
            disabled={loading}
            onChange={(event) => setActive(event.target.checked)}
            className={checkboxClassName}
          />
          <span>
            Active
            <span className="ml-2 text-xs text-muted-alt">
              Only active types are scored when recommendations are generated.
            </span>
          </span>
        </label>
      </form>
    </AdminDialog>
  )
}
