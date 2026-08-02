import {
  deleteRequest,
  getBlobRequest,
  getRequest,
  patchRequest,
  postRequest,
} from '@/shared/api/http'
import type {
  Community,
  CommunityDocument,
  CommunityHistoryEntry,
  CommunityListQuery,
  CommunityPayload,
  CommunityStats,
  CommunitySummary,
  PaginatedResponse,
  Sector,
} from '../types'

const COMMUNITIES_ENDPOINT = '/communities'
const SECTORS_ENDPOINT = '/sectors'

export async function listCommunities(
  query: CommunityListQuery = {},
): Promise<PaginatedResponse<CommunitySummary>> {
  return getRequest<PaginatedResponse<CommunitySummary>>(COMMUNITIES_ENDPOINT, {
    params: {
      page: query.page,
      perPage: query.per_page,
      search: query.search || undefined,
      municipality: query.municipality || undefined,
      sectorId: query.sectorId || undefined,
      classification: query.classification || undefined,
      sort: query.sort,
      direction: query.direction,
    },
  })
}

export async function getCommunityStats(): Promise<CommunityStats> {
  return getRequest<CommunityStats>(`${COMMUNITIES_ENDPOINT}/stats`)
}

export async function getCommunity(id: string): Promise<Community> {
  return getRequest<Community>(`${COMMUNITIES_ENDPOINT}/${id}`)
}

export async function getCommunityHistory(id: string): Promise<CommunityHistoryEntry[]> {
  return getRequest<CommunityHistoryEntry[]>(`${COMMUNITIES_ENDPOINT}/${id}/history`)
}

export async function createCommunity(payload: CommunityPayload): Promise<Community> {
  return postRequest<Community, CommunityPayload>(COMMUNITIES_ENDPOINT, payload)
}

export async function updateCommunity(id: string, payload: CommunityPayload): Promise<Community> {
  return patchRequest<Community, CommunityPayload>(`${COMMUNITIES_ENDPOINT}/${id}`, payload)
}

export async function deleteCommunity(id: string): Promise<void> {
  await deleteRequest(`${COMMUNITIES_ENDPOINT}/${id}`)
}

export async function listSectors(): Promise<Sector[]> {
  return getRequest<Sector[]>(SECTORS_ENDPOINT)
}

export async function listCommunityDocuments(id: string): Promise<CommunityDocument[]> {
  return getRequest<CommunityDocument[]>(`${COMMUNITIES_ENDPOINT}/${id}/documents`)
}

export async function uploadCommunityDocument(
  id: string,
  file: File,
  docType: string,
): Promise<CommunityDocument> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('docType', docType)
  return postRequest<CommunityDocument, FormData>(
    `${COMMUNITIES_ENDPOINT}/${id}/documents`,
    formData,
  )
}

export async function downloadCommunityDocument(id: string, documentId: string): Promise<Blob> {
  return getBlobRequest(`${COMMUNITIES_ENDPOINT}/${id}/documents/${documentId}`)
}

export async function deleteCommunityDocument(id: string, documentId: string): Promise<void> {
  await deleteRequest(`${COMMUNITIES_ENDPOINT}/${id}/documents/${documentId}`)
}
