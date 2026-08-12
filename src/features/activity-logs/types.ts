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

/**
 * Known audit actions emitted by the backend (spec Module 1 §4), grouped by module and kept in sync
 * with every `activityLogService.record(...)` call site. Doubles as the action filter's option list,
 * so an action missing here is invisible in the filter — add the label in the same change that adds
 * the log call. Unknown actions still render, falling back to the raw key.
 */
export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  'auth.login': 'Login',

  'user.created': 'User created',
  'user.updated': 'User updated',
  'user.deleted': 'User deleted',
  'user.status_changed': 'User status changed',
  'user.password_reset': 'Password reset',

  'community.created': 'Community created',
  'community.updated': 'Community updated',
  'community.deleted': 'Community deleted',
  'community.document_added': 'Community document added',
  'community.document_deleted': 'Community document deleted',

  'survey.created': 'Survey created',
  'survey.updated': 'Survey updated',
  'survey.deleted': 'Survey deleted',
  'survey.deployed': 'Survey deployed',
  'survey.closed': 'Survey closed',
  'survey.question_added': 'Survey question added',
  'survey.question_updated': 'Survey question updated',
  'survey.question_deleted': 'Survey question deleted',
  'survey.response_submitted': 'Survey response submitted',
  'survey.results_finalized': 'Assessment results finalized',
  'survey.exported': 'Assessment results exported',
  'survey.report_generated': 'EXTN-QF-23 report generated',

  'recommendation.generated': 'Recommendations generated',
  'recommendation.accepted': 'Recommendation accepted',
  'recommendation.modified': 'Recommendation modified',
  'recommendation.rejected': 'Recommendation rejected',

  'program.created': 'Proposal created',
  'program.created_from_recommendation': 'Proposal created from recommendation',
  'program.updated': 'Proposal updated',
  'program.deleted': 'Proposal deleted',
  'program.document_added': 'Proposal document added',
  'program.document_deleted': 'Proposal document deleted',
  // Approval-chain transitions — `program.<action>` from ProgramStateMachine.Action.
  'program.submit': 'Proposal submitted',
  'program.note': 'Proposal noted',
  'program.recommend': 'Proposal recommended for approval',
  'program.approve': 'Proposal approved',
  'program.return': 'Proposal returned',
  'program.cancel': 'Proposal cancelled',
  'program.start': 'Proposal started',
  'program.complete': 'Proposal completed',
}
