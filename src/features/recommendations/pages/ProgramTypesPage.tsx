import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { hasAnyRole } from '@/features/auth/lib/access'
import { useAuthStore } from '@/features/auth/store/authStore'
import { isApiError, type ApiValidationErrors } from '@/shared/api/http'
import { DataTable, type DataTableColumn } from '@/shared/table'
import { notify } from '@/shared/toast'
import {
  createProgramType,
  listProgramTypes,
  listSectors,
  updateProgramType,
} from '../api/recommendationsApi'
import ProgramTypeFormModal, { type ProgramTypeFormMode } from '../components/ProgramTypeFormModal'
import { formatDecimal, getRecommendationErrorMessage } from '../lib/format'
import { SCORING_MATRIX_ROLES, type ProgramType, type ProgramTypePayload, type Sector } from '../types'

const primaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60 rounded-md'
const secondaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-[#d8e1d4] px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-60 rounded-md'
const chipClassName = 'inline-flex border px-2.5 py-1 text-xs font-medium'

export default function ProgramTypesPage() {
  const currentUser = useAuthStore((state) => state.user)
  const canConfigure = hasAnyRole(currentUser, SCORING_MATRIX_ROLES)

  const [programTypes, setProgramTypes] = useState<ProgramType[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<ProgramTypeFormMode>('create')
  const [formTarget, setFormTarget] = useState<ProgramType | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formApiErrors, setFormApiErrors] = useState<ApiValidationErrors>({})

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const [loadedTypes, loadedSectors] = await Promise.all([listProgramTypes(), listSectors()])
      setProgramTypes(loadedTypes)
      setSectors(loadedSectors)
    } catch (error) {
      setErrorMessage(getRecommendationErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setFormMode('create')
    setFormTarget(null)
    setFormError(null)
    setFormApiErrors({})
    setFormOpen(true)
  }

  const openEdit = (programType: ProgramType) => {
    setFormMode('edit')
    setFormTarget(programType)
    setFormError(null)
    setFormApiErrors({})
    setFormOpen(true)
  }

  const handleSubmit = async (payload: ProgramTypePayload) => {
    setFormLoading(true)
    setFormError(null)
    setFormApiErrors({})
    try {
      if (formMode === 'create') {
        await createProgramType(payload)
        notify.success(`${payload.name} added to the program-type library.`)
      } else if (formTarget) {
        await updateProgramType(formTarget.id, payload)
        notify.success(`${payload.name} updated.`)
      }
      setFormOpen(false)
      await load()
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        setFormApiErrors(error.fields ?? {})
      }
      setFormError(getRecommendationErrorMessage(error))
    } finally {
      setFormLoading(false)
    }
  }

  const columns: DataTableColumn<ProgramType>[] = [
    {
      key: 'name',
      header: 'Program type',
      frozen: true,
      width: 260,
      cellClassName: 'truncate text-[#123524] font-medium',
      render: (row) => row.name,
    },
    {
      key: 'description',
      header: 'Description',
      width: 320,
      render: (row) => row.description ?? '-',
    },
    {
      key: 'duration',
      header: 'Typical duration',
      width: 160,
      render: (row) => row.defaultDuration ?? '-',
    },
    {
      key: 'needs',
      header: 'Needs addressed',
      width: 300,
      render: (row) => {
        const weighted = row.weights.filter((weight) => weight.weight > 0)
        if (weighted.length === 0) {
          return <span className="text-[#617462]">Not weighted yet</span>
        }
        return (
          <span className="flex flex-wrap gap-1.5">
            {weighted.map((weight) => (
              <span
                key={weight.needCategoryId}
                className={`${chipClassName} border-[#d8e1d4] bg-[#f7faf6] text-[#123524]`}
              >
                {weight.needCategoryName}
                <span className="ml-1.5 font-normal text-[#617462]">{formatDecimal(weight.weight, 1)}</span>
              </span>
            ))}
          </span>
        )
      },
    },
    {
      key: 'sectors',
      header: 'Target sectors',
      width: 260,
      render: (row) =>
        row.sectors.length === 0 ? (
          <span className="text-[#617462]">-</span>
        ) : (
          <span className="flex flex-wrap gap-1.5">
            {row.sectors.map((sector) => (
              <span
                key={sector.id}
                className={`${chipClassName} border-[#bfd3c0] bg-[#f3f9f2] text-[#1f5d3b]`}
              >
                {sector.name}
              </span>
            ))}
          </span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 130,
      render: (row) => (
        <span
          className={[
            chipClassName,
            row.active
              ? 'border-[#bfd3c0] bg-[#f3f9f2] text-[#1f5d3b]'
              : 'border-[#d8e1d4] bg-[#f7faf6] text-[#617462]',
          ].join(' ')}
        >
          {row.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: 120,
      align: 'right',
      render: (row) =>
        canConfigure ? (
          <button
            type="button"
            aria-label={`Edit ${row.name}`}
            title="Edit"
            onClick={() => openEdit(row)}
            className="ml-auto flex h-9 w-9 items-center justify-center border border-[#d8e1d4] text-[#123524] transition-colors hover:bg-[#f6faf5] rounded-md"
          >
            <EditOutlinedIcon fontSize="small" />
          </button>
        ) : (
          <span className="inline-flex border border-[#d8e1d4] bg-[#f7faf6] px-3 py-2 text-xs font-medium text-[#617462]">
            Read only
          </span>
        ),
    },
  ]

  const activeCount = programTypes.filter((type) => type.active).length
  const unweightedCount = programTypes.filter(
    (type) => type.weights.every((weight) => weight.weight <= 0),
  ).length

  const summaryCards: { label: string; value: string; hint?: string }[] = [
    { label: 'Program types', value: String(programTypes.length) },
    { label: 'Active', value: String(activeCount), hint: 'Scored when recommendations run' },
    {
      label: 'Without weights',
      value: String(unweightedCount),
      hint: unweightedCount > 0 ? 'These can never score above 0' : undefined,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">
            Recommendation engine
          </p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#123524]">Program Library</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#506552]">
            The catalogue of extension program types the engine matches assessed community needs
            against. How strongly each one addresses a need is set in the scoring matrix.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link to="/admin/scoring-matrix" className={secondaryButtonClassName}>
            <GridOnOutlinedIcon fontSize="small" />
            Scoring matrix
          </Link>
          {canConfigure ? (
            <button type="button" onClick={openCreate} className={primaryButtonClassName}>
              <AddRoundedIcon fontSize="small" />
              Add Program Type
            </button>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <div className="space-y-3">
          <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">{errorMessage}</div>
          <button type="button" onClick={() => void load()} className={secondaryButtonClassName}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="border border-[#d8e1d4] bg-white px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#123524] tabular-nums">
              {card.value}
            </p>
            {card.hint ? <p className="mt-1 text-xs text-[#6a7f6d]">{card.hint}</p> : null}
          </div>
        ))}
      </div>

      <section className="border border-[#d8e1d4] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e7eee3] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#123524]">Program types</h3>
            <p className="mt-1 text-sm text-[#617462]">
              Deactivate a type instead of deleting it — recommendations already generated keep naming it.
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={programTypes}
          rowKey={(row) => row.id}
          loading={loading}
          loadingLabel="Loading program types..."
          emptyMessage="No program types yet. Add one so the engine has something to match against."
          minWidthClassName="min-w-[1400px]"
        />
      </section>

      <ProgramTypeFormModal
        key={formOpen ? `${formMode}-${formTarget?.id ?? 'new'}` : 'program-type-closed'}
        open={formOpen}
        mode={formMode}
        programType={formTarget}
        sectors={sectors}
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
