// Domain types for Module 4 — Recommendation Engine.
// Field names mirror the backend JSON (camelCase) so no remapping is needed.

import { COORDINATOR_ROLES, ROLE_ADMIN, ROLE_CAMPUS_EXTENSION_COORDINATOR } from '@/features/auth/types'
import type { NeedPriority } from '@/features/surveys/types'

export type RecommendationStatus = 'pending' | 'accepted' | 'modified' | 'rejected'

export const RECOMMENDATION_STATUS_LABELS: Record<RecommendationStatus, string> = {
  pending: 'Pending decision',
  accepted: 'Accepted',
  modified: 'Accepted with changes',
  rejected: 'Rejected',
}

/**
 * Roles permitted to generate recommendations and rule on them (spec §2.2 — must match backend
 * `canDecideRecommendations`). Narrower than SURVEY_MANAGE_ROLES: facilitators may view but not decide.
 */
export const RECOMMENDATION_DECIDE_ROLES = COORDINATOR_ROLES

/**
 * Roles permitted to edit the program-type library and the scoring matrix (spec §2.2 — must match
 * backend `canConfigureScoringMatrix`). Narrower still: staff and department coordinators are excluded.
 */
export const SCORING_MATRIX_ROLES = [ROLE_ADMIN, ROLE_CAMPUS_EXTENSION_COORDINATOR] as const

/** Matrix weights are bounded 0.00–5.00 server-side; 0 removes the cell. */
export const MIN_MATRIX_WEIGHT = 0
export const MAX_MATRIX_WEIGHT = 5

/** One need category's share of a program type's raw score. */
export type CategoryContribution = {
  needCategoryId: string
  needCategoryName: string
  avgScore: number
  priority: NeedPriority
  multiplier: number
  weight: number
  contribution: number
}

/**
 * The stored explanation behind a match score. The spec requires `matchScore` to be reproducible
 * from this object alone — the explainer dialog re-derives it rather than trusting the field.
 */
export type ScoreBreakdown = {
  categories: CategoryContribution[]
  rawScore: number
  maxTheoretical: number
  sectorBonus: number
  sectorBonusApplied: boolean
  matchedSectors: string[]
  matchScore: number
}

export type Recommendation = {
  id: string
  surveyId: string
  programTypeId: string
  programTypeName: string
  programTypeDescription: string | null
  defaultDuration: string | null
  matchScore: number
  rank: number
  status: RecommendationStatus
  decidedBy: string | null
  decidedByName: string | null
  decidedAt: string | null
  decisionNote: string | null
  createdAt: string | null
  breakdown: ScoreBreakdown | null
  /** The proposal this recommendation spawned when accepted/modified; null otherwise. */
  spawnedProgramId: string | null
  /** The current AI-drafted proposal text; null when none was requested (spec Module 4 AI layer). */
  draft: RecommendationDraft | null
  /** Whether AI drafting is switched on server-side — hides every draft control when false. */
  draftingAvailable: boolean
}

export type DraftStatus = 'pending' | 'ready' | 'failed' | 'refused'

export type SuggestedActivity = {
  name: string
  description: string | null
}

/**
 * AI-written proposal text. Text only — it never affects rank, score or breakdown. Accepting a
 * recommendation with a ready draft pre-fills the proposal's title, objectives and target
 * beneficiaries; the rest is reference for the person writing the proposal.
 */
export type ProposalDraftContent = {
  title: string
  rationale: string | null
  objectives: string[]
  targetBeneficiaries: string | null
  estimatedBeneficiaries: number | null
  gadConsiderations: string | null
  activities: SuggestedActivity[]
  expectedOutputs: string[]
  suggestedDuration: string | null
  partnerDepartments: string[]
  needsAddressed: string[]
}

export type RecommendationDraft = {
  id: string
  status: DraftStatus
  /** Present only when `status` is `ready`. */
  content: ProposalDraftContent | null
  model: string
  createdAt: string | null
  completedAt: string | null
  /** Why a failed/refused draft has no content. */
  message: string | null
}

/** How often the recommendations page re-reads the list while any draft is still being written. */
export const DRAFT_POLL_MS = 3000

/** The three rulings a coordinator can make; each maps to its own endpoint. */
export type DecisionKind = 'accept' | 'modify' | 'reject'

export const DECISION_LABELS: Record<DecisionKind, string> = {
  accept: 'Accept',
  modify: 'Accept with changes',
  reject: 'Reject',
}

/** A note is optional for accept/modify but required for reject (server returns 422 otherwise). */
export const DECISION_REQUIRES_NOTE: Record<DecisionKind, boolean> = {
  accept: false,
  modify: false,
  reject: true,
}

export type Sector = {
  id: string
  name: string
  active: boolean
}

export type NeedCategory = {
  id: string
  name: string
  active: boolean
}

/** One matrix cell as carried on a program type: how strongly it addresses a need category. */
export type ProgramTypeNeedWeight = {
  needCategoryId: string
  needCategoryName: string
  weight: number
}

export type ProgramType = {
  id: string
  name: string
  description: string | null
  defaultDuration: string | null
  active: boolean
  sectors: Sector[]
  weights: ProgramTypeNeedWeight[]
  createdAt: string | null
  updatedAt: string | null
}

export type ProgramTypePayload = {
  name: string
  description: string | null
  defaultDuration: string | null
  active: boolean
  sectorIds: string[]
}

/** `weights` is filled in for every category in the grid, so cells never need null-handling. */
export type ScoringMatrixRow = {
  programTypeId: string
  programTypeName: string
  active: boolean
  weights: Record<string, number>
}

export type ScoringMatrix = {
  categories: NeedCategory[]
  rows: ScoringMatrixRow[]
}

export type ScoringMatrixCell = {
  programTypeId: string
  needCategoryId: string
  weight: number
}
