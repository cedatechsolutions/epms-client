import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined'
import PollOutlinedIcon from '@mui/icons-material/PollOutlined'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ACTIVITY_ACTION_LABELS } from '@/features/activity-logs/types'
import { hasAnyRole } from '@/features/auth/lib/access'
import { useAuthStore } from '@/features/auth/store/authStore'
import PriorityBadge from '@/features/surveys/components/PriorityBadge'
import { SplitMeter } from '@/shared/meter'
import { getDashboardOverview } from '../api/dashboardApi'
import DashboardSection from '../components/DashboardSection'
import DistributionRow from '../components/DistributionRow'
import MonitoringPanel from '../components/MonitoringPanel'
import StatCard from '../components/StatCard'
import {
  formatDateTime,
  formatNumber,
  formatRelativeTime,
  formatScore,
  getDashboardErrorMessage,
} from '../lib/format'
import {
  MONITORING_DASHBOARD_ROLES,
  PROGRAM_STATUS_ROWS,
  type DashboardOverview,
} from '../types'

const secondaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md'

function EmptyPanelMessage({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted">{children}</p>
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading dashboard figures...</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <section key={index} className="rounded-lg border border-line bg-surface p-5">
            <div className="h-4 w-28 animate-pulse bg-skeleton" />
            <div className="mt-4 h-8 w-20 animate-pulse bg-skeleton" />
            <div className="mt-4 h-3 w-32 animate-pulse bg-skeleton" />
          </section>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
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

export default function DashboardPage() {
  const currentUser = useAuthStore((state) => state.user)
  // The M&E payload is a separate endpoint behind a narrower permission than this screen. Gating
  // the panel here keeps faculty and student volunteers on their personal overview rather than
  // showing them a section that would 403 (see `Permissions.canViewMonitoringDashboard()`).
  const canViewMonitoring = hasAnyRole(currentUser, MONITORING_DASHBOARD_ROLES)

  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Bumped by Refresh so the one button reloads both payloads; the panel fetches its own.
  const [refreshSignal, setRefreshSignal] = useState(0)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
      setRefreshSignal((current) => current + 1)
    } else {
      setLoading(true)
    }
    setErrorMessage(null)
    try {
      setOverview(await getDashboardOverview())
    } catch (error) {
      setErrorMessage(getDashboardErrorMessage(error))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const header = (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">
          Extension Services Center
        </p>
        <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">
          Extension programs overview
        </h4>
      </div>
      <div className="flex flex-col items-start gap-2 xl:items-end">
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={loading || refreshing}
          className={secondaryButtonClassName}
        >
          {refreshing ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary-accent" />
          ) : (
            <RefreshRoundedIcon fontSize="small" />
          )}
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
        {overview ? (
          <p className="text-xs text-muted-alt">Updated {formatDateTime(overview.generatedAt)}</p>
        ) : null}
      </div>
    </div>
  )

  // Rendered on every path below, including the overview's own loading and error states: the two
  // payloads are independent, so a failed overview must not take the M&E figures down with it.
  const monitoringBlock = canViewMonitoring ? <MonitoringPanel refreshSignal={refreshSignal} /> : null

  // The personal block only needs naming when something else sits above it.
  const overviewHeading = canViewMonitoring ? (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">
        Your workspace
      </p>
      <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">
        Your extension work at a glance
      </h4>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-body">
        Across every period, scoped to what you can act on — proposal counts here follow your own
        access, unlike the campus-wide figures above.
      </p>
    </div>
  ) : null

  if (loading && !overview) {
    return (
      <div className="space-y-6">
        {header}
        {monitoringBlock}
        {overviewHeading}
        <LoadingSkeleton />
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="space-y-6">
        {header}
        {monitoringBlock}
        {overviewHeading}
        <div className="flex flex-col gap-3 border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text sm:flex-row sm:items-center sm:justify-between">
          <span>{errorMessage ?? 'Could not load the dashboard.'}</span>
          <button type="button" onClick={() => void load()} className={secondaryButtonClassName}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { communities, assessments, recommendations, programs, topNeeds, recentActivity } = overview
  const pendingReview = programs.underReview + programs.returned

  return (
    <div className="space-y-6">
      {header}
      {monitoringBlock}
      {overviewHeading}

      {errorMessage ? (
        <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
          {errorMessage} Showing the figures from the last successful load.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Partner communities"
          value={formatNumber(communities.total)}
          hint={`${formatNumber(communities.households)} households profiled`}
          icon={<Groups2OutlinedIcon fontSize="small" />}
          to="/admin/communities"
        />
        <StatCard
          label="Needs assessments"
          value={formatNumber(assessments.surveys)}
          hint={`${formatNumber(assessments.deployed)} deployed · ${formatNumber(assessments.finalized)} finalized`}
          icon={<PollOutlinedIcon fontSize="small" />}
          to="/admin/surveys"
        />
        <StatCard
          label="Survey responses"
          value={formatNumber(assessments.responses)}
          hint={`${formatNumber(assessments.responsesFemale)} female · ${formatNumber(assessments.responsesMale)} male`}
          icon={<FactCheckOutlinedIcon fontSize="small" />}
        />
        <StatCard
          label="Project proposals"
          value={formatNumber(programs.total)}
          hint={
            pendingReview > 0
              ? `${formatNumber(pendingReview)} awaiting action`
              : 'None awaiting action'
          }
          icon={<AssignmentOutlinedIcon fontSize="small" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardSection
          title="Community population"
          description={
            communities.withSexSplit > 0
              ? `Sex-disaggregated across ${formatNumber(communities.withSexSplit)} of ${formatNumber(communities.total)} profiles`
              : 'Sex-disaggregated profile data'
          }
        >
          {communities.populationFemale + communities.populationMale > 0 ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-label">
                  Total profiled population
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-[-0.03em] tabular-nums text-ink">
                  {formatNumber(communities.population)}
                </p>
              </div>
              <SplitMeter
                label="Profiled population by sex"
                formatValue={formatNumber}
                parts={[
                  { label: 'Female', value: communities.populationFemale, tone: 'primary' },
                  { label: 'Male', value: communities.populationMale, tone: 'muted' },
                ]}
              />
              {communities.withSexSplit < communities.total ? (
                <p className="text-xs leading-5 text-warning">
                  {formatNumber(communities.total - communities.withSexSplit)} profile(s) have no
                  female/male split recorded and are excluded from the bar above.
                </p>
              ) : null}
            </div>
          ) : (
            <EmptyPanelMessage>
              No community population has been profiled yet.{' '}
              <Link to="/admin/communities" className="font-medium text-primary-accent hover:underline">
                Add a community
              </Link>{' '}
              to start tracking reach.
            </EmptyPanelMessage>
          )}
        </DashboardSection>

        <DashboardSection
          title="Assessment respondents"
          description="Who answered the deployed needs-assessment surveys"
        >
          {assessments.responses > 0 ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-label">
                  Total responses collected
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-[-0.03em] tabular-nums text-ink">
                  {formatNumber(assessments.responses)}
                </p>
              </div>
              <SplitMeter
                label="Respondents by sex"
                formatValue={formatNumber}
                parts={[
                  { label: 'Female', value: assessments.responsesFemale, tone: 'primary' },
                  { label: 'Male', value: assessments.responsesMale, tone: 'muted' },
                  { label: 'Undisclosed', value: assessments.responsesUndisclosed, tone: 'neutral' },
                ]}
              />
              <p className="text-xs leading-5 text-muted-alt">
                {formatNumber(assessments.deployed)} survey(s) currently open ·{' '}
                {formatNumber(assessments.closed)} closed · {formatNumber(assessments.draft)} in draft
              </p>
            </div>
          ) : (
            <EmptyPanelMessage>
              No survey responses yet.{' '}
              <Link to="/admin/surveys" className="font-medium text-primary-accent hover:underline">
                Deploy a survey
              </Link>{' '}
              to start collecting them.
            </EmptyPanelMessage>
          )}
        </DashboardSection>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <DashboardSection
          title="Top identified needs"
          description="Ranked across every finalized assessment, strongest average first"
        >
          {topNeeds.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-[640px] table-auto border-collapse">
                <thead>
                  <tr className="border-b border-divider bg-surface-tint text-left text-xs font-semibold uppercase tracking-[0.12em] text-label">
                    <th className="px-5 py-3">Need category</th>
                    <th className="px-5 py-3">Avg. score</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Respondents (F / M)</th>
                    <th className="px-5 py-3">Assessments</th>
                  </tr>
                </thead>
                <tbody>
                  {topNeeds.map((need) => (
                    <tr
                      key={need.needCategoryId}
                      className="border-b border-row-divider text-sm text-cell last:border-b-0 hover:bg-row-hover"
                    >
                      <td className="px-5 py-4 font-medium text-ink">{need.needCategoryName}</td>
                      <td className="px-5 py-4 tabular-nums">{formatScore(need.avgScore)}</td>
                      <td className="px-5 py-4">
                        <PriorityBadge priority={need.priority} />
                      </td>
                      <td className="px-5 py-4 tabular-nums">
                        {formatNumber(need.responseCount)}{' '}
                        <span className="text-muted-alt">
                          ({formatNumber(need.femaleCount)} / {formatNumber(need.maleCount)})
                        </span>
                      </td>
                      <td className="px-5 py-4 tabular-nums">{formatNumber(need.assessmentCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyPanelMessage>
              No assessment has been finalized yet. Finalize a survey&apos;s results to rank its need
              categories here.
            </EmptyPanelMessage>
          )}
        </DashboardSection>

        <div className="space-y-4">
          <DashboardSection
            title="Proposal pipeline"
            description={`${formatNumber(programs.total)} proposal(s) visible to you`}
          >
            {programs.total > 0 ? (
              <div className="space-y-4">
                {PROGRAM_STATUS_ROWS.map(({ key, label }) => (
                  <DistributionRow
                    key={key}
                    label={label}
                    value={programs[key]}
                    total={programs.total}
                    tone={key === 'cancelled' || key === 'returned' ? 'muted' : 'primary'}
                  />
                ))}
              </div>
            ) : (
              <EmptyPanelMessage>
                No proposals yet. Accepting a recommendation creates a pre-filled draft proposal.
              </EmptyPanelMessage>
            )}
          </DashboardSection>

          <DashboardSection
            title="Recommendation decisions"
            description={`${formatNumber(recommendations.total)} generated to date`}
          >
            {recommendations.total > 0 ? (
              <div className="space-y-4">
                <DistributionRow
                  label="Awaiting decision"
                  value={recommendations.pending}
                  total={recommendations.total}
                />
                <DistributionRow
                  label="Accepted"
                  value={recommendations.accepted}
                  total={recommendations.total}
                />
                <DistributionRow
                  label="Modified"
                  value={recommendations.modified}
                  total={recommendations.total}
                  tone="muted"
                />
                <DistributionRow
                  label="Rejected"
                  value={recommendations.rejected}
                  total={recommendations.total}
                  tone="muted"
                />
              </div>
            ) : (
              <EmptyPanelMessage>
                No recommendations generated yet. Finalize an assessment, then run the engine from
                its results screen.
              </EmptyPanelMessage>
            )}
          </DashboardSection>
        </div>
      </div>

      {recentActivity ? (
        <DashboardSection
          title="Recent activity"
          description="The newest entries in the system audit trail"
          action={
            <Link to="/admin/activity-logs" className={secondaryButtonClassName}>
              View activity log
            </Link>
          }
        >
          {recentActivity.length > 0 ? (
            <ul className="space-y-4">
              {recentActivity.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-col gap-1 border-b border-row-divider pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <div className="flex min-w-0 items-baseline gap-3">
                    <span aria-hidden="true" className="h-2 w-2 shrink-0 translate-y-1 bg-primary" />
                    <p className="text-sm leading-6 text-body">
                      <span className="font-medium text-ink">
                        {ACTIVITY_ACTION_LABELS[log.action] ?? log.action}
                      </span>
                      {log.userLabel ? ` by ${log.userLabel}` : ''}
                      {log.entityType ? (
                        <span className="text-muted-alt"> · {log.entityType}</span>
                      ) : null}
                    </p>
                  </div>
                  <time
                    dateTime={log.createdAt}
                    title={formatDateTime(log.createdAt)}
                    className="shrink-0 text-xs text-muted-alt"
                  >
                    {formatRelativeTime(log.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyPanelMessage>No activity recorded yet.</EmptyPanelMessage>
          )}
        </DashboardSection>
      ) : null}
    </div>
  )
}
