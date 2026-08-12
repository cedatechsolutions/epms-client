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
    <section className="border border-[#d8e1d4] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#e7eee3] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#123524]">{title}</h3>
          {description ? <p className="mt-1 text-sm text-[#617462]">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}
