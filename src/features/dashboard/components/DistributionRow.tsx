import ScoreBar from '@/features/recommendations/components/ScoreBar'
import { formatNumber } from '../lib/format'

/**
 * One row of a count distribution: label, exact count, and the share of the whole as a meter.
 * The meter is the shared `ScoreBar` (UI guidelines §6.9) — the count and percentage beside it are
 * the source of truth; the segments only give the shape of the distribution at a glance.
 */
export default function DistributionRow({
  label,
  value,
  total,
  tone = 'primary',
}: {
  label: string
  value: number
  total: number
  tone?: 'primary' | 'muted'
}) {
  const share = total > 0 ? (value / total) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-[#445846]">{label}</span>
        <span className="flex items-baseline gap-2">
          <span className="text-sm font-medium tabular-nums text-[#123524]">{formatNumber(value)}</span>
          <span className="text-xs tabular-nums text-[#6a7f6d]">{share.toFixed(1)}%</span>
        </span>
      </div>
      <ScoreBar score={share} tone={tone} label={`${label} share`} />
    </div>
  )
}
