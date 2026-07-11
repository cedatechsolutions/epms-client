import { Navigate, Outlet, useLocation } from 'react-router'
import { hasAnyRole } from '../lib/access'
import { useAuthStore } from '../store/authStore'

export function PublicOnlyRoute() {
  const user = useAuthStore((state) => state.user)

  if (user) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Outlet />
}

export function RequireAuth() {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

/**
 * Blocks the app until a user flagged {@code mustChangePassword} sets a new password.
 * Wrap the authenticated app (not the change-password page itself) with this.
 */
export function RequirePasswordCurrent() {
  const user = useAuthStore((state) => state.user)
  const mustChangePassword = useAuthStore((state) => state.mustChangePassword)

  if (user && mustChangePassword) {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}

type RequireRoleProps = {
  allowedRoles: readonly string[]
  fallbackPath?: string
}

export function RequireRole({ allowedRoles, fallbackPath = '/admin/dashboard' }: RequireRoleProps) {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!hasAnyRole(user, allowedRoles)) {
    return <Navigate to={fallbackPath} replace />
  }

  return <Outlet />
}
