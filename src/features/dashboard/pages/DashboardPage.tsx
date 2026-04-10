const summaryCards = [
  ['Active Users', '128'],
  ['Open Tickets', '24'],
  ['Conversion Rate', '18.2%'],
  ['Monthly Revenue', '$84,200'],
]

const recentActivity = [
  'New user account approved',
  'Quarterly report generated',
  'Inventory threshold alert resolved',
  'System backup completed successfully',
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:justify-end">
        <button
          type="button"
          className="border border-[#d8e1d4] bg-[#f7faf6] px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#edf4ea]"
        >
          August 2024
        </button>
        <button
          type="button"
          className="border border-[#d8e1d4] bg-[#f7faf6] px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#edf4ea]"
        >
          Manage Widgets
        </button>
        <button
          type="button"
          className="border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e]"
        >
          New
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(([label, value]) => (
          <section key={label} className="border border-[#d8e1d4] bg-white p-5">
            <p className="text-sm text-[#617462]">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#123524]">{value}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="border border-[#d8e1d4] bg-white p-6">
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#123524]">Recent Activity</h3>
          <div className="mt-5 space-y-4">
            {recentActivity.map((item) => (
              <div key={item} className="flex items-start gap-3 border-b border-[#eef2eb] pb-4 last:border-b-0 last:pb-0">
                <span className="mt-2 h-2 w-2 shrink-0 bg-[#1f5d3b]" />
                <p className="text-sm leading-6 text-[#506552]">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-[#d8e1d4] bg-white p-6">
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#123524]">Team Snapshot</h3>
          <p className="mt-3 text-sm leading-6 text-[#506552]">
            All systems are stable. No high-priority incidents today.
          </p>
          <button
            type="button"
            className="mt-6 w-full border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#18492e]"
          >
            View Full Report
          </button>
        </section>
      </div>
    </div>
  )
}
