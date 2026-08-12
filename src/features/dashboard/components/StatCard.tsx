import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

const CARD_CLASS_NAME = 'block border border-[#d8e1d4] bg-white p-5 rounded-md'

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
        <p className="text-sm text-[#617462]">{label}</p>
        <span className="text-[#60755f]" aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] tabular-nums text-[#123524]">{value}</p>
      {hint ? <p className="mt-2 text-xs text-[#6a7f6d]">{hint}</p> : null}
    </>
  )

  if (!to) {
    return <section className={CARD_CLASS_NAME}>{body}</section>
  }

  return (
    <Link to={to} className={`${CARD_CLASS_NAME} transition-colors hover:bg-[#fbfdf9]`}>
      {body}
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#1f5d3b]">
        View all
        <ArrowForwardRoundedIcon fontSize="small" />
      </span>
    </Link>
  )
}
