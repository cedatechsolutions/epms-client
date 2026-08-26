import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { downloadBlob } from '@/shared/download'
import { SplitMeter } from '@/shared/meter'
import { notify } from '@/shared/toast'
import {
  exportMonitoringDashboard,
  getMonitoringDashboard,
  listAcademicPeriods,
} from '../api/dashboardApi'
import {
  dashboardExportFilename,
  formatDateTime,
  formatNumber,
  formatShare,
  getMonitoringErrorMessage,
} from '../lib/format'
import {
  ALL_PERIODS,
  type AcademicPeriod,
  type DashboardExportFormat,
  type MonitoringDashboard,
} from '../types'
import CompletionTable from './CompletionTable'
import DashboardSection from './DashboardSection'
import DistributionRow from './DistributionRow'
import StatCard from './StatCard'

const secondaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md'

const selectClassName =
  'h-10 cursor-pointer border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary-accent" />
}

function EmptyPanelMessage({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted">{children}</p>
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading monitoring figures...</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <section key={index} className="rounded-lg border border-line bg-surface p-5">
            <div className="h-4 w-28 animate-pulse bg-skeleton" />
            <div className="mt-4 h-8 w-20 animate-pulse bg-skeleton" />
            <div className="mt-4 h-3 w-32 animate-pulse bg-skeleton" />
          </section>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {Array.from({ length: 2 }, (_, index) => (
          <section key={index} className="rounded-lg border border-line bg-surface p-5">
            <div className="h-5 w-44 animate-pulse bg-skeleton" />
            <div className="mt-5 h-2 w-full animate-pulse bg-skeleton" />
            <div className="mt-4 h-4 w-56 animate-pulse bg-skeleton" />
          </section>
        ))}
      </div>
    </div>
  )
}

/** Drill-down target for a KPI or a chart slice: the programs list under the same period rule. */
function programsLink(periodId: string, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams(periodId ? { periodId, ...extra } : extra)
  const query = params.toString()
  return query ? `/admin/programs?${query}` : '/admin/programs'
}

/**
 * The campus-wide M&E dashboard (spec Module 6), rendered above the personal overview for the roles
 * allowed to read it. It owns its own fetch: the two are separate endpoints behind separate
 * permissions, and one failing must not blank the other.
 *
 * Every figure is scoped by the selected academic period, and the same `periodId` rides along on
 * every drill-down. The server applies one period rule to the dashboard and to the programs list,
 * which is what makes the count on a card equal the row count on the screen it opens.
 */
export default function MonitoringPanel({ refreshSignal }: { refreshSignal: number }) {
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  // null until the calendar has resolved which period is current; '' means every period at once.
  const [periodId, setPeriodId] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [exporting, setExporting] = useState<DashboardExportFormat | null>(null)

  useEffect(() => {
    listAcademicPeriods()
      .then((response) => {
        setPeriods(response)
        setPeriodId(response.find((period) => period.current)?.id ?? ALL_PERIODS)
      })
      .catch(() => {
        // The calendar is a convenience, not a gate: without it the dashboard still reports every
        // period at once, and the selector simply has one option.
        setPeriods([])
        setPeriodId(ALL_PERIODS)
      })
  }, [])

  const load = useCallback(async () => {
    if (periodId === null) return
    setLoading(true)
    setErrorMessage(null)
    try {
      setDashboard(await getMonitoringDashboard(periodId))
    } catch (error) {
      setErrorMessage(getMonitoringErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [periodId])

  useEffect(() => {
    void load()
  }, [load, refreshSignal])

  const handleExport = async (format: DashboardExportFormat) => {
    setExporting(format)
    try {
      const blob = await exportMonitoringDashboard(periodId ?? ALL_PERIODS, format)
      downloadBlob(blob, dashboardExportFilename(dashboard?.period?.label ?? null, format))
      notify.success(`${format.toUpperCase()} snapshot downloaded.`)
    } catch (error) {
      notify.error(getMonitoringErrorMessage(error))
    } finally {
      setExporting(null)
    }
  }

  const selectedPeriodId = periodId ?? ALL_PERIODS
  const periodLabel = dashboard?.period?.label ?? 'All periods'

  const header = (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">
          Monitoring and evaluation
        </p>
        <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">
          Campus-wide extension performance
        </h4>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-body">
          Every figure below is scoped to one academic period — a program belongs to the period its
          proposed date falls in, and its beneficiaries are counted with it. Open a count to see the
          list behind it.
        </p>
      </div>

      <div className="flex flex-col items-start gap-3 xl:items-end">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">
              Academic period
            </span>
            <select
              value={selectedPeriodId}
              disabled={periodId === null || loading}
              onChange={(event) => setPeriodId(event.target.value)}
              className={selectClassName}
            >
              <option value={ALL_PERIODS}>All periods</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.current ? `${period.label} (current)` : period.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => void handleExport('xlsx')}
            disabled={!dashboard || exporting !== null}
            className={secondaryButtonClassName}
          >
            {exporting === 'xlsx' ? <ButtonSpinner /> : <TableChartOutlinedIcon fontSize="small" />}
            {exporting === 'xlsx' ? 'Exporting...' : 'Export XLSX'}
          </button>
          <button
            type="button"
            onClick={() => void handleExport('pdf')}
            disabled={!dashboard || exporting !== null}
            className={secondaryButtonClassName}
          >
            {exporting === 'pdf' ? <ButtonSpinner /> : <PictureAsPdfOutlinedIcon fontSize="small" />}
            {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
        {dashboard ? (
          <p className="text-xs text-muted-alt">
            {periodLabel} · snapshot taken {formatDateTime(dashboard.generatedAt)}
          </p>
        ) : null}
      </div>
    </div>
  )

  if (loading && !dashboard) {
    return (
      <section className="space-y-4">
        {header}
        <LoadingSkeleton />
      </section>
    )
  }

  if (!dashboard) {
    return (
      <section className="space-y-4">
        {header}
        <div className="flex flex-col gap-3 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text sm:flex-row sm:items-center sm:justify-between">
          <span>{errorMessage ?? 'Could not load the monitoring dashboard.'}</span>
          <button type="button" onClick={() => void load()} className={secondaryButtonClassName}>
            Retry
          </button>
        </div>
      </section>
    )
  }

  const { kpis, programsByType, beneficiariesBySector, completion, completionTotal } = dashboard
  const sectorTotal = beneficiariesBySector.reduce((sum, sector) => sum + sector.total, 0)

  return (
    <section className="space-y-4">
      {header}

      {errorMessage ? (
        <div className="rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
          {errorMessage} Showing the figures from the last successful load.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Communities served"
          value={formatNumber(kpis.communitiesServed)}
          hint="Partner communities with at least one program in this period"
          icon={<Groups2OutlinedIcon fontSize="small" />}
        />
        <StatCard
          label="Programs"
          value={formatNumber(kpis.programsTotal)}
          hint={
            kpis.programsTotal > 0
              ? `${formatNumber(kpis.programsCompleted)} completed (${formatShare(kpis.programsCompleted, kpis.programsTotal)})`
              : 'None proposed in this period'
          }
          icon={<AssignmentOutlinedIcon fontSize="small" />}
          to={programsLink(selectedPeriodId)}
        />
        <StatCard
          label="Beneficiaries reached"
          value={formatNumber(kpis.beneficiariesTotal)}
          hint={
            <>
              {formatNumber(kpis.beneficiariesFemale)} female ·{' '}
              {formatNumber(kpis.beneficiariesMale)} male
              <span className="mt-1 block" title={kpis.beneficiaryMethod}>
                Counts attendance records, not unique people
              </span>
            </>
          }
          icon={<VolunteerActivismOutlinedIcon fontSize="small" />}
        />
        <StatCard
          label="Faculty involved"
          value={formatNumber(kpis.facultyInvolved)}
          hint="Faculty named as project leads in this period"
          icon={<SchoolOutlinedIcon fontSize="small" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <DashboardSection
          title="Programs by type"
          description="Proposals in this period, largest group first. Open a type to see its proposals."
        >
          {programsByType.length > 0 ? (
            <div className="space-y-4">
              {programsByType.map((type) => (
                <DistributionRow
                  key={type.programTypeId}
                  label={type.programTypeName}
                  value={type.programs}
                  total={kpis.programsTotal}
                  to={programsLink(selectedPeriodId, { programTypeId: type.programTypeId })}
                />
              ))}
            </div>
          ) : (
            <EmptyPanelMessage>No programs were proposed in this period.</EmptyPanelMessage>
          )}
        </DashboardSection>

        <DashboardSection
          title="Beneficiaries by sex"
          description="Attendance recorded across every activity in this period"
        >
          {kpis.beneficiariesTotal > 0 ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-label">
                  Total beneficiaries reached
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-[-0.03em] tabular-nums text-ink">
                  {formatNumber(kpis.beneficiariesTotal)}
                </p>
              </div>
              <SplitMeter
                label="Beneficiaries by sex"
                formatValue={formatNumber}
                parts={[
                  { label: 'Female', value: kpis.beneficiariesFemale, tone: 'primary' },
                  { label: 'Male', value: kpis.beneficiariesMale, tone: 'muted' },
                ]}
              />
              <p className="text-xs leading-5 text-muted-alt">{kpis.beneficiaryMethod}</p>
            </div>
          ) : (
            <EmptyPanelMessage>No attendance has been recorded in this period yet.</EmptyPanelMessage>
          )}
        </DashboardSection>
      </div>

      <DashboardSection
        title="Beneficiaries by sector"
        description="Who was reached, by the sectors their community is profiled under"
      >
        {beneficiariesBySector.length > 0 ? (
          <div className="space-y-4">
            {beneficiariesBySector.map((sector) => (
              <DistributionRow
                key={sector.sectorId ?? 'unspecified'}
                label={sector.sectorName}
                value={sector.total}
                total={sectorTotal}
                tone={sector.sectorId === null ? 'muted' : 'primary'}
                meta={`${formatNumber(sector.female)} female · ${formatNumber(sector.male)} male`}
              />
            ))}
            <p className="text-xs leading-5 text-muted-alt">
              The "Not specified" row collects attendees recorded without a sector. They are counted
              in the totals above and are never dropped.
            </p>
          </div>
        ) : (
          <EmptyPanelMessage>No attendance has been recorded in this period yet.</EmptyPanelMessage>
        )}
      </DashboardSection>

      <section className="overflow-hidden rounded-lg border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">Program completion</h3>
            <p className="mt-1 text-sm text-muted">
              Target against beneficiaries actually reached, with the evaluations encoded so far.
            </p>
          </div>
          <p className="text-sm text-muted">
            {completionTotal === 0
              ? 'No programs in this period'
              : `${formatNumber(completionTotal)} program(s) in this period`}
          </p>
        </div>

        <CompletionTable rows={completion} loading={loading} />

        {completionTotal > completion.length ? (
          <p className="border-t border-divider px-5 py-3 text-xs text-muted-alt">
            Showing the first {formatNumber(completion.length)} of {formatNumber(completionTotal)}{' '}
            programs. Pick a single academic period, or open the{' '}
            <Link
              to={programsLink(selectedPeriodId)}
              className="rounded-md font-medium text-primary-accent hover:underline"
            >
              proposals list
            </Link>{' '}
            to page through them all.
          </p>
        ) : null}
      </section>
    </section>
  )
}
