import { useCallback, useEffect, useState } from 'react'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded'
import RemoveModeratorOutlinedIcon from '@mui/icons-material/RemoveModeratorOutlined'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import { useLocation, useNavigate, useParams } from 'react-router'
import type { ApiValidationErrors } from '@/shared/api/http'
import { isApiError } from '@/shared/api/http'
import {
  getAdminUser,
  patchAdminUserStatus,
  resetAdminUserPassword,
} from '../api/adminUsersApi'
import ResetPasswordModal from '../components/ResetPasswordModal'
import StatusToggleConfirmModal from '../components/StatusToggleConfirmModal'
import UserStatusChip from '../components/UserStatusChip'
import { getUserRequestErrorMessage } from '../lib/errorMessages'
import { formatDateTime } from '../lib/formatters'
import type { ResetPasswordPayload, User } from '../types'

type ToastState = {
  open: boolean
  message: string
  severity: 'success' | 'error'
}

export default function AdminUserViewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetApiErrors, setResetApiErrors] = useState<ApiValidationErrors | undefined>(undefined)
  const [toast, setToast] = useState<ToastState>({ open: false, message: '', severity: 'success' })

  const loadUser = useCallback(async () => {
    if (!id) {
      setErrorMessage('User not found.')
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await getAdminUser(id)
      setUser(response)
    } catch (error) {
      setErrorMessage(getUserRequestErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadUser()
  }, [loadUser])

  useEffect(() => {
    const state = location.state as { toast?: string } | null
    if (!state?.toast) return

    setToast({
      open: true,
      message: state.toast,
      severity: 'success',
    })
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  const handleStatusToggle = async () => {
    if (!user) return

    const nextStatus = user.status === 'active' ? 'inactive' : 'active'
    setStatusLoading(true)

    try {
      await patchAdminUserStatus(user.id, nextStatus)
      setStatusModalOpen(false)
      await loadUser()
      setToast({
        open: true,
        message: `User ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully.`,
        severity: 'success',
      })
    } catch (error) {
      setToast({
        open: true,
        message: getUserRequestErrorMessage(error),
        severity: 'error',
      })
    } finally {
      setStatusLoading(false)
    }
  }

  const handleResetPassword = async (payload: ResetPasswordPayload) => {
    if (!user) return
    setResetLoading(true)
    setResetApiErrors(undefined)

    try {
      await resetAdminUserPassword(user.id, payload)
      setResetModalOpen(false)
      setToast({
        open: true,
        message: 'Password reset successfully.',
        severity: 'success',
      })
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        setResetApiErrors(error.data?.errors ?? {})
        return
      }

      setToast({
        open: true,
        message: getUserRequestErrorMessage(error),
        severity: 'error',
      })
    } finally {
      setResetLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (errorMessage || !user) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{errorMessage || 'User not found.'}</Alert>
        <Box>
          <Button variant="outlined" onClick={() => navigate('/admin/users')}>
            Back to Users
          </Button>
        </Box>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography variant="h5">User Details</Typography>
          <Typography variant="body2" color="text.secondary">
            Review account details and perform administrative actions.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="text" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/admin/users')}>
            Back to Users
          </Button>
          <Button variant="contained" startIcon={<EditOutlinedIcon />} onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
            Edit
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Full Name
              </Typography>
              <Typography>{user.full_name}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Email
              </Typography>
              <Typography>{user.email}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Role
              </Typography>
              <Typography sx={{ textTransform: 'capitalize' }}>{user.role}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Status
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <UserStatusChip status={user.status} />
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Last Login
              </Typography>
              <Typography>{formatDateTime(user.last_login_at)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Created At
              </Typography>
              <Typography>{formatDateTime(user.created_at)}</Typography>
            </Box>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RemoveModeratorOutlinedIcon />}
              onClick={() => setStatusModalOpen(true)}
            >
              {user.status === 'active' ? 'Deactivate User' : 'Activate User'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<LockResetRoundedIcon />}
              onClick={() => {
                setResetApiErrors(undefined)
                setResetModalOpen(true)
              }}
            >
              Reset Password
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <StatusToggleConfirmModal
        open={statusModalOpen}
        user={user}
        loading={statusLoading}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={handleStatusToggle}
      />

      <ResetPasswordModal
        key={resetModalOpen ? `${user.id}-open` : `${user.id}-closed`}
        open={resetModalOpen}
        user={user}
        loading={resetLoading}
        apiErrors={resetApiErrors}
        onClose={() => setResetModalOpen(false)}
        onSubmit={handleResetPassword}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((current) => ({ ...current, open: false }))}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
