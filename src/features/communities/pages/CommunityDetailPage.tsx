import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { hasAnyRole } from '@/features/auth/lib/access'
import { useAuthStore } from '@/features/auth/store/authStore'
import type { ApiValidationErrors } from '@/shared/api/http'
import { isApiError } from '@/shared/api/http'
import { downloadBlob } from '@/shared/download'
import { notify } from '@/shared/toast'
import {
  deleteCommunity,
  deleteCommunityDocument,
  downloadCommunityDocument,
  getCommunity,
  getCommunityHistory,
  listCommunityDocuments,
  listSectors,
  updateCommunity,
  uploadCommunityDocument,
} from '../api/communitiesApi'
import CommunityFormModal from '../components/CommunityFormModal'
import DeleteCommunityModal from '../components/DeleteCommunityModal'
import DocumentUploadModal from '../components/DocumentUploadModal'
import { getCommunityErrorMessage } from '../lib/errorMessages'
import { formatDateTime, formatFileSize, formatNumber } from '../lib/format'
import {
  CLASSIFICATION_LABELS,
  COMMUNITY_MANAGE_ROLES,
  DOC_TYPE_LABELS,
  type Community,
  type CommunityDocument,
  type CommunityHistoryEntry,
  type CommunityPayload,
  type DocType,
  type Sector,
} from '../types'

function InfoRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#eef2eb] py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">{label}</span>
      <span className="text-sm text-[#123524] sm:text-right">{value === null || value === '' ? '-' : value}</span>
    </div>
  )
}

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border border-[#d8e1d4] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#e7eee3] px-5 py-4">
        <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#123524]">{title}</h3>
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
        tone === 'light' ? 'border-white/35 border-t-white' : 'border-[#d8e1d4] border-t-[#1f5d3b]',
      ].join(' ')}
    />
  )
}

export default function CommunityDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const canManage = hasAnyRole(currentUser, COMMUNITY_MANAGE_ROLES)

  const [community, setCommunity] = useState<Community | null>(null)
  const [documents, setDocuments] = useState<CommunityDocument[]>([])
  const [history, setHistory] = useState<CommunityHistoryEntry[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)
  const [formApiErrors, setFormApiErrors] = useState<ApiValidationErrors | undefined>(undefined)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)

  const loadCommunity = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setErrorMessage(null)
    try {
      const [detail, historyEntries] = await Promise.all([getCommunity(id), getCommunityHistory(id)])
      setCommunity(detail)
      setDocuments(detail.documents)
      setHistory(historyEntries)
    } catch (error) {
      setErrorMessage(getCommunityErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadCommunity()
  }, [loadCommunity])

  useEffect(() => {
    listSectors()
      .then(setSectors)
      .catch(() => setSectors([]))
  }, [])

  const refreshDocuments = useCallback(async () => {
    if (!id) return
    try {
      setDocuments(await listCommunityDocuments(id))
    } catch (error) {
      notify.error(getCommunityErrorMessage(error))
    }
  }, [id])

  const handleFormSubmit = async (payload: CommunityPayload) => {
    if (!community) return
    setFormLoading(true)
    setFormErrorMessage(null)
    setFormApiErrors(undefined)
    try {
      const updated = await updateCommunity(community.id, payload)
      setCommunity(updated)
      setDocuments(updated.documents)
      setFormOpen(false)
      notify.success('Community updated successfully.')
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        setFormApiErrors(error.fields ?? {})
      } else {
        setFormErrorMessage(getCommunityErrorMessage(error))
      }
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!community) return
    setDeleteLoading(true)
    try {
      await deleteCommunity(community.id)
      notify.success(`Community ${community.name} deleted successfully.`)
      navigate('/admin/communities')
    } catch (error) {
      notify.error(getCommunityErrorMessage(error))
      setDeleteLoading(false)
    }
  }

  const handleUpload = async (file: File, docType: DocType) => {
    if (!community) return
    setUploadLoading(true)
    setUploadErrorMessage(null)
    try {
      await uploadCommunityDocument(community.id, file, docType)
      setUploadOpen(false)
      notify.success('Document uploaded successfully.')
      await refreshDocuments()
    } catch (error) {
      setUploadErrorMessage(getCommunityErrorMessage(error))
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDownload = async (document_: CommunityDocument) => {
    if (!community) return
    setDownloadingId(document_.id)
    try {
      const blob = await downloadCommunityDocument(community.id, document_.id)
      downloadBlob(blob, document_.originalFilename)
    } catch (error) {
      notify.error(getCommunityErrorMessage(error))
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!community) return
    setDeletingDocId(documentId)
    try {
      await deleteCommunityDocument(community.id, documentId)
      notify.success('Document deleted successfully.')
      await refreshDocuments()
    } catch (error) {
      notify.error(getCommunityErrorMessage(error))
    } finally {
      setDeletingDocId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 border border-[#d8e1d4] bg-white px-5 py-4 text-sm text-[#506552]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#d8e1d4] border-t-[#1f5d3b]" />
        Loading community...
      </div>
    )
  }

  if (errorMessage || !community) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/communities"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#1f5d3b] hover:underline"
        >
          <ArrowBackRoundedIcon fontSize="small" />
          Back to communities
        </Link>
        <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">
          {errorMessage ?? 'Community not found.'}
        </div>
        <button
          type="button"
          onClick={() => void loadCommunity()}
          className="cursor-pointer border border-[#d8e1d4] px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] rounded-md"
        >
          Retry
        </button>
      </div>
    )
  }

  const location = [community.barangayCode, community.municipality, community.province].filter(Boolean).join(', ')

  return (
    <div className="space-y-6">
      <Link
        to="/admin/communities"
        className="inline-flex items-center gap-1 text-sm font-medium text-[#1f5d3b] hover:underline"
      >
        <ArrowBackRoundedIcon fontSize="small" />
        Back to communities
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">Community profile</p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#123524]">{community.name}</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#506552]">{location}</p>
        </div>

        {canManage ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => {
                setFormErrorMessage(null)
                setFormApiErrors(undefined)
                setFormOpen(true)
              }}
              className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#d8e1d4] px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] rounded-md"
            >
              <EditOutlinedIcon fontSize="small" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#9f2f2f] bg-[#9f2f2f] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#832424] rounded-md"
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
              Delete
            </button>
          </div>
        ) : null}
      </div>

      {community.warnings.length > 0 ? (
        <div className="flex items-start gap-3 border border-[#ead7d7] bg-[#fff7f7] px-4 py-3 text-sm text-[#7b6542]">
          <WarningAmberRoundedIcon fontSize="small" className="mt-0.5 text-[#7b6542]" />
          <div className="space-y-1">
            {community.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <SectionCard title="Basic information">
            <div className="divide-y divide-[#eef2eb]">
              <InfoRow label="Name" value={community.name} />
              <InfoRow label="Barangay code" value={community.barangayCode} />
              <InfoRow label="Municipality" value={community.municipality} />
              <InfoRow label="Province" value={community.province} />
              <InfoRow label="Contact person" value={community.contactPersonName} />
              <InfoRow label="Designation" value={community.contactPersonDesignation} />
              <InfoRow label="Contact number" value={community.contactPersonPhone} />
              <InfoRow label="Notes" value={community.notes} />
            </div>
          </SectionCard>

          <SectionCard title="Documents" action={
            canManage ? (
              <button
                type="button"
                onClick={() => {
                  setUploadErrorMessage(null)
                  setUploadOpen(true)
                }}
                className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#d8e1d4] px-3 py-2 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] rounded-md"
              >
                <UploadFileRoundedIcon fontSize="small" />
                Upload
              </button>
            ) : undefined
          }>
            {documents.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#617462]">No documents uploaded yet.</p>
            ) : (
              <ul className="divide-y divide-[#eef2eb]">
                {documents.map((document_) => (
                  <li key={document_.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#123524]">{document_.originalFilename}</p>
                      <p className="mt-0.5 text-xs text-[#6a7f6d]">
                        {DOC_TYPE_LABELS[document_.docType]} · {formatFileSize(document_.sizeBytes)} ·{' '}
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
                        className="flex h-9 w-9 cursor-pointer items-center justify-center border border-[#d8e1d4] text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-45 rounded-md"
                      >
                        {downloadingId === document_.id ? <ButtonSpinner tone="dark" /> : <DownloadRoundedIcon fontSize="small" />}
                      </button>
                      {canManage ? (
                        <button
                          type="button"
                          aria-label={`Delete ${document_.originalFilename}`}
                          title="Delete"
                          disabled={deletingDocId === document_.id}
                          onClick={() => void handleDeleteDocument(document_.id)}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center border border-[#e3c9c9] text-[#9f2f2f] transition-colors hover:bg-[#fff7f7] disabled:cursor-not-allowed disabled:opacity-45 rounded-md"
                        >
                          {deletingDocId === document_.id ? <ButtonSpinner tone="dark" /> : <DeleteOutlineRoundedIcon fontSize="small" />}
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Socio-economic profile">
            <div className="divide-y divide-[#eef2eb]">
              <InfoRow label="Classification" value={CLASSIFICATION_LABELS[community.classification]} />
              <InfoRow label="Estimated population" value={formatNumber(community.estimatedPopulation)} />
              <InfoRow label="Household count" value={formatNumber(community.householdCount)} />
              <InfoRow label="Male population" value={formatNumber(community.populationMale)} />
              <InfoRow label="Female population" value={formatNumber(community.populationFemale)} />
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Sectors served</p>
              {community.sectors.length === 0 ? (
                <p className="text-sm text-[#617462]">No sectors tagged.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {community.sectors.map((sector) => (
                    <span
                      key={sector.id}
                      className="inline-flex border border-[#bfd3c0] bg-[#f3f9f2] px-2.5 py-1 text-xs font-medium text-[#1f5d3b]"
                    >
                      {sector.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Extension history">
            {history.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#617462]">
                No extension programs recorded yet. This timeline is populated automatically once programs
                run in this community.
              </p>
            ) : (
              <ul className="space-y-3">
                {history.map((entry) => (
                  <li key={entry.programId} className="border-l-2 border-[#1f5d3b] pl-3">
                    <p className="text-sm font-medium text-[#123524]">{entry.programTitle}</p>
                    <p className="text-xs text-[#6a7f6d]">
                      {entry.status} · {formatDateTime(entry.date)} · {entry.beneficiaryCount} beneficiaries
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      <CommunityFormModal
        key={`${community.id}-${formOpen ? 'open' : 'closed'}`}
        open={formOpen}
        mode="edit"
        community={community}
        sectors={sectors}
        loading={formLoading}
        errorMessage={formErrorMessage}
        apiErrors={formApiErrors}
        onClose={() => {
          if (!formLoading) setFormOpen(false)
        }}
        onSubmit={handleFormSubmit}
      />

      <DeleteCommunityModal
        open={deleteOpen}
        communityName={community.name}
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) setDeleteOpen(false)
        }}
        onConfirm={handleDelete}
      />

      <DocumentUploadModal
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
