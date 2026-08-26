import AddRoundedIcon from '@mui/icons-material/AddRounded'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import { useCallback, useEffect, useState } from 'react'
import type { ApiValidationErrors } from '@/shared/api/http'
import { isApiError } from '@/shared/api/http'
import { SplitMeter } from '@/shared/meter'
import { notify } from '@/shared/toast'
import {
  createEvaluation,
  createProgramActivity,
  deleteProgramActivity,
  listProgramActivities,
  updateEvaluation,
  updateProgramActivity,
} from '../api/programsApi'
import { getProgramErrorMessage } from '../lib/errorMessages'
import { formatDate, formatNumber } from '../lib/format'
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_STATUS_TONES,
  EVAL_TYPE_LABELS,
  type Evaluation,
  type EvaluationPayload,
  type ProgramActivity,
  type ProgramActivityPayload,
  type Sector,
  type SexSplit,
} from '../types'
import ActivityFormModal, { type ActivityFormMode } from './ActivityFormModal'
import AttendanceImportModal from './AttendanceImportModal'
import AttendancePanel from './AttendancePanel'
import EvaluationFormModal from './EvaluationFormModal'

type ActivitiesSectionProps = {
  programId: string
  /** Server-computed: true only when the caller owns the program AND it is approved or ongoing. */
  canRecord: boolean
  sectors: Sector[]
  /** Called when a change may have advanced the program's status, so the page reloads it. */
  onProgramMayHaveChanged: () => void
}

const actionButtonClassName =
  'flex h-9 w-9 cursor-pointer items-center justify-center border border-line text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-45 rounded-md'

const destructiveActionButtonClassName =
  'flex h-9 w-9 cursor-pointer items-center justify-center border border-danger-border text-danger transition-colors hover:bg-danger-bg-soft disabled:cursor-not-allowed disabled:opacity-45 rounded-md'

function formatTimeRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null
  const trim = (value: string | null) => (value ? value.slice(0, 5) : null)
  const from = trim(start)
  const to = trim(end)
  if (from && to) return `${from} – ${to}`
  return from ?? to
}

/**
 * The activities tab of a program (spec Module 5b).
 *
 * <p>Each activity carries its own attendance split and evaluation list. The program-level rollup at
 * the top is summed from the rows on screen rather than fetched separately, so the header can never
 * disagree with the activities beneath it.
 *
 * <p>Every mutation calls {@code onProgramMayHaveChanged} because the server may have advanced the
 * program's status as a side effect — marking an activity done starts the program, and encoding the
 * last post-evaluation completes it. The client never predicts those transitions; it reloads.
 */
export default function ActivitiesSection({
  programId,
  canRecord,
  sectors,
  onProgramMayHaveChanged,
}: ActivitiesSectionProps) {
  const [activities, setActivities] = useState<ProgramActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<ActivityFormMode>('create')
  const [activeActivity, setActiveActivity] = useState<ProgramActivity | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)
  const [formApiErrors, setFormApiErrors] = useState<ApiValidationErrors | undefined>(undefined)

  const [attendanceActivity, setAttendanceActivity] = useState<ProgramActivity | null>(null)
  const [importActivity, setImportActivity] = useState<ProgramActivity | null>(null)

  const [evaluationActivity, setEvaluationActivity] = useState<ProgramActivity | null>(null)
  const [activeEvaluation, setActiveEvaluation] = useState<Evaluation | null>(null)
  const [evaluationLoading, setEvaluationLoading] = useState(false)
  const [evaluationErrorMessage, setEvaluationErrorMessage] = useState<string | null>(null)
  const [evaluationApiErrors, setEvaluationApiErrors] = useState<ApiValidationErrors | undefined>(undefined)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      setActivities(await listProgramActivities(programId))
    } catch (error) {
      setErrorMessage(getProgramErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [programId])

  useEffect(() => {
    void load()
  }, [load])

  const totals: SexSplit = activities.reduce(
    (split, activity) => ({
      total: split.total + activity.attendance.total,
      female: split.female + activity.attendance.female,
      male: split.male + activity.attendance.male,
    }),
    { total: 0, female: 0, male: 0 },
  )

  const handleFormSubmit = async (payload: ProgramActivityPayload) => {
    setFormLoading(true)
    setFormErrorMessage(null)
    setFormApiErrors(undefined)
    try {
      if (formMode === 'create' || !activeActivity) {
        await createProgramActivity(programId, payload)
        notify.success('Activity added.')
      } else {
        await updateProgramActivity(activeActivity.id, payload)
        notify.success('Activity updated.')
      }
      setFormOpen(false)
      setActiveActivity(null)
      await load()
      onProgramMayHaveChanged()
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        setFormApiErrors(error.fields ?? {})
        setFormErrorMessage(error.fields ? null : getProgramErrorMessage(error))
      } else {
        setFormErrorMessage(getProgramErrorMessage(error))
      }
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (activity: ProgramActivity) => {
    setDeletingId(activity.id)
    try {
      await deleteProgramActivity(activity.id)
      notify.success(`Activity "${activity.title}" deleted.`)
      await load()
      onProgramMayHaveChanged()
    } catch (error) {
      notify.error(getProgramErrorMessage(error))
    } finally {
      setDeletingId(null)
    }
  }

  const handleEvaluationSubmit = async (payload: EvaluationPayload) => {
    if (!evaluationActivity) return
    setEvaluationLoading(true)
    setEvaluationErrorMessage(null)
    setEvaluationApiErrors(undefined)
    try {
      if (activeEvaluation) {
        await updateEvaluation(evaluationActivity.id, activeEvaluation.id, payload)
        notify.success('Evaluation updated.')
      } else {
        await createEvaluation(evaluationActivity.id, payload)
        notify.success('Evaluation encoded.')
      }
      setEvaluationActivity(null)
      setActiveEvaluation(null)
      await load()
      onProgramMayHaveChanged()
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        setEvaluationApiErrors(error.fields ?? {})
        setEvaluationErrorMessage(error.fields ? null : getProgramErrorMessage(error))
      } else {
        setEvaluationErrorMessage(getProgramErrorMessage(error))
      }
    } finally {
      setEvaluationLoading(false)
    }
  }

  return (
    <section className="rounded-lg overflow-hidden border border-line bg-surface">
      <div className="flex flex-col gap-3 border-b border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">Activities</h3>
          <p className="mt-1 text-sm text-muted">
            Sessions delivered under this program, with attendance and evaluations.
          </p>
        </div>
        {canRecord ? (
          <button
            type="button"
            onClick={() => {
              setFormMode('create')
              setActiveActivity(null)
              setFormErrorMessage(null)
              setFormApiErrors(undefined)
              setFormOpen(true)
            }}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover rounded-md"
          >
            <AddRoundedIcon fontSize="small" />
            Add Activity
          </button>
        ) : null}
      </div>

      {totals.total > 0 ? (
        <div className="border-b border-divider px-5 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-label">
            Beneficiaries reached ({formatNumber(totals.total)})
          </p>
          <SplitMeter
            label="Beneficiaries reached by this program, by sex"
            formatValue={formatNumber}
            parts={[
              { label: 'Female', value: totals.female, tone: 'primary' },
              { label: 'Male', value: totals.male, tone: 'muted' },
            ]}
          />
        </div>
      ) : null}

      <div className="px-5 py-4">
        {errorMessage ? (
          <div className="space-y-4">
            <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
              {errorMessage}
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="cursor-pointer border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint rounded-md"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <span key={index} className="block h-16 animate-pulse rounded-md bg-skeleton" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            {canRecord
              ? 'No activities yet. Add the first session to start delivering this program.'
              : 'No activities have been recorded for this program yet.'}
          </p>
        ) : (
          <ul className="space-y-3">
            {activities.map((activity) => {
              const timeRange = formatTimeRange(activity.startTime, activity.endTime)
              return (
                <li
                  key={activity.id}
                  className="rounded-md border border-divider px-4 py-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-ink">{activity.title}</p>
                        <span
                          className={[
                            'inline-flex whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium',
                            ACTIVITY_STATUS_TONES[activity.status],
                          ].join(' ')}
                        >
                          {ACTIVITY_STATUS_LABELS[activity.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-alt">
                        {formatDate(activity.activityDate)}
                        {timeRange ? ` · ${timeRange}` : ''}
                        {activity.venue ? ` · ${activity.venue}` : ''}
                      </p>
                      <p className="mt-1 text-xs text-muted-alt">
                        Attendance: {formatNumber(activity.attendance.total)} total ·{' '}
                        {formatNumber(activity.attendance.female)} F ·{' '}
                        {formatNumber(activity.attendance.male)} M
                      </p>
                      {activity.notes ? (
                        <p className="mt-2 text-sm leading-6 text-body">{activity.notes}</p>
                      ) : null}

                      {activity.evaluations.length > 0 ? (
                        <ul className="mt-3 space-y-1.5">
                          {activity.evaluations.map((evaluation) => (
                            <li key={evaluation.id} className="text-xs text-muted-alt">
                              <span className="font-medium text-ink">
                                {EVAL_TYPE_LABELS[evaluation.evalType]}
                              </span>{' '}
                              · {formatNumber(evaluation.respondentCount)} respondents ·{' '}
                              {formatNumber(evaluation.femaleCount)} F /{' '}
                              {formatNumber(evaluation.maleCount)} M
                              {evaluation.unspecifiedCount > 0
                                ? ` · ${formatNumber(evaluation.unspecifiedCount)} unstated`
                                : ''}
                              {evaluation.avgRating !== null
                                ? ` · avg ${Number(evaluation.avgRating).toFixed(2)}`
                                : ''}
                              {canRecord ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEvaluationActivity(activity)
                                    setActiveEvaluation(evaluation)
                                    setEvaluationErrorMessage(null)
                                    setEvaluationApiErrors(undefined)
                                  }}
                                  className="ml-2 cursor-pointer font-medium text-primary-accent hover:underline rounded-md"
                                >
                                  Edit
                                </button>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setAttendanceActivity(activity)}
                        className="inline-flex cursor-pointer items-center gap-2 border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-hover-tint rounded-md"
                      >
                        <GroupsOutlinedIcon fontSize="small" />
                        Attendance
                      </button>

                      {canRecord ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEvaluationActivity(activity)
                              setActiveEvaluation(null)
                              setEvaluationErrorMessage(null)
                              setEvaluationApiErrors(undefined)
                            }}
                            className="inline-flex cursor-pointer items-center gap-2 border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-hover-tint rounded-md"
                          >
                            <AssignmentTurnedInOutlinedIcon fontSize="small" />
                            Evaluation
                          </button>
                          <button
                            type="button"
                            aria-label={`Edit ${activity.title}`}
                            title="Edit"
                            onClick={() => {
                              setFormMode('edit')
                              setActiveActivity(activity)
                              setFormErrorMessage(null)
                              setFormApiErrors(undefined)
                              setFormOpen(true)
                            }}
                            className={actionButtonClassName}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${activity.title}`}
                            title="Delete"
                            disabled={deletingId === activity.id}
                            onClick={() => void handleDelete(activity)}
                            className={destructiveActionButtonClassName}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ActivityFormModal
        key={`${formMode}-${activeActivity?.id ?? 'new'}-${formOpen ? 'open' : 'closed'}`}
        open={formOpen}
        mode={formMode}
        activity={activeActivity}
        loading={formLoading}
        errorMessage={formErrorMessage}
        apiErrors={formApiErrors}
        onClose={() => {
          if (!formLoading) {
            setFormOpen(false)
            setActiveActivity(null)
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <AttendancePanel
        key={`attendance-${attendanceActivity?.id ?? 'none'}`}
        open={attendanceActivity !== null}
        activity={attendanceActivity}
        sectors={sectors}
        canRecord={canRecord && (attendanceActivity?.canRecordAttendance ?? false)}
        onClose={() => setAttendanceActivity(null)}
        onChanged={() => {
          void load()
          onProgramMayHaveChanged()
        }}
        onOpenImport={() => {
          setImportActivity(attendanceActivity)
          setAttendanceActivity(null)
        }}
      />

      <AttendanceImportModal
        key={`import-${importActivity?.id ?? 'none'}`}
        open={importActivity !== null}
        activityId={importActivity?.id ?? null}
        activityTitle={importActivity?.title ?? null}
        onClose={() => setImportActivity(null)}
        onImported={() => {
          void load()
          onProgramMayHaveChanged()
        }}
      />

      <EvaluationFormModal
        key={`evaluation-${evaluationActivity?.id ?? 'none'}-${activeEvaluation?.id ?? 'new'}`}
        open={evaluationActivity !== null}
        activityTitle={evaluationActivity?.title ?? null}
        evaluation={activeEvaluation}
        loading={evaluationLoading}
        errorMessage={evaluationErrorMessage}
        apiErrors={evaluationApiErrors}
        onClose={() => {
          if (!evaluationLoading) {
            setEvaluationActivity(null)
            setActiveEvaluation(null)
          }
        }}
        onSubmit={handleEvaluationSubmit}
      />
    </section>
  )
}
