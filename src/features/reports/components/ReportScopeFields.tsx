import type { AcademicPeriod } from '@/features/dashboard'
import { fieldLabelClassName, helpTextClassName, selectClassName } from '../lib/ui'
import type { CommunityOption, ReportableProgram, ReportScope, ReportScopeValue } from '../types'
import { PROGRAM_STATUS_SHORT_LABELS } from '../lib/labels'

type ReportScopeFieldsProps = {
  idPrefix: string
  value: ReportScopeValue
  onChange: (value: ReportScopeValue) => void
  periods: AcademicPeriod[]
  communities: CommunityOption[]
  programs: ReportableProgram[]
  disabled: boolean
}

/**
 * The scope shared by the accomplishment report and the beneficiary export (spec Module 7 §1–2):
 * an academic period, then all communities / one community / one program.
 *
 * A single program ignores the period — the program is its own span — so the period select is
 * replaced by a line saying so rather than left on screen doing nothing.
 */
export default function ReportScopeFields({
  idPrefix,
  value,
  onChange,
  periods,
  communities,
  programs,
  disabled,
}: ReportScopeFieldsProps) {
  const update = (patch: Partial<ReportScopeValue>) => onChange({ ...value, ...patch })

  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-scope`} className={fieldLabelClassName}>
          Scope
        </label>
        <select
          id={`${idPrefix}-scope`}
          value={value.scope}
          disabled={disabled}
          onChange={(event) => update({ scope: event.target.value as ReportScope })}
          className={selectClassName}
        >
          <option value="all">All communities</option>
          <option value="community">One community</option>
          <option value="program">One program</option>
        </select>
      </div>

      {value.scope === 'community' ? (
        <div>
          <label htmlFor={`${idPrefix}-community`} className={fieldLabelClassName}>
            Community
          </label>
          <select
            id={`${idPrefix}-community`}
            value={value.communityId}
            disabled={disabled}
            onChange={(event) => update({ communityId: event.target.value })}
            className={selectClassName}
          >
            <option value="">Choose a community</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {value.scope === 'program' ? (
        <div>
          <label htmlFor={`${idPrefix}-program`} className={fieldLabelClassName}>
            Program
          </label>
          <select
            id={`${idPrefix}-program`}
            value={value.programId}
            disabled={disabled}
            onChange={(event) => update({ programId: event.target.value })}
            className={selectClassName}
          >
            <option value="">{programs.length === 0 ? 'No approved programs yet' : 'Choose a program'}</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.title} ({PROGRAM_STATUS_SHORT_LABELS[program.status]})
              </option>
            ))}
          </select>
          <p className={helpTextClassName}>The whole program is covered, whatever academic period it falls in.</p>
        </div>
      ) : (
        <div>
          <label htmlFor={`${idPrefix}-period`} className={fieldLabelClassName}>
            Academic period
          </label>
          <select
            id={`${idPrefix}-period`}
            value={value.periodId}
            disabled={disabled}
            onChange={(event) => update({ periodId: event.target.value })}
            className={selectClassName}
          >
            <option value="">All periods</option>
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.label}
                {period.current ? ' (current)' : ''}
              </option>
            ))}
          </select>
          <p className={helpTextClassName}>
            A program belongs to the period its proposed date falls in, as on the dashboard.
          </p>
        </div>
      )}
    </>
  )
}
