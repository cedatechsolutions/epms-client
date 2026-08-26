import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { hasAnyRole } from '@/features/auth/lib/access'
import { useAuthStore } from '@/features/auth/store/authStore'
import { listCommunities } from '@/features/communities/api/communitiesApi'
import { listAcademicPeriods, type AcademicPeriod } from '@/features/dashboard'
import { listProgramTypes, listSectors } from '@/features/recommendations/api/recommendationsApi'
import { listSurveys } from '@/features/surveys/api/surveysApi'
import type { ApiValidationErrors } from '@/shared/api/http'
import { isApiError } from '@/shared/api/http'
import { DataTable, type DataTableColumn } from '@/shared/table'
import { notify } from '@/shared/toast'
import {
  createProgram,
  deleteProgram,
  getProgram,
  getProgramStats,
  listPrograms,
  listUserOptions,
  submitProgram,
  updateProgram,
} from '../api/programsApi'
import DeleteProgramModal from '../components/DeleteProgramModal'
import ProgramFormModal, {
  type PickerOption,
  type ProgramFormMode,
} from '../components/ProgramFormModal'
import ProgramStatusChip from '../components/ProgramStatusChip'
import { getProgramErrorMessage } from '../lib/errorMessages'
import { formatDate } from '../lib/format'
import {
  PROGRAM_AUTHOR_ROLES,
  type PaginationMeta,
  type Program,
  type ProgramListQuery,
  type ProgramPayload,
  type ProgramStats,
  type ProgramStatusTab,
  type ProgramSummary,
  type Sector,
  type UserOption,
} from '../types'

const defaultMeta: PaginationMeta = {
  current_page: 1,
  from: null,
  last_page: 1,
  path: '',
  per_page: 10,
  to: null,
  total: 0,
}

type PaginationItem = number | 'ellipsis'

/** The list's tabs (spec Module 5 §1). `under_review` collapses the three in-chain statuses. */
const STATUS_TABS: { value: ProgramStatusTab; label: string; countKey: keyof ProgramStats | null }[] = [
  { value: '', label: 'All', countKey: 'total' },
  { value: 'draft', label: 'Draft', countKey: 'draft' },
  { value: 'under_review', label: 'Under Review', countKey: 'underReview' },
  { value: 'returned', label: 'Returned', countKey: 'returned' },
  { value: 'approved', label: 'Approved', countKey: 'approved' },
  { value: 'ongoing', label: 'Ongoing', countKey: 'ongoing' },
  { value: 'completed', label: 'Completed', countKey: 'completed' },
]

const actionButtonClassName =
  'flex h-9 w-9 cursor-pointer items-center justify-center border border-line text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-45 rounded-md'

const destructiveActionButtonClassName =
  'flex h-9 w-9 cursor-pointer items-center justify-center border border-danger-border text-danger transition-colors hover:bg-danger-bg-soft disabled:cursor-not-allowed disabled:opacity-45 rounded-md'

const inputClassName =
  'h-10 border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

const selectClassName =
  'h-10 cursor-pointer border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

function getPaginationItems(currentPage: number, lastPage: number): PaginationItem[] {
  const pageSet = new Set<number>([1, lastPage, currentPage - 1, currentPage, currentPage + 1])
  if (currentPage <= 3) {
    pageSet.add(2)
    pageSet.add(3)
  }
  if (currentPage >= lastPage - 2) {
    pageSet.add(lastPage - 1)
    pageSet.add(lastPage - 2)
  }
  const pages = Array.from(pageSet)
    .filter((page) => page >= 1 && page <= lastPage)
    .sort((left, right) => left - right)
  return pages.reduce<PaginationItem[]>((items, page, index) => {
    const previousPage = pages[index - 1]
    if (previousPage && page - previousPage > 1) {
      items.push('ellipsis')
    }
    items.push(page)
    return items
  }, [])
}

/**
 * Flattens a 422 field map into one sentence, for the case where a proposal saved as a draft but
 * was not ready to submit. The user needs to know *what* is missing, and the draft already exists,
 * so a toast is the honest place for it — the form has already closed on a successful save.
 */
/** The filters the dashboard's drill-downs arrive with; kept in the URL so a view is shareable. */
const URL_FILTER_PARAMS = ['status', 'periodId', 'communityId', 'programTypeId'] as const

const STATUS_TAB_VALUES = STATUS_TABS.map((tab) => tab.value)

/** An unknown `status=` in the URL falls back to All rather than filtering to nothing. */
function readStatusTab(value: string | null): ProgramStatusTab {
  return STATUS_TAB_VALUES.includes((value ?? '') as ProgramStatusTab)
    ? ((value ?? '') as ProgramStatusTab)
    : ''
}

function describeMissingFields(fields: ApiValidationErrors | null | undefined): string {
  const messages = Object.values(fields ?? {})
    .map((entries) => entries[0])
    .filter(Boolean)
  return messages.length > 0 ? messages.join(' ') : 'Some required details are still missing.'
}

export default function ProgramsListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUser = useAuthStore((state) => state.user)
  const canAuthor = hasAnyRole(currentUser, PROGRAM_AUTHOR_ROLES)

  const [programs, setPrograms] = useState<ProgramSummary[]>([])
  const [stats, setStats] = useState<ProgramStats | null>(null)
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(defaultMeta.per_page)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  // Seeded from the URL so a dashboard drill-down lands on the list already filtered the way the
  // count that opened it was computed.
  const [statusTab, setStatusTab] = useState<ProgramStatusTab>(() =>
    readStatusTab(searchParams.get('status')),
  )
  const [communityFilter, setCommunityFilter] = useState(() => searchParams.get('communityId') ?? '')
  const [programTypeFilter, setProgramTypeFilter] = useState(
    () => searchParams.get('programTypeId') ?? '',
  )
  const [periodFilter, setPeriodFilter] = useState(() => searchParams.get('periodId') ?? '')
  const [sort, setSort] = useState<NonNullable<ProgramListQuery['sort']>>('createdAt')
  const [direction, setDirection] = useState<NonNullable<ProgramListQuery['direction']>>('desc')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Picker options for the proposal form. Loaded once; a failure here must not block the table.
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [communities, setCommunities] = useState<PickerOption[]>([])
  const [programTypes, setProgramTypes] = useState<PickerOption[]>([])
  const [surveys, setSurveys] = useState<PickerOption[]>([])
  const [facultyOptions, setFacultyOptions] = useState<UserOption[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<ProgramFormMode>('create')
  const [activeProgram, setActiveProgram] = useState<Program | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)
  const [formApiErrors, setFormApiErrors] = useState<ApiValidationErrors | undefined>(undefined)

  const [editFetchingId, setEditFetchingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProgramSummary | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadPrograms = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const response = await listPrograms({
        page,
        per_page: perPage,
        search,
        status: statusTab,
        communityId: communityFilter,
        programTypeId: programTypeFilter,
        periodId: periodFilter,
        sort,
        direction,
      })
      setPrograms(response.data)
      setMeta(response.meta)
      setPage(response.meta.current_page)
      try {
        // Same period as the rows, or the badges above the table would count a different set.
        setStats(await getProgramStats(periodFilter))
      } catch {
        setStats(null)
      }
    } catch (error) {
      setErrorMessage(getProgramErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [
    communityFilter,
    direction,
    page,
    perPage,
    periodFilter,
    programTypeFilter,
    search,
    sort,
    statusTab,
  ])

  useEffect(() => {
    void loadPrograms()
  }, [loadPrograms])

  // Filters are mirrored back into the URL (replace, so filtering does not fill the back stack).
  // Search and pagination stay out of it — they are transient, and a shared link should open the
  // same slice of data, not the same scroll position.
  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    const values: Record<(typeof URL_FILTER_PARAMS)[number], string> = {
      status: statusTab,
      periodId: periodFilter,
      communityId: communityFilter,
      programTypeId: programTypeFilter,
    }
    URL_FILTER_PARAMS.forEach((param) => {
      if (values[param]) {
        next.set(param, values[param])
      } else {
        next.delete(param)
      }
    })
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [communityFilter, periodFilter, programTypeFilter, searchParams, setSearchParams, statusTab])

  // The period calendar is open to every role, so it loads regardless of who may author a proposal.
  useEffect(() => {
    listAcademicPeriods()
      .then(setPeriods)
      .catch(() => setPeriods([]))
  }, [])

  useEffect(() => {
    if (!canAuthor) return
    // Every picker is optional context for the form; each falls back to an empty list on its own so
    // one unavailable lookup does not empty the rest.
    listCommunities({ per_page: 100, sort: 'name', direction: 'asc' })
      .then((response) =>
        setCommunities(response.data.map((community) => ({ id: community.id, label: community.name }))),
      )
      .catch(() => setCommunities([]))
    listProgramTypes()
      .then((types) =>
        setProgramTypes(types.filter((type) => type.active).map((type) => ({ id: type.id, label: type.name }))),
      )
      .catch(() => setProgramTypes([]))
    listSurveys({ per_page: 100, sort: 'title', direction: 'asc' })
      .then((response) =>
        setSurveys(response.data.map((survey) => ({ id: survey.id, label: survey.title }))),
      )
      .catch(() => setSurveys([]))
    listUserOptions('faculty')
      .then(setFacultyOptions)
      .catch(() => setFacultyOptions([]))
    listSectors()
      .then(setSectors)
      .catch(() => setSectors([]))
  }, [canAuthor])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  const countLabel = useMemo(() => {
    if (!meta.total) return 'No proposals available'
    const from = meta.from ?? 0
    const to = meta.to ?? 0
    return `Showing ${from}-${to} of ${meta.total} proposals`
  }, [meta.from, meta.to, meta.total])

  const paginationItems = useMemo(
    () => getPaginationItems(meta.current_page, meta.last_page),
    [meta.current_page, meta.last_page],
  )

  const handleSortChange = (nextSort: string) => {
    if (sort === nextSort) {
      setDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(nextSort as NonNullable<ProgramListQuery['sort']>)
      setDirection('asc')
    }
    setPage(1)
  }

  const openCreateModal = () => {
    if (!canAuthor) return
    setFormMode('create')
    setActiveProgram(null)
    setFormErrorMessage(null)
    setFormApiErrors(undefined)
    setFormOpen(true)
  }

  const openEditModal = async (program: ProgramSummary) => {
    if (!canAuthor) return
    // The summary row lacks the full record; fetch it so the form is pre-filled with real values
    // (the form submits every field, so partial data would overwrite).
    setEditFetchingId(program.id)
    try {
      const full = await getProgram(program.id)
      if (!full.canEdit) {
        notify.error('This proposal can no longer be edited at its current stage.')
        return
      }
      setFormMode('edit')
      setActiveProgram(full)
      setFormErrorMessage(null)
      setFormApiErrors(undefined)
      setFormOpen(true)
    } catch (error) {
      notify.error(getProgramErrorMessage(error))
    } finally {
      setEditFetchingId(null)
    }
  }

  const closeFormModal = () => {
    if (formLoading || formSubmitting) return
    setFormOpen(false)
    setActiveProgram(null)
    setFormErrorMessage(null)
    setFormApiErrors(undefined)
  }

  const handleFormSubmit = async (payload: ProgramPayload, alsoSubmit: boolean) => {
    if (alsoSubmit) {
      setFormSubmitting(true)
    } else {
      setFormLoading(true)
    }
    setFormErrorMessage(null)
    setFormApiErrors(undefined)

    let savedId: string | null = null
    try {
      const saved =
        formMode === 'create' || !activeProgram
          ? await createProgram(payload)
          : await updateProgram(activeProgram.id, payload)
      savedId = saved.id
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        setFormApiErrors(error.fields ?? {})
      } else {
        setFormErrorMessage(getProgramErrorMessage(error))
      }
      setFormLoading(false)
      setFormSubmitting(false)
      return
    }

    // The save succeeded. If the author also asked to submit, a validation failure now means the
    // draft is saved but not ready — a different outcome from the save failing, and it is reported
    // as such rather than as an error on a form that no longer has unsaved work.
    if (alsoSubmit && savedId) {
      try {
        await submitProgram(savedId)
        notify.success('Proposal submitted for review.')
      } catch (error) {
        if (isApiError(error) && error.status === 422) {
          notify.warning(`Saved as a draft — not submitted. ${describeMissingFields(error.fields)}`)
        } else {
          notify.warning(`Saved as a draft — not submitted. ${getProgramErrorMessage(error)}`)
        }
      }
    } else {
      notify.success(formMode === 'create' ? 'Proposal saved as a draft.' : 'Proposal updated.')
    }

    setFormOpen(false)
    setActiveProgram(null)
    setFormLoading(false)
    setFormSubmitting(false)

    if (formMode === 'create' && page !== 1) {
      setPage(1)
    } else {
      await loadPrograms()
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteProgram(deleteTarget.id)
      const stepBack = programs.length === 1 && page > 1
      notify.success(`Proposal "${deleteTarget.title}" withdrawn.`)
      setDeleteTarget(null)
      if (stepBack) {
        setPage((current) => Math.max(1, current - 1))
      } else {
        await loadPrograms()
      }
    } catch (error) {
      notify.error(getProgramErrorMessage(error))
    } finally {
      setDeleteLoading(false)
    }
  }

  const renderRowActions = (program: ProgramSummary) => {
    const isOpenForEditing = program.status === 'draft' || program.status === 'returned'
    return (
      <div className="flex justify-end gap-2">
        <button
          type="button"
          aria-label={`View ${program.title}`}
          title="View"
          onClick={() => navigate(`/admin/programs/${program.id}`)}
          className={actionButtonClassName}
        >
          <VisibilityOutlinedIcon fontSize="small" />
        </button>
        {canAuthor && isOpenForEditing ? (
          <>
            <button
              type="button"
              aria-label={`Edit ${program.title}`}
              title="Edit"
              disabled={deleteLoading || editFetchingId === program.id}
              onClick={() => void openEditModal(program)}
              className={actionButtonClassName}
            >
              <EditOutlinedIcon fontSize="small" />
            </button>
            <button
              type="button"
              aria-label={`Withdraw ${program.title}`}
              title="Withdraw"
              disabled={deleteLoading}
              onClick={() => setDeleteTarget(program)}
              className={destructiveActionButtonClassName}
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </button>
          </>
        ) : null}
      </div>
    )
  }

  const columns: DataTableColumn<ProgramSummary>[] = [
    {
      key: 'title',
      header: 'Proposal',
      frozen: true,
      width: 260,
      sortKey: 'title',
      cellClassName: 'text-ink',
      render: (program) => (
        <button
          type="button"
          onClick={() => navigate(`/admin/programs/${program.id}`)}
          className="cursor-pointer truncate text-left font-medium text-primary-accent hover:underline rounded-md"
        >
          {program.title}
        </button>
      ),
    },
    {
      key: 'community',
      header: 'Community',
      width: 180,
      render: (program) => program.communityName ?? '-',
    },
    {
      key: 'programType',
      header: 'Program Type',
      width: 180,
      render: (program) => program.programTypeName ?? '-',
    },
    {
      key: 'facultyLead',
      header: 'Faculty Lead',
      width: 180,
      render: (program) => program.facultyLeadName ?? '-',
    },
    {
      key: 'status',
      header: 'Status',
      width: 190,
      sortKey: 'status',
      render: (program) => <ProgramStatusChip status={program.status} />,
    },
    {
      key: 'proposedDate',
      header: 'Proposed Date',
      width: 150,
      sortKey: 'proposedDate',
      cellClassName: 'whitespace-nowrap',
      render: (program) => formatDate(program.proposedDate),
    },
    { key: 'actions', header: 'Actions', align: 'right', width: 160, render: renderRowActions },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">
            Extension projects
          </p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">Project proposals</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-body">
            Draft, submit and track extension project proposals through the four-stage CvSU approval
            chain — extension coordinator, campus extension coordinator, then campus administrator.
          </p>
          {!canAuthor ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-warning">
              Your account has read-only access to proposals. Faculty and extension coordinators
              author them; reviewers act on the proposal's own screen.
            </p>
          ) : null}
        </div>

        {canAuthor ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={openCreateModal}
              disabled={loading || formLoading || formSubmitting}
              className="cursor-pointer border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
            >
              New Proposal
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            { label: 'Total proposals', value: stats?.total },
            { label: 'Under review', value: stats?.underReview },
            { label: 'Approved', value: stats?.approved },
            { label: 'Completed', value: stats?.completed },
          ] as const
        ).map((card) => (
          <div key={card.label} className="rounded-lg border border-line bg-surface px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">{card.label}</p>
            {card.value === undefined ? (
              <span className="mt-2 block h-8 w-16 animate-pulse bg-skeleton" />
            ) : (
              <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-ink">{card.value}</p>
            )}
          </div>
        ))}
      </div>

      <section className="rounded-lg overflow-hidden border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Proposal records</p>
            <p className="mt-1 text-sm text-muted">Filter by stage, period, community, or program type.</p>
          </div>
          <p className="text-sm text-muted">{countLabel}</p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-divider px-5 py-4">
          {STATUS_TABS.map((tab) => {
            const isActive = statusTab === tab.value
            const count = tab.countKey && stats ? stats[tab.countKey] : null
            return (
              <button
                key={tab.value || 'all'}
                type="button"
                aria-pressed={isActive}
                disabled={loading}
                onClick={() => {
                  setStatusTab(tab.value)
                  setPage(1)
                }}
                className={[
                  'inline-flex items-center gap-2 border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 rounded-md',
                  isActive
                    ? 'border-primary bg-primary text-white'
                    : 'cursor-pointer border-line text-ink hover:bg-hover-tint',
                ].join(' ')}
              >
                {tab.label}
                {count === null ? null : (
                  <span className={isActive ? 'text-white/80' : 'text-muted'}>{count}</span>
                )}
              </button>
            )
          })}
        </div>

        <div className="grid gap-3 border-b border-divider px-5 py-4 md:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(150px,auto))] md:items-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">Search</span>
            <input
              type="search"
              value={searchInput}
              disabled={loading}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Title, venue, or objectives"
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">Community</span>
            <select
              value={communityFilter}
              disabled={loading}
              onChange={(event) => {
                setCommunityFilter(event.target.value)
                setPage(1)
              }}
              className={selectClassName}
            >
              <option value="">All communities</option>
              {communities.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">Program type</span>
            <select
              value={programTypeFilter}
              disabled={loading}
              onChange={(event) => {
                setProgramTypeFilter(event.target.value)
                setPage(1)
              }}
              className={selectClassName}
            >
              <option value="">All program types</option>
              {programTypes.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">
              Academic period
            </span>
            <select
              value={periodFilter}
              disabled={loading}
              onChange={(event) => {
                setPeriodFilter(event.target.value)
                setPage(1)
              }}
              className={selectClassName}
            >
              <option value="">All periods</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.current ? `${period.label} (current)` : period.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">Rows</span>
            <select
              value={perPage}
              disabled={loading}
              onChange={(event) => {
                setPerPage(Number(event.target.value))
                setPage(1)
              }}
              className={selectClassName}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>

        {errorMessage ? (
          <div className="space-y-4 px-5 py-6">
            <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
              {errorMessage}
            </div>
            <button
              type="button"
              onClick={() => void loadPrograms()}
              className="cursor-pointer border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint rounded-md"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={programs}
              rowKey={(program) => program.id}
              loading={loading}
              loadingLabel="Loading proposals..."
              emptyMessage="No proposals found."
              minWidthClassName="min-w-[1240px]"
              sortKey={sort}
              sortDirection={direction}
              onSortChange={handleSortChange}
            />

            {meta.total > 0 ? (
              <div className="flex flex-col gap-4 border-t border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm text-muted">
                  Page {meta.current_page} of {meta.last_page}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={meta.current_page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="cursor-pointer border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-45 rounded-md"
                  >
                    Previous
                  </button>
                  {paginationItems.map((item, index) =>
                    item === 'ellipsis' ? (
                      <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted-faint">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        className={[
                          'min-w-10 border px-3 py-2 text-sm font-medium transition-colors rounded-md',
                          item === meta.current_page
                            ? 'cursor-default border-primary bg-primary text-white'
                            : 'cursor-pointer border-line text-ink hover:bg-hover-tint',
                        ].join(' ')}
                      >
                        {item}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => setPage((current) => Math.min(meta.last_page, current + 1))}
                    className="cursor-pointer border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-45 rounded-md"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      <ProgramFormModal
        key={`${formMode}-${activeProgram?.id ?? 'new'}-${formOpen ? 'open' : 'closed'}`}
        open={formOpen}
        mode={formMode}
        program={activeProgram}
        communities={communities}
        programTypes={programTypes}
        surveys={surveys}
        facultyOptions={facultyOptions}
        sectors={sectors}
        loading={formLoading}
        submitting={formSubmitting}
        errorMessage={formErrorMessage}
        apiErrors={formApiErrors}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
      />

      <DeleteProgramModal
        open={Boolean(deleteTarget)}
        programTitle={deleteTarget?.title ?? null}
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}
