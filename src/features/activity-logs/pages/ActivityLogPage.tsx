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
  'h-10 cursor-pointer border border-[#d8e1d4] bg-white px-3 text-sm text-[#123524] outline-none transition-colors focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]'

const inputClassName =
  'h-10 border border-[#d8e1d4] bg-white px-3 text-sm text-[#123524] outline-none transition-colors focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]'

const skeletonRows = Array.from({ length: 5 }, (_, index) => index)

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d8e1d4] border-t-[#1f5d3b]" />
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">Audit</p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#123524]">Activity log</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#506552]">
            A record of logins and every create, update, and delete action across the system.
          </p>
        </div>
      </div>

      <section className="border border-[#d8e1d4] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e7eee3] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#123524]">Activity records</p>
            <p className="mt-1 text-sm text-[#617462]">Filter by user, action, entity type, or date range.</p>
          </div>
          <p className="text-sm text-[#617462]">{countLabel}</p>
        </div>

        <div className="grid gap-3 border-b border-[#e7eee3] px-5 py-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:items-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">User</span>
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
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Action</span>
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
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Entity</span>
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
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">From</span>
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
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">To</span>
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
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Rows</span>
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
            <div className="flex items-center gap-3 border-b border-[#e7eee3] px-5 py-3 text-sm text-[#617462]">
              <Spinner />
              Loading activity records...
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1080px] table-auto border-collapse">
                <thead>
                  <tr className="border-b border-[#e7eee3] bg-[#f7faf6] text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">
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
                    <tr key={row} className="border-b border-[#eef2eb] last:border-b-0">
                      {Array.from({ length: 6 }, (_, cell) => (
                        <td key={cell} className="px-5 py-4">
                          <span className="block h-4 w-full max-w-[160px] animate-pulse bg-[#edf3ea]" />
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
            <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">{errorMessage}</div>
            <button
              type="button"
              onClick={() => void loadLogs()}
              className="cursor-pointer border border-[#d8e1d4] px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5]"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[1080px] table-auto border-collapse">
                <thead>
                  <tr className="border-b border-[#e7eee3] bg-[#f7faf6] text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">
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
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#617462]">
                        No activity records found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-[#eef2eb] text-sm text-[#445846] last:border-b-0 hover:bg-[#fbfdf9]"
                      >
                        <td className="px-5 py-4 whitespace-nowrap text-[#123524]">{formatDateTime(log.createdAt)}</td>
                        <td className="px-5 py-4">{log.userLabel || '-'}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex border border-[#d8e1d4] bg-[#f7faf6] px-2.5 py-1 text-xs font-medium text-[#123524]">
                            {ACTIVITY_ACTION_LABELS[log.action] ?? log.action}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {log.entityType ? (
                            <span>
                              {log.entityType}
                              {log.entityId ? (
                                <span className="ml-1 font-mono text-xs text-[#5d705e]">
                                  {log.entityId.slice(0, 8)}
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-mono text-xs text-[#5d705e]">
                          {log.ipAddress || '-'}
                        </td>
                        <td className="px-5 py-4 text-[#506552]">{formatMetadata(log.metadata)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-[#e7eee3] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm text-[#617462]">
                Page {meta.current_page} of {meta.last_page}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
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
                  onClick={() => setPage((currentPage) => Math.min(meta.last_page, currentPage + 1))}
                  className="cursor-pointer border border-[#d8e1d4] px-3 py-2 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-45"
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
