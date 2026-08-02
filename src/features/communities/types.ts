// Domain types for Module 2 — Community Profiling. Field names mirror the backend JSON
// (camelCase) so no request/response remapping is needed.

export type Classification = 'urban_poor' | 'rural' | 'urban' | 'coastal' | 'other'
export type DocType = 'moa' | 'certification' | 'photo' | 'other'

/** Roles permitted to create/update/delete communities (spec §2.2 — must match backend Permissions). */
export const COMMUNITY_MANAGE_ROLES = [
  'admin',
  'campus_extension_coordinator',
  'extension_coordinator',
] as const

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  urban_poor: 'Urban Poor',
  rural: 'Rural',
  urban: 'Urban',
  coastal: 'Coastal',
  other: 'Other',
}

export const CLASSIFICATION_OPTIONS = Object.entries(CLASSIFICATION_LABELS).map(
  ([value, label]) => ({ value: value as Classification, label }),
)

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  moa: 'MOA',
  certification: 'Certification',
  photo: 'Photo',
  other: 'Other',
}

export const DOC_TYPE_OPTIONS = Object.entries(DOC_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as DocType, label }),
)

export type Sector = {
  id: string
  name: string
  active: boolean
}

export type CommunityDocument = {
  id: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  docType: DocType
  createdAt: string | null
}

export type CommunitySummary = {
  id: string
  name: string
  barangayCode: string | null
  municipality: string
  province: string
  sectors: Sector[]
  lastAssessmentDate: string | null
  activeProgramCount: number
}

export type Community = {
  id: string
  name: string
  barangayCode: string | null
  municipality: string
  province: string
  classification: Classification
  estimatedPopulation: number | null
  householdCount: number | null
  populationMale: number | null
  populationFemale: number | null
  contactPersonName: string | null
  contactPersonDesignation: string | null
  contactPersonPhone: string | null
  notes: string | null
  sectors: Sector[]
  documents: CommunityDocument[]
  warnings: string[]
  createdAt: string | null
  updatedAt: string | null
}

export type CommunityHistoryEntry = {
  programId: string
  programTitle: string
  status: string
  date: string | null
  beneficiaryCount: number
}

export type CommunityStats = {
  totalCommunities: number
  beneficiariesReached: number
  assessedThisSemester: number
}

export type CommunityListQuery = {
  page?: number
  per_page?: number
  search?: string
  municipality?: string
  sectorId?: string
  classification?: Classification | ''
  sort?: 'name' | 'municipality' | 'province' | 'classification' | 'createdAt'
  direction?: 'asc' | 'desc'
}

export type CommunityPayload = {
  name: string
  barangayCode: string | null
  municipality: string
  province: string
  classification: Classification
  estimatedPopulation: number | null
  householdCount: number | null
  populationMale: number | null
  populationFemale: number | null
  contactPersonName: string | null
  contactPersonDesignation: string | null
  contactPersonPhone: string | null
  notes: string | null
  sectorIds: string[]
}

export type PaginationMeta = {
  current_page: number
  from: number | null
  last_page: number
  path: string
  per_page: number
  to: number | null
  total: number
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: PaginationMeta
  links: Record<string, string | null>
}
