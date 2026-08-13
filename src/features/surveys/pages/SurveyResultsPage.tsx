import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { hasAnyRole } from '@/features/auth/lib/access'
import { useAuthStore } from '@/features/auth/store/authStore'
import { downloadBlob } from '@/shared/download'
import { DataTable, type DataTableColumn } from '@/shared/table'
import { notify } from '@/shared/toast'
import {
  downloadSurveyReport,
  exportSurveyResults,
  finalizeSurveyResults,
  generateQf23Report,
  getSurveyResults,
  listSurveyReports,
} from '../api/surveysApi'
import ConfirmModal from '../components/ConfirmModal'
import PriorityBadge from '../components/PriorityBadge'
import Qf23ReportModal from '../components/Qf23ReportModal'
import { formatDateTime, formatDecimal, getSurveyErrorMessage, slugifyTitle } from '../lib/format'
import {
  QUESTION_TYPE_LABELS,
  SURVEY_MANAGE_ROLES,
  SURVEY_STATUS_LABELS,
  type CategoryResult,
  type ExportFormat,
  type GeneratedReport,
  type SignatoryOverrides,
  type SurveyResults,
} from '../types'

const secondaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md'
const primaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md'

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg overflow-hidden border border-line bg-surface">
      <div className="flex flex-col gap-3 border-b border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">{title}</h3>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}

function ButtonSpinner({ tone = 'dark' }: { tone?: 'light' | 'dark' }) {
  return (
    <span
      className={[
        'h-4 w-4 animate-spin rounded-full border-2',
        tone === 'light' ? 'border-white/35 border-t-white' : 'border-line border-t-primary-accent',
      ].join(' ')}
    />
  )
}

export default function SurveyResultsPage() {
  const { id = '' } = useParams()
  const currentUser = useAuthStore((state) => state.user)
  const canManage = hasAnyRole(currentUser, SURVEY_MANAGE_ROLES)

  const [results, setResults] = useState<SurveyResults | null>(null)
  const [reports, setReports] = useState<GeneratedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [finalizeLoading, setFinalizeLoading] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)
  const [qf23Open, setQf23Open] = useState(false)
  const [qf23Loading, setQf23Loading] = useState(false)
  const [qf23Error, setQf23Error] = useState<string | null>(null)
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setErrorMessage(null)
    try {
      setResults(await getSurveyResults(id))
    } catch (error) {
      setErrorMessage(getSurveyErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadReports = useCallback(async () => {
    if (!id) return
    try {
      setReports(await listSurveyReports(id))
    } catch {
      // The archive is supplementary — a failure here must not block the results screen.
      setReports([])
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  const handleFinalize = async () => {
    if (!results) return
    setFinalizeLoading(true)
    try {
      setResults(await finalizeSurveyResults(results.surveyId))
      setFinalizeOpen(false)
      notify.success('Results finalized. Recommendations and the EXTN-QF-23 report can now be generated.')
    } catch (error) {
      notify.error(getSurveyErrorMessage(error))
    } finally {
      setFinalizeLoading(false)
    }
  }

  const handleExport = async (format: ExportFormat) => {
    if (!results) return
    setExportingFormat(format)
    try {
      const blob = await exportSurveyResults(results.surveyId, format)
      const slug = slugifyTitle(results.title)
      downloadBlob(blob, format === 'xlsx' ? `${slug}_results.xlsx` : `${slug}_summary.pdf`)
      notify.success(`${format.toUpperCase()} export downloaded.`)
    } catch (error) {
      notify.error(getSurveyErrorMessage(error))
    } finally {
      setExportingFormat(null)
    }
  }

  const handleGenerateQf23 = async (overrides: SignatoryOverrides) => {
    if (!results) return
    setQf23Loading(true)
    setQf23Error(null)
    try {
      const blob = await generateQf23Report(results.surveyId, overrides)
      downloadBlob(blob, `EXTN-QF-23_${slugifyTitle(results.title)}.docx`)
      setQf23Open(false)
      notify.success('EXTN-QF-23 report generated and archived.')
      await loadReports()
    } catch (error) {
      setQf23Error(getSurveyErrorMessage(error))
    } finally {
      setQf23Loading(false)
    }
  }

  const handleDownloadReport = async (report: GeneratedReport) => {
    if (!results) return
    setDownloadingReportId(report.id)
    try {
      const blob = await downloadSurveyReport(results.surveyId, report.id)
      downloadBlob(blob, `EXTN-QF-23_${slugifyTitle(results.title)}.docx`)
    } catch (error) {
      notify.error(getSurveyErrorMessage(error))
    } finally {
      setDownloadingReportId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-5 py-4 text-sm text-body">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-primary-accent" />
        Loading results...
      </div>
    )
  }

  if (errorMessage || !results) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/surveys"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-accent hover:underline"
        >
          <ArrowBackRoundedIcon fontSize="small" />
          Back to surveys
        </Link>
        <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
          {errorMessage ?? 'Results not found.'}
        </div>
        <button type="button" onClick={() => void load()} className={secondaryButtonClassName}>
          Retry
        </button>
      </div>
    )
  }

  const hasResponses = results.totalResponses > 0
  const canFinalize = canManage && !results.finalized && results.status !== 'draft' && hasResponses

  const summaryCards: { label: string; value: string }[] = [
    { label: 'Total responses', value: String(results.totalResponses) },
    {
      label: 'Female / Male',
      value: `${results.femaleResponses} / ${results.maleResponses}`,
    },
    {
      label: 'Completion rate',
      value:
        results.completionRate === null
          ? 'No target set'
          : `${formatDecimal(results.completionRate, 1)}%`,
    },
    {
      label: 'Highest need score',
      value: results.highestNeedScore === null ? '-' : formatDecimal(results.highestNeedScore),
    },
  ]

  const columns: DataTableColumn<CategoryResult>[] = [
    {
      key: 'rank',
      header: 'Rank',
      width: 90,
      cellClassName: 'text-ink font-medium',
      render: (category) => `#${category.rank}`,
    },
    {
      key: 'category',
      header: 'Need category',
      frozen: true,
      width: 260,
      cellClassName: 'truncate text-ink',
      render: (category) => category.needCategoryName,
    },
    {
      key: 'score',
      header: 'Weighted average',
      width: 170,
      align: 'right',
      cellClassName: 'font-medium text-ink',
      render: (category) => formatDecimal(category.avgScore),
    },
    {
      key: 'priority',
      header: 'Priority',
      width: 140,
      render: (category) => <PriorityBadge priority={category.priority} />,
    },
    {
      key: 'responses',
      header: 'Responses',
      width: 120,
      align: 'right',
      render: (category) => category.responseCount,
    },
    { key: 'female', header: 'Female', width: 110, align: 'right', render: (category) => category.femaleCount },
    { key: 'male', header: 'Male', width: 110, align: 'right', render: (category) => category.maleCount },
  ]

  return (
    <div className="space-y-6">
      <Link
        to={`/admin/surveys/${results.surveyId}/build`}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary-accent hover:underline"
      >
        <ArrowBackRoundedIcon fontSize="small" />
        Back to survey builder
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">Assessment results</p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">{results.title}</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-body">
            {results.communityName} · {SURVEY_STATUS_LABELS[results.status]} ·{' '}
            {results.finalized ? `Finalized ${formatDateTime(results.finalizedAt)}` : 'Live results'}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => void handleExport('xlsx')}
            disabled={exportingFormat !== null || !hasResponses}
            title={hasResponses ? undefined : 'No responses to export yet'}
            className={secondaryButtonClassName}
          >
            {exportingFormat === 'xlsx' ? <ButtonSpinner /> : <TableChartOutlinedIcon fontSize="small" />}
            {exportingFormat === 'xlsx' ? 'Exporting...' : 'Export XLSX'}
          </button>
          <button
            type="button"
            onClick={() => void handleExport('pdf')}
            disabled={exportingFormat !== null || !hasResponses}
            title={hasResponses ? undefined : 'No responses to export yet'}
            className={secondaryButtonClassName}
          >
            {exportingFormat === 'pdf' ? <ButtonSpinner /> : <PictureAsPdfOutlinedIcon fontSize="small" />}
            {exportingFormat === 'pdf' ? 'Exporting...' : 'Export PDF'}
          </button>

          {results.finalized ? (
            <Link to={`/admin/surveys/${results.surveyId}/recommendations`} className={secondaryButtonClassName}>
              <AutoAwesomeOutlinedIcon fontSize="small" />
              Get Recommendations
            </Link>
          ) : null}

          {canManage && results.finalized ? (
            <button
              type="button"
              onClick={() => {
                setQf23Error(null)
                setQf23Open(true)
              }}
              className={secondaryButtonClassName}
            >
              <DescriptionOutlinedIcon fontSize="small" />
              Generate EXTN-QF-23
            </button>
          ) : null}

          {canManage && !results.finalized ? (
            <button
              type="button"
              onClick={() => setFinalizeOpen(true)}
              disabled={!canFinalize}
              title={
                results.status === 'draft'
                  ? 'Deploy the survey and collect responses first'
                  : hasResponses
                    ? undefined
                    : 'There are no responses to finalize'
              }
              className={primaryButtonClassName}
            >
              Finalize Results
            </button>
          ) : null}
        </div>
      </div>

      {results.finalized ? (
        <div className="flex items-start gap-3 border border-line bg-surface-tint px-4 py-3 text-sm text-warning">
          <LockOutlinedIcon fontSize="small" className="mt-0.5 text-warning" />
          <p>
            These results are finalized and no longer recomputed — they are the exact numbers cited by the
            recommendation engine and the EXTN-QF-23 report. Later responses do not change them.
          </p>
        </div>
      ) : (
        <div className="border border-line bg-surface-tint px-4 py-3 text-sm text-warning">
          Live results, recalculated on every visit. Finalize them to lock the scores and unlock
          recommendations and the EXTN-QF-23 report. Finalizing cannot be undone.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-line bg-surface px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-ink">{card.value}</p>
            {card.label === 'Female / Male' && results.undisclosedSexResponses > 0 ? (
              <p className="mt-1 text-xs text-muted-alt">
                {results.undisclosedSexResponses} undisclosed
              </p>
            ) : null}
            {card.label === 'Completion rate' && results.targetResponses !== null ? (
              <p className="mt-1 text-xs text-muted-alt">Target {results.targetResponses}</p>
            ) : null}
          </div>
        ))}
      </div>

      <section className="rounded-lg overflow-hidden border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">Ranked needs</h3>
            <p className="mt-1 text-sm text-muted">
              Weighted average of rating answers per need category (1.00–5.00). Only rating questions are scored.
            </p>
          </div>
          <p className="text-sm text-muted">
            {results.categories.length} {results.categories.length === 1 ? 'category' : 'categories'} ranked
          </p>
        </div>

        <DataTable
          columns={columns}
          rows={results.categories}
          rowKey={(category) => category.needCategoryId}
          emptyMessage="No rating answers have been collected yet, so there is nothing to rank."
          minWidthClassName="min-w-[1000px]"
        />
      </section>

      {results.distributions.length > 0 ? (
        <SectionCard
          title="Other question responses"
          description="Choice and open-text answers are collected for context but do not affect the need scores."
        >
          <ul className="space-y-5">
            {results.distributions.map((distribution) => {
              const optionEntries = Object.entries(distribution.optionCounts)
              return (
                <li key={distribution.questionId} className="rounded-lg border border-line bg-surface px-4 py-4">
                  <p className="text-sm font-medium text-ink">{distribution.questionText}</p>
                  <p className="mt-1 text-xs text-muted-alt">
                    {QUESTION_TYPE_LABELS[distribution.questionType] ?? distribution.questionType}
                  </p>

                  {distribution.questionType === 'open_text' ? (
                    distribution.textAnswers.length === 0 ? (
                      <p className="mt-3 text-sm text-muted">No answers yet.</p>
                    ) : (
                      <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-md border border-row-divider px-3 py-2">
                        {distribution.textAnswers.map((answer, index) => (
                          <li
                            key={`${distribution.questionId}-${index}`}
                            className="border-b border-row-divider pb-2 text-sm leading-6 text-cell last:border-b-0 last:pb-0"
                          >
                            {answer}
                          </li>
                        ))}
                      </ul>
                    )
                  ) : optionEntries.length === 0 ? (
                    <p className="mt-3 text-sm text-muted">No answers yet.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-row-divider">
                      {optionEntries.map(([label, count]) => (
                        <li key={label} className="flex items-center justify-between gap-3 py-2.5">
                          <span className="text-sm text-cell">{label}</span>
                          <span className="text-sm font-medium text-primary-accent">{count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Generated reports"
        description="Every EXTN-QF-23 copy is archived. Regenerating adds a new version and never overwrites an earlier one."
      >
        {reports.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            No EXTN-QF-23 report generated yet.{' '}
            {results.finalized ? 'Generate one from the button above.' : 'Finalize the results first.'}
          </p>
        ) : (
          <ul className="divide-y divide-row-divider">
            {reports.map((report) => (
              <li key={report.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    EXTN-QF-23 · {results.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-alt">
                    {report.fileType.toUpperCase()} · Generated {formatDateTime(report.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Download report generated ${formatDateTime(report.createdAt)}`}
                  title="Download"
                  disabled={downloadingReportId === report.id}
                  onClick={() => void handleDownloadReport(report)}
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border border-line text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-45 rounded-md"
                >
                  {downloadingReportId === report.id ? <ButtonSpinner /> : <DownloadRoundedIcon fontSize="small" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <ConfirmModal
        open={finalizeOpen}
        title="Finalize results"
        description="This snapshots the current scores as the approved assessment."
        confirmLabel="Finalize results"
        loadingLabel="Finalizing..."
        loading={finalizeLoading}
        onClose={() => {
          if (!finalizeLoading) setFinalizeOpen(false)
        }}
        onConfirm={handleFinalize}
      >
        <div className="border border-danger-border-soft bg-danger-bg-soft px-4 py-3 text-sm text-danger-text">
          Finalizing cannot be undone. The ranked scores are frozen exactly as shown, and any responses
          submitted afterwards will not change them. Recommendations and the EXTN-QF-23 report will cite
          these numbers.
        </div>
      </ConfirmModal>

      <Qf23ReportModal
        key={qf23Open ? 'qf23-open' : 'qf23-closed'}
        open={qf23Open}
        loading={qf23Loading}
        errorMessage={qf23Error}
        onClose={() => {
          if (!qf23Loading) setQf23Open(false)
        }}
        onSubmit={handleGenerateQf23}
      />
    </div>
  )
}
