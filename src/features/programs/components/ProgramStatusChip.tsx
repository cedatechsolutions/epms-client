import { PROGRAM_STATUS_LABELS, PROGRAM_STATUS_TONES, type ProgramStatus } from '../types'

/**
 * Status badge for a proposal, using the four sanctioned decision-status tones (UI guidelines §6.4).
 * Unknown statuses fall back to the neutral tone rather than rendering unstyled — a status added
 * server-side should degrade, not break the row.
 */
export default function ProgramStatusChip({ status }: { status: ProgramStatus }) {
  const tone = PROGRAM_STATUS_TONES[status] ?? 'border-line bg-surface-tint text-muted'
  const label = PROGRAM_STATUS_LABELS[status] ?? status

  return (
    <span className={['inline-flex whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium', tone].join(' ')}>
      {label}
    </span>
  )
}
