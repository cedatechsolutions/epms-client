import { isApiError } from '@/shared/api/http'
import { downloadBlob } from '@/shared/download'
import { notify } from '@/shared/toast'
import { downloadReport } from '../api/reportsApi'
import type { GeneratedReport } from '../types'

export function getReportErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message || 'Something went wrong. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}

/**
 * Downloads a report that has just been archived. Generation and download are separate requests, so
 * a failed download must not read as a failed generation: the file exists in the archive either way,
 * and the toast says so rather than inviting a duplicate.
 */
export async function deliverGeneratedReport(report: GeneratedReport, noun: string): Promise<void> {
  try {
    const blob = await downloadReport(report.id)
    downloadBlob(blob, report.filename)
    notify.success(`${noun} generated and saved to the archive.`)
  } catch {
    notify.warning(`${noun} was generated and archived, but the download failed. Download it from the archive below.`)
  }
}

/** Today's date in Asia/Manila as `YYYY-MM-DD` — the certificate issue date default. */
export function todayInManila(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
