import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import { useState, type FormEvent } from 'react'
import AdminDialog from '@/features/users/components/AdminDialog'
import { importAttendanceCsv } from '../api/programsApi'
import { getProgramErrorMessage } from '../lib/errorMessages'
import { formatNumber } from '../lib/format'
import type { AttendanceImportResult } from '../types'

type AttendanceImportModalProps = {
  open: boolean
  activityId: string | null
  activityTitle: string | null
  onClose: () => void
  /** Called once rows have landed, so the parent can refresh totals and the program status. */
  onImported: () => void
}

/** Matches the server's limit (`LocalDiskStorageService.MAX_SIZE_BYTES`). */
const MAX_SIZE_BYTES = 10 * 1024 * 1024

const inputClassName =
  'w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors file:mr-3 file:cursor-pointer file:border-0 file:bg-transparent file:text-sm file:text-primary-accent focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint rounded-md'

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

/**
 * CSV attendance import (spec Module 5b AC 4).
 *
 * <p>The import is **partial**, and this dialog is built around that: after upload it stays open and
 * shows what landed alongside a per-row table of what did not. Treating a rejected row as a failed
 * request would be wrong twice over — the good rows really were saved, and the user would lose the
 * only report telling them which lines to fix.
 */
export default function AttendanceImportModal({
  open,
  activityId,
  activityTitle,
  onClose,
  onImported,
}: AttendanceImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<AttendanceImportResult | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activityId) return
    if (!file) {
      setErrorMessage('Please choose a CSV file to import.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage('That file is larger than the 10 MB limit.')
      return
    }

    setLoading(true)
    setErrorMessage(null)
    try {
      const imported = await importAttendanceCsv(activityId, file)
      setResult(imported)
      if (imported.imported > 0) {
        onImported()
      }
    } catch (error) {
      setErrorMessage(getProgramErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return
    setFile(null)
    setResult(null)
    setErrorMessage(null)
    onClose()
  }

  return (
    <AdminDialog
      open={open}
      title="Import attendance from CSV"
      description={
        activityTitle
          ? `Columns: name, sex, age, sector — for "${activityTitle}".`
          : 'Columns: name, sex, age, sector.'
      }
      maxWidthClassName="max-w-3xl"
      closeDisabled={loading}
      onClose={handleClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="cursor-pointer border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            {result ? 'Done' : 'Cancel'}
          </button>
          {result ? null : (
            <button
              type="submit"
              form="attendance-import-form"
              disabled={loading}
              className="inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
            >
              {loading ? <ButtonSpinner /> : null}
              {loading ? 'Importing...' : 'Import'}
            </button>
          )}
        </div>
      }
    >
      {result ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-md border border-success-border bg-success-bg px-4 py-3 text-sm text-primary-accent">
            <CheckCircleOutlineRoundedIcon fontSize="small" className="mt-0.5 shrink-0" />
            <p>
              {formatNumber(result.imported)} row{result.imported === 1 ? '' : 's'} imported
              {result.skipped > 0 ? `, ${formatNumber(result.skipped)} skipped.` : '.'} The activity
              now has {formatNumber(result.totals.total)} attendees —{' '}
              {formatNumber(result.totals.female)} female, {formatNumber(result.totals.male)} male.
            </p>
          </div>

          {result.errors.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-label">
                Rows that were not imported
              </p>
              <div className="overflow-hidden rounded-md border border-divider">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="border-b border-divider bg-surface-tint text-left text-xs font-semibold uppercase tracking-[0.12em] text-label">
                      <th className="px-4 py-3 w-20">Line</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Row content</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((rowError) => (
                      <tr
                        key={`${rowError.line}-${rowError.content}`}
                        className="border-b border-row-divider text-sm text-cell last:border-b-0"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-cell-strong">{rowError.line}</td>
                        <td className="px-4 py-3 text-danger-text">{rowError.message}</td>
                        <td className="px-4 py-3 font-mono text-xs text-cell-strong">
                          {rowError.content}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted-alt">
                Line numbers count the header row, so they match what you see in your spreadsheet.
                Fix these rows and import the corrected file — the rows above were already saved and
                will not be duplicated by re-importing only the failures.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <form id="attendance-import-form" onSubmit={handleSubmit} className="space-y-5">
          {errorMessage ? (
            <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
              {errorMessage}
            </div>
          ) : null}

          <div className="rounded-md border border-info-border bg-info-bg px-4 py-3 text-sm text-info-text">
            <p className="font-medium">Expected format</p>
            <pre className="mt-2 overflow-x-auto text-xs leading-6">
{`name,sex,age,sector
Maria Santos,female,34,Farmers
Jose Rizal,male,29,`}
            </pre>
            <p className="mt-2 text-xs leading-6">
              A header row is detected and skipped. Sex accepts <strong>female/f/babae</strong> or{' '}
              <strong>male/m/lalaki</strong>; anything else is reported rather than guessed. Age and
              sector may be blank.
            </p>
          </div>

          <div>
            <label htmlFor="attendance-csv" className="mb-2 block text-sm font-medium text-ink">
              CSV file
            </label>
            <input
              id="attendance-csv"
              type="file"
              accept=".csv,text/csv"
              disabled={loading}
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null)
                setErrorMessage(null)
              }}
              className={inputClassName}
            />
          </div>
        </form>
      )}
    </AdminDialog>
  )
}
