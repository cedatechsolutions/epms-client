import { useCallback, useEffect, useMemo, useState } from 'react'
import { listAdminUsers } from '@/features/users/api/adminUsersApi'
import { formatDateTime } from '@/features/users/lib/formatters'
import { getUserRequestErrorMessage } from '@/features/users/lib/errorMessages'
import { listActivityLogs } from '../api/activityLogsApi'
import { ACTIVITY_ACTION_LABELS, type ActivityLog, type ActivityLogPaginationMeta, type ActivityLogQuery } from '../types'

const defaultMeta: ActivityLogPaginationMeta = {
  current_page: 1,
  from: null,
  last_page: 1,
  path: '',
  per_page: 20,
  to: null,
  total: 0,
}

type PaginationItem = number | 'ellipsis'

type UserOption = {
  id: string
  label: string
}

const selectClassName =
  'h-10 cursor-pointer border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

const inputClassName =
  'h-10 border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

const skeletonRows = Array.from({ length: 5 }, (_, index) => index)

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary-accent" />
}

function formatMetadata(raw: string | null): string {
  if (!raw) return '-'
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const entries = Object.entries(parsed)
    if (entries.length === 0) return '-'
    return entries.map(([key, value]) => `${key}: ${String(value)}`).join(', ')
  } catch {
    return raw
  }
}

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

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [meta, setMeta] = useState<ActivityLogPaginationMeta>(defaultMeta)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(defaultMeta.per_page)
  const [userFilter, setUserFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [userOptions, setUserOptions] = useState<UserOption[]>([])

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)

    const query: ActivityLogQuery = {
      page,
      per_page: perPage,
      userId: userFilter,
      action: actionFilter,
      entityType: entityFilter,
      from: fromDate,
      to: toDate,
    }

    try {
      const response = await listActivityLogs(query)
      setLogs(response.data)
      setMeta(response.meta)
      setPage(response.meta.current_page)
    } catch (error) {
      setErrorMessage(getUserRequestErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [actionFilter, entityFilter, fromDate, page, perPage, toDate, userFilter])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  // Populate the user filter once (admin already has access here).
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await listAdminUsers({ per_page: 100, sort: 'lastName', direction: 'asc' })
        if (!cancelled) {
          setUserOptions(response.data.map((user) => ({ id: user.id, label: user.full_name || user.email })))
        }
      } catch {
        // A failed lookup just leaves the user filter empty; the log table still works.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const paginationItems = useMemo(
    () => getPaginationItems(meta.current_page, meta.last_page),
    [meta.current_page, meta.last_page],
  )

  const countLabel = useMemo(() => {
    if (!meta.total) return 'No activity recorded'
    const from = meta.from ?? 0
    const to = meta.to ?? 0
    return `Showing ${from}-${to} of ${meta.total} entries`
  }, [meta.from, meta.to, meta.total])

  const resetToFirstPage = () => setPage(1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">Audit</p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">Activity log</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-body">
            A record of logins and every create, update, and delete action across the system.
          </p>
        </div>
      </div>

      <section className="rounded-lg overflow-hidden border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Activity records</p>
            <p className="mt-1 text-sm text-muted">Filter by user, action, entity type, or date range.</p>
          </div>
          <p className="text-sm text-muted">{countLabel}</p>
        </div>

        <div className="grid gap-3 border-b border-divider px-5 py-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:items-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">User</span>
            <select
              value={userFilter}
              disabled={loading}
              onChange={(event) => {
                setUserFilter(event.target.value)
                resetToFirstPage()
              }}
              className={selectClassName}
            >
              <option value="">All users</option>
              {userOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">Action</span>
            <select
              value={actionFilter}
              disabled={loading}
              onChange={(event) => {
                setActionFilter(event.target.value)
                resetToFirstPage()
              }}
              className={selectClassName}
            >
              <option value="">All actions</option>
              {Object.entries(ACTIVITY_ACTION_LABELS).map(([action, label]) => (
                <option key={action} value={action}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">Entity</span>
            <select
              value={entityFilter}
              disabled={loading}
              onChange={(event) => {
                setEntityFilter(event.target.value)
                resetToFirstPage()
              }}
              className={selectClassName}
            >
              <option value="">All entities</option>
              <option value="user">User</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">From</span>
            <input
              type="date"
              value={fromDate}
              disabled={loading}
              onChange={(event) => {
                setFromDate(event.target.value)
                resetToFirstPage()
              }}
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">To</span>
            <input
              type="date"
              value={toDate}
              disabled={loading}
              onChange={(event) => {
                setToDate(event.target.value)
                resetToFirstPage()
              }}
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">Rows</span>
            <select
              value={perPage}
              disabled={loading}
              onChange={(event) => {
                setPerPage(Number(event.target.value))
                resetToFirstPage()
              }}
              className={selectClassName}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div aria-busy="true" aria-live="polite">
            <div className="flex items-center gap-3 border-b border-divider px-5 py-3 text-sm text-muted">
              <Spinner />
              Loading activity records...
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1080px] table-auto border-collapse">
                <thead>
                  <tr className="border-b border-divider bg-surface-tint text-left text-xs font-semibold uppercase tracking-[0.12em] text-label">
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Entity</th>
                    <th className="px-5 py-3">IP address</th>
                    <th className="px-5 py-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {skeletonRows.map((row) => (
                    <tr key={row} className="border-b border-row-divider last:border-b-0">
                      {Array.from({ length: 6 }, (_, cell) => (
                        <td key={cell} className="px-5 py-4">
                          <span className="block h-4 w-full max-w-[160px] animate-pulse bg-skeleton" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="space-y-4 px-5 py-6">
            <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">{errorMessage}</div>
            <button
              type="button"
              onClick={() => void loadLogs()}
              className="cursor-pointer border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint rounded-md"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[1080px] table-auto border-collapse">
                <thead>
                  <tr className="border-b border-divider bg-surface-tint text-left text-xs font-semibold uppercase tracking-[0.12em] text-label">
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Entity</th>
                    <th className="px-5 py-3">IP address</th>
                    <th className="px-5 py-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted">
                        No activity records found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-row-divider text-sm text-cell last:border-b-0 hover:bg-row-hover"
                      >
                        <td className="px-5 py-4 whitespace-nowrap text-ink">{formatDateTime(log.createdAt)}</td>
                        <td className="px-5 py-4">{log.userLabel || '-'}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-md border border-line bg-surface-tint px-2.5 py-1 text-xs font-medium text-ink">
                            {ACTIVITY_ACTION_LABELS[log.action] ?? log.action}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {log.entityType ? (
                            <span>
                              {log.entityType}
                              {log.entityId ? (
                                <span className="ml-1 font-mono text-xs text-cell-strong">
                                  {log.entityId.slice(0, 8)}
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-mono text-xs text-cell-strong">
                          {log.ipAddress || '-'}
                        </td>
                        <td className="px-5 py-4 text-body">{formatMetadata(log.metadata)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm text-muted">
                Page {meta.current_page} of {meta.last_page}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
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
                  onClick={() => setPage((currentPage) => Math.min(meta.last_page, currentPage + 1))}
                  className="cursor-pointer border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-45 rounded-md"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
