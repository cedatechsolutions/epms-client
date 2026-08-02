import { useState, type FormEvent } from 'react'
import AdminDialog from '@/features/users/components/AdminDialog'
import type { ApiValidationErrors } from '@/shared/api/http'
import { fromDateTimeLocal, toDateTimeLocal } from '../lib/format'
import type { Survey, SurveyPayload } from '../types'

export type SurveyFormMode = 'create' | 'edit'

type CommunityOption = { id: string; name: string }

type SurveyFormModalProps = {
  open: boolean
  mode: SurveyFormMode
  survey: Survey | null
  communities: CommunityOption[]
  /** A deployed survey keeps its target community (responses are tied to it). */
  communityLocked?: boolean
  loading: boolean
  errorMessage: string | null
  apiErrors?: ApiValidationErrors
  onClose: () => void
  onSubmit: (payload: SurveyPayload) => void
}

const inputClassName =
  'w-full border border-[#cad5c7] bg-white px-4 py-3 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]'
const selectClassName = `${inputClassName} cursor-pointer`
const labelClassName = 'mb-2 block text-sm font-medium text-[#123524]'
const fieldErrorClassName = 'mt-1 text-xs text-[#8a2d2d]'

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

export default function SurveyFormModal({
  open,
  mode,
  survey,
  communities,
  communityLocked = false,
  loading,
  errorMessage,
  apiErrors,
  onClose,
  onSubmit,
}: SurveyFormModalProps) {
  const [title, setTitle] = useState(survey?.title ?? '')
  const [description, setDescription] = useState(survey?.description ?? '')
  const [communityId, setCommunityId] = useState(survey?.communityId ?? communities[0]?.id ?? '')
  const [opensAt, setOpensAt] = useState(toDateTimeLocal(survey?.opensAt ?? null))
  const [closesAt, setClosesAt] = useState(toDateTimeLocal(survey?.closesAt ?? null))
  const [targetResponses, setTargetResponses] = useState(
    survey?.targetResponses === null || survey?.targetResponses === undefined
      ? ''
      : String(survey.targetResponses),
  )

  const fieldError = (field: string): string | undefined => apiErrors?.[field]?.[0]

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsedTarget = targetResponses.trim() === '' ? null : Number(targetResponses)
    onSubmit({
      communityId,
      title: title.trim(),
      description: description.trim() || null,
      opensAt: fromDateTimeLocal(opensAt),
      closesAt: fromDateTimeLocal(closesAt),
      targetResponses: parsedTarget !== null && Number.isFinite(parsedTarget) ? parsedTarget : null,
    })
  }

  return (
    <AdminDialog
      open={open}
      title={mode === 'create' ? 'Create New Survey' : 'Edit Survey'}
      description="Set the survey title, target community, and collection window. Questions are managed in the builder."
      closeDisabled={loading}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer border border-[#d8e1d4] bg-white px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="survey-form"
            disabled={loading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Saving...' : mode === 'create' ? 'Create Survey' : 'Save Changes'}
          </button>
        </div>
      }
    >
      <form id="survey-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMessage ? (
          <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">{errorMessage}</div>
        ) : null}

        <div>
          <label htmlFor="survey-title" className={labelClassName}>
            Survey title *
          </label>
          <input
            id="survey-title"
            value={title}
            disabled={loading}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Community Needs Assessment 2026"
            className={inputClassName}
          />
          {fieldError('title') ? <p className={fieldErrorClassName}>{fieldError('title')}</p> : null}
        </div>

        <div>
          <label htmlFor="survey-community" className={labelClassName}>
            Target community *
          </label>
          <select
            id="survey-community"
            value={communityId}
            disabled={loading || communityLocked}
            onChange={(event) => setCommunityId(event.target.value)}
            className={selectClassName}
          >
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
          {communityLocked ? (
            <p className="mt-1 text-xs text-[#7b6542]">
              The target community cannot change after the survey is deployed.
            </p>
          ) : null}
          {fieldError('communityId') ? (
            <p className={fieldErrorClassName}>{fieldError('communityId')}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="survey-description" className={labelClassName}>
            Description
          </label>
          <textarea
            id="survey-description"
            value={description}
            rows={3}
            disabled={loading}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Shown to respondents at the top of the public form."
            className={inputClassName}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="survey-opens" className={labelClassName}>
              Opens at
            </label>
            <input
              id="survey-opens"
              type="datetime-local"
              value={opensAt}
              disabled={loading}
              onChange={(event) => setOpensAt(event.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="survey-closes" className={labelClassName}>
              Closes at
            </label>
            <input
              id="survey-closes"
              type="datetime-local"
              value={closesAt}
              disabled={loading}
              onChange={(event) => setClosesAt(event.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="survey-target" className={labelClassName}>
              Target responses
            </label>
            <input
              id="survey-target"
              type="number"
              min={0}
              value={targetResponses}
              disabled={loading}
              onChange={(event) => setTargetResponses(event.target.value)}
              className={inputClassName}
            />
          </div>
        </div>
        <p className="text-xs text-[#6a7f6d]">
          Submissions after the closing date are rejected by the server, regardless of the respondent's device.
        </p>
      </form>
    </AdminDialog>
  )
}
