/**
 * Part-to-whole meter for sex-disaggregated counts (UI guidelines §6.11).
 *
 * <p>Built on the same 20-segment geometry as `ScoreBar` (§6.9) — Tailwind v4 extracts classes
 * statically, so a computed `w-[50.6%]` would never be generated, and inline `style` is reserved
 * for `DataTable`'s sticky offsets (§1). Segments are allocated by largest remainder so they always
 * total 20 and a non-zero part never renders as nothing.
 *
 * <p>Identity is never carried by color alone: the legend is always rendered, and it names every
 * part alongside its exact count and share. The fills are a single-hue lightness ramp from §3, which
 * is what keeps them separable under every colour-vision deficiency.
 */

const SEGMENT_COUNT = 20

/** Ordered darkest → lightest → mid; adjacent pairs are separated by lightness, not hue. */
const TONE_CLASSES = {
  primary: 'bg-[#1f5d3b]',
  muted: 'bg-[#9caf9a]',
  neutral: 'bg-[#617462]',
} as const

export type SplitMeterTone = keyof typeof TONE_CLASSES

export type SplitMeterPart = {
  label: string
  value: number
  tone: SplitMeterTone
}

type SplitMeterProps = {
  parts: SplitMeterPart[]
  /** Names the whole the parts divide, e.g. "Profiled population by sex". */
  label: string
  /** Renders `value` as-is; pass the same formatter the surrounding page uses. */
  formatValue?: (value: number) => string
}

function formatShare(value: number, total: number): string {
  if (total <= 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

/**
 * Largest-remainder allocation: floor every part, then hand the leftover segments to the parts with
 * the biggest fractional remainders. A part with a non-zero value always gets at least one segment,
 * so a small minority is visible rather than rounded away.
 */
function allocateSegments(values: number[], total: number): number[] {
  if (total <= 0) return values.map(() => 0)

  const exact = values.map((value) => (value / total) * SEGMENT_COUNT)
  const allocated = exact.map((value, index) => (values[index] > 0 ? Math.max(1, Math.floor(value)) : 0))

  let remaining = SEGMENT_COUNT - allocated.reduce((sum, value) => sum + value, 0)
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .filter(({ index }) => values[index] > 0)
    .sort((left, right) => right.remainder - left.remainder)

  // Hand out (or claw back, when the min-one-segment floor overshot) one segment at a time.
  for (let cursor = 0; remaining !== 0 && byRemainder.length > 0; cursor += 1) {
    const { index } = byRemainder[cursor % byRemainder.length]
    if (remaining > 0) {
      allocated[index] += 1
      remaining -= 1
    } else if (allocated[index] > 1) {
      allocated[index] -= 1
      remaining += 1
    }
  }

  return allocated
}

export default function SplitMeter({
  parts,
  label,
  formatValue = (value) => String(value),
}: SplitMeterProps) {
  const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0)
  const segments = allocateSegments(
    parts.map((part) => Math.max(0, part.value)),
    total,
  )

  const filled = parts.flatMap((part, index) =>
    Array.from({ length: segments[index] }, () => TONE_CLASSES[part.tone]),
  )

  const summary = parts
    .map((part) => `${part.label} ${formatValue(part.value)} (${formatShare(part.value, total)})`)
    .join(', ')

  return (
    <div className="space-y-3">
      <div role="img" aria-label={`${label}: ${total > 0 ? summary : 'no data recorded'}`} className="flex h-2 w-full gap-px">
        {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
          <span key={index} className={['flex-1', filled[index] ?? 'bg-[#edf3ea]'].join(' ')} />
        ))}
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {parts.map((part) => (
          <li key={part.label} className="flex items-center gap-2">
            <span aria-hidden="true" className={['h-2.5 w-2.5 shrink-0', TONE_CLASSES[part.tone]].join(' ')} />
            <span className="text-xs text-[#617462]">{part.label}</span>
            <span className="text-sm font-medium tabular-nums text-[#123524]">{formatValue(part.value)}</span>
            <span className="text-xs tabular-nums text-[#6a7f6d]">{formatShare(part.value, total)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
