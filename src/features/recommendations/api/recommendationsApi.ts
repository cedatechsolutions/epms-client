import { getRequest, patchRequest, postRequest, putRequest } from '@/shared/api/http'
import type {
  DecisionKind,
  NeedCategory,
  ProgramType,
  ProgramTypePayload,
  Recommendation,
  ScoringMatrix,
  ScoringMatrixCell,
  Sector,
} from '../types'

const SURVEYS_ENDPOINT = '/surveys'
const RECOMMENDATIONS_ENDPOINT = '/recommendations'
const PROGRAM_TYPES_ENDPOINT = '/program-types'
const SCORING_MATRIX_ENDPOINT = '/scoring-matrix'
const SECTORS_ENDPOINT = '/sectors'
const NEED_CATEGORIES_ENDPOINT = '/need-categories'

/**
 * Scores every active program type against the survey's finalized results. Rejected with 409 when
 * the results are not finalized yet, or when the library has no active types.
 */
export async function generateRecommendations(surveyId: string): Promise<Recommendation[]> {
  return postRequest<Recommendation[]>(`${SURVEYS_ENDPOINT}/${surveyId}/recommendations/generate`)
}

export async function listRecommendations(surveyId: string): Promise<Recommendation[]> {
  return getRequest<Recommendation[]>(`${SURVEYS_ENDPOINT}/${surveyId}/recommendations`)
}

/**
 * Records a ruling. Re-deciding an already-decided recommendation is a 409; rejecting without a
 * reason is a 422 — both surface as inline dialog errors.
 */
export async function decideRecommendation(
  recommendationId: string,
  decision: DecisionKind,
  note: string | null,
): Promise<Recommendation> {
  return postRequest<Recommendation, { note: string | null }>(
    `${RECOMMENDATIONS_ENDPOINT}/${recommendationId}/${decision}`,
    { note },
  )
}

// --- program-type library (spec Module 4 §4) ---

export async function listProgramTypes(): Promise<ProgramType[]> {
  return getRequest<ProgramType[]>(PROGRAM_TYPES_ENDPOINT)
}

export async function createProgramType(payload: ProgramTypePayload): Promise<ProgramType> {
  return postRequest<ProgramType, ProgramTypePayload>(PROGRAM_TYPES_ENDPOINT, payload)
}

export async function updateProgramType(
  id: string,
  payload: ProgramTypePayload,
): Promise<ProgramType> {
  return patchRequest<ProgramType, ProgramTypePayload>(`${PROGRAM_TYPES_ENDPOINT}/${id}`, payload)
}

// --- scoring matrix (spec Module 4 §4) ---

export async function getScoringMatrix(): Promise<ScoringMatrix> {
  return getRequest<ScoringMatrix>(SCORING_MATRIX_ENDPOINT)
}

/** Writes only the supplied cells; edits affect future scoring runs, never existing rows. */
export async function updateScoringMatrix(cells: ScoringMatrixCell[]): Promise<ScoringMatrix> {
  return putRequest<ScoringMatrix, { cells: ScoringMatrixCell[] }>(SCORING_MATRIX_ENDPOINT, { cells })
}

export async function listSectors(): Promise<Sector[]> {
  return getRequest<Sector[]>(SECTORS_ENDPOINT)
}

export async function listNeedCategories(): Promise<NeedCategory[]> {
  return getRequest<NeedCategory[]>(NEED_CATEGORIES_ENDPOINT)
}
