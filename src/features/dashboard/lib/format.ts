import { isApiError } from '@/shared/api/http'

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatDateTime(value: string | null): string {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** Assessment scores are on the survey's 1–5 scale; show two decimals as the results screen does. */
export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return value.toFixed(2)
}

/** Compact relative age for the activity feed; falls back to the absolute stamp past a week. */
export function formatRelativeTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return formatDateTime(value)
}

export function getDashboardErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 403) {
      return 'You do not have access to the dashboard overview.'
    }
    return error.message || 'Could not load the dashboard.'
  }
  return 'Could not load the dashboard. Check your connection and try again.'
}

/**
 * Coverage of a program's beneficiary target. A program that never set a target reports "-", not
 * 0% — the server deliberately leaves `targetBeneficiaries` null so the client can say "unknown"
 * instead of inventing a denominator.
 */
export function formatCoverage(actual: number, target: number | null): string {
  if (target === null || target === undefined || target <= 0) return '-'
  return `${Math.round((actual / target) * 100)}%`
}

export function formatShare(value: number, total: number): string {
  if (total <= 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

/**
 * Mirrors `DashboardController.filename()` so a downloaded snapshot is named the same whether the
 * browser or the server labelled it — these land in shared drives beside a dozen siblings.
 */
export function dashboardExportFilename(periodLabel: string | null, format: string): string {
  const slug = (periodLabel ?? 'all periods')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const today = new Date().toISOString().slice(0, 10)
  return `cems-dashboard-${slug}-${today}.${format}`
}

export function getMonitoringErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 403) {
      return 'Your account cannot open the campus-wide monitoring dashboard.'
    }
    if (error.status === 404) {
      return 'That academic period no longer exists. Pick another period.'
    }
    return error.message || 'Could not load the monitoring dashboard.'
  }
  return 'Could not load the monitoring dashboard. Check your connection and try again.'
}
