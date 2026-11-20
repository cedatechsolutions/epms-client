import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Department } from '@/features/auth/types'
import { isApiError, type ApiValidationErrors } from '@/shared/api/http'
import { DataTable, type DataTableColumn } from '@/shared/table'
import { notify } from '@/shared/toast'
import {
  createDepartment,
  listDepartments,
  updateDepartment,
  type DepartmentPayload,
} from '../api/departmentsApi'
import DepartmentFormModal, { type DepartmentFormMode } from '../components/DepartmentFormModal'

const primaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md'
const secondaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md'
const textActionButtonClassName =
  'inline-flex h-9 cursor-pointer items-center justify-center gap-2 border border-line px-3 text-xs font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-45 rounded-md'
const iconActionButtonClassName =
  'flex h-9 w-9 cursor-pointer items-center justify-center border border-line text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-45 rounded-md'
const chipClassName = 'inline-flex border px-2.5 py-1 text-xs font-medium'

function errorMessageOf(error: unknown): string {
  return isApiError(error) && error.message ? error.message : 'Something went wrong. Please try again.'
}

/**
 * Settings / Departments (Department-Based Access, Phase D). Administrator-only: the backend's
 * `canManageDepartments` is the admin role, matching the route gate in App.tsx.
 */
export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<DepartmentFormMode>('create')
  const [formTarget, setFormTarget] = useState<Department | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formApiErrors, setFormApiErrors] = useState<ApiValidationErrors>({})
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      setDepartments(await listDepartments(true))
    } catch (error) {
      setErrorMessage(errorMessageOf(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openForm = (mode: DepartmentFormMode, target: Department | null) => {
    setFormMode(mode)
    setFormTarget(target)
    setFormError(null)
    setFormApiErrors({})
    setFormOpen(true)
  }

  const handleSubmit = async (payload: DepartmentPayload) => {
    setFormLoading(true)
    setFormError(null)
    setFormApiErrors({})
    try {
      if (formMode === 'create') {
        await createDepartment(payload)
        notify.success(`${payload.code} added.`)
      } else if (formTarget) {
        await updateDepartment(formTarget.id, payload)
        notify.success(`${payload.code} updated.`)
      }
      setFormOpen(false)
      await load()
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        setFormApiErrors(error.fields ?? {})
      }
      setFormError(errorMessageOf(error))
    } finally {
      setFormLoading(false)
    }
  }

  const toggleActive = async (department: Department) => {
    setTogglingId(department.id)
    try {
      await updateDepartment(department.id, {
        code: department.code,
        name: department.name,
        active: !department.active,
      })
      notify.success(`${department.code} ${department.active ? 'deactivated' : 'activated'}.`)
      await load()
    } catch (error) {
      notify.error(errorMessageOf(error))
    } finally {
      setTogglingId(null)
    }
  }

  const columns: DataTableColumn<Department>[] = [
    {
      key: 'code',
      header: 'Code',
      frozen: true,
      width: 120,
      cellClassName: 'font-medium text-ink',
      render: (row) => row.code,
    },
    { key: 'name', header: 'Name', width: 360, cellClassName: 'text-ink', render: (row) => row.name },
    {
      key: 'status',
      header: 'Status',
      width: 130,
      render: (row) => (
        <span
          className={[
            chipClassName,
            row.active
              ? 'border-success-border bg-success-bg text-primary-accent'
              : 'border-line bg-surface-tint text-muted',
          ].join(' ')}
        >
          {row.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: 200,
      align: 'right',
      render: (row) => {
        const busy = togglingId === row.id
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void toggleActive(row)}
              className={textActionButtonClassName}
            >
              {busy ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-primary-accent" />
              ) : null}
              {row.active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              type="button"
              aria-label={`Edit ${row.code}`}
              title="Edit"
              disabled={busy}
              onClick={() => openForm('edit', row)}
              className={iconActionButtonClassName}
            >
              <EditOutlinedIcon fontSize="small" />
            </button>
          </div>
        )
      },
    },
  ]

  const activeCount = useMemo(() => departments.filter((row) => row.active).length, [departments])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">Settings</p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">Departments</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-body">
            Department coordinators and facilitators see their own department&apos;s proposals, surveys
            and reports, and stage 2 of the approval chain goes to the coordinator of the
            proposal&apos;s department. Assign people to a department from User Management.
          </p>
        </div>
        <button type="button" onClick={() => openForm('create', null)} className={primaryButtonClassName}>
          <AddRoundedIcon fontSize="small" />
          Add Department
        </button>
      </div>

      {errorMessage ? (
        <div className="space-y-3">
          <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">{errorMessage}</div>
          <button type="button" onClick={() => void load()} className={secondaryButtonClassName}>
            Retry
          </button>
        </div>
      ) : null}

      <section className="rounded-lg overflow-hidden border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">All departments</h3>
            <p className="mt-1 text-sm text-muted">
              Deactivating hides a department from pickers; nothing already filed under it moves.
            </p>
          </div>
          <p className="text-sm text-muted">
            {loading ? 'Loading...' : `${activeCount} active of ${departments.length}`}
          </p>
        </div>

        <DataTable
          columns={columns}
          rows={departments}
          rowKey={(row) => row.id}
          loading={loading}
          loadingLabel="Loading departments..."
          emptyMessage="No departments yet. Add one before assigning department coordinators and facilitators."
          minWidthClassName="min-w-[810px]"
        />
      </section>

      <DepartmentFormModal
        key={formOpen ? `${formMode}-${formTarget?.id ?? 'new'}` : 'department-closed'}
        open={formOpen}
        mode={formMode}
        department={formTarget}
        loading={formLoading}
        errorMessage={formError}
        apiErrors={formApiErrors}
        onClose={() => {
          if (!formLoading) setFormOpen(false)
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
