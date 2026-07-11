// The six EPMS domain roles (spec §2.1). Values are the snake_case codes the API uses.
export const ROLE_ADMIN = 'admin'
export const ROLE_CAMPUS_ADMIN = 'campus_admin'
export const ROLE_CAMPUS_EXTENSION_COORDINATOR = 'campus_extension_coordinator'
export const ROLE_EXTENSION_COORDINATOR = 'extension_coordinator'
export const ROLE_FACULTY = 'faculty'
export const ROLE_STUDENT_VOLUNTEER = 'student_volunteer'

export const ALL_ROLES = [
  ROLE_ADMIN,
  ROLE_CAMPUS_ADMIN,
  ROLE_CAMPUS_EXTENSION_COORDINATOR,
  ROLE_EXTENSION_COORDINATOR,
  ROLE_FACULTY,
  ROLE_STUDENT_VOLUNTEER,
] as const

export type RoleCode = (typeof ALL_ROLES)[number]

/** Human-friendly labels for the role codes, for badges and selects. */
export const ROLE_LABELS: Record<string, string> = {
  [ROLE_ADMIN]: 'Admin',
  [ROLE_CAMPUS_ADMIN]: 'Campus Admin',
  [ROLE_CAMPUS_EXTENSION_COORDINATOR]: 'Campus Extension Coordinator',
  [ROLE_EXTENSION_COORDINATOR]: 'Extension Coordinator',
  [ROLE_FACULTY]: 'Faculty',
  [ROLE_STUDENT_VOLUNTEER]: 'Student Volunteer',
}

/** User & access management is admin-only (spec §2.2). */
export const USER_MANAGEMENT_ROLES = [ROLE_ADMIN] as const

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  middleName: string | null
  contactNumber: string | null
  roles: string[]
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
