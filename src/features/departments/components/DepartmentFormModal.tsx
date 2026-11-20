import { useState, type FormEvent } from 'react'
import type { Department } from '@/features/auth/types'
import AdminDialog from '@/features/users/components/AdminDialog'
import type { ApiValidationErrors } from '@/shared/api/http'
import type { DepartmentPayload } from '../api/departmentsApi'

export type DepartmentFormMode = 'create' | 'edit'

type DepartmentFormModalProps = {
  open: boolean
  mode: DepartmentFormMode
  department: Department | null
  loading: boolean
  errorMessage: string | null
  apiErrors?: ApiValidationErrors
  onClose: () => void
  onSubmit: (payload: DepartmentPayload) => void
}

const inputClassName =
  'w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'
const labelClassName = 'mb-2 block text-sm font-medium text-ink'
const fieldErrorClassName = 'mt-1 text-xs text-danger-text'

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

export default function DepartmentFormModal({
  open,
  mode,
  department,
  loading,
  errorMessage,
  apiErrors,
  onClose,
  onSubmit,
}: DepartmentFormModalProps) {
  const [code, setCode] = useState(department?.code ?? '')
  const [name, setName] = useState(department?.name ?? '')
  const [active, setActive] = useState(department?.active ?? true)

  const fieldError = (field: string): string | undefined => apiErrors?.[field]?.[0]

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({ code: code.trim().toUpperCase(), name: name.trim(), active })
  }

  return (
    <AdminDialog
      open={open}
      title={mode === 'create' ? 'Add Department' : 'Edit Department'}
      description="Departments scope who sees which proposals, surveys and reports. Deactivate one instead of deleting it — existing records keep their department."
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
            form="department-form"
            disabled={loading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Saving...' : mode === 'create' ? 'Add Department' : 'Save Changes'}
          </button>
        </div>
      }
    >
      <form id="department-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMessage ? (
          <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">{errorMessage}</div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          <div>
            <label htmlFor="department-code" className={labelClassName}>
              Code *
            </label>
            <input
              id="department-code"
              value={code}
              maxLength={32}
              disabled={loading}
              onChange={(event) => setCode(event.target.value)}
              placeholder="e.g. DCS"
              className={`${inputClassName} uppercase`}
            />
            {fieldError('code') ? <p className={fieldErrorClassName}>{fieldError('code')}</p> : null}
          </div>
          <div>
            <label htmlFor="department-name" className={labelClassName}>
              Name *
            </label>
            <input
              id="department-name"
              value={name}
              maxLength={255}
              disabled={loading}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Department of Computer Studies"
              className={inputClassName}
            />
            {fieldError('name') ? <p className={fieldErrorClassName}>{fieldError('name')}</p> : null}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={active}
            disabled={loading}
            onChange={(event) => setActive(event.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer accent-primary-accent"
          />
          <span>
            <span className="block text-sm font-medium text-ink">Active</span>
            <span className="mt-0.5 block text-xs text-muted-alt">
              Inactive departments drop out of pickers; users and records already assigned keep it.
            </span>
          </span>
        </label>
      </form>
    </AdminDialog>
  )
}
