import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useState, type FormEvent } from 'react'
import AdminDialog from '@/features/users/components/AdminDialog'
import type { ApiValidationErrors } from '@/shared/api/http'
import {
  QUESTION_TYPE_OPTIONS,
  type NeedCategory,
  type QuestionOption,
  type QuestionPayload,
  type QuestionType,
  type SurveyQuestion,
} from '../types'

type QuestionFormModalProps = {
  open: boolean
  question: SurveyQuestion | null
  categories: NeedCategory[]
  loading: boolean
  errorMessage: string | null
  apiErrors?: ApiValidationErrors
  onClose: () => void
  onSubmit: (payload: QuestionPayload) => void
}

const inputClassName =
  'w-full border border-[#cad5c7] bg-white px-4 py-3 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c] rounded-md'
const selectClassName = `${inputClassName} cursor-pointer`
const labelClassName = 'mb-2 block text-sm font-medium text-[#123524]'

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

function isChoiceType(type: QuestionType): boolean {
  return type === 'multiple_choice' || type === 'checkbox'
}

/** Derives a stable option value from its label when the author does not supply one. */
function slugify(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'option'
}

export default function QuestionFormModal({
  open,
  question,
  categories,
  loading,
  errorMessage,
  apiErrors,
  onClose,
  onSubmit,
}: QuestionFormModalProps) {
  const [questionText, setQuestionText] = useState(question?.questionText ?? '')
  const [questionType, setQuestionType] = useState<QuestionType>(question?.questionType ?? 'rating')
  const [weight, setWeight] = useState(String(question?.weight ?? 1))
  const [needCategoryId, setNeedCategoryId] = useState(question?.needCategoryId ?? '')
  const [required, setRequired] = useState(question?.required ?? true)
  const [optionLabels, setOptionLabels] = useState<string[]>(
    question?.options.length ? question.options.map((option) => option.label) : ['', ''],
  )
  const [localError, setLocalError] = useState<string | null>(null)

  const fieldError = (field: string): string | undefined => apiErrors?.[field]?.[0]

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsedWeight = Number(weight)
    if (!Number.isFinite(parsedWeight) || parsedWeight < 0.5 || parsedWeight > 5) {
      setLocalError('Weight must be between 0.5 and 5.0.')
      return
    }

    let options: QuestionOption[] | null = null
    if (isChoiceType(questionType)) {
      const cleaned = optionLabels.map((label) => label.trim()).filter(Boolean)
      if (cleaned.length < 2) {
        setLocalError('Choice questions require at least two options.')
        return
      }
      options = cleaned.map((label) => ({ label, value: slugify(label) }))
    }

    setLocalError(null)
    onSubmit({
      questionText: questionText.trim(),
      questionType,
      options,
      weight: parsedWeight,
      needCategoryId: needCategoryId || null,
      required,
    })
  }

  return (
    <AdminDialog
      open={open}
      title={question ? 'Edit Question' : 'Add Question'}
      description="Only rating questions contribute to the weighted need score. Other types are collected and shown as distributions."
      closeDisabled={loading}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer border border-[#d8e1d4] bg-white px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="question-form"
            disabled={loading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Saving...' : question ? 'Save Question' : 'Add Question'}
          </button>
        </div>
      }
    >
      <form id="question-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMessage || localError ? (
          <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">
            {errorMessage ?? localError}
          </div>
        ) : null}

        <div>
          <label htmlFor="question-text" className={labelClassName}>
            Question text *
          </label>
          <textarea
            id="question-text"
            value={questionText}
            rows={2}
            disabled={loading}
            onChange={(event) => setQuestionText(event.target.value)}
            placeholder="e.g. How would you rate access to health services?"
            className={inputClassName}
          />
          {fieldError('questionText') ? (
            <p className="mt-1 text-xs text-[#8a2d2d]">{fieldError('questionText')}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="question-type" className={labelClassName}>
              Type *
            </label>
            <select
              id="question-type"
              value={questionType}
              disabled={loading}
              onChange={(event) => setQuestionType(event.target.value as QuestionType)}
              className={selectClassName}
            >
              {QUESTION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="question-weight" className={labelClassName}>
              Weight (0.5–5.0)
            </label>
            <input
              id="question-weight"
              type="number"
              step="0.5"
              min={0.5}
              max={5}
              value={weight}
              disabled={loading}
              onChange={(event) => setWeight(event.target.value)}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="question-category" className={labelClassName}>
              Need category
            </label>
            <select
              id="question-category"
              value={needCategoryId}
              disabled={loading}
              onChange={(event) => setNeedCategoryId(event.target.value)}
              className={selectClassName}
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {questionType !== 'rating' ? (
          <p className="border border-[#d8e1d4] bg-[#f7faf6] px-4 py-3 text-xs text-[#6a7f6d]">
            This question type is not scored in v1 — its answers are collected and shown as a distribution,
            but the weight does not affect the need ranking.
          </p>
        ) : null}

        {isChoiceType(questionType) ? (
          <div>
            <p className={labelClassName}>Options (at least two) *</p>
            <div className="space-y-2">
              {optionLabels.map((label, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={label}
                    disabled={loading}
                    aria-label={`Option ${index + 1}`}
                    onChange={(event) => {
                      const next = [...optionLabels]
                      next[index] = event.target.value
                      setOptionLabels(next)
                    }}
                    placeholder={`Option ${index + 1}`}
                    className={inputClassName}
                  />
                  <button
                    type="button"
                    aria-label={`Remove option ${index + 1}`}
                    title="Remove option"
                    disabled={loading || optionLabels.length <= 2}
                    onClick={() => setOptionLabels(optionLabels.filter((_, i) => i !== index))}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border border-[#e3c9c9] text-[#9f2f2f] transition-colors hover:bg-[#fff7f7] disabled:cursor-not-allowed disabled:opacity-45 rounded-md"
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => setOptionLabels([...optionLabels, ''])}
              className="mt-2 inline-flex cursor-pointer items-center gap-2 border border-[#d8e1d4] px-3 py-2 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
            >
              <AddRoundedIcon fontSize="small" />
              Add option
            </button>
          </div>
        ) : null}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={required}
            disabled={loading}
            onChange={(event) => setRequired(event.target.checked)}
            className="h-4 w-4 cursor-pointer accent-[#1f5d3b]"
          />
          <span className="text-sm text-[#123524]">Required</span>
        </label>
      </form>
    </AdminDialog>
  )
}
