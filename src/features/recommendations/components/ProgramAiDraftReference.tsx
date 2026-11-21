import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { useCallback, useEffect, useId, useState } from 'react'
import { isApiError } from '@/shared/api/http'
import { listRecommendations } from '../api/recommendationsApi'
import { formatDateTime, getRecommendationErrorMessage } from '../lib/format'
import type { RecommendationDraft } from '../types'
import AiDraftDetails, { AiDraftBadge } from './AiDraftDetails'

const smallButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-line px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60'

type ProgramAiDraftReferenceProps = {
  recommendationId: string
  surveyId: string
}

/**
 * "AI draft (reference)" on a program spawned from a drafted recommendation (UI guidelines
 * §6.17): the full original AI text, read-only, next to the proposal people actually edit. It
 * renders nothing when the recommendation had no ready draft, or when the viewer cannot see the
 * assessment it came from (403/404) — it is a reference, not part of the proposal.
 */
export default function ProgramAiDraftReference({ recommendationId, surveyId }: ProgramAiDraftReferenceProps) {
  const detailsId = useId()
  const [draft, setDraft] = useState<RecommendationDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const recommendations = await listRecommendations(surveyId)
      const source = recommendations.find((item) => item.id === recommendationId)
      setDraft(source?.draft?.status === 'ready' ? source.draft : null)
    } catch (error) {
      if (isApiError(error) && (error.status === 403 || error.status === 404)) {
        setDraft(null)
      } else {
        setErrorMessage(getRecommendationErrorMessage(error))
      }
    } finally {
      setLoading(false)
    }
  }, [recommendationId, surveyId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <div
        className="flex items-center gap-3 rounded-lg border border-line bg-surface px-5 py-4 text-sm text-body"
        aria-busy="true"
      >
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary-accent" />
        Checking for an AI draft...
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="space-y-3 rounded-lg border border-line bg-surface px-5 py-4">
        <div className="rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
          Couldn&apos;t load the AI draft: {errorMessage}
        </div>
        <button type="button" onClick={() => void load()} className={smallButtonClassName}>
          Retry
        </button>
      </div>
    )
  }

  if (!draft?.content) return null

  return (
    <section className="rounded-lg overflow-hidden border border-line bg-surface">
      <div className="flex flex-col gap-3 border-b border-divider px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">AI draft (reference)</h3>
          <p className="mt-1 text-xs text-muted-alt">
            The original AI text this proposal started from
            {draft.completedAt ? `, written ${formatDateTime(draft.completedAt)}` : ''}. Editing the proposal never
            changes it.
          </p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((current) => !current)}
          className={smallButtonClassName}
        >
          {expanded ? <ExpandLessRoundedIcon sx={{ fontSize: 16 }} /> : <ExpandMoreRoundedIcon sx={{ fontSize: 16 }} />}
          {expanded ? 'Hide' : 'Show'}
        </button>
      </div>
      <div className="space-y-3 px-5 py-4">
        <AiDraftBadge />
        <p className="text-base font-semibold tracking-[-0.01em] text-ink">{draft.content.title}</p>
        {expanded ? (
          <div id={detailsId} className="border-t border-divider pt-4">
            <AiDraftDetails content={draft.content} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
