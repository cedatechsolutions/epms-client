// Domain types for Module 3 — Needs Assessment (Pass A: survey builder).
// Field names mirror the backend JSON (camelCase) so no remapping is needed.

export type SurveyStatus = 'draft' | 'deployed' | 'closed'
export type QuestionType = 'rating' | 'multiple_choice' | 'checkbox' | 'open_text'

/** Roles permitted to create/manage surveys (spec §2.2 — must match backend canCreateSurveys). */
export const SURVEY_MANAGE_ROLES = [
  'admin',
  'campus_extension_coordinator',
  'extension_coordinator',
  'faculty',
] as const

/** Roles permitted to view surveys/assessments — everyone except student volunteers (spec §2.2). */
export const ASSESSMENT_VIEW_ROLES = [
  'admin',
  'campus_admin',
  'campus_extension_coordinator',
  'extension_coordinator',
  'faculty',
] as const

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: 'Draft',
  deployed: 'Deployed',
  closed: 'Closed',
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  rating: 'Rating (1–5)',
  multiple_choice: 'Multiple choice',
  checkbox: 'Checkbox (multi-select)',
  open_text: 'Open text',
}

export const QUESTION_TYPE_OPTIONS = Object.entries(QUESTION_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as QuestionType, label }),
)

/** Only rating answers feed the weighted score in v1 (spec Module 3 §4). */
export const SCORED_QUESTION_TYPES: QuestionType[] = ['rating']

export type QuestionOption = {
  label: string
  value: string
}

export type NeedCategory = {
  id: string
  name: string
  active: boolean
}

export type SurveyQuestion = {
  id: string
  orderIndex: number
  questionText: string
  questionType: QuestionType
  options: QuestionOption[]
  weight: number
  needCategoryId: string | null
  needCategoryName: string | null
  required: boolean
}

export type Survey = {
  id: string
  communityId: string
  communityName: string
  title: string
  description: string | null
  status: SurveyStatus
  accessToken: string | null
  opensAt: string | null
  closesAt: string | null
  targetResponses: number | null
  questionCount: number
  questions: SurveyQuestion[]
  createdBy: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type SurveySummary = {
  id: string
  title: string
  communityId: string
  communityName: string
  status: SurveyStatus
  questionCount: number
  responseCount: number
  opensAt: string | null
  closesAt: string | null
  createdAt: string | null
}

export type SurveyListQuery = {
  page?: number
  per_page?: number
  search?: string
  status?: SurveyStatus | ''
  communityId?: string
  sort?: 'createdAt' | 'title' | 'status' | 'updatedAt'
  direction?: 'asc' | 'desc'
}

export type SurveyPayload = {
  communityId: string
  title: string
  description: string | null
  opensAt: string | null
  closesAt: string | null
  targetResponses: number | null
}

export type QuestionPayload = {
  questionText: string
  questionType: QuestionType
  options: QuestionOption[] | null
  weight: number
  needCategoryId: string | null
  required: boolean
  orderIndex?: number
}

// --- Pass C: results, finalize, exports (spec Module 3 §4/§5) ---

export type NeedPriority = 'critical' | 'high' | 'moderate' | 'low'

export const PRIORITY_LABELS: Record<NeedPriority, string> = {
  critical: 'Critical',
  high: 'High',
  moderate: 'Moderate',
  low: 'Low',
}

/** One ranked need category. Counts are sex-disaggregated (cross-cutting GAD rule). */
export type CategoryResult = {
  needCategoryId: string
  needCategoryName: string
  avgScore: number
  responseCount: number
  femaleCount: number
  maleCount: number
  priority: NeedPriority
  rank: number
}

/**
 * Answers to a question type that is collected but not scored. Choice/checkbox questions carry
 * `optionCounts`; open-text questions carry `textAnswers` (server-capped at 200).
 */
export type QuestionDistribution = {
  questionId: string
  questionText: string
  questionType: QuestionType
  optionCounts: Record<string, number>
  textAnswers: string[]
}

export type SurveyResults = {
  surveyId: string
  title: string
  communityName: string
  status: SurveyStatus
  finalized: boolean
  finalizedAt: string | null
  totalResponses: number
  femaleResponses: number
  maleResponses: number
  undisclosedSexResponses: number
  targetResponses: number | null
  completionRate: number | null
  highestNeedScore: number | null
  categories: CategoryResult[]
  distributions: QuestionDistribution[]
}

/** Optional signatory names for the EXTN-QF-23 report; blanks fall back to the role holders. */
export type SignatoryOverrides = {
  preparedBy: string | null
  notedBy: string | null
  recommendingApproval: string | null
  approvedBy: string | null
}

/** An archived generated document (spec §3.6). Files are immutable — regenerating adds a row. */
export type GeneratedReport = {
  id: string
  reportType: string
  fileType: string
  createdAt: string
}

export type ExportFormat = 'xlsx' | 'pdf'

export type PaginationMeta = {
  current_page: number
  from: number | null
  last_page: number
  path: string
  per_page: number
  to: number | null
  total: number
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: PaginationMeta
  links: Record<string, string | null>
}
