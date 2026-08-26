import { deleteRequest, getBlobRequest, getRequest, patchRequest, postRequest } from '@/shared/api/http'
import type {
  AttendanceImportResult,
  AttendancePayload,
  AttendanceRecord,
  Evaluation,
  EvaluationPayload,
  PaginatedResponse,
  Program,
  ProgramActivity,
  ProgramActivityPayload,
  ProgramApproval,
  ProgramDocument,
  ProgramListQuery,
  ProgramMember,
  ProgramMemberPayload,
  ProgramPayload,
  ProgramStats,
  ProgramSummary,
  SexSplit,
  StageActionPayload,
  UserOption,
} from '../types'

const PROGRAMS_ENDPOINT = '/programs'
const ACTIVITIES_ENDPOINT = '/activities'
const USERS_DIRECTORY_ENDPOINT = '/users/directory'

export async function listPrograms(
  query: ProgramListQuery = {},
): Promise<PaginatedResponse<ProgramSummary>> {
  return getRequest<PaginatedResponse<ProgramSummary>>(PROGRAMS_ENDPOINT, {
    params: {
      page: query.page,
      perPage: query.per_page,
      search: query.search || undefined,
      status: query.status || undefined,
      communityId: query.communityId || undefined,
      programTypeId: query.programTypeId || undefined,
      facultyLeadId: query.facultyLeadId || undefined,
      periodId: query.periodId || undefined,
      sort: query.sort,
      direction: query.direction,
    },
  })
}

/** Pass the same `periodId` the list was fetched with, or the tab badges will outcount the rows. */
export async function getProgramStats(periodId?: string): Promise<ProgramStats> {
  return getRequest<ProgramStats>(`${PROGRAMS_ENDPOINT}/stats`, {
    params: { periodId: periodId || undefined },
  })
}

export async function getProgram(id: string): Promise<Program> {
  return getRequest<Program>(`${PROGRAMS_ENDPOINT}/${id}`)
}

export async function getProgramApprovals(id: string): Promise<ProgramApproval[]> {
  return getRequest<ProgramApproval[]>(`${PROGRAMS_ENDPOINT}/${id}/approvals`)
}

export async function createProgram(payload: ProgramPayload): Promise<Program> {
  return postRequest<Program, ProgramPayload>(PROGRAMS_ENDPOINT, payload)
}

export async function updateProgram(id: string, payload: ProgramPayload): Promise<Program> {
  return patchRequest<Program, ProgramPayload>(`${PROGRAMS_ENDPOINT}/${id}`, payload)
}

export async function deleteProgram(id: string): Promise<void> {
  await deleteRequest(`${PROGRAMS_ENDPOINT}/${id}`)
}

// --- the four-stage approval chain ---
// One endpoint per stage, each owned by exactly one role. `return` is legal on stages 2-4 and the
// server requires a comment with it (422 otherwise).

export async function submitProgram(id: string): Promise<Program> {
  return postRequest<Program, undefined>(`${PROGRAMS_ENDPOINT}/${id}/submit`, undefined)
}

export async function reviewProgram(id: string, payload: StageActionPayload): Promise<Program> {
  return postRequest<Program, StageActionPayload>(`${PROGRAMS_ENDPOINT}/${id}/review`, payload)
}

export async function recommendProgram(id: string, payload: StageActionPayload): Promise<Program> {
  return postRequest<Program, StageActionPayload>(`${PROGRAMS_ENDPOINT}/${id}/recommend`, payload)
}

export async function approveProgram(id: string, payload: StageActionPayload): Promise<Program> {
  return postRequest<Program, StageActionPayload>(`${PROGRAMS_ENDPOINT}/${id}/approve`, payload)
}

// --- attachments ---

export async function listProgramDocuments(id: string): Promise<ProgramDocument[]> {
  return getRequest<ProgramDocument[]>(`${PROGRAMS_ENDPOINT}/${id}/documents`)
}

export async function uploadProgramDocument(
  id: string,
  file: File,
  docType: string,
): Promise<ProgramDocument> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('docType', docType)
  return postRequest<ProgramDocument, FormData>(`${PROGRAMS_ENDPOINT}/${id}/documents`, formData)
}

export async function downloadProgramDocument(id: string, documentId: string): Promise<Blob> {
  return getBlobRequest(`${PROGRAMS_ENDPOINT}/${id}/documents/${documentId}`)
}

export async function deleteProgramDocument(id: string, documentId: string): Promise<void> {
  await deleteRequest(`${PROGRAMS_ENDPOINT}/${id}/documents/${documentId}`)
}

/**
 * People options for the faculty-lead picker. Readable by any proposal author, unlike the rest of
 * `/api/users` — see `Permissions.canBrowseUserDirectory()`.
 */
export async function listUserOptions(role?: string): Promise<UserOption[]> {
  return getRequest<UserOption[]>(USERS_DIRECTORY_ENDPOINT, {
    params: { role: role || undefined },
  })
}

// --- Module 5b: activities ---
// Activities are created under their program but addressed directly once they exist, mirroring the
// spec's API surface.

export async function listProgramActivities(programId: string): Promise<ProgramActivity[]> {
  return getRequest<ProgramActivity[]>(`${PROGRAMS_ENDPOINT}/${programId}/activities`)
}

/** The program's running Total/F/M across every activity. */
export async function getProgramAttendanceTotals(programId: string): Promise<SexSplit> {
  return getRequest<SexSplit>(`${PROGRAMS_ENDPOINT}/${programId}/attendance-totals`)
}

export async function createProgramActivity(
  programId: string,
  payload: ProgramActivityPayload,
): Promise<ProgramActivity> {
  return postRequest<ProgramActivity, ProgramActivityPayload>(
    `${PROGRAMS_ENDPOINT}/${programId}/activities`,
    payload,
  )
}

export async function updateProgramActivity(
  activityId: string,
  payload: ProgramActivityPayload,
): Promise<ProgramActivity> {
  return patchRequest<ProgramActivity, ProgramActivityPayload>(
    `${ACTIVITIES_ENDPOINT}/${activityId}`,
    payload,
  )
}

export async function deleteProgramActivity(activityId: string): Promise<void> {
  await deleteRequest(`${ACTIVITIES_ENDPOINT}/${activityId}`)
}

// --- attendance ---

export async function listAttendance(activityId: string): Promise<AttendanceRecord[]> {
  return getRequest<AttendanceRecord[]>(`${ACTIVITIES_ENDPOINT}/${activityId}/attendance`)
}

export async function addAttendance(
  activityId: string,
  payload: AttendancePayload,
): Promise<AttendanceRecord> {
  return postRequest<AttendanceRecord, AttendancePayload>(
    `${ACTIVITIES_ENDPOINT}/${activityId}/attendance`,
    payload,
  )
}

export async function deleteAttendance(activityId: string, attendanceId: string): Promise<void> {
  await deleteRequest(`${ACTIVITIES_ENDPOINT}/${activityId}/attendance/${attendanceId}`)
}

/**
 * Uploads a CSV of attendees. Resolves with the row-level report even when rows were rejected —
 * a partial import is a success, not an error, so this does not throw on `skipped > 0`.
 */
export async function importAttendanceCsv(
  activityId: string,
  file: File,
): Promise<AttendanceImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  return postRequest<AttendanceImportResult, FormData>(
    `${ACTIVITIES_ENDPOINT}/${activityId}/attendance/import`,
    formData,
  )
}

// --- evaluations ---

export async function listEvaluations(activityId: string): Promise<Evaluation[]> {
  return getRequest<Evaluation[]>(`${ACTIVITIES_ENDPOINT}/${activityId}/evaluations`)
}

export async function createEvaluation(
  activityId: string,
  payload: EvaluationPayload,
): Promise<Evaluation> {
  return postRequest<Evaluation, EvaluationPayload>(
    `${ACTIVITIES_ENDPOINT}/${activityId}/evaluations`,
    payload,
  )
}

export async function updateEvaluation(
  activityId: string,
  evaluationId: string,
  payload: EvaluationPayload,
): Promise<Evaluation> {
  return patchRequest<Evaluation, EvaluationPayload>(
    `${ACTIVITIES_ENDPOINT}/${activityId}/evaluations/${evaluationId}`,
    payload,
  )
}

export async function deleteEvaluation(activityId: string, evaluationId: string): Promise<void> {
  await deleteRequest(`${ACTIVITIES_ENDPOINT}/${activityId}/evaluations/${evaluationId}`)
}

export async function attachEvaluationFile(
  activityId: string,
  evaluationId: string,
  file: File,
): Promise<Evaluation> {
  const formData = new FormData()
  formData.append('file', file)
  return postRequest<Evaluation, FormData>(
    `${ACTIVITIES_ENDPOINT}/${activityId}/evaluations/${evaluationId}/file`,
    formData,
  )
}

export async function downloadEvaluationFile(
  activityId: string,
  evaluationId: string,
): Promise<Blob> {
  return getBlobRequest(`${ACTIVITIES_ENDPOINT}/${activityId}/evaluations/${evaluationId}/file`)
}

// --- team assignment ---

export async function listProgramMembers(programId: string): Promise<ProgramMember[]> {
  return getRequest<ProgramMember[]>(`${PROGRAMS_ENDPOINT}/${programId}/members`)
}

export async function addProgramMember(
  programId: string,
  payload: ProgramMemberPayload,
): Promise<ProgramMember> {
  return postRequest<ProgramMember, ProgramMemberPayload>(
    `${PROGRAMS_ENDPOINT}/${programId}/members`,
    payload,
  )
}

export async function removeProgramMember(programId: string, memberId: string): Promise<void> {
  await deleteRequest(`${PROGRAMS_ENDPOINT}/${programId}/members/${memberId}`)
}
