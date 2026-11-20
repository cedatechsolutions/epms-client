import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { notify } from '@/shared/toast'
import { listNotifications, markAllNotificationsRead } from '../api/notificationsApi'
import { getNotificationErrorMessage, UNREAD_POLL_MS } from '../lib/labels'
import { useOpenNotification } from '../lib/useOpenNotification'
import { useNotificationStore } from '../store/notificationStore'
import type { AppNotification } from '../types'
import NotificationItem from './NotificationItem'

const PANEL_SIZE = 8

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary-accent" />
}

/**
 * Header bell (UI guidelines §6.16): unread badge, and a dropdown with the latest few
 * notifications, "Mark all read" and a link to the full feed. The badge polls every minute while
 * the tab is visible and refreshes when the tab regains focus.
 */
export default function NotificationBell() {
  const navigate = useNavigate()
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const version = useNotificationStore((state) => state.version)
  const refreshUnread = useNotificationStore((state) => state.refreshUnread)
  const changed = useNotificationStore((state) => state.changed)
  const reset = useNotificationStore((state) => state.reset)

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { open: openNotification, openingId } = useOpenNotification(() => setOpen(false))

  // Badge: now, every minute while visible, and whenever the tab comes back.
  useEffect(() => {
    void refreshUnread()
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshUnread()
    }, UNREAD_POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshUnread()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      // The bell lives in the signed-in shell; leaving it (sign-out) must not show the next
      // account the previous one's count.
      reset()
    }
  }, [refreshUnread, reset])

  const loadPanel = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      setItems((await listNotifications({ perPage: PANEL_SIZE })).data)
    } catch (error) {
      setErrorMessage(getNotificationErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) void loadPanel()
  }, [open, loadPanel, version])

  // Dropdown contract (§6.7): closes on outside mousedown and Escape.
  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

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

  const count = unreadCount ?? 0
  const badge = count > 99 ? '99+' : String(count)
  const label = count > 0 ? `Notifications, ${count} unread` : 'Notifications'

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={label}
        title="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink transition-colors hover:bg-hover-tint"
      >
        <NotificationsNoneOutlinedIcon fontSize="small" />
        {count > 0 ? (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white tabular-nums"
          >
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="animate-pop-in absolute right-0 top-[calc(100%+8px)] z-20 w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-lg border border-divider bg-surface shadow-dropdown">
          <div className="flex items-center justify-between gap-3 border-b border-divider px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            <button
              type="button"
              disabled={markingAll || count === 0}
              onClick={() => void handleMarkAll()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary-accent transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:text-muted"
            >
              {markingAll ? <Spinner /> : <DoneAllRoundedIcon fontSize="small" />}
              Mark all read
            </button>
          </div>

          <div className="max-h-[420px] divide-y divide-row-divider overflow-y-auto" aria-busy={loading} aria-live="polite">
            {loading && items.length === 0 ? (
              <div className="flex items-center gap-3 px-4 py-6 text-sm text-muted">
                <Spinner />
                Loading notifications...
              </div>
            ) : errorMessage ? (
              <div className="space-y-3 px-4 py-4">
                <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">{errorMessage}</div>
                <button
                  type="button"
                  onClick={() => void loadPanel()}
                  className="cursor-pointer rounded-md border border-line px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-hover-tint"
                >
                  Retry
                </button>
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">You&apos;re all caught up.</p>
            ) : (
              items.map((item) => (
                <NotificationItem
                  key={item.id}
                  notification={item}
                  compact
                  busy={openingId === item.id}
                  onOpen={(notification) => void openNotification(notification)}
                />
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              navigate('/admin/notifications')
            }}
            className="block w-full cursor-pointer border-t border-divider px-4 py-3 text-center text-sm font-medium text-primary-accent transition-colors hover:bg-hover-tint"
          >
            View all notifications
          </button>
        </div>
      ) : null}
    </div>
  )
}
