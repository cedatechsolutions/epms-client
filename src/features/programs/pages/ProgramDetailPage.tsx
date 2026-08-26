import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { listCommunities } from '@/features/communities/api/communitiesApi'
import { listProgramTypes, listSectors } from '@/features/recommendations/api/recommendationsApi'
import { listSurveys } from '@/features/surveys/api/surveysApi'
import type { ApiValidationErrors } from '@/shared/api/http'
import { isApiError } from '@/shared/api/http'
import { downloadBlob } from '@/shared/download'
import { notify } from '@/shared/toast'
import {
  approveProgram,
  deleteProgram,
  deleteProgramDocument,
  downloadProgramDocument,
  getProgram,
  listProgramDocuments,
  listUserOptions,
  recommendProgram,
  reviewProgram,
  submitProgram,
  updateProgram,
  uploadProgramDocument,
} from '../api/programsApi'
import ActivitiesSection from '../components/ActivitiesSection'
import ApprovalStepper from '../components/ApprovalStepper'
import DeleteProgramModal from '../components/DeleteProgramModal'
import ProgramTeamSection from '../components/ProgramTeamSection'
import ProgramDocumentUploadModal from '../components/ProgramDocumentUploadModal'
import ProgramFormModal, { type PickerOption } from '../components/ProgramFormModal'
import ProgramStatusChip from '../components/ProgramStatusChip'
import StageActionModal, { type StageActionKind } from '../components/StageActionModal'
import { getProgramErrorMessage, isStageConflict } from '../lib/errorMessages'
import { formatCurrency, formatDate, formatDateTime, formatFileSize, formatNumber } from '../lib/format'
import {
  PROGRAM_DOC_TYPE_LABELS,
  type Program,
  type ProgramAction,
  type ProgramDocType,
  type ProgramDocument,
  type ProgramPayload,
  type Sector,
  type StageActionPayload,
  type UserOption,
} from '../types'

function InfoRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex flex-col gap-1 border-b border-row-divider py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">{label}</span>
      <span className="text-sm text-ink sm:text-right">{value === null || value === '' ? '-' : value}</span>
    </div>
  )
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg overflow-hidden border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-divider px-5 py-4">
        <h3 className="text-lg font-semibold tracking-[-0.02em] text-ink">{title}</h3>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}

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

/** Button copy for each action the server may offer in `availableActions`. */
const STAGE_BUTTON_LABELS: Record<Exclude<ProgramAction, 'edit'>, string> = {
  submit: 'Submit for Review',
  note: 'Note and Endorse',
  recommend: 'Recommend for Approval',
  approve: 'Approve',
  return: 'Return for Revision',
}

export default function ProgramDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const [program, setProgram] = useState<Program | null>(null)
  const [documents, setDocuments] = useState<ProgramDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Picker options, loaded only for users who can actually edit this proposal.
  const [communities, setCommunities] = useState<PickerOption[]>([])
  const [programTypes, setProgramTypes] = useState<PickerOption[]>([])
  const [surveys, setSurveys] = useState<PickerOption[]>([])
  const [facultyOptions, setFacultyOptions] = useState<UserOption[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)
  const [formApiErrors, setFormApiErrors] = useState<ApiValidationErrors | undefined>(undefined)

  const [stageKind, setStageKind] = useState<StageActionKind | null>(null)
  const [stageLoading, setStageLoading] = useState(false)
  const [stageErrorMessage, setStageErrorMessage] = useState<string | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)

  const loadProgram = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setErrorMessage(null)
    try {
      const detail = await getProgram(id)
      setProgram(detail)
      setDocuments(detail.documents)
    } catch (error) {
      setErrorMessage(getProgramErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadProgram()
  }, [loadProgram])

  const canEdit = program?.canEdit ?? false
  const canRecordDelivery = program?.canRecordDelivery ?? false

  // Sectors are needed in two unrelated places — the proposal form and the attendance sector picker
  // — and those are never both available at once, so this loads on either.
  useEffect(() => {
    if (!canEdit && !canRecordDelivery) return
    listSectors()
      .then(setSectors)
      .catch(() => setSectors([]))
  }, [canEdit, canRecordDelivery])

  useEffect(() => {
    if (!canEdit) return
    listCommunities({ per_page: 100, sort: 'name', direction: 'asc' })
      .then((response) =>
        setCommunities(response.data.map((community) => ({ id: community.id, label: community.name }))),
      )
      .catch(() => setCommunities([]))
    listProgramTypes()
      .then((types) =>
        setProgramTypes(types.filter((type) => type.active).map((type) => ({ id: type.id, label: type.name }))),
      )
      .catch(() => setProgramTypes([]))
    listSurveys({ per_page: 100, sort: 'title', direction: 'asc' })
      .then((response) => setSurveys(response.data.map((survey) => ({ id: survey.id, label: survey.title }))))
      .catch(() => setSurveys([]))
    listUserOptions('faculty')
      .then(setFacultyOptions)
      .catch(() => setFacultyOptions([]))
  }, [canEdit])

  const refreshDocuments = useCallback(async () => {
    if (!id) return
    try {
      setDocuments(await listProgramDocuments(id))
    } catch (error) {
      notify.error(getProgramErrorMessage(error))
    }
  }, [id])

  const handleFormSubmit = async (payload: ProgramPayload, alsoSubmit: boolean) => {
    if (!program) return
    if (alsoSubmit) {
      setFormSubmitting(true)
    } else {
      setFormLoading(true)
    }
    setFormErrorMessage(null)
    setFormApiErrors(undefined)

    try {
      const updated = await updateProgram(program.id, payload)
      setProgram(updated)
      setDocuments(updated.documents)
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        setFormApiErrors(error.fields ?? {})
      } else {
        setFormErrorMessage(getProgramErrorMessage(error))
      }
      setFormLoading(false)
      setFormSubmitting(false)
      return
    }

    if (alsoSubmit) {
      try {
        const submitted = await submitProgram(program.id)
        setProgram(submitted)
        setDocuments(submitted.documents)
        notify.success('Proposal submitted for review.')
      } catch (error) {
        if (isApiError(error) && error.status === 422) {
          setFormApiErrors(error.fields ?? {})
          setFormErrorMessage('Saved, but this proposal is not ready to submit yet.')
        } else {
          setFormErrorMessage(getProgramErrorMessage(error))
        }
        setFormLoading(false)
        setFormSubmitting(false)
        return
      }
    } else {
      notify.success('Proposal updated.')
    }

    setFormOpen(false)
    setFormLoading(false)
    setFormSubmitting(false)
  }

  const handleStageAction = async (payload: StageActionPayload | null) => {
    if (!program || !stageKind) return
    setStageLoading(true)
    setStageErrorMessage(null)
    try {
      let updated: Program
      if (stageKind === 'submit') {
        updated = await submitProgram(program.id)
      } else if (stageKind === 'note') {
        updated = await reviewProgram(program.id, payload!)
      } else if (stageKind === 'recommend') {
        updated = await recommendProgram(program.id, payload!)
      } else if (stageKind === 'approve') {
        updated = await approveProgram(program.id, payload!)
      } else {
        // A return is issued through whichever stage endpoint owns the proposal's current status —
        // the server rejects the wrong one with 409, so the mapping has to follow the status.
        const returnPayload = { ...payload!, action: 'return' as const }
        updated =
          program.status === 'submitted'
            ? await reviewProgram(program.id, returnPayload)
            : program.status === 'coordinator_review'
              ? await recommendProgram(program.id, returnPayload)
              : await approveProgram(program.id, returnPayload)
      }
      setProgram(updated)
      setDocuments(updated.documents)
      setStageKind(null)
      notify.success(
        stageKind === 'return' ? 'Proposal returned to its author.' : 'Decision recorded.',
      )
    } catch (error) {
      // A 409 means the proposal moved on while this screen was open; reloading is the fix, so say
      // that rather than leaving the reviewer looking at a stale stage.
      if (isStageConflict(error)) {
        setStageErrorMessage(`${getProgramErrorMessage(error)} Reloading the proposal...`)
        await loadProgram()
      } else {
        setStageErrorMessage(getProgramErrorMessage(error))
      }
    } finally {
      setStageLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!program) return
    setDeleteLoading(true)
    try {
      await deleteProgram(program.id)
      notify.success(`Proposal "${program.title}" withdrawn.`)
      navigate('/admin/programs')
    } catch (error) {
      notify.error(getProgramErrorMessage(error))
      setDeleteLoading(false)
    }
  }

  const handleUpload = async (file: File, docType: ProgramDocType) => {
    if (!program) return
    setUploadLoading(true)
    setUploadErrorMessage(null)
    try {
      await uploadProgramDocument(program.id, file, docType)
      setUploadOpen(false)
      notify.success('Document attached.')
      await refreshDocuments()
      // Attaching a needs-assessment report clears the "no assessment linked" warning, which the
      // server recomputes — so reload the record rather than guessing at it here.
      await loadProgram()
    } catch (error) {
      setUploadErrorMessage(getProgramErrorMessage(error))
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDownload = async (document_: ProgramDocument) => {
    if (!program) return
    setDownloadingId(document_.id)
    try {
      const blob = await downloadProgramDocument(program.id, document_.id)
      downloadBlob(blob, document_.originalFilename)
    } catch (error) {
      notify.error(getProgramErrorMessage(error))
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!program) return
    setDeletingDocId(documentId)
    try {
      await deleteProgramDocument(program.id, documentId)
      notify.success('Document removed.')
      await refreshDocuments()
      await loadProgram()
    } catch (error) {
      notify.error(getProgramErrorMessage(error))
    } finally {
      setDeletingDocId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-5 py-4 text-sm text-body">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-primary-accent" />
        Loading proposal...
      </div>
    )
  }

  if (errorMessage || !program) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/programs"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-accent hover:underline"
        >
          <ArrowBackRoundedIcon fontSize="small" />
          Back to proposals
        </Link>
        <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
          {errorMessage ?? 'Proposal not found.'}
        </div>
        <button
          type="button"
          onClick={() => void loadProgram()}
          className="cursor-pointer border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint rounded-md"
        >
          Retry
        </button>
      </div>
    )
  }

  const stageActions = program.availableActions.filter(
    (action): action is Exclude<ProgramAction, 'edit'> => action !== 'edit',
  )
  const canWithdraw =
    program.canEdit && (program.status === 'draft' || program.status === 'returned')

  // Delivery records exist from approval onward; a completed program keeps showing them read-only,
  // which is why this is broader than `canRecordDelivery`.
  const hasEnteredDelivery =
    program.status === 'approved' ||
    program.status === 'ongoing' ||
    program.status === 'completed'

  // The team is assembled while the proposal is still a draft, so this follows authorship rather
  // than the delivery phase — matching ProgramMemberService's own gate.
  const canManageTeam = program.canEdit || program.canRecordDelivery

  return (
    <div className="space-y-6">
      <Link
        to="/admin/programs"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary-accent hover:underline"
      >
        <ArrowBackRoundedIcon fontSize="small" />
        Back to proposals
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">
            Extension project proposal
          </p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">{program.title}</h4>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <ProgramStatusChip status={program.status} />
            <span className="text-sm text-body">
              {program.communityName ?? 'No community set'} ·{' '}
              {program.programTypeName ?? 'No program type set'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {program.canEdit ? (
            <button
              type="button"
              onClick={() => {
                setFormErrorMessage(null)
                setFormApiErrors(undefined)
                setFormOpen(true)
              }}
              className="inline-flex cursor-pointer items-center justify-center gap-2 border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint rounded-md"
            >
              <EditOutlinedIcon fontSize="small" />
              Edit
            </button>
          ) : null}

          {stageActions.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => {
                setStageErrorMessage(null)
                setStageKind(action)
              }}
              className={[
                'inline-flex cursor-pointer items-center justify-center gap-2 border px-4 py-2.5 text-sm font-medium transition-colors rounded-md',
                action === 'return'
                  ? 'border-danger bg-danger text-white hover:bg-danger-hover'
                  : 'border-primary bg-primary text-white hover:bg-primary-hover',
              ].join(' ')}
            >
              {STAGE_BUTTON_LABELS[action]}
            </button>
          ))}

          {canWithdraw ? (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 border border-danger-border px-4 py-2.5 text-sm font-medium text-danger-text transition-colors hover:bg-danger-bg-soft rounded-md"
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
              Withdraw
            </button>
          ) : null}
        </div>
      </div>

      {program.warnings.length > 0 ? (
        <div className="flex items-start gap-3 border border-danger-border-soft bg-danger-bg-soft px-4 py-3 text-sm text-warning">
          <WarningAmberRoundedIcon fontSize="small" className="mt-0.5 text-warning" />
          <div className="space-y-1">
            {program.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <SectionCard title="Proposal details">
            <div className="divide-y divide-row-divider">
              <InfoRow label="Partner community" value={program.communityName} />
              <InfoRow label="Program type" value={program.programTypeName} />
              <InfoRow label="Faculty lead" value={program.facultyLeadName} />
              <InfoRow label="Target beneficiaries" value={formatNumber(program.targetBeneficiaries)} />
              <InfoRow label="Proposed start date" value={formatDate(program.proposedDate)} />
              <InfoRow label="End date" value={formatDate(program.endDate)} />
              <InfoRow label="Venue" value={program.venue} />
              <InfoRow label="Budget requested" value={formatCurrency(program.budgetRequested)} />
              <InfoRow label="Budget approved" value={formatCurrency(program.budgetApproved)} />
              <InfoRow label="Linked needs assessment" value={program.surveyTitle} />
              <InfoRow label="Created" value={formatDateTime(program.createdAt)} />
              <InfoRow label="Last updated" value={formatDateTime(program.updatedAt)} />
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-label">Objectives</p>
              {program.objectives ? (
                <p className="text-sm leading-7 text-body">{program.objectives}</p>
              ) : (
                <p className="text-sm text-muted">No objectives recorded yet.</p>
              )}
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-label">
                Sectors served
              </p>
              {program.sectors.length === 0 ? (
                <p className="text-sm text-muted">No sectors tagged.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {program.sectors.map((sector) => (
                    <span
                      key={sector.id}
                      className="inline-flex rounded-md border border-success-border bg-success-bg px-2.5 py-1 text-xs font-medium text-primary-accent"
                    >
                      {sector.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Attachments"
            action={
              program.canEdit ? (
                <button
                  type="button"
                  onClick={() => {
                    setUploadErrorMessage(null)
                    setUploadOpen(true)
                  }}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-hover-tint rounded-md"
                >
                  <UploadFileRoundedIcon fontSize="small" />
                  Attach
                </button>
              ) : undefined
            }
          >
            {documents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No documents attached yet.</p>
            ) : (
              <ul className="divide-y divide-row-divider">
                {documents.map((document_) => {
                  const typeLabel =
                    document_.docType && document_.docType in PROGRAM_DOC_TYPE_LABELS
                      ? PROGRAM_DOC_TYPE_LABELS[document_.docType as ProgramDocType]
                      : (document_.docType ?? 'Other')
                  return (
                    <li
                      key={document_.id}
                      className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{document_.originalFilename}</p>
                        <p className="mt-0.5 text-xs text-muted-alt">
                          {typeLabel} · {formatFileSize(document_.sizeBytes)} ·{' '}
                          {formatDateTime(document_.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          aria-label={`Download ${document_.originalFilename}`}
                          title="Download"
                          disabled={downloadingId === document_.id}
                          onClick={() => void handleDownload(document_)}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center border border-line text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-45 rounded-md"
                        >
                          {downloadingId === document_.id ? (
                            <ButtonSpinner tone="dark" />
                          ) : (
                            <DownloadRoundedIcon fontSize="small" />
                          )}
                        </button>
                        {program.canEdit ? (
                          <button
                            type="button"
                            aria-label={`Remove ${document_.originalFilename}`}
                            title="Remove"
                            disabled={deletingDocId === document_.id}
                            onClick={() => void handleDeleteDocument(document_.id)}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center border border-danger-border text-danger transition-colors hover:bg-danger-bg-soft disabled:cursor-not-allowed disabled:opacity-45 rounded-md"
                          >
                            {deletingDocId === document_.id ? (
                              <ButtonSpinner tone="dark" />
                            ) : (
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Approval workflow">
            <ApprovalStepper status={program.status} approvals={program.approvals} />
          </SectionCard>

          <ProgramTeamSection programId={program.id} canManage={canManageTeam} />
        </div>
      </div>

      {/* Delivery (spec Module 5b) only exists once a proposal has been approved. Before that the
          section would be an empty shell promising something the server would refuse. */}
      {hasEnteredDelivery ? (
        <ActivitiesSection
          programId={program.id}
          canRecord={program.canRecordDelivery}
          sectors={sectors}
          onProgramMayHaveChanged={() => void loadProgram()}
        />
      ) : null}

      <ProgramFormModal
        key={`${program.id}-${formOpen ? 'open' : 'closed'}`}
        open={formOpen}
        mode="edit"
        program={program}
        communities={communities}
        programTypes={programTypes}
        surveys={surveys}
        facultyOptions={facultyOptions}
        sectors={sectors}
        loading={formLoading}
        submitting={formSubmitting}
        errorMessage={formErrorMessage}
        apiErrors={formApiErrors}
        onClose={() => {
          if (!formLoading && !formSubmitting) setFormOpen(false)
        }}
        onSubmit={handleFormSubmit}
      />

      <StageActionModal
        key={`${stageKind ?? 'none'}-${program.status}`}
        open={stageKind !== null}
        kind={stageKind ?? 'submit'}
        programTitle={program.title}
        budgetRequested={program.budgetRequested}
        loading={stageLoading}
        errorMessage={stageErrorMessage}
        onClose={() => {
          if (!stageLoading) {
            setStageKind(null)
            setStageErrorMessage(null)
          }
        }}
        onConfirm={handleStageAction}
      />

      <DeleteProgramModal
        open={deleteOpen}
        programTitle={program.title}
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) setDeleteOpen(false)
        }}
        onConfirm={handleDelete}
      />

      <ProgramDocumentUploadModal
        key={uploadOpen ? 'upload-open' : 'upload-closed'}
        open={uploadOpen}
        loading={uploadLoading}
        errorMessage={uploadErrorMessage}
        onClose={() => {
          if (!uploadLoading) setUploadOpen(false)
        }}
        onSubmit={handleUpload}
      />
    </div>
  )
}
