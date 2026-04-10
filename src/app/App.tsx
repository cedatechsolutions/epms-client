import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from '@/features/admin'
import { LoginPage } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard'
import {
  AdminUserCreatePage,
  AdminUserEditPage,
  AdminUsersListPage,
  AdminUserViewPage,
} from '@/features/users'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<AdminUsersListPage />} />
        <Route path="users/new" element={<AdminUserCreatePage />} />
        <Route path="users/:id" element={<AdminUserViewPage />} />
        <Route path="users/:id/edit" element={<AdminUserEditPage />} />
      </Route>

      <Route path="/test" element={<AdminLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
