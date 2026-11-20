import { isApiError } from '@/shared/api/http'
import type { NotificationType } from '../types'

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  proposal_status: 'Proposal',
  survey_alert: 'Survey',
  activity_reminder: 'Activity',
  system: 'System',
}

/** Type chip tones (UI guidelines §6.4) — semantic tokens only. */
export const NOTIFICATION_TYPE_TONES: Record<NotificationType, string> = {
  proposal_status: 'border-success-border bg-success-bg text-primary-accent',
  survey_alert: 'border-info-border bg-info-bg text-info-text',
  activity_reminder: 'border-line bg-surface-tint text-warning',
  system: 'border-line bg-surface-tint text-muted',
}

export const NOTIFICATION_TYPES = Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationType[]

/** How often the header badge re-checks while the tab is visible. */
export const UNREAD_POLL_MS = 60_000

export function getNotificationErrorMessage(error: unknown): string {
  if (isApiError(error) && error.message) return error.message
  return 'Unable to load notifications. Please try again.'
}
