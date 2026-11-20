import { useState } from 'react'
import type { AcademicPeriod } from '@/features/dashboard'
import { generateBeneficiaryExport } from '../api/reportsApi'
import { deliverGeneratedReport, getReportErrorMessage } from '../lib/deliver'
import { scopePayload, scopeValidationMessage } from '../lib/scope'
import type { CommunityOption, GeneratedReport, ReportableProgram, ReportScopeValue } from '../types'
import GeneratorCard from './GeneratorCard'
import ReportScopeFields from './ReportScopeFields'

type BeneficiaryExportCardProps = {
  periods: AcademicPeriod[]
  communities: CommunityOption[]
  programs: ReportableProgram[]
  defaultPeriodId: string
  lookupsLoading: boolean
  onGenerated: (report: GeneratedReport) => void
}

/** Spec Module 7 §2: every attendance row in scope, the raw material for GAD reporting. */
export default function BeneficiaryExportCard({
  periods,
  communities,
  programs,
  defaultPeriodId,
  lookupsLoading,
  onGenerated,
}: BeneficiaryExportCardProps) {
  const [scope, setScope] = useState<ReportScopeValue>({
    scope: 'all',
    periodId: defaultPeriodId,
    communityId: '',
    programId: '',
  })
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
      const report = await generateBeneficiaryExport(scopePayload(scope))
      onGenerated(report)
      await deliverGeneratedReport(report, 'Beneficiary export')
    } catch (error) {
      setErrorMessage(getReportErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <GeneratorCard
      id="beneficiary-export"
      title="Beneficiary data"
      description="Excel workbook of every attendee in scope with sex, age, sector, community and program, plus a Female / Male summary."
      submitLabel="Export to Excel"
      loadingLabel="Exporting..."
      loading={loading}
      disabled={lookupsLoading}
      errorMessage={errorMessage}
      onSubmit={() => void handleSubmit()}
    >
      <ReportScopeFields
        idPrefix="beneficiary"
        value={scope}
        onChange={(value) => {
          setScope(value)
          setErrorMessage(null)
        }}
        periods={periods}
        communities={communities}
        programs={programs}
        disabled={loading || lookupsLoading}
      />

      <p className="rounded-md border border-info-border bg-info-bg px-4 py-3 text-xs leading-5 text-info-text">
        This file holds attendees' names, which are personal data under the Data Privacy Act (RA 10173).
        Every export and download is recorded in the activity log.
      </p>
    </GeneratorCard>
  )
}
