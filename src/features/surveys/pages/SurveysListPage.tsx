import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { hasAnyRole } from '@/features/auth/lib/access'
import { useAuthStore } from '@/features/auth/store/authStore'
import { listCommunities } from '@/features/communities/api/communitiesApi'
import type { ApiValidationErrors } from '@/shared/api/http'
import { isApiError } from '@/shared/api/http'
import { DataTable, type DataTableColumn } from '@/shared/table'
import { notify } from '@/shared/toast'
import { createSurvey, deleteSurvey, listSurveys } from '../api/surveysApi'
import ConfirmModal from '../components/ConfirmModal'
import SurveyFormModal from '../components/SurveyFormModal'
import { formatDateTime, getSurveyErrorMessage } from '../lib/format'
import {
  SURVEY_MANAGE_ROLES,
  SURVEY_STATUS_LABELS,
  type PaginationMeta,
  type SurveyListQuery,
  type SurveyPayload,
  type SurveyStatus,
  type SurveySummary,
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

type CommunityOption = { id: string; name: string }

const actionButtonClassName =
  'flex h-9 w-9 cursor-pointer items-center justify-center border border-line text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-45 rounded-md'
const destructiveActionButtonClassName =
  'flex h-9 w-9 cursor-pointer items-center justify-center border border-danger-border text-danger transition-colors hover:bg-danger-bg-soft disabled:cursor-not-allowed disabled:opacity-45 rounded-md'
const inputClassName =
  'h-10 border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'
const selectClassName =
  'h-10 cursor-pointer border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

function StatusBadge({ status }: { status: SurveyStatus }) {
  const tone =
    status === 'deployed'
      ? 'border-success-border bg-success-bg text-primary-accent'
      : 'border-line bg-surface-tint text-muted'
  return (
    <span className={['inline-flex border px-2.5 py-1 text-xs font-medium', tone].join(' ')}>
      {SURVEY_STATUS_LABELS[status]}
    </span>
  )
}

export default function SurveysListPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const canManage = hasAnyRole(currentUser, SURVEY_MANAGE_ROLES)

  const [surveys, setSurveys] = useState<SurveySummary[]>([])
  const [communities, setCommunities] = useState<CommunityOption[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)
  const [formApiErrors, setFormApiErrors] = useState<ApiValidationErrors | undefined>(undefined)

  const [deleteTarget, setDeleteTarget] = useState<SurveySummary | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadSurveys = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const response = await listSurveys({
        page,
        per_page: meta.per_page,
        search,
        status: statusFilter,
        sort: 'createdAt',
        direction: 'desc',
      } satisfies SurveyListQuery)
      setSurveys(response.data)
      setMeta(response.meta)
      setPage(response.meta.current_page)
    } catch (error) {
      setErrorMessage(getSurveyErrorMessage(error))
    } finally {
      setLoading(false)
    }
    // meta.per_page is a stable page-size preference, not a reactive input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter])

  useEffect(() => {
    void loadSurveys()
  }, [loadSurveys])

  useEffect(() => {
    // Community options for the create form; a failure here must not block the table.
    listCommunities({ per_page: 100 })
      .then((response) => setCommunities(response.data.map(({ id, name }) => ({ id, name }))))
      .catch(() => setCommunities([]))
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  const countLabel = useMemo(() => {
    if (!meta.total) return 'No surveys yet'
    const from = meta.from ?? 0
    const to = meta.to ?? 0
    return `Showing ${from}-${to} of ${meta.total} surveys`
  }, [meta.from, meta.to, meta.total])

  const handleCreate = async (payload: SurveyPayload) => {
    setFormLoading(true)
    setFormErrorMessage(null)
    setFormApiErrors(undefined)
    try {
      const created = await createSurvey(payload)
      setFormOpen(false)
      notify.success('Survey created. Add questions, then deploy it.')
      navigate(`/admin/surveys/${created.id}/build`)
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        setFormApiErrors(error.fields ?? {})
      } else {
        setFormErrorMessage(getSurveyErrorMessage(error))
      }
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteSurvey(deleteTarget.id)
      notify.success(`Survey "${deleteTarget.title}" deleted.`)
      setDeleteTarget(null)
      await loadSurveys()
    } catch (error) {
      notify.error(getSurveyErrorMessage(error))
    } finally {
      setDeleteLoading(false)
    }
  }

  const columns: DataTableColumn<SurveySummary>[] = [
    {
      key: 'title',
      header: 'Survey',
      frozen: true,
      width: 260,
      sortKey: 'title',
      cellClassName: 'text-ink',
      render: (survey) => (
        <button
          type="button"
          onClick={() => navigate(`/admin/surveys/${survey.id}/build`)}
          className="cursor-pointer text-left font-medium text-primary-accent hover:underline rounded-md"
        >
          {survey.title}
        </button>
      ),
    },
    { key: 'community', header: 'Community', width: 200, render: (survey) => survey.communityName },
    { key: 'status', header: 'Status', width: 130, render: (survey) => <StatusBadge status={survey.status} /> },
    { key: 'questions', header: 'Questions', width: 110, align: 'right', render: (survey) => survey.questionCount },
    { key: 'responses', header: 'Responses', width: 110, align: 'right', render: (survey) => survey.responseCount },
    {
      key: 'closesAt',
      header: 'Closes',
      width: 170,
      cellClassName: 'whitespace-nowrap',
      render: (survey) => formatDateTime(survey.closesAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: 180,
      render: (survey) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            aria-label={`Open builder for ${survey.title}`}
            title="Open builder"
            onClick={() => navigate(`/admin/surveys/${survey.id}/build`)}
            className={actionButtonClassName}
          >
            <BuildOutlinedIcon fontSize="small" />
          </button>
          {survey.status !== 'draft' ? (
            <button
              type="button"
              aria-label={`View results for ${survey.title}`}
              title="View results"
              onClick={() => navigate(`/admin/surveys/${survey.id}/results`)}
              className={actionButtonClassName}
            >
              <InsightsOutlinedIcon fontSize="small" />
            </button>
          ) : null}
          {canManage ? (
            <button
              type="button"
              aria-label={`Delete ${survey.title}`}
              title="Delete"
              disabled={deleteLoading}
              onClick={() => setDeleteTarget(survey)}
              className={destructiveActionButtonClassName}
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">Assessment</p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">Needs assessment surveys</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-body">
            Build a survey for a partner community, deploy it to collect sex-disaggregated responses via a
            public link, then rank the community's needs from the results.
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => {
              setFormErrorMessage(null)
              setFormApiErrors(undefined)
              setFormOpen(true)
            }}
            disabled={loading || communities.length === 0}
            className="cursor-pointer border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            Create New Survey
          </button>
        ) : null}
      </div>

      <section className="rounded-lg overflow-hidden border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Surveys</p>
            <p className="mt-1 text-sm text-muted">Draft surveys are editable; deployed surveys are locked.</p>
          </div>
          <p className="text-sm text-muted">{countLabel}</p>
        </div>

        <div className="grid gap-3 border-b border-divider px-5 py-4 md:grid-cols-[minmax(220px,1fr)_minmax(150px,auto)] md:items-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">Search</span>
            <input
              type="search"
              value={searchInput}
              disabled={loading}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Survey title"
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">Status</span>
            <select
              value={statusFilter}
              disabled={loading}
              onChange={(event) => {
                setStatusFilter(event.target.value as SurveyStatus | '')
                setPage(1)
              }}
              className={selectClassName}
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="deployed">Deployed</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        </div>

        {errorMessage ? (
          <div className="space-y-4 px-5 py-6">
            <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">{errorMessage}</div>
            <button
              type="button"
              onClick={() => void loadSurveys()}
              className="cursor-pointer border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint rounded-md"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={surveys}
              rowKey={(survey) => survey.id}
              loading={loading}
              loadingLabel="Loading surveys..."
              emptyMessage="No surveys found. Create one to get started."
              minWidthClassName="min-w-[1120px]"
            />

            {meta.total > 0 && meta.last_page > 1 ? (
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

      <SurveyFormModal
        key={formOpen ? 'survey-form-open' : 'survey-form-closed'}
        open={formOpen}
        mode="create"
        survey={null}
        communities={communities}
        loading={formLoading}
        errorMessage={formErrorMessage}
        apiErrors={formApiErrors}
        onClose={() => {
          if (!formLoading) setFormOpen(false)
        }}
        onSubmit={handleCreate}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete survey"
        description={deleteTarget ? `This will remove "${deleteTarget.title}" from the list.` : undefined}
        confirmLabel="Delete survey"
        loadingLabel="Deleting..."
        destructive
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
        onConfirm={handleDelete}
      >
        <div className="border border-danger-border-soft bg-danger-bg-soft px-4 py-3 text-sm text-danger-text">
          Deleting a survey is a soft delete — it is hidden from the list but its responses and history are
          preserved. This action cannot be undone from the interface.
        </div>
      </ConfirmModal>
    </div>
  )
}
