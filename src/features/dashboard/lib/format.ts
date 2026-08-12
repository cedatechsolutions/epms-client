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
