import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { hasAnyRole } from '@/features/auth/lib/access'
import { useAuthStore } from '@/features/auth/store/authStore'
import type { ApiValidationErrors } from '@/shared/api/http'
import { isApiError } from '@/shared/api/http'
import { DataTable, type DataTableColumn } from '@/shared/table'
import { notify } from '@/shared/toast'
import {
  createCommunity,
  deleteCommunity,
  getCommunity,
  getCommunityStats,
  listCommunities,
  listSectors,
  updateCommunity,
} from '../api/communitiesApi'
import CommunityFormModal, { type CommunityFormMode } from '../components/CommunityFormModal'
import DeleteCommunityModal from '../components/DeleteCommunityModal'
import { getCommunityErrorMessage } from '../lib/errorMessages'
import { formatDateTime } from '../lib/format'
import {
  CLASSIFICATION_OPTIONS,
  COMMUNITY_MANAGE_ROLES,
  type Community,
  type CommunityListQuery,
  type CommunityPayload,
  type CommunityStats,
  type CommunitySummary,
  type PaginationMeta,
  type Sector,
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

const actionButtonClassName =
  'flex h-9 w-9 cursor-pointer items-center justify-center border border-[#d8e1d4] text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-45'

const destructiveActionButtonClassName =
  'flex h-9 w-9 cursor-pointer items-center justify-center border border-[#e3c9c9] text-[#9f2f2f] transition-colors hover:bg-[#fff7f7] disabled:cursor-not-allowed disabled:opacity-45'

const inputClassName =
  'h-10 border border-[#d8e1d4] bg-white px-3 text-sm text-[#123524] outline-none transition-colors focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]'

const selectClassName =
  'h-10 cursor-pointer border border-[#d8e1d4] bg-white px-3 text-sm text-[#123524] outline-none transition-colors focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]'

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

function SectorChips({ sectors }: { sectors: Sector[] }) {
  if (sectors.length === 0) {
    return <span className="text-[#617462]">-</span>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {sectors.map((sector) => (
        <span
          key={sector.id}
          className="inline-flex border border-[#d8e1d4] bg-[#f7faf6] px-2.5 py-1 text-xs font-medium text-[#123524]"
        >
          {sector.name}
        </span>
      ))}
    </div>
  )
}

export default function CommunitiesListPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const canManage = hasAnyRole(currentUser, COMMUNITY_MANAGE_ROLES)

  const [communities, setCommunities] = useState<CommunitySummary[]>([])
  const [stats, setStats] = useState<CommunityStats | null>(null)
  const [sectors, setSectors] = useState<Sector[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(defaultMeta.per_page)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [classificationFilter, setClassificationFilter] = useState('')
  const [sort, setSort] = useState<NonNullable<CommunityListQuery['sort']>>('name')
  const [direction, setDirection] = useState<NonNullable<CommunityListQuery['direction']>>('asc')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<CommunityFormMode>('create')
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)
  const [formApiErrors, setFormApiErrors] = useState<ApiValidationErrors | undefined>(undefined)

  const [editFetchingId, setEditFetchingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CommunitySummary | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadCommunities = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const response = await listCommunities({
        page,
        per_page: perPage,
        search,
        sectorId: sectorFilter,
        classification: classificationFilter as CommunityListQuery['classification'],
        sort,
        direction,
      })
      setCommunities(response.data)
      setMeta(response.meta)
      setPage(response.meta.current_page)
      try {
        setStats(await getCommunityStats())
      } catch {
        setStats(null)
      }
    } catch (error) {
      setErrorMessage(getCommunityErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [classificationFilter, direction, page, perPage, search, sectorFilter, sort])

  useEffect(() => {
    void loadCommunities()
  }, [loadCommunities])

  useEffect(() => {
    // Sector filter options; failure here should not block the table.
    listSectors()
      .then(setSectors)
      .catch(() => setSectors([]))
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  const countLabel = useMemo(() => {
    if (!meta.total) return 'No community records available'
    const from = meta.from ?? 0
    const to = meta.to ?? 0
    return `Showing ${from}-${to} of ${meta.total} community records`
  }, [meta.from, meta.to, meta.total])

  const paginationItems = useMemo(
    () => getPaginationItems(meta.current_page, meta.last_page),
    [meta.current_page, meta.last_page],
  )

  const handleSortChange = (nextSort: string) => {
    if (sort === nextSort) {
      setDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(nextSort as NonNullable<CommunityListQuery['sort']>)
      setDirection('asc')
    }
    setPage(1)
  }

  const openCreateModal = () => {
    if (!canManage) return
    setFormMode('create')
    setActiveCommunity(null)
    setFormErrorMessage(null)
    setFormApiErrors(undefined)
    setFormOpen(true)
  }

  const openEditModal = async (community: CommunitySummary) => {
    if (!canManage) return
    // The summary row lacks full detail; fetch the complete record so the edit form is pre-filled
    // with real values (submitting the form sends every field, so partial data would overwrite).
    setEditFetchingId(community.id)
    try {
      const full = await getCommunity(community.id)
      setFormMode('edit')
      setActiveCommunity(full)
      setFormErrorMessage(null)
      setFormApiErrors(undefined)
      setFormOpen(true)
    } catch (error) {
      notify.error(getCommunityErrorMessage(error))
    } finally {
      setEditFetchingId(null)
    }
  }

  const closeFormModal = () => {
    if (formLoading) return
    setFormOpen(false)
    setActiveCommunity(null)
    setFormErrorMessage(null)
    setFormApiErrors(undefined)
  }

  const handleFormSubmit = async (payload: CommunityPayload) => {
    setFormLoading(true)
    setFormErrorMessage(null)
    setFormApiErrors(undefined)
    try {
      if (formMode === 'create') {
        await createCommunity(payload)
      } else if (activeCommunity) {
        await updateCommunity(activeCommunity.id, payload)
      }
      setFormOpen(false)
      setActiveCommunity(null)
      notify.success(formMode === 'create' ? 'Community created successfully.' : 'Community updated successfully.')
      if (formMode === 'create' && page !== 1) {
        setPage(1)
      } else {
        await loadCommunities()
      }
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        setFormApiErrors(error.fields ?? {})
      } else {
        setFormErrorMessage(getCommunityErrorMessage(error))
      }
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteCommunity(deleteTarget.id)
      const stepBack = communities.length === 1 && page > 1
      notify.success(`Community ${deleteTarget.name} deleted successfully.`)
      setDeleteTarget(null)
      if (stepBack) {
        setPage((current) => Math.max(1, current - 1))
      } else {
        await loadCommunities()
      }
    } catch (error) {
      notify.error(getCommunityErrorMessage(error))
    } finally {
      setDeleteLoading(false)
    }
  }

  const renderRowActions = (community: CommunitySummary) => (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        aria-label={`View ${community.name}`}
        title="View"
        onClick={() => navigate(`/admin/communities/${community.id}`)}
        className={actionButtonClassName}
      >
        <VisibilityOutlinedIcon fontSize="small" />
      </button>
      {canManage ? (
        <>
          <button
            type="button"
            aria-label={`Edit ${community.name}`}
            title="Edit"
            disabled={deleteLoading || editFetchingId === community.id}
            onClick={() => void openEditModal(community)}
            className={actionButtonClassName}
          >
            <EditOutlinedIcon fontSize="small" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${community.name}`}
            title="Delete"
            disabled={deleteLoading}
            onClick={() => setDeleteTarget(community)}
            className={destructiveActionButtonClassName}
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </button>
        </>
      ) : (
        <span className="inline-flex border border-[#d8e1d4] bg-[#f7faf6] px-3 py-2 text-xs font-medium text-[#617462]">
          Read only
        </span>
      )}
    </div>
  )

  const columns: DataTableColumn<CommunitySummary>[] = [
    {
      key: 'name',
      header: 'Community',
      frozen: true,
      width: 220,
      sortKey: 'name',
      cellClassName: 'text-[#123524]',
      render: (community) => (
        <button
          type="button"
          onClick={() => navigate(`/admin/communities/${community.id}`)}
          className="cursor-pointer text-left font-medium text-[#1f5d3b] hover:underline"
        >
          {community.name}
        </button>
      ),
    },
    {
      key: 'municipality',
      header: 'Barangay / Municipality',
      width: 200,
      sortKey: 'municipality',
      render: (community) =>
        [community.barangayCode, community.municipality].filter(Boolean).join(' · ') || community.municipality,
    },
    { key: 'province', header: 'Province', width: 140, sortKey: 'province', render: (community) => community.province },
    { key: 'sectors', header: 'Sectors', width: 260, render: (community) => <SectorChips sectors={community.sectors} /> },
    {
      key: 'lastAssessment',
      header: 'Last Assessment',
      width: 170,
      cellClassName: 'whitespace-nowrap',
      render: (community) => formatDateTime(community.lastAssessmentDate),
    },
    {
      key: 'activePrograms',
      header: 'Active Programs',
      width: 150,
      align: 'right',
      render: (community) => community.activeProgramCount,
    },
    { key: 'actions', header: 'Actions', align: 'right', width: 160, render: renderRowActions },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">Master data</p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#123524]">Partner communities</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#506552]">
            Profile partner communities with GAD-ready population data, sector tags, and supporting
            documents. Assessment and program history appear here as those records are captured.
          </p>
          {!canManage ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#7b6542]">
              Your account has read-only access here. Only administrators and extension coordinators can
              create, edit, or delete communities.
            </p>
          ) : null}
        </div>

        {canManage ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={openCreateModal}
              disabled={loading || formLoading}
              className="cursor-pointer border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Create New Community
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            { label: 'Total partner communities', value: stats?.totalCommunities },
            { label: 'Beneficiaries reached', value: stats?.beneficiariesReached },
            { label: 'Assessed this semester', value: stats?.assessedThisSemester },
          ] as const
        ).map((card) => (
          <div key={card.label} className="border border-[#d8e1d4] bg-white px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">{card.label}</p>
            {card.value === undefined ? (
              <span className="mt-2 block h-8 w-16 animate-pulse bg-[#edf3ea]" />
            ) : (
              <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#123524]">{card.value}</p>
            )}
          </div>
        ))}
      </div>

      <section className="border border-[#d8e1d4] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e7eee3] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#123524]">Community records</p>
            <p className="mt-1 text-sm text-[#617462]">Search and filter partner communities.</p>
          </div>
          <p className="text-sm text-[#617462]">{countLabel}</p>
        </div>

        <div className="grid gap-3 border-b border-[#e7eee3] px-5 py-4 md:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(150px,auto))] md:items-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Search</span>
            <input
              type="search"
              value={searchInput}
              disabled={loading}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name, municipality, or contact"
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Sector</span>
            <select
              value={sectorFilter}
              disabled={loading}
              onChange={(event) => {
                setSectorFilter(event.target.value)
                setPage(1)
              }}
              className={selectClassName}
            >
              <option value="">All sectors</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Classification</span>
            <select
              value={classificationFilter}
              disabled={loading}
              onChange={(event) => {
                setClassificationFilter(event.target.value)
                setPage(1)
              }}
              className={selectClassName}
            >
              <option value="">All classifications</option>
              {CLASSIFICATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Rows</span>
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
            <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">{errorMessage}</div>
            <button
              type="button"
              onClick={() => void loadCommunities()}
              className="cursor-pointer border border-[#d8e1d4] px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5]"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={communities}
              rowKey={(community) => community.id}
              loading={loading}
              loadingLabel="Loading community records..."
              emptyMessage="No community records found."
              minWidthClassName="min-w-[1180px]"
              sortKey={sort}
              sortDirection={direction}
              onSortChange={handleSortChange}
            />

            {meta.total > 0 ? (
              <div className="flex flex-col gap-4 border-t border-[#e7eee3] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm text-[#617462]">
                  Page {meta.current_page} of {meta.last_page}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={meta.current_page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="cursor-pointer border border-[#d8e1d4] px-3 py-2 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Previous
                  </button>
                  {paginationItems.map((item, index) =>
                    item === 'ellipsis' ? (
                      <span key={`ellipsis-${index}`} className="px-1 text-sm text-[#7e8d7a]">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        className={[
                          'min-w-10 border px-3 py-2 text-sm font-medium transition-colors',
                          item === meta.current_page
                            ? 'cursor-default border-[#1f5d3b] bg-[#1f5d3b] text-white'
                            : 'cursor-pointer border-[#d8e1d4] text-[#123524] hover:bg-[#f6faf5]',
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
                    className="cursor-pointer border border-[#d8e1d4] px-3 py-2 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      <CommunityFormModal
        key={`${formMode}-${activeCommunity?.id ?? 'new'}-${formOpen ? 'open' : 'closed'}`}
        open={formOpen}
        mode={formMode}
        community={activeCommunity}
        sectors={sectors}
        loading={formLoading}
        errorMessage={formErrorMessage}
        apiErrors={formApiErrors}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
      />

      <DeleteCommunityModal
        open={Boolean(deleteTarget)}
        communityName={deleteTarget?.name ?? null}
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}
