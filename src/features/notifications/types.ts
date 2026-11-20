// Module 8 — in-app notifications. Field names mirror the backend `NotificationResponse`.

export type NotificationType = 'proposal_status' | 'survey_alert' | 'activity_reminder' | 'system'

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  body: string | null
  linkEntityType: 'program' | 'survey' | 'activity' | null
  linkEntityId: string | null
  /** e.g. "View proposal"; null when the notification has no link. */
  linkLabel: string | null
  /** In-app route to open; null when there is no link or the record is gone. */
  linkPath: string | null
  /** False when the linked record was deleted — show "no longer available", do not navigate. */
  linkAvailable: boolean
  readAt: string | null
  createdAt: string
}

export type NotificationPaginationMeta = {
  current_page: number
  from: number | null
  last_page: number
  path: string
  per_page: number
  to: number | null
  total: number
}

export type NotificationPage = {
  data: AppNotification[]
  meta: NotificationPaginationMeta
}

export type NotificationQuery = {
  page?: number
  perPage?: number
  type?: NotificationType | ''
  unreadOnly?: boolean
}
