import { getRequest } from '@/shared/api/http'
import type { ActivityLog, ActivityLogListResponse, ActivityLogQuery } from '../types'

const ACTIVITY_LOGS_ENDPOINT = '/activity-logs'

type BackendActivityLogs = {
  data: ActivityLog[]
  meta: ActivityLogListResponse['meta']
  links?: Record<string, string | null>
}

export async function listActivityLogs(query: ActivityLogQuery = {}): Promise<ActivityLogListResponse> {
  const response = await getRequest<BackendActivityLogs>(ACTIVITY_LOGS_ENDPOINT, {
    params: {
      page: query.page,
      perPage: query.per_page,
      userId: query.userId || undefined,
      action: query.action || undefined,
      entityType: query.entityType || undefined,
      from: query.from || undefined,
      to: query.to || undefined,
    },
  })

  return {
    data: response.data,
    meta: response.meta,
  }
}
