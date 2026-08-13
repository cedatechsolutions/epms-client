import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { hasAnyRole } from '@/features/auth/lib/access'
import { useAuthStore } from '@/features/auth/store/authStore'
import { getSurveyResults } from '@/features/surveys/api/surveysApi'
import type { SurveyResults } from '@/features/surveys/types'
import { notify } from '@/shared/toast'
import { decideRecommendation, generateRecommendations, listRecommendations } from '../api/recommendationsApi'
import DecisionModal from '../components/DecisionModal'
import RecommendationCard from '../components/RecommendationCard'
import ScoreBreakdownModal from '../components/ScoreBreakdownModal'
import { formatDateTime, getRecommendationErrorMessage } from '../lib/format'
import {
  RECOMMENDATION_DECIDE_ROLES,
  type DecisionKind,
  type Recommendation,
} from '../types'

const primaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60 rounded-md'
const secondaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-[#d8e1d4] px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-60 rounded-md'

function ButtonSpinner({ tone = 'dark' }: { tone?: 'light' | 'dark' }) {
  return (
    <span
      className={[
        'h-4 w-4 animate-spin rounded-full border-2',
        tone === 'light' ? 'border-white/35 border-t-white' : 'border-[#d8e1d4] border-t-[#1f5d3b]',
      ].join(' ')}
    />
  )
}

export default function RecommendationsPage() {
  const { id = '' } = useParams()
  const currentUser = useAuthStore((state) => state.user)
  const canDecide = hasAnyRole(currentUser, RECOMMENDATION_DECIDE_ROLES)

  const [results, setResults] = useState<SurveyResults | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const [explained, setExplained] = useState<Recommendation | null>(null)
  const [decisionTarget, setDecisionTarget] = useState<Recommendation | null>(null)
  const [decisionKind, setDecisionKind] = useState<DecisionKind>('accept')
  const [decisionLoading, setDecisionLoading] = useState(false)
  const [decisionError, setDecisionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setErrorMessage(null)
    try {
      const [loadedResults, loadedRecommendations] = await Promise.all([
        getSurveyResults(id),
        listRecommendations(id),
      ])
      setResults(loadedResults)
      setRecommendations(loadedRecommendations)
    } catch (error) {
      setErrorMessage(getRecommendationErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const handleGenerate = async () => {
    if (!id) return
    setGenerating(true)
    try {
      const generated = await generateRecommendations(id)
      setRecommendations(generated)
      notify.success(
        `${generated.length} program ${generated.length === 1 ? 'type' : 'types'} scored against this assessment.`,
      )
    } catch (error) {
      notify.error(getRecommendationErrorMessage(error))
    } finally {
      setGenerating(false)
    }
  }

  const openDecision = (recommendation: Recommendation, decision: DecisionKind) => {
    setDecisionTarget(recommendation)
    setDecisionKind(decision)
    setDecisionError(null)
  }

  const handleDecide = async (note: string | null) => {
    if (!decisionTarget) return
    setDecisionLoading(true)
    setDecisionError(null)
    try {
      const updated = await decideRecommendation(decisionTarget.id, decisionKind, note)
      setRecommendations((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setDecisionTarget(null)
      notify.success(`Recommendation for ${updated.programTypeName} recorded.`)
    } catch (error) {
      setDecisionError(getRecommendationErrorMessage(error))
    } finally {
      setDecisionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 border border-[#d8e1d4] bg-white px-5 py-4 text-sm text-[#506552]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#d8e1d4] border-t-[#1f5d3b]" />
        Loading recommendations...
      </div>
    )
  }

  if (errorMessage || !results) {
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
          {errorMessage ?? 'Recommendations not found.'}
        </div>
        <button type="button" onClick={() => void load()} className={secondaryButtonClassName}>
          Retry
        </button>
      </div>
    )
  }

  const decidedCount = recommendations.filter((item) => item.status !== 'pending').length
  const acceptedCount = recommendations.filter(
    (item) => item.status === 'accepted' || item.status === 'modified',
  ).length
  const pendingCount = recommendations.length - decidedCount
  const topScore = recommendations.length === 0 ? null : Math.max(...recommendations.map((item) => item.matchScore))

  const summaryCards: { label: string; value: string }[] = [
    { label: 'Program types scored', value: String(recommendations.length) },
    { label: 'Accepted', value: String(acceptedCount) },
    { label: 'Pending decision', value: String(pendingCount) },
    { label: 'Best match', value: topScore === null ? '-' : `${topScore.toFixed(2)} / 100` },
  ]

  return (
    <div className="space-y-6">
      <Link
        to={`/admin/surveys/${results.surveyId}/results`}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#1f5d3b] hover:underline"
      >
        <ArrowBackRoundedIcon fontSize="small" />
        Back to assessment results
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">
            Program recommendations
          </p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#123524]">{results.title}</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#506552]">
            {results.communityName} ·{' '}
            {results.finalized
              ? `Assessment finalized ${formatDateTime(results.finalizedAt)}`
              : 'Assessment not finalized yet'}
          </p>
        </div>

        {canDecide ? (
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={generating || !results.finalized}
            title={results.finalized ? undefined : 'Finalize the assessment results first'}
            className={primaryButtonClassName}
          >
            {generating ? <ButtonSpinner tone="light" /> : <AutoAwesomeOutlinedIcon fontSize="small" />}
            {generating
              ? 'Scoring...'
              : recommendations.length === 0
                ? 'Generate Recommendations'
                : 'Regenerate'}
          </button>
        ) : null}
      </div>

      {results.finalized ? (
        <div className="flex items-start gap-3 border border-[#d8e1d4] bg-[#f7faf6] px-4 py-3 text-sm text-[#7b6542]">
          <LockOutlinedIcon fontSize="small" className="mt-0.5 text-[#7b6542]" />
          <p>
            Scores come from a transparent weighting matrix, not a prediction model — every one can be
            traced back to the assessment figures through &quot;Why this score?&quot;. Regenerating replaces
            entries still awaiting a decision and leaves decided ones untouched.
          </p>
        </div>
      ) : (
        <div className="border border-[#d8e1d4] bg-[#f7faf6] px-4 py-3 text-sm text-[#7b6542]">
          Recommendations are generated from finalized figures so a decision can never rest on scores
          that later move. Finalize the assessment results first.
        </div>
      )}

      {recommendations.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="border border-[#d8e1d4] bg-white px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#123524] tabular-nums">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {recommendations.length === 0 ? (
        <div className="border border-[#d8e1d4] bg-white px-5 py-12 text-center">
          <p className="text-sm text-[#617462]">
            {results.finalized
              ? canDecide
                ? 'No recommendations yet. Generate them to score every active program type against this assessment.'
                : 'No recommendations have been generated for this assessment yet.'
              : 'Finalize the assessment results to unlock recommendations.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              canDecide={canDecide}
              onDecide={openDecision}
              onExplain={setExplained}
            />
          ))}
        </ul>
      )}

      <ScoreBreakdownModal
        open={explained !== null}
        recommendation={explained}
        onClose={() => setExplained(null)}
      />

      <DecisionModal
        key={decisionTarget ? `${decisionTarget.id}-${decisionKind}` : 'decision-closed'}
        open={decisionTarget !== null}
        decision={decisionKind}
        recommendation={decisionTarget}
        loading={decisionLoading}
        errorMessage={decisionError}
        onClose={() => {
          if (!decisionLoading) setDecisionTarget(null)
        }}
        onSubmit={handleDecide}
      />
    </div>
  )
}
