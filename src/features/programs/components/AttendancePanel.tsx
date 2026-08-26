import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import AdminDialog from '@/features/users/components/AdminDialog'
import { SplitMeter } from '@/shared/meter'
import { notify } from '@/shared/toast'
import { addAttendance, deleteAttendance, listAttendance } from '../api/programsApi'
import { getProgramErrorMessage } from '../lib/errorMessages'
import { formatNumber } from '../lib/format'
import {
  SEX_LABELS,
  type AttendanceRecord,
  type ProgramActivity,
  type Sector,
  type Sex,
  type SexSplit,
} from '../types'

type AttendancePanelProps = {
  open: boolean
  activity: ProgramActivity | null
  sectors: Sector[]
  /** False for readers who may not write (wrong role, wrong program stage, cancelled activity). */
  canRecord: boolean
  onClose: () => void
  /** Called after any change so the parent can refresh totals and the program's status. */
  onChanged: () => void
  onOpenImport: () => void
}

const inputClassName =
  'h-10 w-full border border-control-border bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

const selectClassName = `${inputClassName} cursor-pointer`
const labelClassName = 'mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-label'

function ButtonSpinner({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <span
      className={[
        'h-4 w-4 animate-spin rounded-full border-2',
        tone === 'light' ? 'border-white/35 border-t-white' : 'border-line border-t-primary-accent',
      ].join(' ')}
    />
  )
}

/**
 * Attendance encoding for one activity (spec Module 5b §4).
 *
 * <p>The entry row is deliberately **keyboard-first**: Enter submits, and focus returns to the name
 * field with the row cleared, so a coordinator typing up a paper sign-in sheet never reaches for the
 * mouse between attendees. Sex defaults to nothing and must be chosen — it is the column every GAD
 * figure is computed from, so defaulting it would silently invent data.
 *
 * <p>Names arrive as `null` for masked readers (student volunteers). The column renders "Hidden"
 * rather than an empty cell, so the reason is legible instead of looking like missing data.
 */
export default function AttendancePanel({
  open,
  activity,
  sectors,
  canRecord,
  onClose,
  onChanged,
  onOpenImport,
}: AttendancePanelProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [sex, setSex] = useState<Sex | ''>('')
  const [age, setAge] = useState('')
  const [sectorId, setSectorId] = useState('')
  const [adding, setAdding] = useState(false)
  const [entryError, setEntryError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const nameInputRef = useRef<HTMLInputElement>(null)
  const activityId = activity?.id ?? null

  const load = useCallback(async () => {
    if (!activityId) return
    setLoading(true)
    setErrorMessage(null)
    try {
      setRecords(await listAttendance(activityId))
    } catch (error) {
      setErrorMessage(getProgramErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [activityId])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  // Totals come from the rows on screen so the meter can never disagree with the table beneath it.
  const totals: SexSplit = records.reduce(
    (split, record) => ({
      total: split.total + 1,
      female: split.female + (record.sex === 'female' ? 1 : 0),
      male: split.male + (record.sex === 'male' ? 1 : 0),
    }),
    { total: 0, female: 0, male: 0 },
  )

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activityId) return

    if (!name.trim()) {
      setEntryError('An attendee name is required.')
      return
    }
    if (!sex) {
      setEntryError('Sex is required for every attendee.')
      return
    }

    setAdding(true)
    setEntryError(null)
    try {
      await addAttendance(activityId, {
        attendeeName: name.trim(),
        sex,
        age: age.trim() === '' ? null : Number(age),
        sectorId: sectorId || null,
      })
      // Clear and hand focus back so the next attendee can be typed straight in.
      setName('')
      setSex('')
      setAge('')
      await load()
      onChanged()
      nameInputRef.current?.focus()
    } catch (error) {
      setEntryError(getProgramErrorMessage(error))
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (recordId: string) => {
    if (!activityId) return
    setRemovingId(recordId)
    try {
      await deleteAttendance(activityId, recordId)
      await load()
      onChanged()
    } catch (error) {
      notify.error(getProgramErrorMessage(error))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <AdminDialog
      open={open}
      title={activity ? `Attendance — ${activity.title}` : 'Attendance'}
      description="Every attendee is recorded with their sex; the running split is shown below."
      maxWidthClassName="max-w-3xl"
      closeDisabled={adding}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {formatNumber(totals.total)} recorded · {formatNumber(totals.female)} F ·{' '}
            {formatNumber(totals.male)} M
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={adding}
            className="cursor-pointer border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            Done
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {errorMessage ? (
          <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
            {errorMessage}
          </div>
        ) : null}

        {totals.total > 0 ? (
          <div className="rounded-md border border-divider bg-row-hover px-4 py-4">
            <SplitMeter
              label={`Attendance for ${activity?.title ?? 'this activity'} by sex`}
              formatValue={formatNumber}
              parts={[
                { label: 'Female', value: totals.female, tone: 'primary' },
                { label: 'Male', value: totals.male, tone: 'muted' },
              ]}
            />
          </div>
        ) : null}

        {canRecord ? (
          <form onSubmit={handleAdd} className="rounded-md border border-divider bg-row-hover px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,1.2fr)_auto] sm:items-end">
              <div>
                <label htmlFor="attendance-name" className={labelClassName}>
                  Attendee name
                </label>
                <input
                  id="attendance-name"
                  ref={nameInputRef}
                  value={name}
                  disabled={adding}
                  onChange={(event) => {
                    setName(event.target.value)
                    setEntryError(null)
                  }}
                  placeholder="Full name"
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="attendance-sex" className={labelClassName}>
                  Sex
                </label>
                <select
                  id="attendance-sex"
                  value={sex}
                  disabled={adding}
                  onChange={(event) => {
                    setSex(event.target.value as Sex | '')
                    setEntryError(null)
                  }}
                  className={selectClassName}
                >
                  <option value="">Select</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>
              <div>
                <label htmlFor="attendance-age" className={labelClassName}>
                  Age
                </label>
                <input
                  id="attendance-age"
                  type="number"
                  min={0}
                  max={130}
                  value={age}
                  disabled={adding}
                  onChange={(event) => setAge(event.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="attendance-sector" className={labelClassName}>
                  Sector
                </label>
                <select
                  id="attendance-sector"
                  value={sectorId}
                  disabled={adding}
                  onChange={(event) => setSectorId(event.target.value)}
                  className={selectClassName}
                >
                  <option value="">None</option>
                  {sectors
                    .filter((sector) => sector.active)
                    .map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={adding}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
              >
                {adding ? <ButtonSpinner /> : null}
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>

            {entryError ? (
              <p className="mt-2 text-xs text-danger-strong">{entryError}</p>
            ) : (
              <p className="mt-2 text-xs text-muted-alt">
                Press Enter to add and start the next row.
              </p>
            )}

            <div className="mt-3 border-t border-divider pt-3">
              <button
                type="button"
                onClick={onOpenImport}
                className="inline-flex cursor-pointer items-center gap-2 border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-hover-tint rounded-md"
              >
                <UploadFileRoundedIcon fontSize="small" />
                Import from CSV
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-md border border-line bg-surface-tint px-4 py-3 text-sm text-muted">
            {activity && !activity.canRecordAttendance
              ? 'This activity was cancelled, so attendance can no longer be recorded against it.'
              : 'You have read-only access to this attendance record.'}
          </div>
        )}

        <div className="overflow-hidden rounded-md border border-divider">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b border-divider bg-surface-tint text-left text-xs font-semibold uppercase tracking-[0.12em] text-label">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Sex</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Sector</th>
                {canRecord ? <th className="px-4 py-3 text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index} className="border-b border-row-divider last:border-b-0">
                    <td colSpan={canRecord ? 5 : 4} className="px-4 py-4">
                      <span className="block h-4 animate-pulse bg-skeleton" />
                    </td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={canRecord ? 5 : 4}
                    className="px-4 py-10 text-center text-sm text-muted"
                  >
                    No attendance recorded yet.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-row-divider text-sm text-cell last:border-b-0 hover:bg-row-hover"
                  >
                    <td className="px-4 py-3 text-ink">
                      {record.attendeeName ?? (
                        <span className="text-muted" title="Beneficiary names are hidden for your role">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{SEX_LABELS[record.sex] ?? record.sex}</td>
                    <td className="px-4 py-3">{record.age ?? '-'}</td>
                    <td className="px-4 py-3">{record.sectorName ?? '-'}</td>
                    {canRecord ? (
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            aria-label={`Remove ${record.attendeeName ?? 'attendee'}`}
                            title="Remove"
                            disabled={removingId === record.id}
                            onClick={() => void handleRemove(record.id)}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center border border-danger-border text-danger transition-colors hover:bg-danger-bg-soft disabled:cursor-not-allowed disabled:opacity-45 rounded-md"
                          >
                            {removingId === record.id ? (
                              <ButtonSpinner tone="dark" />
                            ) : (
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            )}
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminDialog>
  )
}
