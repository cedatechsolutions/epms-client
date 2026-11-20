import { useMemo, useState, type FormEvent } from 'react'
import type { ApiValidationErrors } from '@/shared/api/http'
import AdminDialog from '@/features/users/components/AdminDialog'
import type { Community, CommunityPayload, Sector } from '../types'

export type CommunityFormMode = 'create' | 'edit'

type CommunityFormModalProps = {
  open: boolean
  mode: CommunityFormMode
  community: Community | null
  sectors: Sector[]
  loading: boolean
  errorMessage: string | null
  apiErrors?: ApiValidationErrors
  onClose: () => void
  onSubmit: (payload: CommunityPayload) => void
}

const inputClassName =
  'w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

const labelClassName = 'mb-2 block text-sm font-medium text-ink'
const fieldErrorClassName = 'mt-1 text-xs text-danger-text'

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

function toStringValue(value: number | null): string {
  return value === null || value === undefined ? '' : String(value)
}

const PHONE_LENGTH = 11
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export default function CommunityFormModal({
  open,
  mode,
  community,
  sectors,
  loading,
  errorMessage,
  apiErrors,
  onClose,
  onSubmit,
}: CommunityFormModalProps) {
  const [name, setName] = useState(community?.name ?? '')
  const [municipality, setMunicipality] = useState(community?.municipality ?? '')
  const [province, setProvince] = useState(community?.province ?? 'Cavite')
  const [estimatedPopulation, setEstimatedPopulation] = useState(
    toStringValue(community?.estimatedPopulation ?? null),
  )
  const [householdCount, setHouseholdCount] = useState(toStringValue(community?.householdCount ?? null))
  const [populationMale, setPopulationMale] = useState(toStringValue(community?.populationMale ?? null))
  const [populationFemale, setPopulationFemale] = useState(
    toStringValue(community?.populationFemale ?? null),
  )
  const [contactPersonName, setContactPersonName] = useState(community?.contactPersonName ?? '')
  const [contactPersonDesignation, setContactPersonDesignation] = useState(
    community?.contactPersonDesignation ?? '',
  )
  const [contactPersonPhone, setContactPersonPhone] = useState(community?.contactPersonPhone ?? '')
  const [contactPersonEmail, setContactPersonEmail] = useState(community?.contactPersonEmail ?? '')
  const [othersSelected, setOthersSelected] = useState(Boolean(community?.otherSector))
  const [otherSector, setOtherSector] = useState(community?.otherSector ?? '')
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState(community?.notes ?? '')
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>(
    community?.sectors.map((sector) => sector.id) ?? [],
  )

  const fieldError = (field: string): string | undefined => clientErrors[field] ?? apiErrors?.[field]?.[0]

  const toggleSector = (id: string) => {
    setSelectedSectorIds((current) =>
      current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id],
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const phone = contactPersonPhone.trim()
    const email = contactPersonEmail.trim()
    const other = otherSector.trim()
    const errors: Record<string, string> = {}
    if (phone !== '' && phone.length !== PHONE_LENGTH) {
      errors.contactPersonPhone = `Contact number must be exactly ${PHONE_LENGTH} digits.`
    }
    if (email !== '' && !EMAIL_PATTERN.test(email)) {
      errors.contactPersonEmail = 'Enter a valid email address.'
    }
    if (othersSelected && other === '') {
      errors.otherSector = 'Specify the other sector.'
    }
    setClientErrors(errors)
    if (Object.keys(errors).length > 0) return

    onSubmit({
      name: name.trim(),
      // Barangay code and classification are no longer on the form; keep any existing values on edit.
      barangayCode: community?.barangayCode ?? null,
      municipality: municipality.trim(),
      province: province.trim(),
      classification: community?.classification ?? null,
      estimatedPopulation: toNumberOrNull(estimatedPopulation),
      householdCount: toNumberOrNull(householdCount),
      populationMale: toNumberOrNull(populationMale),
      populationFemale: toNumberOrNull(populationFemale),
      contactPersonName: contactPersonName.trim() || null,
      contactPersonDesignation: contactPersonDesignation.trim() || null,
      contactPersonPhone: phone || null,
      contactPersonEmail: email || null,
      otherSector: othersSelected ? other : null,
      notes: notes.trim() || null,
      sectorIds: selectedSectorIds,
    })
  }

  const title = mode === 'create' ? 'Create New Community' : 'Edit Community'
  const submitLabel = mode === 'create' ? 'Create Community' : 'Save Changes'

  const activeSectors = useMemo(() => sectors.filter((sector) => sector.active), [sectors])

  return (
    <AdminDialog
      open={open}
      title={title}
      description="Capture partner-community profile and GAD-ready population data. Fields marked * are required."
      closeDisabled={loading}
      onClose={onClose}
      maxWidthClassName = "max-w-screen "
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="community-form"
            disabled={loading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Saving...' : submitLabel}
          </button>
        </div>
      }
    >
      <form id="community-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMessage ? (
          <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="community-name" className={labelClassName}>
              Community name *
            </label>
            <input
              id="community-name"
              value={name}
              disabled={loading}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Barangay Mabolo"
              className={inputClassName}
            />
            {fieldError('name') ? <p className={fieldErrorClassName}>{fieldError('name')}</p> : null}
          </div>

          <div>
            <label htmlFor="community-municipality" className={labelClassName}>
              Municipality *
            </label>
            <input
              id="community-municipality"
              value={municipality}
              disabled={loading}
              onChange={(event) => setMunicipality(event.target.value)}
              placeholder="e.g. Bacoor"
              className={inputClassName}
            />
            {fieldError('municipality') ? (
              <p className={fieldErrorClassName}>{fieldError('municipality')}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="community-province" className={labelClassName}>
              Province *
            </label>
            <input
              id="community-province"
              value={province}
              disabled={loading}
              onChange={(event) => setProvince(event.target.value)}
              placeholder="e.g. Cavite"
              className={inputClassName}
            />
            {fieldError('province') ? <p className={fieldErrorClassName}>{fieldError('province')}</p> : null}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-label">
            Socio-economic profile
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="community-population" className={labelClassName}>
                Estimated population
              </label>
              <input
                id="community-population"
                type="number"
                min={0}
                value={estimatedPopulation}
                disabled={loading}
                onChange={(event) => setEstimatedPopulation(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="community-households" className={labelClassName}>
                Household count
              </label>
              <input
                id="community-households"
                type="number"
                min={0}
                value={householdCount}
                disabled={loading}
                onChange={(event) => setHouseholdCount(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="community-male" className={labelClassName}>
                Male population
              </label>
              <input
                id="community-male"
                type="number"
                min={0}
                value={populationMale}
                disabled={loading}
                onChange={(event) => setPopulationMale(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="community-female" className={labelClassName}>
                Female population
              </label>
              <input
                id="community-female"
                type="number"
                min={0}
                value={populationFemale}
                disabled={loading}
                onChange={(event) => setPopulationFemale(event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-alt">
            Leave population fields blank when unknown. If both male and female are provided, a
            non-blocking notice appears when their sum differs from the estimate by more than 10%.
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Sectors served</p>
          <div className="flex flex-wrap gap-2">
            {activeSectors.map((sector) => {
                const selected = selectedSectorIds.includes(sector.id)
                return (
                  <button
                    key={sector.id}
                    type="button"
                    aria-pressed={selected}
                    disabled={loading}
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
              <button
                type="button"
                aria-pressed={othersSelected}
                disabled={loading}
                onClick={() => setOthersSelected((current) => !current)}
                className={[
                  'inline-flex border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 rounded-md',
                  othersSelected
                    ? 'border-success-border bg-success-bg text-primary-accent'
                    : 'cursor-pointer border-line bg-surface-tint text-muted hover:bg-row-divider',
                ].join(' ')}
              >
                Others
              </button>
          </div>
          {othersSelected ? (
            <div className="mt-3 sm:max-w-md">
              <label htmlFor="community-other-sector" className={labelClassName}>
                Other sector *
              </label>
              <input
                id="community-other-sector"
                value={otherSector}
                disabled={loading}
                maxLength={255}
                onChange={(event) => setOtherSector(event.target.value)}
                placeholder="e.g. Indigenous Peoples"
                className={inputClassName}
              />
              {fieldError('otherSector') ? (
                <p className={fieldErrorClassName}>{fieldError('otherSector')}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="community-contact-name" className={labelClassName}>
              Contact person
            </label>
            <input
              id="community-contact-name"
              value={contactPersonName}
              disabled={loading}
              onChange={(event) => setContactPersonName(event.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="community-contact-designation" className={labelClassName}>
              Designation
            </label>
            <input
              id="community-contact-designation"
              value={contactPersonDesignation}
              disabled={loading}
              onChange={(event) => setContactPersonDesignation(event.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="community-contact-phone" className={labelClassName}>
              Contact number
            </label>
            <input
              id="community-contact-phone"
              value={contactPersonPhone}
              disabled={loading}
              type="tel"
              inputMode="numeric"
              maxLength={PHONE_LENGTH}
              onChange={(event) =>
                setContactPersonPhone(event.target.value.replace(/\D/g, '').slice(0, PHONE_LENGTH))
              }
              placeholder="e.g. 09171234567"
              className={inputClassName}
            />
            {fieldError('contactPersonPhone') ? (
              <p className={fieldErrorClassName}>{fieldError('contactPersonPhone')}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="community-contact-email" className={labelClassName}>
              Email
            </label>
            <input
              id="community-contact-email"
              type="email"
              value={contactPersonEmail}
              disabled={loading}
              onChange={(event) => setContactPersonEmail(event.target.value)}
              placeholder="e.g. contact@example.com"
              className={inputClassName}
            />
            {fieldError('contactPersonEmail') ? (
              <p className={fieldErrorClassName}>{fieldError('contactPersonEmail')}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label htmlFor="community-notes" className={labelClassName}>
            Notes
          </label>
          <textarea
            id="community-notes"
            value={notes}
            disabled={loading}
            rows={3}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional context about this partner community."
            className={inputClassName}
          />
        </div>
      </form>
    </AdminDialog>
  )
}
