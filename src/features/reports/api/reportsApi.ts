import { getBlobRequest, getRequest, postRequest } from '@/shared/api/http'
import type {
  CertificatePayload,
  GeneratedReport,
  ReportArchivePage,
  ReportArchiveQuery,
  ReportScopePayload,
} from '../types'

const REPORTS_ENDPOINT = '/reports'

/**
 * The three generators return the archived row, not the file — every issued document is in the
 * archive by construction. Fetch the bytes with {@link downloadReport}.
 */
export async function generateAccomplishmentReport(payload: ReportScopePayload): Promise<GeneratedReport> {
  return postRequest<GeneratedReport, ReportScopePayload>(`${REPORTS_ENDPOINT}/accomplishment`, payload)
}

export async function generateBeneficiaryExport(payload: ReportScopePayload): Promise<GeneratedReport> {
  return postRequest<GeneratedReport, ReportScopePayload>(`${REPORTS_ENDPOINT}/beneficiary-export`, payload)
}

export async function generateCertificates(payload: CertificatePayload): Promise<GeneratedReport> {
  return postRequest<GeneratedReport, CertificatePayload>(`${REPORTS_ENDPOINT}/certificates`, payload)
}

/** The archive, newest first. Coordinators and admins see every report; faculty see their own. */
export async function listReports(query: ReportArchiveQuery): Promise<ReportArchivePage> {
  return getRequest<ReportArchivePage>(REPORTS_ENDPOINT, {
    params: {
      page: query.page,
      perPage: query.per_page,
      type: query.type || undefined,
      periodId: query.periodId || undefined,
      search: query.search || undefined,
      departmentId: query.departmentId || undefined,
    },
  })
}

/** Downloads are logged server-side (RA 10173): the files carry attendance and beneficiary names. */
export async function downloadReport(id: string): Promise<Blob> {
  return getBlobRequest(`${REPORTS_ENDPOINT}/${id}/download`)
}
