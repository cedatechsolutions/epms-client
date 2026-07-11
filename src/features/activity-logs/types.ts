export type ActivityLog = {
  id: string
  userId: string | null
  userLabel: string | null
  action: string
  entityType: string | null
  entityId: string | null
  metadata: string | null
  ipAddress: string | null
  createdAt: string
}

export type ActivityLogPaginationMeta = {
  current_page: number
  from: number | null
  last_page: number
  path: string
  per_page: number
  to: number | null
  total: number
}

export type ActivityLogListResponse = {
  data: ActivityLog[]
  meta: ActivityLogPaginationMeta
}

export type ActivityLogQuery = {
  page?: number
  per_page?: number
  userId?: string
  action?: string
  entityType?: string
  from?: string
  to?: string
}

/** Known audit actions emitted by the backend (spec Module 1 §4). */
export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  'auth.login': 'Login',
  'user.created': 'User created',
  'user.updated': 'User updated',
  'user.deleted': 'User deleted',
  'user.status_changed': 'User status changed',
  'user.password_reset': 'Password reset',
}
