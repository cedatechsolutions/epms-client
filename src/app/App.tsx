import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from '@/features/admin'
import {
  ADMIN_ROLES,
  LoginPage,
  PublicOnlyRoute,
  RequireAuth,
  RequireRole,
  useAuthStore,
} from '@/features/auth'
import { DashboardPage } from '@/features/dashboard'
import { AdminUsersListPage } from '@/features/users'
import { registerUnauthorizedHandler } from '@/shared/api/http'

function AppLoader() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f1] px-4 text-[#123524]">
      <div className="flex items-center gap-3 border border-[#d8e1d4] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(18,53,36,0.05)]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#d8e1d4] border-t-[#1f5d3b]" />
        <span className="text-sm font-medium">Loading your session...</span>
      </div>
    </main>
  )
}

export default function App() {
  const bootstrapAuth = useAuthStore((state) => state.bootstrapAuth)
  const clearSession = useAuthStore((state) => state.clearSession)
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping)

  useEffect(() => {
    void bootstrapAuth()
  }, [bootstrapAuth])

  useEffect(() => {
    const unregister = registerUnauthorizedHandler(() => {
      clearSession()
    })

    return unregister
  }, [clearSession])

  if (isBootstrapping) {
    return <AppLoader />
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route element={<RequireRole allowedRoles={ADMIN_ROLES} />}>
            <Route path="users" element={<AdminUsersListPage />} />
            <Route path="users/new" element={<Navigate to="/admin/users" replace />} />
            <Route path="users/:id" element={<Navigate to="/admin/users" replace />} />
            <Route path="users/:id/edit" element={<Navigate to="/admin/users" replace />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}
