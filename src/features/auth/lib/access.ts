import { ROLE_ADMIN, ROLE_SUPER_ADMIN, type AuthUser } from '../types'

export function hasAnyRole(user: AuthUser | null | undefined, roles: readonly string[]): boolean {
  if (!user) {
    return false
  }

  return user.roles.some((role) => roles.includes(role))
}

export function getUserDisplayName(user: AuthUser | null | undefined): string {
  if (!user) {
    return 'Administrator'
  }

  const fullName = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ').trim()
  return fullName || user.email
}

export function getUserInitials(user: AuthUser | null | undefined): string {
  if (!user) {
    return 'AD'
  }

  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((part) => part.trim().charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)

  if (initials) {
    return initials
  }

  return user.email.slice(0, 2).toUpperCase()
}

export function getPrimaryRoleLabel(user: AuthUser | null | undefined): string {
  if (!user) {
    return 'Authenticated user'
  }

  if (user.roles.includes(ROLE_SUPER_ADMIN)) {
    return 'Super Admin'
  }

  if (user.roles.includes(ROLE_ADMIN)) {
    return 'Admin'
  }

  return 'User'
}
