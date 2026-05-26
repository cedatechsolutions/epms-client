import { ApiError, deleteRequest, getBlobRequest, getRequest, patchRequest, postRequest, putRequest } from '@/shared/api/http'
import type {
  CreateUserPayload,
  PaginatedResponse,
  ResetPasswordPayload,
  UpdateUserPayload,
  User,
  UserListQuery,
  UserRole,
  UserStatus,
} from '../types'

const USERS_ENDPOINT = '/users'

type BackendUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  middleName: string | null
  contactNumber: string | null
  active: boolean
  lastLoginAt: string | null
  createdAt: string | null
  updatedAt: string | null
  roles: string[]
}

type BackendManagedUserPayload = {
  email: string
  password?: string
  firstName: string
  lastName: string
  middleName: string
  contactNumber: string
  role: 'ADMIN' | 'USER'
  status?: 'ACTIVE' | 'INACTIVE'
}

type BackendStatusPayload = {
  status: 'ACTIVE' | 'INACTIVE'
}

type BackendPaginatedUsers = {
  data: BackendUser[]
  meta: {
    current_page: number
    from: number | null
    last_page: number
    path: string
    per_page: number
    to: number | null
    total: number
  }
  links: Record<string, string | null>
}

function mapUserRole(roles: string[]): UserRole {
  if (roles.includes('ROLE_SUPER_ADMIN') || roles.includes('ROLE_ADMIN')) {
    return 'admin'
  }

  return 'user'
}

function mapBackendUser(user: BackendUser): User {
  const status: UserStatus = user.active ? 'active' : 'inactive'

  return {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    middle_name: user.middleName,
    contact_number: user.contactNumber,
    full_name: [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ').trim(),
    email: user.email,
    role: mapUserRole(user.roles),
    roles: [...user.roles].sort(),
    status,
    is_active: user.active,
    last_login_at: user.lastLoginAt,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    deleted_at: null,
  }
}

function toBackendPayload(payload: CreateUserPayload | UpdateUserPayload): BackendManagedUserPayload {
  return {
    email: payload.email.trim(),
    ...(payload.password ? { password: payload.password } : {}),
    firstName: payload.first_name.trim(),
    lastName: payload.last_name.trim(),
    middleName: payload.middle_name?.trim() ?? '',
    contactNumber: payload.contact_number?.trim() ?? '',
    role: payload.role === 'admin' ? 'ADMIN' : 'USER',
    ...(payload.status
      ? {
          status: payload.status === 'active' ? 'ACTIVE' : 'INACTIVE',
        }
      : {}),
  }
}

export async function listAdminUsers(query: UserListQuery = {}): Promise<PaginatedResponse<User>> {
  const response = await getRequest<BackendPaginatedUsers>(USERS_ENDPOINT, {
    params: {
      page: query.page,
      perPage: query.per_page,
      search: query.search || undefined,
      role: query.role ? query.role.toUpperCase() : undefined,
      status: query.status ? query.status.toUpperCase() : undefined,
      sort: query.sort,
      direction: query.direction,
    },
  })

  return {
    data: response.data.map(mapBackendUser),
    meta: response.meta,
    links: response.links ?? {},
  }
}

export async function printAdminUsersPdf(): Promise<Blob> {
  return getBlobRequest(`${USERS_ENDPOINT}/print`, {
    headers: {
      Accept: 'application/pdf',
    },
  })
}

export async function createAdminUser(payload: CreateUserPayload): Promise<User> {
  const response = await postRequest<BackendUser, BackendManagedUserPayload>(USERS_ENDPOINT, toBackendPayload(payload))
  return mapBackendUser(response)
}

export async function getAdminUser(id: string): Promise<User> {
  try {
    const user = await getRequest<BackendUser>(`${USERS_ENDPOINT}/${id}`)
    return mapBackendUser(user)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError('User not found.', 404)
    }

    throw error
  }
}

export async function updateAdminUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const response = await putRequest<BackendUser, BackendManagedUserPayload>(`${USERS_ENDPOINT}/${id}`, toBackendPayload(payload))
  return mapBackendUser(response)
}

export async function deleteAdminUser(id: string): Promise<void> {
  await deleteRequest(`${USERS_ENDPOINT}/${id}`)
}

export async function patchAdminUserStatus(id: string, status: UserStatus): Promise<User> {
  const response = await patchRequest<BackendUser, BackendStatusPayload>(`${USERS_ENDPOINT}/${id}/status`, {
    status: status === 'active' ? 'ACTIVE' : 'INACTIVE',
  })

  return mapBackendUser(response)
}

export async function resetAdminUserPassword(id: string, payload: ResetPasswordPayload): Promise<void> {
  await patchRequest<void, { password: string; passwordConfirmation: string }>(`${USERS_ENDPOINT}/${id}/password`, {
    password: payload.password,
    passwordConfirmation: payload.password_confirmation,
  })
}
