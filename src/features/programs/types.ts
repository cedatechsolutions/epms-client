// Domain types for Module 5a — Extension Projects (proposals) and the four-stage approval chain.
// Field names mirror the backend JSON (camelCase) so no request/response remapping is needed.

/** Every status `programs.status` can hold (backend `Program.STATUS_*`). */
export type ProgramStatus =
  | 'draft'
  | 'submitted'
  | 'coordinator_review'
  | 'recommending_approval'
  | 'approved'
  | 'returned'
  | 'ongoing'
  | 'completed'
  | 'cancelled'

/**
 * What the current user may do to a proposal right now. The server computes this
 * (`ProgramResponse.availableActions`) and the client renders buttons from it rather than
 * re-implementing the state machine — the two cannot drift apart that way.
 */
export type ProgramAction = 'edit' | 'submit' | 'note' | 'recommend' | 'approve' | 'return'

/** `program_approvals.action` — one row of the audit trail. */
export type ApprovalAction = 'submitted' | 'noted' | 'recommended' | 'approved' | 'returned'

/** Roles permitted to author proposals (backend `Permissions.canCreatePrograms`). */
export const PROGRAM_AUTHOR_ROLES = [
  'admin',
  'campus_extension_coordinator',
  'extension_coordinator',
  'faculty',
] as const

export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  coordinator_review: 'Coordinator Review',
  recommending_approval: 'Recommending Approval',
  approved: 'Approved',
  returned: 'Returned',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

/**
 * Chip tones, drawn only from the four sanctioned decision-status tones (UI guidelines §6.4).
 * `returned` takes the critical tone because it is the one status demanding the author act;
 * the three in-chain statuses share the "high" tone since they are the same thing at different desks.
 */
export const PROGRAM_STATUS_TONES: Record<ProgramStatus, string> = {
  draft: 'border-line bg-surface-tint text-muted',
  submitted: 'border-line bg-surface-tint text-warning',
  coordinator_review: 'border-line bg-surface-tint text-warning',
  recommending_approval: 'border-line bg-surface-tint text-warning',
  approved: 'border-success-border bg-success-bg text-primary-accent',
  ongoing: 'border-success-border bg-success-bg text-primary-accent',
  completed: 'border-success-border bg-success-bg text-primary-accent',
  returned: 'border-danger-border bg-danger-bg text-danger-text',
  cancelled: 'border-line bg-surface-tint text-muted',
}

/**
 * The list's status tabs (spec Module 5 §1). `under_review` is a pseudo-status the backend expands
 * to the three in-chain statuses; `''` is the All tab.
 */
export type ProgramStatusTab = '' | 'draft' | 'under_review' | 'returned' | 'approved' | 'ongoing' | 'completed'

/**
 * The four signatory stages, in order. This mirrors `ProgramStateMachine` for display only — the
 * server decides what may actually happen. `reachedAt` is derived from the approval trail.
 */
export const APPROVAL_STAGES = [
  { stage: 1, label: 'Submitted', role: 'faculty', roleLabel: 'Extension Project Leader' },
  { stage: 2, label: 'Coordinator Review', role: 'extension_coordinator', roleLabel: 'Extension Coordinator' },
  {
    stage: 3,
    label: 'Recommending Approval',
    role: 'campus_extension_coordinator',
    roleLabel: 'Campus Extension Coordinator',
  },
  { stage: 4, label: 'Approved', role: 'campus_admin', roleLabel: 'Campus Administrator' },
] as const

/** Status → how many stages of the chain are complete. Drives the stepper's filled state. */
export const STAGES_COMPLETED_BY_STATUS: Record<ProgramStatus, number> = {
  draft: 0,
  returned: 0,
  submitted: 1,
  coordinator_review: 2,
  recommending_approval: 3,
  approved: 4,
  ongoing: 4,
  completed: 4,
  cancelled: 0,
}

export const APPROVAL_ACTION_LABELS: Record<ApprovalAction, string> = {
  submitted: 'Submitted for review',
  noted: 'Noted and endorsed',
  recommended: 'Recommended for approval',
  approved: 'Approved',
  returned: 'Returned for revision',
}

/** Must stay in step with `ProgramService.ALLOWED_DOC_TYPES` — the server rejects anything else. */
export type ProgramDocType =
  | 'letter_request'
  | 'moa'
  | 'budget_breakdown'
  | 'needs_assessment_report'
  | 'photo'
  | 'other'

export const PROGRAM_DOC_TYPE_LABELS: Record<ProgramDocType, string> = {
  letter_request: 'Letter of Request',
  moa: 'MOA',
  budget_breakdown: 'Budget Breakdown',
  needs_assessment_report: 'Needs Assessment Report',
  photo: 'Photo',
  other: 'Other',
}

export const PROGRAM_DOC_TYPE_OPTIONS = Object.entries(PROGRAM_DOC_TYPE_LABELS).map(([value, label]) => ({
  value: value as ProgramDocType,
  label,
}))

export type Sector = {
  id: string
  name: string
  active: boolean
}

export type ProgramDocument = {
  id: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  docType: ProgramDocType | string | null
  uploadedBy: string | null
  createdAt: string | null
}

export type ProgramApproval = {
  id: string
  stage: number
  stageRole: string | null
  action: ApprovalAction
  actedBy: string | null
  actedByName: string | null
  comment: string | null
  actedAt: string | null
}

export type ProgramSummary = {
  id: string
  title: string
  communityId: string | null
  communityName: string | null
  programTypeId: string | null
  programTypeName: string | null
  facultyLeadId: string | null
  facultyLeadName: string | null
  status: ProgramStatus
  proposedDate: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type Program = {
  id: string
  title: string
  communityId: string | null
  communityName: string | null
  programTypeId: string | null
  programTypeName: string | null
  recommendationId: string | null
  surveyId: string | null
  surveyTitle: string | null
  objectives: string | null
  targetBeneficiaries: number | null
  proposedDate: string | null
  endDate: string | null
  venue: string | null
  budgetRequested: number | null
  budgetApproved: number | null
  facultyLeadId: string | null
  facultyLeadName: string | null
  status: ProgramStatus
  createdBy: string | null
  createdAt: string | null
  updatedAt: string | null
  sectors: Sector[]
  documents: ProgramDocument[]
  approvals: ProgramApproval[]
  availableActions: ProgramAction[]
  canEdit: boolean
  /**
   * The delivery-phase counterpart of `canEdit`: true only when the caller owns the program AND it
   * is approved or ongoing. The two are never both true — a proposal is editable before submission
   * and deliverable after approval.
   */
  canRecordDelivery: boolean
  warnings: string[]
}

export type ProgramStats = {
  total: number
  draft: number
  underReview: number
  returned: number
  approved: number
  ongoing: number
  completed: number
  cancelled: number
}

export type ProgramPayload = {
  title: string
  communityId: string | null
  programTypeId: string | null
  surveyId: string | null
  objectives: string | null
  targetBeneficiaries: number | null
  proposedDate: string | null
  endDate: string | null
  venue: string | null
  budgetRequested: number | null
  facultyLeadId: string | null
  sectorIds: string[]
}

export type ProgramListQuery = {
  page?: number
  per_page?: number
  search?: string
  status?: ProgramStatusTab
  communityId?: string
  programTypeId?: string
  facultyLeadId?: string
  /**
   * Academic period to scope the list to. The dashboard hands this over on every drill-down and the
   * server applies the same rule to both (proposed date inside the period), which is what makes a
   * KPI count equal the number of rows the click opens.
   */
  periodId?: string
  sort?: 'title' | 'status' | 'proposedDate' | 'createdAt' | 'updatedAt'
  direction?: 'asc' | 'desc'
}

/** Payload for the three stage endpoints. `comment` is required by the server when returning. */
export type StageActionPayload = {
  action: 'note' | 'recommend' | 'approve' | 'return'
  comment?: string
  budgetApproved?: number | null
}

/** A person as a picker option (`GET /api/users/directory`). */
export type UserOption = {
  id: string
  name: string
  email: string
  roles: string[]
}

// --- Module 5b: activities, attendance, evaluations ---

export type ActivityStatus = 'scheduled' | 'done' | 'cancelled'

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  scheduled: 'Scheduled',
  done: 'Done',
  cancelled: 'Cancelled',
}

/** Reuses the four §6.4 decision tones — no new colours for a new status set. */
export const ACTIVITY_STATUS_TONES: Record<ActivityStatus, string> = {
  scheduled: 'border-line bg-surface-tint text-warning',
  done: 'border-success-border bg-success-bg text-primary-accent',
  cancelled: 'border-line bg-surface-tint text-muted',
}

export const ACTIVITY_STATUS_OPTIONS = Object.entries(ACTIVITY_STATUS_LABELS).map(([value, label]) => ({
  value: value as ActivityStatus,
  label,
}))

export type Sex = 'female' | 'male'

export const SEX_LABELS: Record<Sex, string> = {
  female: 'Female',
  male: 'Male',
}

/**
 * A head count with its GAD split. `total` is carried separately because evaluation respondents may
 * decline to state a sex, so `female + male` can legitimately be less than `total`.
 */
export type SexSplit = {
  total: number
  female: number
  male: number
}

export type EvalType = 'pre' | 'post'

export const EVAL_TYPE_LABELS: Record<EvalType, string> = {
  pre: 'Pre-activity',
  post: 'Post-activity',
}

export type Evaluation = {
  id: string
  programActivityId: string
  evalType: EvalType
  respondentCount: number
  femaleCount: number
  maleCount: number
  /** Respondents counted in the total but in neither bucket — reported in words, never as a bucket. */
  unspecifiedCount: number
  avgRating: number | null
  notes: string | null
  originalFilename: string | null
  sizeBytes: number | null
  encodedBy: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type ProgramActivity = {
  id: string
  programId: string
  title: string
  activityDate: string
  startTime: string | null
  endTime: string | null
  venue: string | null
  status: ActivityStatus
  notes: string | null
  attendance: SexSplit
  evaluations: Evaluation[]
  /** Server's answer to "render the quick-entry row?" — false once the activity is cancelled. */
  canRecordAttendance: boolean
  canEdit: boolean
  createdBy: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type ProgramActivityPayload = {
  title: string
  activityDate: string
  startTime: string | null
  endTime: string | null
  venue: string | null
  status: ActivityStatus
  notes: string | null
}

export type AttendanceRecord = {
  id: string
  programActivityId: string
  /** Null for masked readers (student volunteers) — the server never sends the name at all. */
  attendeeName: string | null
  sex: Sex
  age: number | null
  sectorId: string | null
  sectorName: string | null
  communityId: string | null
  createdBy: string | null
  createdAt: string | null
}

export type AttendancePayload = {
  attendeeName: string
  sex: Sex
  age: number | null
  sectorId: string | null
}

export type AttendanceImportRowError = {
  /** 1-based line in the uploaded file, counting the header — matches the user's spreadsheet. */
  line: number
  message: string
  content: string
}

/** A CSV import is partial: some rows land, some are reported. Both halves matter to the user. */
export type AttendanceImportResult = {
  imported: number
  skipped: number
  errors: AttendanceImportRowError[]
  totals: SexSplit
}

export type ProgramMemberRole = 'volunteer' | 'co_faculty'

export const PROGRAM_MEMBER_ROLE_LABELS: Record<ProgramMemberRole, string> = {
  volunteer: 'Student Volunteer',
  co_faculty: 'Co-Faculty',
}

export const PROGRAM_MEMBER_ROLE_OPTIONS = Object.entries(PROGRAM_MEMBER_ROLE_LABELS).map(
  ([value, label]) => ({ value: value as ProgramMemberRole, label }),
)

export type ProgramMember = {
  id: string
  programId: string
  userId: string
  name: string | null
  email: string | null
  roleInProgram: ProgramMemberRole
  assignedBy: string | null
  createdAt: string | null
}

export type ProgramMemberPayload = {
  userId: string
  roleInProgram: ProgramMemberRole
}

export type EvaluationPayload = {
  evalType: EvalType
  respondentCount: number
  femaleCount: number
  maleCount: number
  avgRating: number | null
  notes: string | null
}

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
