import type { ReactNode } from 'react'

type AuthCardProps = {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

/** Centered auth card chrome (UI guidelines §5.3), shared by the auth pages. */
export default function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <main className="flex min-h-screen flex-col bg-app px-4 py-10 text-ink md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-1 items-center justify-center">
        <section className="w-full max-w-[420px] rounded-lg border border-line bg-surface p-8 shadow-card md:p-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
              Cavite State University
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-ink">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-body">{description}</p>
          </div>

          {children}

          {footer ? <div className="mt-6 text-sm text-body">{footer}</div> : null}
        </section>
      </div>
    </main>
  )
}
