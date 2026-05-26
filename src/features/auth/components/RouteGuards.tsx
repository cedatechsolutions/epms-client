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
