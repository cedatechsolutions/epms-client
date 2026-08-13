import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { isApiError } from '@/shared/api/http'
import { getPublicSurvey, submitSurveyResponse } from '../api/publicSurveyApi'
import PublicShell from '../components/PublicShell'
import { getRespondentToken, hasSubmitted, markSubmitted } from '../lib/respondentToken'
import {
  AGE_GROUP_OPTIONS,
  SEX_OPTIONS,
  type AgeGroup,
  type AnswerInput,
  type PublicQuestion,
  type PublicSurvey,
  type RespondentSex,
} from '../types'

type PageState = 'loading' | 'ready' | 'closed' | 'notfound' | 'error' | 'submitted' | 'already'

const inputClassName =
  'w-full border border-[#cad5c7] bg-white px-4 py-3 text-base text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b] rounded-md'
const selectClassName = `${inputClassName} cursor-pointer`
const labelClassName = 'mb-2 block text-sm font-medium text-[#123524]'

function Notice({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <section className="border border-[#d8e1d4] bg-white px-5 py-8 text-center">
      <div className="flex justify-center text-[#1f5d3b]">{icon}</div>
      <h1 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[#123524]">{title}</h1>
      <p className="mt-2 text-sm leading-7 text-[#506552]">{body}</p>
    </section>
  )
}

export default function PublicSurveyPage() {
  const { token = '' } = useParams()

  const [state, setState] = useState<PageState>('loading')
  const [survey, setSurvey] = useState<PublicSurvey | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [sex, setSex] = useState<RespondentSex | ''>('')
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('')
  const [sectorId, setSectorId] = useState('')
  const [consent, setConsent] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    if (hasSubmitted(token)) {
      setState('already')
      return
    }

    setState('loading')
    try {
      setSurvey(await getPublicSurvey(token))
      setState('ready')
    } catch (error) {
      if (isApiError(error) && error.status === 410) {
        setErrorMessage(error.message)
        setState('closed')
      } else if (isApiError(error) && error.status === 404) {
        setState('notfound')
      } else {
        setErrorMessage(isApiError(error) ? error.message : 'Something went wrong.')
        setState('error')
      }
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const setAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((current) => ({ ...current, [questionId]: value }))
  }

  const toggleCheckbox = (questionId: string, optionValue: string) => {
    const current = answers[questionId]
    const list = Array.isArray(current) ? current : []
    setAnswer(
      questionId,
      list.includes(optionValue) ? list.filter((item) => item !== optionValue) : [...list, optionValue],
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!survey) return

    if (!sex) {
      setFormError('Please select your sex — it is required.')
      return
    }
    if (!consent) {
      setFormError('Please give your consent before submitting.')
      return
    }

    const missing = survey.questions.find((question) => {
      if (!question.required) return false
      const value = answers[question.id]
      if (Array.isArray(value)) return value.length === 0
      return !value || value.trim() === ''
    })
    if (missing) {
      setFormError(`Please answer: ${missing.questionText}`)
      return
    }

    const payloadAnswers: AnswerInput[] = survey.questions
      .map((question): AnswerInput | null => {
        const value = answers[question.id]
        if (Array.isArray(value)) {
          return value.length > 0 ? { questionId: question.id, values: value } : null
        }
        return value && value.trim() !== '' ? { questionId: question.id, value: value.trim() } : null
      })
      .filter((answer): answer is AnswerInput => answer !== null)

    setSubmitting(true)
    setFormError(null)
    try {
      await submitSurveyResponse(token, {
        respondentSex: sex,
        respondentAgeGroup: ageGroup || null,
        respondentSectorId: sectorId || null,
        respondentToken: getRespondentToken(token),
        consent: true,
        answers: payloadAnswers,
      })
      markSubmitted(token)
      setState('submitted')
    } catch (error) {
      if (isApiError(error) && error.status === 410) {
        setErrorMessage(error.message)
        setState('closed')
      } else if (isApiError(error) && error.status === 409) {
        markSubmitted(token)
        setState('already')
      } else {
        setFormError(isApiError(error) ? error.message : 'Could not submit your response. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (state === 'loading') {
    return (
      <PublicShell>
        <section className="flex items-center justify-center gap-3 border border-[#d8e1d4] bg-white px-5 py-10">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#d8e1d4] border-t-[#1f5d3b]" />
          <span className="text-sm text-[#506552]">Loading survey...</span>
        </section>
      </PublicShell>
    )
  }

  if (state === 'closed') {
    return (
      <PublicShell>
        <Notice
          icon={<EventBusyOutlinedIcon fontSize="large" />}
          title="This survey is closed"
          body={errorMessage ?? 'This survey is no longer accepting responses. Thank you for your interest.'}
        />
      </PublicShell>
    )
  }

  if (state === 'notfound') {
    return (
      <PublicShell>
        <Notice
          icon={<EventBusyOutlinedIcon fontSize="large" />}
          title="Survey not found"
          body="This link is not valid. Please check the link you were given, or contact the extension office."
        />
      </PublicShell>
    )
  }

  if (state === 'already') {
    return (
      <PublicShell>
        <Notice
          icon={<CheckCircleOutlineRoundedIcon fontSize="large" />}
          title="You've already responded"
          body="A response has already been submitted from this device. Thank you for taking part."
        />
      </PublicShell>
    )
  }

  if (state === 'submitted') {
    return (
      <PublicShell>
        <Notice
          icon={<CheckCircleOutlineRoundedIcon fontSize="large" />}
          title="Salamat! Thank you."
          body="Your response has been recorded and will help shape extension programs for your community."
        />
      </PublicShell>
    )
  }

  if (state === 'error' || !survey) {
    return (
      <PublicShell>
        <section className="border border-[#d8e1d4] bg-white px-5 py-8">
          <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">
            {errorMessage ?? 'Something went wrong.'}
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 w-full cursor-pointer border border-[#d8e1d4] px-4 py-3 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] rounded-md"
          >
            Try again
          </button>
        </section>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <section className="border border-[#d8e1d4] bg-white px-5 py-5">
        <h1 className="text-xl font-semibold tracking-[-0.03em] text-[#123524]">{survey.title}</h1>
        <p className="mt-1 text-sm text-[#617462]">{survey.communityName}</p>
        {survey.description ? (
          <p className="mt-3 text-sm leading-7 text-[#506552]">{survey.description}</p>
        ) : null}
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GAD demographic block — always first, sex required (spec Module 3 §2). */}
        <section className="border border-[#d8e1d4] bg-white px-5 py-5">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#123524]">About you</h2>
          <p className="mt-1 text-sm text-[#617462]">
            This helps us make sure programs reach everyone fairly.
          </p>

          <fieldset className="mt-4">
            <legend className={labelClassName}>
              Sex <span className="text-[#9f2f2f]">*</span>
            </legend>
            <div className="space-y-2">
              {SEX_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 border border-[#d8e1d4] px-4 py-3 transition-colors hover:bg-[#f6faf5] rounded-md"
                >
                  <input
                    type="radio"
                    name="respondentSex"
                    value={option.value}
                    checked={sex === option.value}
                    onChange={() => setSex(option.value)}
                    className="h-4 w-4 cursor-pointer accent-[#1f5d3b]"
                  />
                  <span className="text-base text-[#123524]">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4">
            <label htmlFor="age-group" className={labelClassName}>
              Age group <span className="text-[#617462]">(optional)</span>
            </label>
            <select
              id="age-group"
              value={ageGroup}
              onChange={(event) => setAgeGroup(event.target.value as AgeGroup | '')}
              className={selectClassName}
            >
              <option value="">Prefer not to say</option>
              {AGE_GROUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label htmlFor="sector" className={labelClassName}>
              Sector <span className="text-[#617462]">(optional)</span>
            </label>
            <select
              id="sector"
              value={sectorId}
              onChange={(event) => setSectorId(event.target.value)}
              className={selectClassName}
            >
              <option value="">Prefer not to say</option>
              {survey.sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Content questions */}
        {survey.questions.map((question, index) => (
          <QuestionField
            key={question.id}
            question={question}
            index={index}
            value={answers[question.id]}
            onChange={setAnswer}
            onToggleCheckbox={toggleCheckbox}
          />
        ))}

        {/* Privacy notice + consent — RA 10173 (Data Privacy Act). */}
        <section className="border border-[#d8e1d4] bg-white px-5 py-5">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#123524]">Privacy notice</h2>
          <p className="mt-2 text-sm leading-7 text-[#506552]">
            Your answers are collected by Cavite State University – Bacoor Campus solely to plan community
            extension programs. We do not collect your name or contact details, and results are reported only
            as anonymous, aggregated statistics. Your data is processed under the Data Privacy Act of 2012
            (RA 10173).{' '}
            <Link
              to="/privacy"
              target="_blank"
              className="font-medium text-[#1f5d3b] transition-colors hover:text-[#18492e]"
            >
              Read the full privacy notice
            </Link>
            .
          </p>
          <label className="mt-4 flex cursor-pointer items-start gap-3 border border-[#d8e1d4] px-4 py-3 transition-colors hover:bg-[#f6faf5] rounded-md">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 h-4 w-4 cursor-pointer accent-[#1f5d3b]"
            />
            <span className="text-sm leading-6 text-[#123524]">
              I have read the privacy notice and I consent to my answers being collected and used as described.{' '}
              <span className="text-[#9f2f2f]">*</span>
            </span>
          </label>
        </section>

        {formError ? (
          <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">{formError}</div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
        >
          {submitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
          ) : null}
          {submitting ? 'Submitting...' : 'Submit response'}
        </button>
      </form>
    </PublicShell>
  )
}

function QuestionField({
  question,
  index,
  value,
  onChange,
  onToggleCheckbox,
}: {
  question: PublicQuestion
  index: number
  value: string | string[] | undefined
  onChange: (questionId: string, value: string) => void
  onToggleCheckbox: (questionId: string, optionValue: string) => void
}) {
  const selected = Array.isArray(value) ? value : []

  return (
    <section className="border border-[#d8e1d4] bg-white px-5 py-5">
      <p className="text-base font-medium text-[#123524]">
        {index + 1}. {question.questionText}
        {question.required ? <span className="text-[#9f2f2f]"> *</span> : null}
      </p>

      {question.questionType === 'rating' ? (
        <div className="mt-4">
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((rating) => {
              const active = value === String(rating)
              return (
                <button
                  key={rating}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange(question.id, String(rating))}
                  className={[
                    'cursor-pointer border px-2 py-3 text-base font-medium transition-colors rounded-md',
                    active
                      ? 'border-[#1f5d3b] bg-[#1f5d3b] text-white'
                      : 'border-[#d8e1d4] text-[#123524] hover:bg-[#f6faf5]',
                  ].join(' ')}
                >
                  {rating}
                </button>
              )
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-[#6a7f6d]">
            <span>1 — Very poor</span>
            <span>5 — Very good</span>
          </div>
        </div>
      ) : null}

      {question.questionType === 'multiple_choice' ? (
        <div className="mt-4 space-y-2">
          {question.options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 border border-[#d8e1d4] px-4 py-3 transition-colors hover:bg-[#f6faf5] rounded-md"
            >
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(question.id, option.value)}
                className="h-4 w-4 cursor-pointer accent-[#1f5d3b]"
              />
              <span className="text-base text-[#123524]">{option.label}</span>
            </label>
          ))}
        </div>
      ) : null}

      {question.questionType === 'checkbox' ? (
        <div className="mt-4 space-y-2">
          {question.options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 border border-[#d8e1d4] px-4 py-3 transition-colors hover:bg-[#f6faf5] rounded-md"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => onToggleCheckbox(question.id, option.value)}
                className="h-4 w-4 cursor-pointer accent-[#1f5d3b]"
              />
              <span className="text-base text-[#123524]">{option.label}</span>
            </label>
          ))}
        </div>
      ) : null}

      {question.questionType === 'open_text' ? (
        <textarea
          value={typeof value === 'string' ? value : ''}
          rows={4}
          onChange={(event) => onChange(question.id, event.target.value)}
          placeholder="Your answer"
          className={`mt-4 ${inputClassName} rounded-md`}
        />
      ) : null}
    </section>
  )
}
