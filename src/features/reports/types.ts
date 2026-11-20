import { ALL_ROLES, COORDINATOR_ROLES } from '@/features/auth/types'

/**
 * Who may open Reports: every role (spec §2.2 "Generate reports/certificates"). Facilitators are
 * "own" — the server narrows their scope to the programs they lead or are assigned to, and their
 * archive to the reports they generated.
 */
export const REPORT_ROLES = ALL_ROLES

/** Roles that see the whole archive rather than only their own reports. */
export const REPORT_ARCHIVE_ALL_ROLES = COORDINATOR_ROLES

export type ReportType = 'accomplishment' | 'beneficiary_data' | 'needs_assessment_qf23' | 'certificates'

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  accomplishment: 'Accomplishment report',
  beneficiary_data: 'Beneficiary data',
  needs_assessment_qf23: 'Needs assessment (QF-23)',
  certificates: 'Certificates',
}

export type ReportScope = 'all' | 'community' | 'program'

/** What a report covers. `periodId` is ignored for a single program (the program is its own span). */
export type ReportScopeValue = {
  scope: ReportScope
  periodId: string
  communityId: string
  programId: string
}

export type AccomplishmentFormat = 'pdf' | 'docx'

export type ReportScopePayload = {
  scope: ReportScope
  periodId?: string
  communityId?: string
  programId?: string
  format?: AccomplishmentFormat
  includePhotos?: boolean
}

export type CertificateRecipients = 'beneficiaries' | 'faculty'
export type CertificateOutput = 'pdf' | 'zip'

export type CertificatePayload = {
  programId: string
  recipientType: CertificateRecipients
  output: CertificateOutput
  /** `YYYY-MM-DD`; the server defaults to today (Asia/Manila) when omitted. */
  issuedOn?: string
}

/** An archived document (`GeneratedReportResponse`). The storage path is never sent to clients. */
export type GeneratedReport = {
  id: string
  reportType: ReportType
  title: string
  filename: string
  fileType: 'pdf' | 'docx' | 'xlsx' | 'zip'
  sizeBytes: number | null
  periodId: string | null
  periodLabel: string | null
  communityId: string | null
  programId: string | null
  generatedById: string | null
  generatedByName: string | null
  createdAt: string
}

export type ReportArchiveQuery = {
  page: number
  per_page: number
  type: ReportType | ''
  periodId: string
  search: string
  /** Campus-wide users only; narrows within the caller's scope, never widens it. */
  departmentId?: string
}

export type ReportPaginationMeta = {
  current_page: number
  from: number | null
  last_page: number
  path: string
  per_page: number
  to: number | null
  total: number
}

export type ReportArchivePage = {
  data: GeneratedReport[]
  meta: ReportPaginationMeta
}

/** A program a report or certificate can be generated for — only those past final approval. */
export type ReportableProgram = {
  id: string
  title: string
  status: 'approved' | 'ongoing' | 'completed'
  communityName: string | null
}

export type CommunityOption = {
  id: string
  name: string
}
