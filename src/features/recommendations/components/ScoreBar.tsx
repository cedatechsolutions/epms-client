/**
 * Match-score meter (UI guidelines §6.9).
 *
 * <p>Rendered as 20 fixed 5% segments rather than one bar with a computed width: Tailwind v4
 * extracts classes statically, so a dynamic `w-[73.33%]` would never be generated, and inline
 * `style` is reserved for the shared DataTable (§1). The exact value always sits next to the meter
 * as text, so the segments are an at-a-glance indicator, never the source of truth.
 */

const SEGMENT_COUNT = 20

const TONE_CLASSES = {
  primary: 'bg-primary',
  muted: 'bg-meter-muted',
} as const

export type ScoreBarTone = keyof typeof TONE_CLASSES

type ScoreBarProps = {
  /** 0–100. Values outside the range are clamped. */
  score: number
  tone?: ScoreBarTone
  label?: string
}

export default function ScoreBar({ score, tone = 'primary', label = 'Match score' }: ScoreBarProps) {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(score) ? score : 0))
  const filled = Math.round((clamped / 100) * SEGMENT_COUNT)

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-valuetext={`${clamped.toFixed(2)} out of 100`}
      className="flex h-2 w-full gap-px"
    >
      {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
        <span
          key={index}
          className={['flex-1', index < filled ? TONE_CLASSES[tone] : 'bg-skeleton'].join(' ')}
        />
      ))}
    </div>
  )
}
