import { formatRelativeTime } from '@/features/dashboard/lib/format'
import { NOTIFICATION_TYPE_LABELS, NOTIFICATION_TYPE_TONES } from '../lib/labels'
import type { AppNotification } from '../types'

type NotificationItemProps = {
  notification: AppNotification
  /** Compact = the header panel (two-line body); full = the notifications page. */
  compact?: boolean
  busy?: boolean
  onOpen: (notification: AppNotification) => void
}

/**
 * One feed row (UI guidelines §6.16): type chip, title, body, relative time and the deep link.
 * Unread rows sit on `bg-surface-tint` with a semibold title. A link whose record is gone reads
 * "No longer available" and never navigates (spec Module 8 AC 4).
 */
export default function NotificationItem({ notification, compact = false, busy = false, onOpen }: NotificationItemProps) {
  const unread = notification.readAt === null
  const linkText = notification.linkLabel
    ? notification.linkAvailable
      ? `→ ${notification.linkLabel}`
      : 'No longer available'
    : null

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => onOpen(notification)}
      className={[
        'flex w-full cursor-pointer flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-row-hover disabled:cursor-wait disabled:opacity-60',
        unread ? 'bg-surface-tint' : 'bg-surface',
      ].join(' ')}
    >
      <span className="flex items-center gap-2">
        <span className={['inline-flex border px-2 py-0.5 text-[11px] font-medium rounded-md', NOTIFICATION_TYPE_TONES[notification.type]].join(' ')}>
          {NOTIFICATION_TYPE_LABELS[notification.type]}
        </span>
        <span className="text-xs text-muted-alt">{formatRelativeTime(notification.createdAt)}</span>
        {unread ? <span className="sr-only">Unread</span> : null}
      </span>
      <span className={['text-sm text-ink', unread ? 'font-semibold' : 'font-medium'].join(' ')}>
        {notification.title}
      </span>
      {notification.body ? (
        <span className={['whitespace-pre-line text-sm text-body', compact ? 'line-clamp-2' : ''].join(' ')}>
          {notification.body}
        </span>
      ) : null}
      {linkText ? (
        <span
          className={
            notification.linkAvailable ? 'text-xs font-medium text-primary-accent' : 'text-xs font-medium text-muted'
          }
        >
          {linkText}
        </span>
      ) : null}
    </button>
  )
}
