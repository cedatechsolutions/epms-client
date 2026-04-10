import { httpRequest } from '@/shared/api/http'
import type {
  CreateUserPayload,
  PaginatedResponse,
  ResetPasswordPayload,
  UpdateUserPayload,
  User,
  UserListQuery,
  UserStatus,
} from '../types'

const USERS_ENDPOINT = '/api/admin/users'

function buildUsersQuery(query: UserListQuery): string {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.per_page) params.set('per_page', String(query.per_page))
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

function extractUser(payload: unknown): User {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: User }).data
  }
  return payload as User
}

export async function listAdminUsers(query: UserListQuery = {}): Promise<PaginatedResponse<User>> {
  const queryString = buildUsersQuery(query)
  return httpRequest<PaginatedResponse<User>>(`${USERS_ENDPOINT}${queryString}`)
}

export async function createAdminUser(payload: CreateUserPayload): Promise<User> {
  const response = await httpRequest<unknown>(USERS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return extractUser(response)
}

export async function getAdminUser(id: string): Promise<User> {
  const response = await httpRequest<unknown>(`${USERS_ENDPOINT}/${id}`)
  return extractUser(response)
}

export async function updateAdminUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const response = await httpRequest<unknown>(`${USERS_ENDPOINT}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return extractUser(response)
}

export async function patchAdminUserStatus(id: string, status: UserStatus): Promise<User> {
  const response = await httpRequest<unknown>(`${USERS_ENDPOINT}/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  return extractUser(response)
}

export async function resetAdminUserPassword(id: string, payload: ResetPasswordPayload): Promise<void> {
  await httpRequest<unknown>(`${USERS_ENDPOINT}/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
