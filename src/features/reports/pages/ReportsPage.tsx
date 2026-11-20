import { useCallback, useMemo, useState } from 'react'
import { hasAnyRole } from '@/features/auth/lib/access'
import { useAuthStore } from '@/features/auth/store/authStore'
import AccomplishmentReportCard from '../components/AccomplishmentReportCard'
import BeneficiaryExportCard from '../components/BeneficiaryExportCard'
import CertificateCard from '../components/CertificateCard'
import ReportArchiveSection from '../components/ReportArchiveSection'
import { useReportLookups } from '../lib/useReportLookups'
import { errorAlertClassName, secondaryButtonClassName } from '../lib/ui'
import { REPORT_ARCHIVE_ALL_ROLES } from '../types'

/**
 * Module 7 — Reporting & documentation. Three generators over one archive: everything generated
 * here is archived first and downloaded from the archive, so the table below is the complete record
 * of what the campus has issued.
 */
export default function ReportsPage() {
  const user = useAuthStore((state) => state.user)
  const seesWholeArchive = hasAnyRole(user, REPORT_ARCHIVE_ALL_ROLES)
  const { periods, communities, programs, loading, errorMessage, reload } = useReportLookups()
  const [archiveRefresh, setArchiveRefresh] = useState(0)

  const defaultPeriodId = useMemo(() => periods.find((period) => period.current)?.id ?? '', [periods])
  const handleGenerated = useCallback(() => setArchiveRefresh((value) => value + 1), [])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">
          Reporting and documentation
        </p>
        <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">Reports</h4>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-body">
          {seesWholeArchive
            ? 'Generate accomplishment reports, beneficiary data and certificates. Every file is kept in the archive below.'
            : 'Generate reports and certificates for the programs you lead or are assigned to. Every file is kept in the archive below.'}
        </p>
      </div>

      {errorMessage ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="alert" className={`${errorAlertClassName} flex-1`}>
            Could not load the report options: {errorMessage}
          </div>
          <button type="button" onClick={reload} className={secondaryButtonClassName}>
            Retry
          </button>
        </div>
      ) : null}

      {/* Remounted once the calendar arrives so each generator opens on the current period. */}
      <div key={defaultPeriodId} className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <AccomplishmentReportCard
          periods={periods}
          communities={communities}
          programs={programs}
          defaultPeriodId={defaultPeriodId}
          lookupsLoading={loading}
          onGenerated={handleGenerated}
        />
        <BeneficiaryExportCard
          periods={periods}
          communities={communities}
          programs={programs}
          defaultPeriodId={defaultPeriodId}
          lookupsLoading={loading}
          onGenerated={handleGenerated}
        />
        <CertificateCard programs={programs} lookupsLoading={loading} onGenerated={handleGenerated} />
      </div>

      <ReportArchiveSection periods={periods} ownOnly={!seesWholeArchive} refreshSignal={archiveRefresh} />
    </div>
  )
}
