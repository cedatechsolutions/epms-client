import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { useId, useState } from 'react'
import type { Recommendation } from '../types'
import AiDraftDetails, { AiDraftBadge } from './AiDraftDetails'

const smallButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-line bg-surface px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60'

function Spinner() {
  return <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-line border-t-primary-accent" />
}

type AiDraftPanelProps = {
  recommendation: Recommendation
  /** The caller may request drafts (decide roles) — and the recommendation is still undecided. */
  canRequest: boolean
  requesting: boolean
  onRequest: (recommendation: Recommendation) => void
}

/**
 * The AI-draft block inside a recommendation card (UI guidelines §6.17). Renders nothing when AI
 * drafting is off. States: none yet (offer to draft), pending (spinner, polled by the page),
 * failed/refused (the server's message + Try again), ready (badge, title, expandable details,
 * Regenerate). The ranking above it is untouched by anything here.
 */
export default function AiDraftPanel({ recommendation, canRequest, requesting, onRequest }: AiDraftPanelProps) {
  const detailsId = useId()
  const [expanded, setExpanded] = useState(false)
  const draft = recommendation.draft

  if (!recommendation.draftingAvailable && (!draft || draft.status !== 'ready')) {
    return null
  }

  const requestButton = (label: string, icon: React.ReactNode) =>
    canRequest && recommendation.draftingAvailable ? (
      <button
        type="button"
        disabled={requesting}
        onClick={() => onRequest(recommendation)}
        className={smallButtonClassName}
      >
        {requesting ? <Spinner /> : icon}
        {requesting ? 'Requesting...' : label}
      </button>
    ) : null
  const draftIcon = <AutoAwesomeOutlinedIcon sx={{ fontSize: 16 }} />
  const retryIcon = <RefreshRoundedIcon sx={{ fontSize: 16 }} />

  return (
    <div className="rounded-md border border-line bg-surface-tint px-4 py-4" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-label">Proposal draft</p>

      {!draft ? (
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">No AI draft for this recommendation yet.</p>
          {requestButton('Draft proposal', draftIcon)}
        </div>
      ) : draft.status === 'pending' ? (
        <div className="mt-2 flex items-center gap-3 text-sm text-body" aria-busy="true">
          <Spinner />
          Drafting the proposal text... this usually takes under a minute.
        </div>
      ) : draft.status === 'ready' && draft.content ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <AiDraftBadge />
              <p className="text-base font-semibold tracking-[-0.01em] text-ink">{draft.content.title}</p>
              <p className="text-xs text-muted-alt">
                {draft.content.objectives.length} objectives · {draft.content.activities.length} activities
                {draft.content.suggestedDuration ? ` · ${draft.content.suggestedDuration}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={detailsId}
                onClick={() => setExpanded((current) => !current)}
                className={smallButtonClassName}
              >
                {expanded ? <ExpandLessRoundedIcon sx={{ fontSize: 16 }} /> : <ExpandMoreRoundedIcon sx={{ fontSize: 16 }} />}
                {expanded ? 'Hide draft' : 'Show draft'}
              </button>
              {requestButton('Regenerate', retryIcon)}
            </div>
          </div>
          {expanded ? (
            <div id={detailsId} className="border-t border-divider pt-4">
              <AiDraftDetails content={draft.content} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {draft.message ?? "Couldn't draft this one. Try again, or write it manually."}
          </p>
          {requestButton('Try again', retryIcon)}
        </div>
      )}
    </div>
  )
}
