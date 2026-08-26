import { useMemo, useState, type FormEvent } from 'react'
import AdminDialog from '@/features/users/components/AdminDialog'
import type { ApiValidationErrors } from '@/shared/api/http'
import type {
  Program,
  ProgramPayload,
  Sector,
  UserOption,
} from '../types'

export type ProgramFormMode = 'create' | 'edit'

/** A community/program-type/survey option, reduced to what the pickers need. */
export type PickerOption = { id: string; label: string }

type ProgramFormModalProps = {
  open: boolean
  mode: ProgramFormMode
  program: Program | null
  communities: PickerOption[]
  programTypes: PickerOption[]
  surveys: PickerOption[]
  facultyOptions: UserOption[]
  sectors: Sector[]
  loading: boolean
  /** True while the Save-and-submit path is running, so the two buttons show separate states. */
  submitting: boolean
  errorMessage: string | null
  apiErrors?: ApiValidationErrors
  onClose: () => void
  onSubmit: (payload: ProgramPayload, alsoSubmit: boolean) => void
}

const inputClassName =
  'w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

const selectClassName = `${inputClassName} cursor-pointer`
const labelClassName = 'mb-2 block text-sm font-medium text-ink'
const fieldErrorClassName = 'mt-1 text-xs text-danger-strong'

function ButtonSpinner({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <span
      className={[
        'h-4 w-4 animate-spin rounded-full border-2',
        tone === 'light' ? 'border-white/35 border-t-white' : 'border-line border-t-primary-accent',
      ].join(' ')}
    />
  )
}

function toStringValue(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value)
}

function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Create/edit form for an extension-project proposal (spec Module 5 §2).
 *
 * <p>The form has **two** submit paths because the API does: `Save Draft` persists whatever is
 * filled in — the server requires only a title — while `Save and Submit` additionally calls
 * `/submit`, which validates the full field set and returns 422 listing what is missing. The client
 * therefore does not block submission itself; it surfaces the server's field errors. Duplicating
 * that rule here would mean two places to keep in step, and the server is the authoritative one.
 */
export default function ProgramFormModal({
  open,
  mode,
  program,
  communities,
  programTypes,
  surveys,
  facultyOptions,
  sectors,
  loading,
  submitting,
  errorMessage,
  apiErrors,
  onClose,
  onSubmit,
}: ProgramFormModalProps) {
  const [title, setTitle] = useState(program?.title ?? '')
  const [communityId, setCommunityId] = useState(program?.communityId ?? '')
  const [programTypeId, setProgramTypeId] = useState(program?.programTypeId ?? '')
  const [surveyId, setSurveyId] = useState(program?.surveyId ?? '')
  const [objectives, setObjectives] = useState(program?.objectives ?? '')
  const [targetBeneficiaries, setTargetBeneficiaries] = useState(
    toStringValue(program?.targetBeneficiaries),
  )
  const [proposedDate, setProposedDate] = useState(program?.proposedDate ?? '')
  const [endDate, setEndDate] = useState(program?.endDate ?? '')
  const [venue, setVenue] = useState(program?.venue ?? '')
  const [budgetRequested, setBudgetRequested] = useState(toStringValue(program?.budgetRequested))
  const [facultyLeadId, setFacultyLeadId] = useState(program?.facultyLeadId ?? '')
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>(
    program?.sectors.map((sector) => sector.id) ?? [],
  )

  const busy = loading || submitting
  const fieldError = (field: string): string | undefined => apiErrors?.[field]?.[0]

  const activeSectors = useMemo(() => sectors.filter((sector) => sector.active), [sectors])

  const toggleSector = (id: string) => {
    setSelectedSectorIds((current) =>
      current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id],
    )
  }

  const buildPayload = (): ProgramPayload => ({
    title: title.trim(),
    communityId: communityId || null,
    programTypeId: programTypeId || null,
    surveyId: surveyId || null,
    objectives: objectives.trim() || null,
    targetBeneficiaries: toNumberOrNull(targetBeneficiaries),
    proposedDate: proposedDate || null,
    endDate: endDate || null,
    venue: venue.trim() || null,
    budgetRequested: toNumberOrNull(budgetRequested),
    facultyLeadId: facultyLeadId || null,
    sectorIds: selectedSectorIds,
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(buildPayload(), false)
  }

  const heading = mode === 'create' ? 'New Extension Project Proposal' : 'Edit Proposal'
  const draftLabel = mode === 'create' ? 'Save Draft' : 'Save Changes'

  return (
    <AdminDialog
      open={open}
      title={heading}
      description="A draft needs only a title. Everything else is validated when the proposal is submitted for review."
      closeDisabled={busy}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="program-form"
            disabled={busy}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            {loading ? <ButtonSpinner tone="dark" /> : null}
            {loading ? 'Saving...' : draftLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSubmit(buildPayload(), true)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            {submitting ? <ButtonSpinner /> : null}
            {submitting ? 'Submitting...' : 'Save and Submit'}
          </button>
        </div>
      }
    >
      <form id="program-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMessage ? (
          <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="program-title" className={labelClassName}>
              Project title
            </label>
            <input
              id="program-title"
              value={title}
              disabled={busy}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Community Health and Nutrition Caravan"
              className={inputClassName}
            />
            {fieldError('title') ? <p className={fieldErrorClassName}>{fieldError('title')}</p> : null}
          </div>

          <div>
            <label htmlFor="program-community" className={labelClassName}>
              Partner community
            </label>
            <select
              id="program-community"
              value={communityId}
              disabled={busy}
              onChange={(event) => setCommunityId(event.target.value)}
              className={selectClassName}
            >
              <option value="">Select a community</option>
              {communities.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldError('communityId') ? (
              <p className={fieldErrorClassName}>{fieldError('communityId')}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="program-type" className={labelClassName}>
              Program type
            </label>
            <select
              id="program-type"
              value={programTypeId}
              disabled={busy}
              onChange={(event) => setProgramTypeId(event.target.value)}
              className={selectClassName}
            >
              <option value="">Select a program type</option>
              {programTypes.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldError('programTypeId') ? (
              <p className={fieldErrorClassName}>{fieldError('programTypeId')}</p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="program-objectives" className={labelClassName}>
              Objectives
            </label>
            <textarea
              id="program-objectives"
              value={objectives}
              rows={4}
              disabled={busy}
              onChange={(event) => setObjectives(event.target.value)}
              placeholder="What this project sets out to achieve in the partner community."
              className={inputClassName}
            />
            {fieldError('objectives') ? (
              <p className={fieldErrorClassName}>{fieldError('objectives')}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="program-lead" className={labelClassName}>
              Faculty lead
            </label>
            <select
              id="program-lead"
              value={facultyLeadId}
              disabled={busy}
              onChange={(event) => setFacultyLeadId(event.target.value)}
              className={selectClassName}
            >
              <option value="">Default to me</option>
              {facultyOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            {fieldError('facultyLeadId') ? (
              <p className={fieldErrorClassName}>{fieldError('facultyLeadId')}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-alt">
                Left blank, the proposal is led by whoever drafts it.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="program-beneficiaries" className={labelClassName}>
              Target beneficiaries
            </label>
            <input
              id="program-beneficiaries"
              type="number"
              min={0}
              value={targetBeneficiaries}
              disabled={busy}
              onChange={(event) => setTargetBeneficiaries(event.target.value)}
              className={inputClassName}
            />
            {fieldError('targetBeneficiaries') ? (
              <p className={fieldErrorClassName}>{fieldError('targetBeneficiaries')}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="program-proposed-date" className={labelClassName}>
              Proposed start date
            </label>
            <input
              id="program-proposed-date"
              type="date"
              value={proposedDate}
              disabled={busy}
              onChange={(event) => setProposedDate(event.target.value)}
              className={inputClassName}
            />
            {fieldError('proposedDate') ? (
              <p className={fieldErrorClassName}>{fieldError('proposedDate')}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="program-end-date" className={labelClassName}>
              End date (optional)
            </label>
            <input
              id="program-end-date"
              type="date"
              value={endDate}
              disabled={busy}
              onChange={(event) => setEndDate(event.target.value)}
              className={inputClassName}
            />
            {fieldError('endDate') ? <p className={fieldErrorClassName}>{fieldError('endDate')}</p> : null}
          </div>

          <div>
            <label htmlFor="program-venue" className={labelClassName}>
              Venue (optional)
            </label>
            <input
              id="program-venue"
              value={venue}
              disabled={busy}
              onChange={(event) => setVenue(event.target.value)}
              placeholder="e.g. Barangay Hall"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="program-budget" className={labelClassName}>
              Budget requested
            </label>
            <input
              id="program-budget"
              type="number"
              min={0}
              step="0.01"
              value={budgetRequested}
              disabled={busy}
              onChange={(event) => setBudgetRequested(event.target.value)}
              placeholder="0.00"
              className={inputClassName}
            />
            {fieldError('budgetRequested') ? (
              <p className={fieldErrorClassName}>{fieldError('budgetRequested')}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="program-survey" className={labelClassName}>
            Supporting needs assessment (optional)
          </label>
          <select
            id="program-survey"
            value={surveyId}
            disabled={busy}
            onChange={(event) => setSurveyId(event.target.value)}
            className={selectClassName}
          >
            <option value="">No assessment linked</option>
            {surveys.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-alt">
            Extension proposals are expected to cite the assessment that justifies them. Submitting
            without one raises a notice but is not blocked.
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Sectors served</p>
          {activeSectors.length === 0 ? (
            <p className="text-sm text-muted">No sectors available.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeSectors.map((sector) => {
                const selected = selectedSectorIds.includes(sector.id)
                return (
                  <button
                    key={sector.id}
                    type="button"
                    aria-pressed={selected}
                    disabled={busy}
                    onClick={() => toggleSector(sector.id)}
                    className={[
                      'inline-flex border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 rounded-md',
                      selected
                        ? 'border-success-border bg-success-bg text-primary-accent'
                        : 'cursor-pointer border-line bg-surface-tint text-muted hover:bg-row-divider',
                    ].join(' ')}
                  >
                    {sector.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </form>
    </AdminDialog>
  )
}
