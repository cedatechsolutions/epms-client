import { PRIORITY_LABELS, type NeedPriority } from '../types'

/** Priority chip tones (UI guidelines §6.4) — descending visual weight. */
const PRIORITY_TONES: Record<NeedPriority, string> = {
  critical: 'border-danger-border bg-danger-bg text-danger-text',
  high: 'border-line bg-surface-tint text-warning',
  moderate: 'border-success-border bg-success-bg text-primary-accent',
  low: 'border-line bg-surface-tint text-muted',
}

export default function PriorityBadge({ priority }: { priority: NeedPriority }) {
  return (
    <span className={['inline-flex border px-2.5 py-1 text-xs font-medium', PRIORITY_TONES[priority]].join(' ')}>
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  )
}
