import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import { formatDateTime, formatDecimal } from '../lib/format'
import {
  RECOMMENDATION_STATUS_LABELS,
  type DecisionKind,
  type Recommendation,
  type RecommendationStatus,
} from '../types'
import ScoreBar from './ScoreBar'

/** Status chip tones — the §6.4 chip set, matched to the priority-chip weights. */
const STATUS_TONES: Record<RecommendationStatus, string> = {
  pending: 'border-[#d8e1d4] bg-[#f7faf6] text-[#617462]',
  accepted: 'border-[#bfd3c0] bg-[#f3f9f2] text-[#1f5d3b]',
  modified: 'border-[#d8e1d4] bg-[#f7faf6] text-[#7b6542]',
  rejected: 'border-[#e3c9c9] bg-[#fff5f5] text-[#8a2d2d]',
}

const chipClassName = 'inline-flex border px-2.5 py-1 text-xs font-medium'
const neutralChipClassName = `${chipClassName} border-[#d8e1d4] bg-[#f7faf6] text-[#123524]`
const successChipClassName = `${chipClassName} border-[#bfd3c0] bg-[#f3f9f2] text-[#1f5d3b]`

const secondaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-[#d8e1d4] px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-60 rounded-md'
const primaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60 rounded-md'
const destructiveButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-[#e3c9c9] px-4 py-2.5 text-sm font-medium text-[#9f2f2f] transition-colors hover:bg-[#fff7f7] disabled:cursor-not-allowed disabled:opacity-60 rounded-md'

type RecommendationCardProps = {
  recommendation: Recommendation
  canDecide: boolean
  onDecide: (recommendation: Recommendation, decision: DecisionKind) => void
  onExplain: (recommendation: Recommendation) => void
}

export default function RecommendationCard({
  recommendation,
  canDecide,
  onDecide,
  onExplain,
}: RecommendationCardProps) {
  const breakdown = recommendation.breakdown
  const decided = recommendation.status !== 'pending'
  const contributingCategories = (breakdown?.categories ?? []).filter((category) => category.contribution > 0)
  const matchedSectors = breakdown?.matchedSectors ?? []

  return (
    <li className="border border-[#d8e1d4] bg-white">
      <div className="flex flex-col gap-4 border-b border-[#e7eee3] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#d8e1d4] bg-[#f7faf6] text-sm font-semibold text-[#123524]">
            {recommendation.rank}
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#123524]">
              {recommendation.programTypeName}
            </h3>
            {recommendation.programTypeDescription ? (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#506552]">
                {recommendation.programTypeDescription}
              </p>
            ) : null}
            {recommendation.defaultDuration ? (
              <p className="mt-1 text-xs text-[#6a7f6d]">Typical duration: {recommendation.defaultDuration}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 lg:flex-col lg:items-end">
          <span className={[chipClassName, STATUS_TONES[recommendation.status]].join(' ')}>
            {RECOMMENDATION_STATUS_LABELS[recommendation.status]}
          </span>
        </div>
      </div>

      <div className="space-y-5 px-5 py-4">
        <div>
          <div className="flex items-end justify-between gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">Match score</p>
            <p className="text-3xl font-semibold tracking-[-0.03em] text-[#123524] tabular-nums">
              {formatDecimal(recommendation.matchScore)}
              <span className="ml-1 text-sm font-medium text-[#617462]">/ 100</span>
            </p>
          </div>
          <div className="mt-2">
            <ScoreBar
              score={recommendation.matchScore}
              tone={recommendation.status === 'rejected' ? 'muted' : 'primary'}
              label={`Match score for ${recommendation.programTypeName}`}
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Needs addressed</p>
          {contributingCategories.length === 0 ? (
            <p className="mt-2 text-sm text-[#617462]">
              This program type is not weighted against any need the survey measured.
            </p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {contributingCategories.map((category) => (
                <li key={category.needCategoryId} className={neutralChipClassName}>
                  {category.needCategoryName}
                  <span className="ml-1.5 font-normal text-[#617462]">{formatDecimal(category.avgScore)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Sector fit</p>
          {matchedSectors.length === 0 ? (
            <p className="mt-2 text-sm text-[#617462]">
              No overlap with this community&apos;s target sectors, so no bonus was applied.
            </p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {matchedSectors.map((sector) => (
                <li key={sector} className={successChipClassName}>
                  {sector}
                </li>
              ))}
            </ul>
          )}
        </div>

        {decided ? (
          <div className="border border-[#d8e1d4] bg-[#f7faf6] px-4 py-3">
            <p className="text-sm font-medium text-[#123524]">
              {RECOMMENDATION_STATUS_LABELS[recommendation.status]}
              {recommendation.decidedByName ? ` by ${recommendation.decidedByName}` : ''}
              {recommendation.decidedAt ? ` · ${formatDateTime(recommendation.decidedAt)}` : ''}
            </p>
            {recommendation.decisionNote ? (
              <p className="mt-1 text-sm leading-6 text-[#506552]">{recommendation.decisionNote}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-[#e7eee3] bg-[#fbfdf9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={() => onExplain(recommendation)} className={secondaryButtonClassName}>
          <HelpOutlineRoundedIcon fontSize="small" />
          Why this score?
        </button>

        {decided ? null : canDecide ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => onDecide(recommendation, 'reject')}
              className={destructiveButtonClassName}
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => onDecide(recommendation, 'modify')}
              className={secondaryButtonClassName}
            >
              Accept with changes
            </button>
            <button
              type="button"
              onClick={() => onDecide(recommendation, 'accept')}
              className={primaryButtonClassName}
            >
              Accept
            </button>
          </div>
        ) : (
          <span className="inline-flex border border-[#d8e1d4] bg-[#f7faf6] px-3 py-2 text-xs font-medium text-[#617462]">
            Read only
          </span>
        )}
      </div>
    </li>
  )
}
