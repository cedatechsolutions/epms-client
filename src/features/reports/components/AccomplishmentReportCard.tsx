import { useState } from 'react'
import type { AcademicPeriod } from '@/features/dashboard'
import { generateAccomplishmentReport } from '../api/reportsApi'
import { deliverGeneratedReport, getReportErrorMessage } from '../lib/deliver'
import { scopePayload, scopeValidationMessage } from '../lib/scope'
import { fieldLabelClassName, helpTextClassName, selectClassName } from '../lib/ui'
import type {
  AccomplishmentFormat,
  CommunityOption,
  GeneratedReport,
  ReportableProgram,
  ReportScopeValue,
} from '../types'
import GeneratorCard from './GeneratorCard'
import ReportScopeFields from './ReportScopeFields'

type AccomplishmentReportCardProps = {
  periods: AcademicPeriod[]
  communities: CommunityOption[]
  programs: ReportableProgram[]
  defaultPeriodId: string
  lookupsLoading: boolean
  onGenerated: (report: GeneratedReport) => void
}

/**
 * Spec Module 7 §1. PDF for submission, Word for the project leader to complete the bracketed
 * narrative placeholders — the system never writes narrative it does not hold.
 */
export default function AccomplishmentReportCard({
  periods,
  communities,
  programs,
  defaultPeriodId,
  lookupsLoading,
  onGenerated,
}: AccomplishmentReportCardProps) {
  const [scope, setScope] = useState<ReportScopeValue>({
    scope: 'all',
    periodId: defaultPeriodId,
    communityId: '',
    programId: '',
  })
  const [format, setFormat] = useState<AccomplishmentFormat>('pdf')
  const [includePhotos, setIncludePhotos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async () => {
    const invalid = scopeValidationMessage(scope)
    if (invalid) {
      setErrorMessage(invalid)
      return
    }
    setLoading(true)
    setErrorMessage(null)
    try {
      const report = await generateAccomplishmentReport({ ...scopePayload(scope), format, includePhotos })
      onGenerated(report)
      await deliverGeneratedReport(report, 'Accomplishment report')
    } catch (error) {
      setErrorMessage(getReportErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || lookupsLoading

  return (
    <GeneratorCard
      id="accomplishment-report"
      title="Accomplishment report"
      description="Cover with signatories, program tables and per-program narratives. Every count is split Female / Male."
      submitLabel="Generate report"
      loadingLabel="Generating..."
      loading={loading}
      disabled={lookupsLoading}
      errorMessage={errorMessage}
      onSubmit={() => void handleSubmit()}
    >
      <ReportScopeFields
        idPrefix="accomplishment"
        value={scope}
        onChange={(value) => {
          setScope(value)
          setErrorMessage(null)
        }}
        periods={periods}
        communities={communities}
        programs={programs}
        disabled={disabled}
      />

      <div>
        <label htmlFor="accomplishment-format" className={fieldLabelClassName}>
          Format
        </label>
        <select
          id="accomplishment-format"
          value={format}
          disabled={disabled}
          onChange={(event) => setFormat(event.target.value as AccomplishmentFormat)}
          className={selectClassName}
        >
          <option value="pdf">PDF</option>
          <option value="docx">Word (.docx), editable</option>
        </select>
        <p className={helpTextClassName}>
          Narrative the system does not hold is left as a marked placeholder for the project leader to complete.
        </p>
      </div>

      <label htmlFor="accomplishment-photos" className="flex cursor-pointer items-start gap-3">
        <input
          id="accomplishment-photos"
          type="checkbox"
          checked={includePhotos}
          disabled={disabled}
          onChange={(event) => setIncludePhotos(event.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-primary-accent"
        />
        <span>
          <span className="block text-sm font-medium text-ink">Include program photos</span>
          <span className="block text-xs leading-5 text-muted-alt">
            Up to 4 per program, from attachments of type Photo.
          </span>
        </span>
      </label>
    </GeneratorCard>
  )
}
