import type { ReactNode } from 'react'

/**
 * Bordered white panel with the standard header strip (UI guidelines §5.2). Mirrors the
 * `SectionCard` used on the survey results screen so the two read as the same surface.
 */
export default function DashboardSection({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-lg overflow-hidden border border-line bg-surface">
      <div className="flex flex-col gap-3 border-b border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">{title}</h3>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}
