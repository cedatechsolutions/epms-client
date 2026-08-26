import { getBlobRequest, getRequest } from '@/shared/api/http'
import type {
  AcademicPeriod,
  DashboardExportFormat,
  DashboardOverview,
  MonitoringDashboard,
} from '../types'

const DASHBOARD_ENDPOINT = '/dashboard'
const ACADEMIC_PERIODS_ENDPOINT = '/academic-periods'

/** Single aggregate read — every widget on the personal overview comes from this one payload. */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  return getRequest<DashboardOverview>(`${DASHBOARD_ENDPOINT}/overview`)
}

/** The semester lookup behind the period selector. Read-only; periods are seeded server-side. */
export async function listAcademicPeriods(): Promise<AcademicPeriod[]> {
  return getRequest<AcademicPeriod[]>(ACADEMIC_PERIODS_ENDPOINT)
}

/**
 * The whole M&E dashboard in one request (spec Module 6). A blank `periodId` means every period at
 * once — it is omitted rather than sent empty, since the server distinguishes "no period asked for"
 * from an id it cannot find (which is a 404, not a silent widening).
 */
export async function getMonitoringDashboard(periodId: string): Promise<MonitoringDashboard> {
  return getRequest<MonitoringDashboard>(DASHBOARD_ENDPOINT, {
    params: { periodId: periodId || undefined },
  })
}

/** Snapshot of the same payload the screen renders, rendered server-side as XLSX or PDF. */
export async function exportMonitoringDashboard(
  periodId: string,
  format: DashboardExportFormat,
): Promise<Blob> {
  return getBlobRequest(`${DASHBOARD_ENDPOINT}/export`, {
    params: { periodId: periodId || undefined, format },
  })
}
