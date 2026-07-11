import { ROLE_LABELS, type AuthUser } from '../types'

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
  if (!user || user.roles.length === 0) {
    return 'Authenticated user'
  }

  const [primaryRole] = [...user.roles].sort()
  return ROLE_LABELS[primaryRole] ?? primaryRole
}
