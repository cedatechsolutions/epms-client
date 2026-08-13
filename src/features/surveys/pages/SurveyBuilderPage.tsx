import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { hasAnyRole } from '@/features/auth/lib/access'
import { useAuthStore } from '@/features/auth/store/authStore'
import { listCommunities } from '@/features/communities/api/communitiesApi'
import type { ApiValidationErrors } from '@/shared/api/http'
import { isApiError } from '@/shared/api/http'
import { notify } from '@/shared/toast'
import {
  addQuestion,
  closeSurvey,
  deleteQuestion,
  deploySurvey,
  getSurvey,
  listNeedCategories,
  updateQuestion,
  updateSurvey,
} from '../api/surveysApi'
import ConfirmModal from '../components/ConfirmModal'
import QuestionFormModal from '../components/QuestionFormModal'
import SurveyFormModal from '../components/SurveyFormModal'
import { formatDateTime, getSurveyErrorMessage } from '../lib/format'
import {
  QUESTION_TYPE_LABELS,
  SURVEY_MANAGE_ROLES,
  SURVEY_STATUS_LABELS,
  type NeedCategory,
  type QuestionPayload,
  type Survey,
  type SurveyPayload,
  type SurveyQuestion,
} from '../types'

type CommunityOption = { id: string; name: string }

function SectionCard({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="border border-[#d8e1d4] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#e7eee3] px-5 py-4">
        <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#123524]">{title}</h3>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}

const iconButtonClassName =
  'flex h-9 w-9 cursor-pointer items-center justify-center border border-[#d8e1d4] text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-45 rounded-md'
const destructiveIconButtonClassName =
  'flex h-9 w-9 cursor-pointer items-center justify-center border border-[#e3c9c9] text-[#9f2f2f] transition-colors hover:bg-[#fff7f7] disabled:cursor-not-allowed disabled:opacity-45 rounded-md'

export default function SurveyBuilderPage() {
  const { id = '' } = useParams()
  const currentUser = useAuthStore((state) => state.user)
  const canManageRole = hasAnyRole(currentUser, SURVEY_MANAGE_ROLES)

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [categories, setCategories] = useState<NeedCategory[]>([])
  const [communities, setCommunities] = useState<CommunityOption[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [metaOpen, setMetaOpen] = useState(false)
  const [metaLoading, setMetaLoading] = useState(false)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [metaApiErrors, setMetaApiErrors] = useState<ApiValidationErrors | undefined>(undefined)

  const [questionOpen, setQuestionOpen] = useState(false)
  const [activeQuestion, setActiveQuestion] = useState<SurveyQuestion | null>(null)
  const [questionLoading, setQuestionLoading] = useState(false)
  const [questionError, setQuestionError] = useState<string | null>(null)
  const [questionApiErrors, setQuestionApiErrors] = useState<ApiValidationErrors | undefined>(undefined)

  const [deleteTarget, setDeleteTarget] = useState<SurveyQuestion | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deployOpen, setDeployOpen] = useState(false)
  const [deployLoading, setDeployLoading] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [closeLoading, setCloseLoading] = useState(false)
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  const isDraft = survey?.status === 'draft'
  const editable = canManageRole && isDraft

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setErrorMessage(null)
    try {
      setSurvey(await getSurvey(id))
    } catch (error) {
      setErrorMessage(getSurveyErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    listNeedCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
    listCommunities({ per_page: 100 })
      .then((response) => setCommunities(response.data.map(({ id: cid, name }) => ({ id: cid, name }))))
      .catch(() => setCommunities([]))
  }, [])

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const question of survey?.questions ?? []) {
      const key = question.needCategoryName ?? 'Uncategorized'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [survey?.questions])

  const publicLink = survey?.accessToken ? `${window.location.origin}/s/${survey.accessToken}` : null

  const handleMetaSubmit = async (payload: SurveyPayload) => {
    if (!survey) return
    setMetaLoading(true)
    setMetaError(null)
    setMetaApiErrors(undefined)
    try {
      setSurvey(await updateSurvey(survey.id, payload))
      setMetaOpen(false)
      notify.success('Survey updated.')
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        setMetaApiErrors(error.fields ?? {})
      } else {
        setMetaError(getSurveyErrorMessage(error))
      }
    } finally {
      setMetaLoading(false)
    }
  }

  const handleQuestionSubmit = async (payload: QuestionPayload) => {
    if (!survey) return
    setQuestionLoading(true)
    setQuestionError(null)
    setQuestionApiErrors(undefined)
    try {
      if (activeQuestion) {
        await updateQuestion(survey.id, activeQuestion.id, payload)
      } else {
        await addQuestion(survey.id, payload)
      }
      setQuestionOpen(false)
      setActiveQuestion(null)
      notify.success(activeQuestion ? 'Question updated.' : 'Question added.')
      await load()
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        setQuestionApiErrors(error.fields ?? {})
      } else {
        setQuestionError(getSurveyErrorMessage(error))
      }
    } finally {
      setQuestionLoading(false)
    }
  }

  const handleDeleteQuestion = async () => {
    if (!survey || !deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteQuestion(survey.id, deleteTarget.id)
      setDeleteTarget(null)
      notify.success('Question deleted.')
      await load()
    } catch (error) {
      notify.error(getSurveyErrorMessage(error))
    } finally {
      setDeleteLoading(false)
    }
  }

  /** Swaps a question with its neighbour by writing both order indexes. */
  const moveQuestion = async (question: SurveyQuestion, direction: -1 | 1) => {
    if (!survey) return
    const ordered = [...survey.questions].sort((a, b) => a.orderIndex - b.orderIndex)
    const index = ordered.findIndex((item) => item.id === question.id)
    const neighbour = ordered[index + direction]
    if (!neighbour) return

    setReorderingId(question.id)
    try {
      await Promise.all([
        updateQuestion(survey.id, question.id, toPayload(question, neighbour.orderIndex)),
        updateQuestion(survey.id, neighbour.id, toPayload(neighbour, question.orderIndex)),
      ])
      await load()
    } catch (error) {
      notify.error(getSurveyErrorMessage(error))
    } finally {
      setReorderingId(null)
    }
  }

  const handleDeploy = async () => {
    if (!survey) return
    setDeployLoading(true)
    try {
      const deployed = await deploySurvey(survey.id)
      setSurvey(deployed)
      setDeployOpen(false)
      notify.success('Survey deployed. The public link is now live.')
    } catch (error) {
      notify.error(getSurveyErrorMessage(error))
    } finally {
      setDeployLoading(false)
    }
  }

  const handleClose = async () => {
    if (!survey) return
    setCloseLoading(true)
    try {
      setSurvey(await closeSurvey(survey.id))
      setCloseOpen(false)
      notify.success('Survey closed. No further responses will be accepted.')
    } catch (error) {
      notify.error(getSurveyErrorMessage(error))
    } finally {
      setCloseLoading(false)
    }
  }

  const copyLink = async () => {
    if (!publicLink) return
    try {
      await navigator.clipboard.writeText(publicLink)
      notify.success('Public link copied to clipboard.')
    } catch {
      notify.error('Could not copy the link. Select and copy it manually.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 border border-[#d8e1d4] bg-white px-5 py-4 text-sm text-[#506552]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#d8e1d4] border-t-[#1f5d3b]" />
        Loading survey...
      </div>
    )
  }

  if (errorMessage || !survey) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/surveys"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#1f5d3b] hover:underline"
        >
          <ArrowBackRoundedIcon fontSize="small" />
          Back to surveys
        </Link>
        <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">
          {errorMessage ?? 'Survey not found.'}
        </div>
      </div>
    )
  }

  const orderedQuestions = [...survey.questions].sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <div className="space-y-6">
      <Link
        to="/admin/surveys"
        className="inline-flex items-center gap-1 text-sm font-medium text-[#1f5d3b] hover:underline"
      >
        <ArrowBackRoundedIcon fontSize="small" />
        Back to surveys
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">Survey builder</p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#123524]">{survey.title}</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#506552]">
            {survey.communityName} · {SURVEY_STATUS_LABELS[survey.status]}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Results exist only once responses can be collected; viewable by every assessment role. */}
          {!isDraft ? (
            <Link
              to={`/admin/surveys/${survey.id}/results`}
              className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#d8e1d4] px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] rounded-md"
            >
              <InsightsOutlinedIcon fontSize="small" />
              View results
            </Link>
          ) : null}

          {canManageRole ? (
            <>
              {isDraft ? (
                <button
                  type="button"
                  onClick={() => setDeployOpen(true)}
                  disabled={orderedQuestions.length === 0}
                  title={orderedQuestions.length === 0 ? 'Add at least one question first' : undefined}
                  className="cursor-pointer border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
                >
                  Deploy Survey
                </button>
              ) : null}
              {survey.status === 'deployed' ? (
                <button
                  type="button"
                  onClick={() => setCloseOpen(true)}
                  className="cursor-pointer border border-[#d8e1d4] px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] rounded-md"
                >
                  Close Survey
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {!isDraft ? (
        <div className="flex items-start gap-3 border border-[#d8e1d4] bg-[#f7faf6] px-4 py-3 text-sm text-[#7b6542]">
          <LockOutlinedIcon fontSize="small" className="mt-0.5 text-[#7b6542]" />
          <p>
            This survey is {SURVEY_STATUS_LABELS[survey.status].toLowerCase()} — its questions are read-only.
            Versioning is not supported in v1; create a new survey to change the questions.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Questions */}
        <SectionCard
          title={`Questions (${orderedQuestions.length})`}
          action={
            editable ? (
              <button
                type="button"
                onClick={() => {
                  setActiveQuestion(null)
                  setQuestionError(null)
                  setQuestionApiErrors(undefined)
                  setQuestionOpen(true)
                }}
                className="inline-flex cursor-pointer items-center gap-2 border border-[#d8e1d4] px-3 py-2 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] rounded-md"
              >
                <AddRoundedIcon fontSize="small" />
                Add question
              </button>
            ) : undefined
          }
        >
          <div className="mb-4 border border-[#d8e1d4] bg-[#f7faf6] px-4 py-3 text-xs text-[#6a7f6d]">
            Every survey automatically begins with a required GAD demographic block (sex, plus optional age
            group and sector). It is not editable here and is not part of the question list.
          </div>

          {orderedQuestions.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#617462]">
              No questions yet. Add at least one before deploying.
            </p>
          ) : (
            <ul className="divide-y divide-[#eef2eb]">
              {orderedQuestions.map((question, index) => (
                <li key={question.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#123524]">
                      {index + 1}. {question.questionText}
                      {question.required ? <span className="text-[#9f2f2f]"> *</span> : null}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex border border-[#d8e1d4] bg-[#f7faf6] px-2.5 py-1 text-xs font-medium text-[#123524]">
                        {QUESTION_TYPE_LABELS[question.questionType]}
                      </span>
                      <span className="inline-flex border border-[#d8e1d4] bg-[#f7faf6] px-2.5 py-1 text-xs font-medium text-[#617462]">
                        Weight {question.weight}
                      </span>
                      <span className="inline-flex border border-[#bfd3c0] bg-[#f3f9f2] px-2.5 py-1 text-xs font-medium text-[#1f5d3b]">
                        {question.needCategoryName ?? 'Uncategorized'}
                      </span>
                    </div>
                    {question.options.length > 0 ? (
                      <p className="mt-2 text-xs text-[#6a7f6d]">
                        Options: {question.options.map((option) => option.label).join(', ')}
                      </p>
                    ) : null}
                  </div>

                  {editable ? (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        aria-label={`Move question ${index + 1} up`}
                        title="Move up"
                        disabled={index === 0 || reorderingId !== null}
                        onClick={() => void moveQuestion(question, -1)}
                        className={iconButtonClassName}
                      >
                        <ArrowUpwardRoundedIcon fontSize="small" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move question ${index + 1} down`}
                        title="Move down"
                        disabled={index === orderedQuestions.length - 1 || reorderingId !== null}
                        onClick={() => void moveQuestion(question, 1)}
                        className={iconButtonClassName}
                      >
                        <ArrowDownwardRoundedIcon fontSize="small" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit question ${index + 1}`}
                        title="Edit"
                        onClick={() => {
                          setActiveQuestion(question)
                          setQuestionError(null)
                          setQuestionApiErrors(undefined)
                          setQuestionOpen(true)
                        }}
                        className={iconButtonClassName}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete question ${index + 1}`}
                        title="Delete"
                        onClick={() => setDeleteTarget(question)}
                        className={destructiveIconButtonClassName}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Right panel */}
        <div className="space-y-6">
          <SectionCard
            title="Survey details"
            action={
              canManageRole && survey.status !== 'closed' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMetaError(null)
                    setMetaApiErrors(undefined)
                    setMetaOpen(true)
                  }}
                  className="inline-flex cursor-pointer items-center gap-2 border border-[#d8e1d4] px-3 py-2 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] rounded-md"
                >
                  <EditOutlinedIcon fontSize="small" />
                  Edit
                </button>
              ) : undefined
            }
          >
            <dl className="divide-y divide-[#eef2eb]">
              {[
                ['Community', survey.communityName],
                ['Status', SURVEY_STATUS_LABELS[survey.status]],
                ['Opens', formatDateTime(survey.opensAt)],
                ['Closes', formatDateTime(survey.closesAt)],
                ['Target responses', survey.targetResponses === null ? '-' : String(survey.targetResponses)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">{label}</dt>
                  <dd className="text-right text-sm text-[#123524]">{value}</dd>
                </div>
              ))}
            </dl>
            {survey.description ? (
              <p className="mt-3 text-sm leading-6 text-[#506552]">{survey.description}</p>
            ) : null}
          </SectionCard>

          <SectionCard title="Questions per category">
            {categoryCounts.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#617462]">No questions yet.</p>
            ) : (
              <ul className="divide-y divide-[#eef2eb]">
                {categoryCounts.map(([name, count]) => (
                  <li key={name} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-[#123524]">{name}</span>
                    <span className="text-sm font-medium text-[#1f5d3b]">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {publicLink ? (
            <SectionCard title="Public link">
              <p className="break-all border border-[#d8e1d4] bg-[#f7faf6] px-3 py-2 font-mono text-xs text-[#123524]">
                {publicLink}
              </p>
              <button
                type="button"
                onClick={() => void copyLink()}
                className="mt-3 inline-flex cursor-pointer items-center gap-2 border border-[#d8e1d4] px-3 py-2 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] rounded-md"
              >
                <ContentCopyRoundedIcon fontSize="small" />
                Copy link
              </button>
              <p className="mt-2 text-xs text-[#6a7f6d]">
                Share this link with respondents. It opens the mobile-first public form — no sign-in required.
              </p>
            </SectionCard>
          ) : null}
        </div>
      </div>

      <SurveyFormModal
        key={metaOpen ? 'meta-open' : 'meta-closed'}
        open={metaOpen}
        mode="edit"
        survey={survey}
        communities={communities}
        communityLocked={survey.status !== 'draft'}
        loading={metaLoading}
        errorMessage={metaError}
        apiErrors={metaApiErrors}
        onClose={() => {
          if (!metaLoading) setMetaOpen(false)
        }}
        onSubmit={handleMetaSubmit}
      />

      <QuestionFormModal
        key={`${activeQuestion?.id ?? 'new'}-${questionOpen ? 'open' : 'closed'}`}
        open={questionOpen}
        question={activeQuestion}
        categories={categories}
        loading={questionLoading}
        errorMessage={questionError}
        apiErrors={questionApiErrors}
        onClose={() => {
          if (!questionLoading) {
            setQuestionOpen(false)
            setActiveQuestion(null)
          }
        }}
        onSubmit={handleQuestionSubmit}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete question"
        description={deleteTarget ? `"${deleteTarget.questionText}" will be removed.` : undefined}
        confirmLabel="Delete question"
        loadingLabel="Deleting..."
        destructive
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
        onConfirm={handleDeleteQuestion}
      />

      <ConfirmModal
        open={deployOpen}
        title="Deploy survey"
        description="Deploying generates the public link and locks the questions."
        confirmLabel="Deploy survey"
        loadingLabel="Deploying..."
        loading={deployLoading}
        onClose={() => {
          if (!deployLoading) setDeployOpen(false)
        }}
        onConfirm={handleDeploy}
      >
        <div className="border border-[#d8e1d4] bg-[#f7faf6] px-4 py-3 text-sm text-[#7b6542]">
          Once deployed, questions can no longer be added, edited, or removed (v1 has no survey versioning).
          You can still adjust the title, dates, and target responses.
        </div>
      </ConfirmModal>

      <ConfirmModal
        open={closeOpen}
        title="Close survey"
        description="Closing stops accepting new responses."
        confirmLabel="Close survey"
        loadingLabel="Closing..."
        loading={closeLoading}
        onClose={() => {
          if (!closeLoading) setCloseOpen(false)
        }}
        onConfirm={handleClose}
      >
        <div className="border border-[#d8e1d4] bg-[#f7faf6] px-4 py-3 text-sm text-[#7b6542]">
          The public link will show a "survey closed" message and the server will reject further submissions.
        </div>
      </ConfirmModal>
    </div>
  )
}

/** Rebuilds a question's full payload (PATCH sends every field) with a new order index. */
function toPayload(question: SurveyQuestion, orderIndex: number): QuestionPayload {
  return {
    questionText: question.questionText,
    questionType: question.questionType,
    options: question.options.length > 0 ? question.options : null,
    weight: question.weight,
    needCategoryId: question.needCategoryId,
    required: question.required,
    orderIndex,
  }
}
