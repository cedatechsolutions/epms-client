import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

const CARD_CLASS_NAME = 'block border border-line bg-surface p-5 rounded-lg'

type StatCardProps = {
  label: string
  value: string
  /** Secondary line under the value — the breakdown that makes the headline number actionable. */
  hint?: ReactNode
  icon: ReactNode
  /** When set, the whole card becomes the drill-down into the list behind the number. */
  to?: string
}

/**
 * One KPI tile (UI guidelines §5.2 stats grid). Linked tiles are anchors, not click handlers, so
 * the drill-down is keyboard-reachable and opens in a new tab like any other link.
 */
export default function StatCard({ label, value, hint, icon, to }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        <span className="text-icon-muted" aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-2 text-xs text-muted-alt">{hint}</p> : null}
    </>
  )

  if (!to) {
    return <section className={CARD_CLASS_NAME}>{body}</section>
  }

  return (
    <Link to={to} className={`${CARD_CLASS_NAME} transition-colors hover:bg-row-hover`}>
      {body}
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-accent">
        View all
        <ArrowForwardRoundedIcon fontSize="small" />
      </span>
    </Link>
  )
}
