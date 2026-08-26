import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { notify } from '@/shared/toast'
import {
  addProgramMember,
  listProgramMembers,
  listUserOptions,
  removeProgramMember,
} from '../api/programsApi'
import { getProgramErrorMessage } from '../lib/errorMessages'
import {
  PROGRAM_MEMBER_ROLE_LABELS,
  PROGRAM_MEMBER_ROLE_OPTIONS,
  type ProgramMember,
  type ProgramMemberRole,
  type UserOption,
} from '../types'

type ProgramTeamSectionProps = {
  programId: string
  /** Whether the caller may change the team — the lead, the creator, or a coordinator. */
  canManage: boolean
}

const inputClassName =
  'h-10 w-full cursor-pointer border border-control-border bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

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
 * The people assigned to a program besides its faculty lead (spec Module 5 §1, §2.2).
 *
 * <p><strong>Assignment grants visibility, not authority.</strong> Adding a student volunteer here
 * lets them find and read the program — which is the only way §2.2's "the programs they help run"
 * can be true, since a student can neither create nor lead one. It does not let them record
 * attendance; that still requires being the creator, the lead, or a coordinator. The copy says so,
 * because the distinction is not obvious from the act of adding someone.
 */
export default function ProgramTeamSection({ programId, canManage }: ProgramTeamSectionProps) {
  const [members, setMembers] = useState<ProgramMember[]>([])
  const [candidates, setCandidates] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [userId, setUserId] = useState('')
  const [roleInProgram, setRoleInProgram] = useState<ProgramMemberRole>('volunteer')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      setMembers(await listProgramMembers(programId))
    } catch (error) {
      setErrorMessage(getProgramErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [programId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!canManage) return
    // Everyone assignable, not just students — a co-faculty member is a valid assignment too.
    listUserOptions()
      .then(setCandidates)
      .catch(() => setCandidates([]))
  }, [canManage])

  const assignedIds = new Set(members.map((member) => member.userId))
  const available = candidates.filter((candidate) => !assignedIds.has(candidate.id))

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!userId) {
      setAddError('Choose someone to assign.')
      return
    }
    setAdding(true)
    setAddError(null)
    try {
      await addProgramMember(programId, { userId, roleInProgram })
      setUserId('')
      notify.success('Assigned to this program.')
      await load()
    } catch (error) {
      setAddError(getProgramErrorMessage(error))
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (member: ProgramMember) => {
    setRemovingId(member.id)
    try {
      await removeProgramMember(programId, member.id)
      notify.success(`${member.name ?? 'Member'} removed from this program.`)
      await load()
    } catch (error) {
      notify.error(getProgramErrorMessage(error))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <section className="rounded-lg overflow-hidden border border-line bg-surface">
      <div className="border-b border-divider px-5 py-4">
        <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">Project team</h3>
        <p className="mt-1 text-sm text-muted">
          People assigned to this program alongside the faculty lead.
        </p>
      </div>

      <div className="px-5 py-4">
        {errorMessage ? (
          <div className="space-y-4">
            <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
              {errorMessage}
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="cursor-pointer border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint rounded-md"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {loading ? (
              <div className="space-y-2" aria-busy="true">
                {Array.from({ length: 2 }).map((_, index) => (
                  <span key={index} className="block h-10 animate-pulse rounded-md bg-skeleton" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No one else is assigned yet.</p>
            ) : (
              <ul className="divide-y divide-row-divider">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {member.name ?? member.email ?? 'Unknown user'}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-alt">
                        {PROGRAM_MEMBER_ROLE_LABELS[member.roleInProgram] ?? member.roleInProgram}
                        {member.email ? ` · ${member.email}` : ''}
                      </p>
                    </div>
                    {canManage ? (
                      <button
                        type="button"
                        aria-label={`Remove ${member.name ?? 'member'}`}
                        title="Remove"
                        disabled={removingId === member.id}
                        onClick={() => void handleRemove(member)}
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border border-danger-border text-danger transition-colors hover:bg-danger-bg-soft disabled:cursor-not-allowed disabled:opacity-45 rounded-md"
                      >
                        {removingId === member.id ? (
                          <ButtonSpinner tone="dark" />
                        ) : (
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        )}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            {canManage ? (
              <form onSubmit={handleAdd} className="mt-4 rounded-md border border-divider bg-row-hover px-4 py-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_auto] sm:items-end">
                  <div>
                    <label htmlFor="team-user" className={labelClassName}>
                      Person
                    </label>
                    <select
                      id="team-user"
                      value={userId}
                      disabled={adding}
                      onChange={(event) => {
                        setUserId(event.target.value)
                        setAddError(null)
                      }}
                      className={inputClassName}
                    >
                      <option value="">Select a person</option>
                      {available.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="team-role" className={labelClassName}>
                      Role
                    </label>
                    <select
                      id="team-role"
                      value={roleInProgram}
                      disabled={adding}
                      onChange={(event) => setRoleInProgram(event.target.value as ProgramMemberRole)}
                      className={inputClassName}
                    >
                      {PROGRAM_MEMBER_ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={adding}
                    className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
                  >
                    {adding ? <ButtonSpinner /> : <PersonAddAltRoundedIcon fontSize="small" />}
                    {adding ? 'Assigning...' : 'Assign'}
                  </button>
                </div>

                {addError ? (
                  <p className="mt-2 text-xs text-danger-strong">{addError}</p>
                ) : (
                  <p className="mt-2 text-xs text-muted-alt">
                    Assigning someone lets them see this program. It does not let them record
                    attendance — that stays with the faculty lead and coordinators.
                  </p>
                )}
              </form>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
