import type { ActivityLog } from '@/features/activity-logs/types'
import type { ProgramStatus } from '@/features/programs/types'
import type { NeedPriority } from '@/features/surveys/types'

/**
 * Partner-community reach. `populationFemale`/`populationMale` cover only the profiles that
 * recorded a split — `withSexSplit` is the denominator to show beside them.
 */
export type CommunityOverview = {
  total: number
  households: number
  population: number
  populationFemale: number
  populationMale: number
  withSexSplit: number
}

export type AssessmentOverview = {
  surveys: number
  draft: number
  deployed: number
  closed: number
  finalized: number
  responses: number
  responsesFemale: number
  responsesMale: number
  responsesUndisclosed: number
}

export type RecommendationOverview = {
  total: number
  pending: number
  accepted: number
  modified: number
  rejected: number
}

/** Mirrors the backend `ProgramStatsResponse`; `underReview` collapses the three in-chain stages. */
export type ProgramOverview = {
  total: number
  draft: number
  underReview: number
  returned: number
  approved: number
  ongoing: number
  completed: number
  cancelled: number
}

/** One need category rolled up across every finalized assessment. */
export type NeedHighlight = {
  needCategoryId: string
  needCategoryName: string
  avgScore: number
  assessmentCount: number
  responseCount: number
  femaleCount: number
  maleCount: number
  priority: NeedPriority
}

/** `recentActivity` is null for callers who may not read the audit trail — hide the card entirely. */
export type DashboardOverview = {
  communities: CommunityOverview
  assessments: AssessmentOverview
  recommendations: RecommendationOverview
  programs: ProgramOverview
  topNeeds: NeedHighlight[]
  recentActivity: ActivityLog[] | null
  generatedAt: string
}

/** Proposal statuses shown in the distribution panel, in workflow order. */
export const PROGRAM_STATUS_ROWS: { key: keyof ProgramOverview; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'underReview', label: 'Under review' },
  { key: 'returned', label: 'Returned' },
  { key: 'approved', label: 'Approved' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

// --- M&E dashboard (spec Module 6) ------------------------------------------------
// A separate payload from the overview above, behind a separate permission: `GET /api/dashboard`
// is campus-wide and coordinator/admin-only, while the overview stays personal and open to every
// role. The two are shown on one screen but never merged.

/** One option in the period selector (`GET /api/academic-periods`). Exactly one row is `current`. */
export type AcademicPeriod = {
  id: string
  label: string
  startsOn: string
  endsOn: string
  current: boolean
}

/**
 * The four KPI figures. `beneficiaryMethod` is the server's own sentence describing how the
 * beneficiary count is arrived at — rendered verbatim so the screen and both exports say the same
 * thing rather than three paraphrases.
 */
export type MonitoringKpis = {
  communitiesServed: number
  programsTotal: number
  programsCompleted: number
  beneficiariesTotal: number
  beneficiariesFemale: number
  beneficiariesMale: number
  facultyInvolved: number
  beneficiaryMethod: string
}

export type ProgramTypeCount = {
  programTypeId: string
  programTypeName: string
  programs: number
}

/** `sectorId` is null for the single "Not specified" bucket — attendees recorded without a sector. */
export type SectorBeneficiaryCount = {
  sectorId: string | null
  sectorName: string
  total: number
  female: number
  male: number
}

/**
 * One row of the completion table. `targetBeneficiaries` is null on proposals that never set one:
 * "0 of null" is unknown, not 0%, and the coverage cell renders that distinction.
 */
export type ProgramCompletionRow = {
  programId: string
  title: string
  communityName: string | null
  programTypeName: string | null
  status: ProgramStatus
  targetBeneficiaries: number | null
  actualTotal: number
  actualFemale: number
  actualMale: number
  hasPreEvaluation: boolean
  hasPostEvaluation: boolean
}

/** `period` is null when every period was asked for at once; the selector renders "All periods". */
export type MonitoringDashboard = {
  period: AcademicPeriod | null
  kpis: MonitoringKpis
  programsByType: ProgramTypeCount[]
  beneficiariesBySector: SectorBeneficiaryCount[]
  completion: ProgramCompletionRow[]
  completionTotal: number
  generatedAt: string
}

export type DashboardExportFormat = 'xlsx' | 'pdf'

/**
 * Mirrors `Permissions.canViewMonitoringDashboard()`. Faculty and student volunteers keep the
 * personal overview only — the completion table names programs they cannot open.
 */
export const MONITORING_DASHBOARD_ROLES = [
  'admin',
  'campus_admin',
  'campus_extension_coordinator',
  'extension_coordinator',
] as const

/** Sentinel for the "All periods" option — the server treats a blank `periodId` as every period. */
export const ALL_PERIODS = ''
