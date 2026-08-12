import type { ActivityLog } from '@/features/activity-logs/types'
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
