import type { ScoreBreakdown } from '../types'

export { formatDateTime, formatDecimal } from '@/features/surveys/lib/format'
export { getSurveyErrorMessage as getRecommendationErrorMessage } from '@/features/surveys/lib/format'

/**
 * Re-derives the match score from the stored breakdown alone.
 *
 * <p>This mirrors `RecommendationScoringService` exactly — contributions are already rounded to 2dp
 * server-side, so summing them reproduces `rawScore`. The explainer renders this next to the stored
 * value so a coordinator (or an auditor) can see the number reconcile rather than take it on trust.
 */
export function recomputeMatchScore(breakdown: ScoreBreakdown): number {
  if (breakdown.maxTheoretical <= 0) return 0

  const raw = breakdown.categories.reduce((sum, category) => sum + category.contribution, 0)
  return Math.min(100, ((raw + breakdown.sectorBonus) / breakdown.maxTheoretical) * 100)
}

/** Rounding tolerance when comparing the recomputed score against the stored one. */
const RECONCILE_TOLERANCE = 0.05

export function reconcilesWithStoredScore(breakdown: ScoreBreakdown): boolean {
  return Math.abs(recomputeMatchScore(breakdown) - breakdown.matchScore) <= RECONCILE_TOLERANCE
}

/** Sum of the per-category contributions — shown as the raw-score subtotal in the explainer. */
export function sumContributions(breakdown: ScoreBreakdown): number {
  return breakdown.categories.reduce((sum, category) => sum + category.contribution, 0)
}
