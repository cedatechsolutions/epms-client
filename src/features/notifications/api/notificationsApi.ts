import { getRequest, postRequest } from '@/shared/api/http'
import type { AppNotification, NotificationPage, NotificationQuery } from '../types'

const NOTIFICATIONS_ENDPOINT = '/notifications'

/** The signed-in user's feed, newest first. The server only ever returns the caller's own rows. */
export async function listNotifications(query: NotificationQuery = {}): Promise<NotificationPage> {
  return getRequest<NotificationPage>(NOTIFICATIONS_ENDPOINT, {
    params: {
      page: query.page,
      perPage: query.perPage,
      type: query.type || undefined,
      unreadOnly: query.unreadOnly || undefined,
    },
  })
}

export async function getUnreadCount(): Promise<number> {
  const response = await getRequest<{ count: number }>(`${NOTIFICATIONS_ENDPOINT}/unread-count`)
  return response.count
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  return postRequest<AppNotification>(`${NOTIFICATIONS_ENDPOINT}/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<number> {
  const response = await postRequest<{ updated: number }>(`${NOTIFICATIONS_ENDPOINT}/read-all`)
  return response.updated
}
