import { PRIORITY_LABELS, type NeedPriority } from '../types'

/** Priority chip tones (UI guidelines §6.4) — descending visual weight. */
const PRIORITY_TONES: Record<NeedPriority, string> = {
  critical: 'border-[#e3c9c9] bg-[#fff5f5] text-[#8a2d2d]',
  high: 'border-[#d8e1d4] bg-[#f7faf6] text-[#7b6542]',
  moderate: 'border-[#bfd3c0] bg-[#f3f9f2] text-[#1f5d3b]',
  low: 'border-[#d8e1d4] bg-[#f7faf6] text-[#617462]',
}

export default function PriorityBadge({ priority }: { priority: NeedPriority }) {
  return (
    <span className={['inline-flex border px-2.5 py-1 text-xs font-medium', PRIORITY_TONES[priority]].join(' ')}>
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  )
}
