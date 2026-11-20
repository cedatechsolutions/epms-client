import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded'
import { useCallback, useEffect, useState } from 'react'
import { notify } from '@/shared/toast'
import { listNotifications, markAllNotificationsRead } from '../api/notificationsApi'
import NotificationItem from '../components/NotificationItem'
import {
  getNotificationErrorMessage,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPES,
} from '../lib/labels'
import { useOpenNotification } from '../lib/useOpenNotification'
import { useNotificationStore } from '../store/notificationStore'
import type { AppNotification, NotificationPaginationMeta, NotificationType } from '../types'

const PER_PAGE = 20

const defaultMeta: NotificationPaginationMeta = {
  current_page: 1,
  from: null,
  last_page: 1,
  path: '',
  per_page: PER_PAGE,
  to: null,
  total: 0,
}

const pagerButtonClassName =
  'cursor-pointer border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-45 rounded-md'

function tabClassName(active: boolean): string {
  return [
    'inline-flex items-center gap-2 border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 rounded-md',
    active ? 'border-primary bg-primary text-white' : 'cursor-pointer border-line text-ink hover:bg-hover-tint',
  ].join(' ')
}

/** The full feed (spec Module 8 §1): type filter, unread-only, mark one/all read, deep links. */
export default function NotificationsPage() {
  const version = useNotificationStore((state) => state.version)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const changed = useNotificationStore((state) => state.changed)

  const [items, setItems] = useState<AppNotification[]>([])
  const [meta, setMeta] = useState<NotificationPaginationMeta>(defaultMeta)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<NotificationType | ''>('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const { open, openingId } = useOpenNotification()

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const response = await listNotifications({ page, perPage: PER_PAGE, type: typeFilter, unreadOnly })
      setItems(response.data)
      setMeta(response.meta)
    } catch (error) {
      setErrorMessage(getNotificationErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, unreadOnly])

  useEffect(() => {
    void load()
  }, [load, version])

  const handleMarkAll = async () => {
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      changed()
      notify.success('All notifications marked as read.')
    } catch (error) {
      notify.error(getNotificationErrorMessage(error))
    } finally {
      setMarkingAll(false)
    }
  }

  const filtered = Boolean(typeFilter) || unreadOnly

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">Inbox</p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">Notifications</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-body">
            Proposal decisions, survey alerts and activity reminders for the records you are part of.
          </p>
        </div>
        <button
          type="button"
          disabled={markingAll || !unreadCount}
          onClick={() => void handleMarkAll()}
          className="inline-flex cursor-pointer items-center justify-center gap-2 border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
        >
          {markingAll ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary-accent" />
          ) : (
            <DoneAllRoundedIcon fontSize="small" />
          )}
          Mark all read
        </button>
      </div>

      <section className="overflow-hidden rounded-lg border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={typeFilter === ''}
              disabled={loading}
              onClick={() => {
                setTypeFilter('')
                setPage(1)
              }}
              className={tabClassName(typeFilter === '')}
            >
              All
            </button>
            {NOTIFICATION_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={typeFilter === type}
                disabled={loading}
                onClick={() => {
                  setTypeFilter(type)
                  setPage(1)
                }}
                className={tabClassName(typeFilter === type)}
              >
                {NOTIFICATION_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={unreadOnly}
              disabled={loading}
              onChange={(event) => {
                setUnreadOnly(event.target.checked)
                setPage(1)
              }}
              className="h-4 w-4 cursor-pointer accent-primary-accent"
            />
            Unread only
          </label>
        </div>

        {errorMessage ? (
          <div className="space-y-4 px-5 py-6">
            <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">{errorMessage}</div>
            <button type="button" onClick={() => void load()} className={pagerButtonClassName}>
              Retry
            </button>
          </div>
        ) : loading && items.length === 0 ? (
          <div aria-busy="true" aria-live="polite" className="divide-y divide-row-divider">
            <div className="flex items-center gap-3 px-5 py-3 text-sm text-muted">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary-accent" />
              Loading notifications...
            </div>
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="space-y-2 px-5 py-4">
                <div className="h-4 w-1/3 animate-pulse bg-skeleton" />
                <div className="h-4 w-2/3 animate-pulse bg-skeleton" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            {filtered ? 'No notifications match these filters.' : 'No notifications yet.'}
          </p>
        ) : (
          <div className="divide-y divide-row-divider" aria-busy={loading}>
            {items.map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                busy={openingId === item.id}
                onOpen={(notification) => void open(notification)}
              />
            ))}
          </div>
        )}

        {meta.total > 0 && meta.last_page > 1 ? (
          <div className="flex flex-col gap-4 border-t border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-muted">
              Page {meta.current_page} of {meta.last_page}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={loading || meta.current_page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className={pagerButtonClassName}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={loading || meta.current_page >= meta.last_page}
                onClick={() => setPage((current) => Math.min(meta.last_page, current + 1))}
                className={pagerButtonClassName}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
