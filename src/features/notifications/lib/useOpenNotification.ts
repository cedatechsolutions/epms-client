import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { notify } from '@/shared/toast'
import { markNotificationRead } from '../api/notificationsApi'
import { useNotificationStore } from '../store/notificationStore'
import type { AppNotification } from '../types'
import { getNotificationErrorMessage } from './labels'

/**
 * Opening a notification: mark it read (if it was unread), then follow its deep link — or, when
 * the linked record has been deleted, say so instead of navigating to a page that would 404.
 */
export function useOpenNotification(onDone?: () => void) {
  const navigate = useNavigate()
  const changed = useNotificationStore((state) => state.changed)
  const [openingId, setOpeningId] = useState<string | null>(null)

  const open = useCallback(
    async (notification: AppNotification) => {
      setOpeningId(notification.id)
      try {
        if (notification.readAt === null) {
          await markNotificationRead(notification.id)
          changed()
        }
        if (notification.linkPath && notification.linkAvailable) {
          onDone?.()
          navigate(notification.linkPath)
        } else if (notification.linkLabel) {
          notify.info('That record is no longer available — it may have been deleted.')
        }
      } catch (error) {
        notify.error(getNotificationErrorMessage(error))
      } finally {
        setOpeningId(null)
      }
    },
    [changed, navigate, onDone],
  )

  return { open, openingId }
}
