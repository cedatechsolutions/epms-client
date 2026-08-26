import type { ReactNode } from 'react'
import { Link } from 'react-router'
import ScoreBar from '@/features/recommendations/components/ScoreBar'
import { formatNumber } from '../lib/format'

/**
 * One row of a count distribution: label, exact count, and the share of the whole as a meter.
 * The meter is the shared `ScoreBar` (UI guidelines §6.9) — the count and percentage beside it are
 * the source of truth; the segments only give the shape of the distribution at a glance.
 *
 * `to` turns the label into the drill-down for that slice, and is set only where the filtered list
 * behind it counts exactly these records (UI guidelines §6.15). `meta` carries the row's
 * sex-disaggregation under the label, which the GAD rule requires on every count surface.
 */
export default function DistributionRow({
  label,
  value,
  total,
  tone = 'primary',
  to,
  meta,
}: {
  label: string
  value: number
  total: number
  tone?: 'primary' | 'muted'
  to?: string
  meta?: ReactNode
}) {
  const share = total > 0 ? (value / total) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        {to ? (
          <Link to={to} className="rounded-md text-sm font-medium text-primary-accent hover:underline">
            {label}
          </Link>
        ) : (
          <span className="text-sm text-cell">{label}</span>
        )}
        <span className="flex items-baseline gap-2">
          <span className="text-sm font-medium tabular-nums text-ink">{formatNumber(value)}</span>
          <span className="text-xs tabular-nums text-muted-alt">{share.toFixed(1)}%</span>
        </span>
      </div>
      <ScoreBar score={share} tone={tone} label={`${label} share`} />
      {meta ? <p className="text-xs text-muted-alt">{meta}</p> : null}
    </div>
  )
}
