import { getRequest } from '@/shared/api/http'
import type { DashboardOverview } from '../types'

const DASHBOARD_ENDPOINT = '/dashboard'

/** Single aggregate read — every widget on the dashboard comes from this one payload. */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  return getRequest<DashboardOverview>(`${DASHBOARD_ENDPOINT}/overview`)
}
