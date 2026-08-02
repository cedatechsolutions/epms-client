// Public (unauthenticated) survey form — Module 3 §3.
// Mirrors the backend's deliberately minimal public payload: no weights, no need categories, no PII.

export type PublicQuestionType = 'rating' | 'multiple_choice' | 'checkbox' | 'open_text'

export type RespondentSex = 'female' | 'male' | 'prefer_not_to_say'
export type AgeGroup = 'under_18' | '18_30' | '31_45' | '46_59' | '60_plus'

/** GAD demographic block — sex is required, age group and sector are optional (spec Module 3 §2). */
export const SEX_OPTIONS: { value: RespondentSex; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export const AGE_GROUP_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: 'under_18', label: 'Under 18' },
  { value: '18_30', label: '18–30' },
  { value: '31_45', label: '31–45' },
  { value: '46_59', label: '46–59' },
  { value: '60_plus', label: '60 and above' },
]

export type PublicQuestionOption = {
  label: string
  value: string
}

export type PublicQuestion = {
  id: string
  orderIndex: number
  questionText: string
  questionType: PublicQuestionType
  options: PublicQuestionOption[]
  required: boolean
}

export type PublicSector = {
  id: string
  name: string
  active: boolean
}

export type PublicSurvey = {
  title: string
  description: string | null
  communityName: string
  closesAt: string | null
  questions: PublicQuestion[]
  sectors: PublicSector[]
}

export type AnswerInput = {
  questionId: string
  value?: string
  values?: string[]
}

export type SubmitResponsePayload = {
  respondentSex: RespondentSex
  respondentAgeGroup: AgeGroup | null
  respondentSectorId: string | null
  respondentToken: string
  consent: boolean
  answers: AnswerInput[]
}
