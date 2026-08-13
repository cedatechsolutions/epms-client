import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { hasAnyRole } from '@/features/auth/lib/access'
import { useAuthStore } from '@/features/auth/store/authStore'
import { DataTable, type DataTableColumn } from '@/shared/table'
import { notify } from '@/shared/toast'
import { getScoringMatrix, updateScoringMatrix } from '../api/recommendationsApi'
import { getRecommendationErrorMessage } from '../lib/format'
import {
  MAX_MATRIX_WEIGHT,
  MIN_MATRIX_WEIGHT,
  SCORING_MATRIX_ROLES,
  type ScoringMatrix,
  type ScoringMatrixCell,
  type ScoringMatrixRow,
} from '../types'

const primaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md'
const secondaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md'
const cellInputClassName =
  'h-10 w-full border bg-surface px-3 text-right text-sm text-ink outline-none transition-colors focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

/** The draft grid: program type id -> need category id -> the raw input value. */
type MatrixDraft = Record<string, Record<string, string>>

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

function toDraft(matrix: ScoringMatrix): MatrixDraft {
  const draft: MatrixDraft = {}
  for (const row of matrix.rows) {
    draft[row.programTypeId] = {}
    for (const category of matrix.categories) {
      draft[row.programTypeId][category.id] = String(row.weights[category.id] ?? 0)
    }
  }
  return draft
}

function isValidWeight(value: string): boolean {
  if (value.trim() === '') return false
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= MIN_MATRIX_WEIGHT && parsed <= MAX_MATRIX_WEIGHT
}

export default function ScoringMatrixPage() {
  const currentUser = useAuthStore((state) => state.user)
  const canConfigure = hasAnyRole(currentUser, SCORING_MATRIX_ROLES)

  const [matrix, setMatrix] = useState<ScoringMatrix | null>(null)
  const [draft, setDraft] = useState<MatrixDraft>({})
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const loaded = await getScoringMatrix()
      setMatrix(loaded)
      setDraft(toDraft(loaded))
    } catch (error) {
      setErrorMessage(getRecommendationErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  /** Only the cells whose value actually moved are sent — the matrix is stored sparsely. */
  const changedCells = useMemo((): ScoringMatrixCell[] => {
    if (!matrix) return []
    const cells: ScoringMatrixCell[] = []
    for (const row of matrix.rows) {
      for (const category of matrix.categories) {
        const value = draft[row.programTypeId]?.[category.id] ?? ''
        if (!isValidWeight(value)) continue
        const parsed = Number(value)
        if (parsed !== (row.weights[category.id] ?? 0)) {
          cells.push({ programTypeId: row.programTypeId, needCategoryId: category.id, weight: parsed })
        }
      }
    }
    return cells
  }, [draft, matrix])

  const invalidCount = useMemo(() => {
    if (!matrix) return 0
    return matrix.rows.reduce(
      (total, row) =>
        total +
        matrix.categories.filter(
          (category) => !isValidWeight(draft[row.programTypeId]?.[category.id] ?? ''),
        ).length,
      0,
    )
  }, [draft, matrix])

  const handleCellChange = (programTypeId: string, needCategoryId: string, value: string) => {
    setDraft((current) => ({
      ...current,
      [programTypeId]: { ...current[programTypeId], [needCategoryId]: value },
    }))
  }

  const handleSave = async () => {
    if (changedCells.length === 0) return
    setSaving(true)
    try {
      const saved = await updateScoringMatrix(changedCells)
      setMatrix(saved)
      setDraft(toDraft(saved))
      notify.success(
        `${changedCells.length} ${changedCells.length === 1 ? 'weight' : 'weights'} saved. Recommendations already generated keep their original scores.`,
      )
    } catch (error) {
      notify.error(getRecommendationErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const columns: DataTableColumn<ScoringMatrixRow>[] = [
    {
      key: 'programType',
      header: 'Program type',
      frozen: true,
      width: 260,
      cellClassName: 'truncate text-ink font-medium',
      render: (row) => (
        <span className="flex items-center gap-2">
          <span className="truncate">{row.programTypeName}</span>
          {row.active ? null : (
            <span className="inline-flex shrink-0 rounded-md border border-line bg-surface-tint px-2 py-0.5 text-[11px] font-medium text-muted">
              Inactive
            </span>
          )}
        </span>
      ),
    },
    ...(matrix?.categories ?? []).map((category): DataTableColumn<ScoringMatrixRow> => ({
      key: category.id,
      header: category.name,
      width: 150,
      align: 'right',
      render: (row) => {
        const value = draft[row.programTypeId]?.[category.id] ?? ''
        const invalid = !isValidWeight(value)
        return (
          <input
            type="number"
            inputMode="decimal"
            min={MIN_MATRIX_WEIGHT}
            max={MAX_MATRIX_WEIGHT}
            step={0.5}
            value={value}
            disabled={!canConfigure || saving}
            aria-label={`${row.programTypeName} weight for ${category.name}`}
            aria-invalid={invalid}
            onChange={(event) => handleCellChange(row.programTypeId, category.id, event.target.value)}
            className={[cellInputClassName, invalid ? 'border-danger-border rounded-md' : 'border-line'].join(' ')}
          />
        )
      },
    })),
  ]

  return (
    <div className="space-y-6">
      <Link
        to="/admin/program-types"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary-accent hover:underline"
      >
        <ArrowBackRoundedIcon fontSize="small" />
        Back to program library
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">
            Recommendation engine
          </p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">Scoring Matrix</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-body">
            How strongly each program type addresses each need category, from 0.00 (not at all) to
            5.00 (its core purpose). These weights are the whole of the engine — there is no model
            behind them.
          </p>
        </div>

        {canConfigure ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => matrix && setDraft(toDraft(matrix))}
              disabled={saving || changedCells.length === 0}
              className={secondaryButtonClassName}
            >
              Discard changes
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || changedCells.length === 0 || invalidCount > 0}
              title={invalidCount > 0 ? 'Some weights are outside 0.00–5.00' : undefined}
              className={primaryButtonClassName}
            >
              {saving ? <ButtonSpinner /> : null}
              {saving
                ? 'Saving...'
                : changedCells.length === 0
                  ? 'Save Matrix'
                  : `Save ${changedCells.length} ${changedCells.length === 1 ? 'Change' : 'Changes'}`}
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex items-start gap-3 border border-line bg-surface-tint px-4 py-3 text-sm text-warning">
        <InfoOutlinedIcon fontSize="small" className="mt-0.5 shrink-0 text-warning" />
        <p>
          Scores are normalised against each program type&apos;s own ceiling, so raising every one of a
          type&apos;s weights together changes nothing — what matters is the <strong>balance</strong> between
          a type&apos;s categories, and setting a weight to 0 to drop a category entirely. Edits apply to
          future runs only; recommendations already generated keep the scores they were produced with.
        </p>
      </div>

      {errorMessage ? (
        <div className="space-y-3">
          <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">{errorMessage}</div>
          <button type="button" onClick={() => void load()} className={secondaryButtonClassName}>
            Retry
          </button>
        </div>
      ) : null}

      {invalidCount > 0 ? (
        <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
          {invalidCount} {invalidCount === 1 ? 'weight is' : 'weights are'} empty or outside 0.00–5.00.
          Fix them before saving.
        </div>
      ) : null}

      <section className="rounded-lg overflow-hidden border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">
              Program types x need categories
            </h3>
            <p className="mt-1 text-sm text-muted">
              A weight of 0 removes the pairing entirely — the category then plays no part in that
              type&apos;s score, in either direction.
            </p>
          </div>
          {canConfigure ? null : (
            <span className="inline-flex rounded-md border border-line bg-surface-tint px-3 py-2 text-xs font-medium text-muted">
              Read only
            </span>
          )}
        </div>

        <DataTable
          columns={columns}
          rows={matrix?.rows ?? []}
          rowKey={(row) => row.programTypeId}
          loading={loading}
          loadingLabel="Loading scoring matrix..."
          emptyMessage="No program types to weight yet. Add one in the program library first."
          minWidthClassName="min-w-[1400px]"
        />
      </section>
    </div>
  )
}
