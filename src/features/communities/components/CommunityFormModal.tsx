import { useMemo, useState, type FormEvent } from 'react'
import type { ApiValidationErrors } from '@/shared/api/http'
import AdminDialog from '@/features/users/components/AdminDialog'
import {
  CLASSIFICATION_OPTIONS,
  type Classification,
  type Community,
  type CommunityPayload,
  type Sector,
} from '../types'

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
  'w-full border border-[#cad5c7] bg-white px-4 py-3 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]'

const selectClassName = `${inputClassName} cursor-pointer`
const labelClassName = 'mb-2 block text-sm font-medium text-[#123524]'
const fieldErrorClassName = 'mt-1 text-xs text-[#8a2d2d]'

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

function toStringValue(value: number | null): string {
  return value === null || value === undefined ? '' : String(value)
}

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
  const [barangayCode, setBarangayCode] = useState(community?.barangayCode ?? '')
  const [municipality, setMunicipality] = useState(community?.municipality ?? '')
  const [province, setProvince] = useState(community?.province ?? 'Cavite')
  const [classification, setClassification] = useState<Classification>(
    community?.classification ?? 'rural',
  )
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
  const [notes, setNotes] = useState(community?.notes ?? '')
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>(
    community?.sectors.map((sector) => sector.id) ?? [],
  )

  const fieldError = (field: string): string | undefined => apiErrors?.[field]?.[0]

  const toggleSector = (id: string) => {
    setSelectedSectorIds((current) =>
      current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id],
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      name: name.trim(),
      barangayCode: barangayCode.trim() || null,
      municipality: municipality.trim(),
      province: province.trim(),
      classification,
      estimatedPopulation: toNumberOrNull(estimatedPopulation),
      householdCount: toNumberOrNull(householdCount),
      populationMale: toNumberOrNull(populationMale),
      populationFemale: toNumberOrNull(populationFemale),
      contactPersonName: contactPersonName.trim() || null,
      contactPersonDesignation: contactPersonDesignation.trim() || null,
      contactPersonPhone: contactPersonPhone.trim() || null,
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
            form="community-form"
            disabled={loading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <ButtonSpinner /> : null}
            {loading ? 'Saving...' : submitLabel}
          </button>
        </div>
      }
    >
      <form id="community-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMessage ? (
          <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">
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
            <label htmlFor="community-barangay" className={labelClassName}>
              Barangay code
            </label>
            <input
              id="community-barangay"
              value={barangayCode}
              disabled={loading}
              onChange={(event) => setBarangayCode(event.target.value)}
              placeholder="Optional"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="community-classification" className={labelClassName}>
              Classification *
            </label>
            <select
              id="community-classification"
              value={classification}
              disabled={loading}
              onChange={(event) => setClassification(event.target.value as Classification)}
              className={selectClassName}
            >
              {CLASSIFICATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldError('classification') ? (
              <p className={fieldErrorClassName}>{fieldError('classification')}</p>
            ) : null}
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
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">
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
          <p className="mt-2 text-xs text-[#6a7f6d]">
            Leave population fields blank when unknown. If both male and female are provided, a
            non-blocking notice appears when their sum differs from the estimate by more than 10%.
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-[#123524]">Sectors served</p>
          {activeSectors.length === 0 ? (
            <p className="text-sm text-[#617462]">No sectors available.</p>
          ) : (
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
                      'inline-flex border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                      selected
                        ? 'border-[#bfd3c0] bg-[#f3f9f2] text-[#1f5d3b]'
                        : 'cursor-pointer border-[#d8e1d4] bg-[#f7faf6] text-[#617462] hover:bg-[#edf4ea]',
                    ].join(' ')}
                  >
                    {sector.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
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
              onChange={(event) => setContactPersonPhone(event.target.value)}
              className={inputClassName}
            />
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
