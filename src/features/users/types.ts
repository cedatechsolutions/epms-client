import type { Department, RoleCode } from '@/features/auth/types'

export type UserRole = RoleCode
export type UserStatus = 'active' | 'inactive'

export type User = {
  id: string
  first_name: string
  last_name: string
  middle_name: string | null
  contact_number: string | null
  full_name: string
  email: string
  role: UserRole
  roles: string[]
  /** Null for campus-wide accounts. */
  department: Department | null
  status: UserStatus
  is_active: boolean
  /** Set when the account has a profile photo; also the cache key for re-fetching it. */
  avatar_updated_at: string | null
  last_login_at: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
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

export type PaginationLinks = {
  first?: string | null
  last?: string | null
  prev?: string | null
  next?: string | null
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: PaginationMeta
  links: PaginationLinks
}

export type UserListQuery = {
  page?: number
  per_page?: number
  search?: string
  role?: UserRole | ''
  status?: UserStatus | ''
  department_id?: string
  sort?: 'lastName' | 'firstName' | 'middleName' | 'email' | 'contactNumber' | 'createdAt' | 'lastLoginAt' | 'active'
  direction?: 'asc' | 'desc'
}

export type CreateUserPayload = {
  first_name: string
  last_name: string
  middle_name: string | null
  contact_number?: string | null
  email: string
  password: string
  password_confirmation?: string
  role: UserRole
  /** Required for departmental roles, null for campus-wide ones. */
  department_id: string | null
  status?: UserStatus
}

export type UpdateUserPayload = {
  first_name: string
  last_name: string
  middle_name: string | null
  contact_number?: string | null
  email: string
  password?: string
  password_confirmation?: string
  role: UserRole
  /** Required for departmental roles, null for campus-wide ones. */
  department_id: string | null
  status?: UserStatus
}

export type UpdateUserStatusPayload = {
  status: UserStatus
}

export type ResetPasswordPayload = {
  password: string
  password_confirmation: string
}

export type UserStats = {
  total: number
  active: number
  inactive: number
}
