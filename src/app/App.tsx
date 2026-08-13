import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from '@/features/admin'
import {
  ChangePasswordPage,
  ForgotPasswordPage,
  LoginPage,
  PublicOnlyRoute,
  RequireAuth,
  RequirePasswordCurrent,
  RequireRole,
  ResetPasswordPage,
  USER_MANAGEMENT_ROLES,
  useAuthStore,
} from '@/features/auth'
import { ActivityLogPage } from '@/features/activity-logs'
import { CommunitiesListPage, CommunityDetailPage } from '@/features/communities'
import { DashboardPage } from '@/features/dashboard'
import { ProfileSettingsPage } from '@/features/profile'
import { PrivacyNoticePage, PublicSurveyPage } from '@/features/public-survey'
import {
  ProgramTypesPage,
  RecommendationsPage,
  ScoringMatrixPage,
} from '@/features/recommendations'
import {
  ASSESSMENT_VIEW_ROLES,
  SurveyBuilderPage,
  SurveyResultsPage,
  SurveysListPage,
} from '@/features/surveys'
import { AdminUsersListPage } from '@/features/users'
import { registerUnauthorizedHandler } from '@/shared/api/http'
import { ToastViewport } from '@/shared/toast'

function AppLoader() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-4 text-ink">
      <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-5 py-4 shadow-card">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-primary-accent" />
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
    <>
      <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Public password-recovery routes (reachable regardless of session). */}
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Public tokenized survey form — no auth, no admin chrome (spec Module 3 §3). */}
      <Route path="/s/:token" element={<PublicSurveyPage />} />

      {/* Public privacy notice — RA 10173 (spec §5.3); linked from login and the survey form. */}
      <Route path="/privacy" element={<PrivacyNoticePage />} />

      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Reachable even while a forced password change is pending. */}
        <Route path="/change-password" element={<ChangePasswordPage />} />

        <Route element={<RequirePasswordCurrent />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Every authenticated role manages their own account here. */}
            <Route path="profile" element={<ProfileSettingsPage />} />

            {/* Communities are viewable by all authenticated roles; write actions are gated in-page. */}
            <Route path="communities" element={<CommunitiesListPage />} />
            <Route path="communities/:id" element={<CommunityDetailPage />} />

            {/* Needs assessment + recommendations — every role except student volunteers
                (spec §2.2). Generating, deciding and matrix edits are gated in-page, since the
                backend allows a wider set of roles to read these screens than to change them. */}
            <Route element={<RequireRole allowedRoles={ASSESSMENT_VIEW_ROLES} />}>
              <Route path="surveys" element={<SurveysListPage />} />
              <Route path="surveys/:id/build" element={<SurveyBuilderPage />} />
              <Route path="surveys/:id/results" element={<SurveyResultsPage />} />
              <Route path="surveys/:id/recommendations" element={<RecommendationsPage />} />
              <Route path="program-types" element={<ProgramTypesPage />} />
              <Route path="scoring-matrix" element={<ScoringMatrixPage />} />
            </Route>

            <Route element={<RequireRole allowedRoles={USER_MANAGEMENT_ROLES} />}>
              <Route path="users" element={<AdminUsersListPage />} />
              <Route path="users/new" element={<Navigate to="/admin/users" replace />} />
              <Route path="users/:id" element={<Navigate to="/admin/users" replace />} />
              <Route path="users/:id/edit" element={<Navigate to="/admin/users" replace />} />
              <Route path="activity-logs" element={<ActivityLogPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
      <ToastViewport />
    </>
  )
}
