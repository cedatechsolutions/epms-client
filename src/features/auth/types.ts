export const ROLE_SUPER_ADMIN = 'ROLE_SUPER_ADMIN'
export const ROLE_ADMIN = 'ROLE_ADMIN'
export const ROLE_USER = 'ROLE_USER'

export const ADMIN_ROLES = [ROLE_ADMIN, ROLE_SUPER_ADMIN] as const
export const SUPER_ADMIN_ROLES = [ROLE_SUPER_ADMIN] as const

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  middleName: string | null
  contactNumber: string | null
  roles: string[]
}

export type AuthResponse = AuthUser & {
  accessToken: string
  tokenType: string
}

export type LoginPayload = {
  email: string
  password: string
  captchaToken?: string | null
}
