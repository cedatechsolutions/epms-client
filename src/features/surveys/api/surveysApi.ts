import {
  deleteRequest,
  getBlobRequest,
  getRequest,
  patchRequest,
  postBlobRequest,
  postRequest,
} from '@/shared/api/http'
import type {
  ExportFormat,
  GeneratedReport,
  NeedCategory,
  PaginatedResponse,
  QuestionPayload,
  SignatoryOverrides,
  Survey,
  SurveyListQuery,
  SurveyPayload,
  SurveyQuestion,
  SurveyResults,
  SurveySummary,
} from '../types'

const SURVEYS_ENDPOINT = '/surveys'
const NEED_CATEGORIES_ENDPOINT = '/need-categories'

export async function listSurveys(query: SurveyListQuery = {}): Promise<PaginatedResponse<SurveySummary>> {
  return getRequest<PaginatedResponse<SurveySummary>>(SURVEYS_ENDPOINT, {
    params: {
      page: query.page,
      perPage: query.per_page,
      search: query.search || undefined,
      status: query.status || undefined,
      communityId: query.communityId || undefined,
      sort: query.sort,
      direction: query.direction,
    },
  })
}

export async function getSurvey(id: string): Promise<Survey> {
  return getRequest<Survey>(`${SURVEYS_ENDPOINT}/${id}`)
}

export async function createSurvey(payload: SurveyPayload): Promise<Survey> {
  return postRequest<Survey, SurveyPayload>(SURVEYS_ENDPOINT, payload)
}

export async function updateSurvey(id: string, payload: SurveyPayload): Promise<Survey> {
  return patchRequest<Survey, SurveyPayload>(`${SURVEYS_ENDPOINT}/${id}`, payload)
}

export async function deleteSurvey(id: string): Promise<void> {
  await deleteRequest(`${SURVEYS_ENDPOINT}/${id}`)
}

export async function deploySurvey(id: string): Promise<Survey> {
  return postRequest<Survey>(`${SURVEYS_ENDPOINT}/${id}/deploy`)
}

export async function closeSurvey(id: string): Promise<Survey> {
  return postRequest<Survey>(`${SURVEYS_ENDPOINT}/${id}/close`)
}

export async function addQuestion(surveyId: string, payload: QuestionPayload): Promise<SurveyQuestion> {
  return postRequest<SurveyQuestion, QuestionPayload>(`${SURVEYS_ENDPOINT}/${surveyId}/questions`, payload)
}

export async function updateQuestion(
  surveyId: string,
  questionId: string,
  payload: QuestionPayload,
): Promise<SurveyQuestion> {
  return patchRequest<SurveyQuestion, QuestionPayload>(
    `${SURVEYS_ENDPOINT}/${surveyId}/questions/${questionId}`,
    payload,
  )
}

export async function deleteQuestion(surveyId: string, questionId: string): Promise<void> {
  await deleteRequest(`${SURVEYS_ENDPOINT}/${surveyId}/questions/${questionId}`)
}

export async function listNeedCategories(): Promise<NeedCategory[]> {
  return getRequest<NeedCategory[]>(NEED_CATEGORIES_ENDPOINT)
}

// --- results, finalize, exports (spec Module 3 §4/§5) ---

/** Live scores while the survey is open; the finalized snapshot once results are frozen. */
export async function getSurveyResults(surveyId: string): Promise<SurveyResults> {
  return getRequest<SurveyResults>(`${SURVEYS_ENDPOINT}/${surveyId}/results`)
}

/** Freezes the current scores. Rejected with 409 when already finalized or with no responses. */
export async function finalizeSurveyResults(surveyId: string): Promise<SurveyResults> {
  return postRequest<SurveyResults>(`${SURVEYS_ENDPOINT}/${surveyId}/finalize`)
}

export async function exportSurveyResults(surveyId: string, format: ExportFormat): Promise<Blob> {
  return getBlobRequest(`${SURVEYS_ENDPOINT}/${surveyId}/export`, { params: { format } })
}

/** Generates and archives the EXTN-QF-23 .docx. Requires finalized results (409 otherwise). */
export async function generateQf23Report(
  surveyId: string,
  overrides: SignatoryOverrides,
): Promise<Blob> {
  return postBlobRequest<SignatoryOverrides>(`${SURVEYS_ENDPOINT}/${surveyId}/report-qf23`, overrides)
}

export async function listSurveyReports(surveyId: string): Promise<GeneratedReport[]> {
  return getRequest<GeneratedReport[]>(`${SURVEYS_ENDPOINT}/${surveyId}/reports`)
}

export async function downloadSurveyReport(surveyId: string, reportId: string): Promise<Blob> {
  return getBlobRequest(`${SURVEYS_ENDPOINT}/${surveyId}/reports/${reportId}`)
}
