/** Mobile-first shell — no sidebar, no auth chrome (spec: public pages are standalone). */
export default function PublicShell({
  subtitle = 'Community Needs Assessment',
  children,
}: {
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-[#f4f7f1] px-4 py-8 text-[#123524]">
      <div className="mx-auto w-full max-w-[640px] space-y-6">
        <header className="border border-[#d8e1d4] bg-white px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">
            Cavite State University – Bacoor Campus
          </p>
          <p className="mt-1 text-sm font-medium text-[#123524]">{subtitle}</p>
        </header>
        {children}
      </div>
    </main>
  )
}
