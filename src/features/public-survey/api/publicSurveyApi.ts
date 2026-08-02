import { getRequest, postRequest } from '@/shared/api/http'
import type { PublicSurvey, SubmitResponsePayload } from '../types'

const PUBLIC_SURVEYS_ENDPOINT = '/public/surveys'

export async function getPublicSurvey(token: string): Promise<PublicSurvey> {
  return getRequest<PublicSurvey>(`${PUBLIC_SURVEYS_ENDPOINT}/${token}`)
}

export async function submitSurveyResponse(
  token: string,
  payload: SubmitResponsePayload,
): Promise<void> {
  await postRequest<void, SubmitResponsePayload>(
    `${PUBLIC_SURVEYS_ENDPOINT}/${token}/responses`,
    payload,
  )
}
