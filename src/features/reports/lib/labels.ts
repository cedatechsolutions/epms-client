import type { ReportableProgram } from '../types'

export const PROGRAM_STATUS_SHORT_LABELS: Record<ReportableProgram['status'], string> = {
  approved: 'Approved',
  ongoing: 'Ongoing',
  completed: 'Completed',
}

export const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  docx: 'Word',
  xlsx: 'Excel',
  zip: 'ZIP',
}
