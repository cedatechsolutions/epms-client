import { isApiError } from '@/shared/api/http'

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

/** Converts an ISO instant to the value a datetime-local input expects (yyyy-MM-ddTHH:mm). */
export function toDateTimeLocal(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

/** Converts a datetime-local input value back to an ISO instant, or null when empty. */
export function fromDateTimeLocal(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** Filesystem-safe form of a survey title — mirrors SurveyReportService.slug on the backend. */
export function slugifyTitle(title: string): string {
  const slug = title.trim().replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return slug || 'survey'
}

/** Score/percentage values arrive as JSON numbers; render them at a fixed precision. */
export function formatDecimal(value: number | null, fractionDigits = 2): string {
  if (value === null || Number.isNaN(value)) return '-'
  return value.toFixed(fractionDigits)
}

export function getSurveyErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message || 'Something went wrong. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}
