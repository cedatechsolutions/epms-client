import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Link } from 'react-router'
import { CAMPUS_CONTACT } from '@/shared/config/campusContact'

/** Mobile-first shell — no sidebar, no auth chrome (spec: public pages are standalone). */
export default function PublicShell({
  subtitle = 'Community Needs Assessment',
  backTo,
  backLabel = 'Back',
  children,
}: {
  subtitle?: string
  /** Route for the header's back link. Omit on pages with nowhere to go back to (the survey form). */
  backTo?: string
  backLabel?: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-app px-4 py-8 text-ink">
      <div className="mx-auto w-full max-w-[640px] space-y-6">
        <header className="rounded-lg overflow-hidden border border-line bg-surface">
          {backTo ? (
            <div className="border-b border-divider px-5 py-3">
              <Link
                to={backTo}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-accent transition-colors hover:text-primary-hover"
              >
                <ArrowBackRoundedIcon fontSize="small" />
                {backLabel}
              </Link>
            </div>
          ) : null}

          <div className="flex items-center gap-3 px-5 py-4">
            <img
              src="/logo.png"
              alt="Cavite State University logo"
              className="brand-mark h-12 w-12 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">
                {CAMPUS_CONTACT.campusName}
              </p>
              <p className="mt-1 text-sm font-medium text-ink">{subtitle}</p>
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  )
}
