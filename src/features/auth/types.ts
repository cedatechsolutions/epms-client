// EPMS roles (spec §2.1, department-based access since backend migration V15). Values are the
// snake_case codes the API uses. Must match backend `RoleName`.
export const ROLE_ADMIN = 'admin'
export const ROLE_CAMPUS_EXTENSION_COORDINATOR = 'campus_extension_coordinator'
export const ROLE_EXTENSION_STAFF_COORDINATOR = 'extension_staff_coordinator'
export const ROLE_DEPT_EXTENSION_COORDINATOR = 'dept_extension_coordinator'
export const ROLE_FACILITATOR = 'facilitator'

export const ALL_ROLES = [
  ROLE_ADMIN,
  ROLE_CAMPUS_EXTENSION_COORDINATOR,
  ROLE_EXTENSION_STAFF_COORDINATOR,
  ROLE_DEPT_EXTENSION_COORDINATOR,
  ROLE_FACILITATOR,
] as const

export type RoleCode = (typeof ALL_ROLES)[number]

/**
 * Roles limited to their own department's data. Holders must be assigned a department; every
 * other role is campus-wide and must not carry one (backend `RoleName.isDepartmental`).
 */
export const DEPARTMENTAL_ROLES: readonly string[] = [ROLE_DEPT_EXTENSION_COORDINATOR, ROLE_FACILITATOR]

/** Roles that see every department (backend `ProgramAccessPolicy.isCampusWide`). */
export const CAMPUS_WIDE_ROLES: readonly string[] = [
  ROLE_ADMIN,
  ROLE_CAMPUS_EXTENSION_COORDINATOR,
  ROLE_EXTENSION_STAFF_COORDINATOR,
]

/** Admin plus every coordinator role — the shared base of most "manage" gates below. */
export const COORDINATOR_ROLES = [
  ROLE_ADMIN,
  ROLE_CAMPUS_EXTENSION_COORDINATOR,
  ROLE_EXTENSION_STAFF_COORDINATOR,
  ROLE_DEPT_EXTENSION_COORDINATOR,
] as const

export function isDepartmentalRole(role: string): boolean {
  return DEPARTMENTAL_ROLES.includes(role)
}

/** Human-friendly labels for the role codes, for badges and selects. */
export const ROLE_LABELS: Record<string, string> = {
  [ROLE_ADMIN]: 'System Admin',
  [ROLE_CAMPUS_EXTENSION_COORDINATOR]: 'Campus Extension Coordinator',
  [ROLE_EXTENSION_STAFF_COORDINATOR]: 'Extension Staff Coordinator',
  [ROLE_DEPT_EXTENSION_COORDINATOR]: 'Dept. Extension Coordinator',
  [ROLE_FACILITATOR]: 'Facilitator',
}

/** User & access management is admin-only (spec §2.2). */
export const USER_MANAGEMENT_ROLES = [ROLE_ADMIN] as const

/** A university department (backend `DepartmentResponse`). */
export type Department = {
  id: string
  code: string
  name: string
  active: boolean
}

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  middleName: string | null
  contactNumber: string | null
  roles: string[]
  /** Null for campus-wide accounts. */
  department: Department | null
  /** Set when the user has a profile photo; also the cache key for re-fetching it. */
  avatarUpdatedAt: string | null
  mustChangePassword?: boolean
}

export type AuthResponse = AuthUser & {
  accessToken: string
  refreshToken: string
  tokenType: string
  mustChangePassword: boolean
}

export type LoginPayload = {
  email: string
  password: string
  captchaToken?: string | null
}

export type ForgotPasswordPayload = {
  email: string
}

export type ResetPasswordPayload = {
  token: string
  password: string
  passwordConfirmation: string
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
  newPasswordConfirmation: string
}

/**
 * Self-service profile edit. Email, role and status are deliberately absent — those stay with
 * user management, and the API ignores them on this endpoint.
 */
export type UpdateProfilePayload = {
  firstName: string
  lastName: string
  middleName: string
  contactNumber: string
}
