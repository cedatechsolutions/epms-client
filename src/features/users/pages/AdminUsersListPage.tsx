import { useCallback, useEffect, useMemo, useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded'
import RemoveModeratorOutlinedIcon from '@mui/icons-material/RemoveModeratorOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Pagination,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router'
import type { ApiValidationErrors } from '@/shared/api/http'
import { isApiError } from '@/shared/api/http'
import {
  listAdminUsers,
  patchAdminUserStatus,
  resetAdminUserPassword,
} from '../api/adminUsersApi'
import ResetPasswordModal from '../components/ResetPasswordModal'
import StatusToggleConfirmModal from '../components/StatusToggleConfirmModal'
import UserStatusChip from '../components/UserStatusChip'
import { getUserRequestErrorMessage } from '../lib/errorMessages'
import { formatDateTime } from '../lib/formatters'
import type { PaginationMeta, ResetPasswordPayload, User } from '../types'

const defaultMeta: PaginationMeta = {
  current_page: 1,
  from: null,
  last_page: 1,
  path: '',
  per_page: 15,
  to: null,
  total: 0,
}

type ToastState = {
  open: boolean
  message: string
  severity: 'success' | 'error'
}

export default function AdminUsersListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusTargetUser, setStatusTargetUser] = useState<User | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetApiErrors, setResetApiErrors] = useState<ApiValidationErrors | undefined>(undefined)
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await listAdminUsers({ page, per_page: 15 })
      setUsers(response.data)
      setMeta(response.meta)
    } catch (error) {
      setErrorMessage(getUserRequestErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

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

  const usersCountLabel = useMemo(() => {
    if (!meta.total) return 'No users found'
    const from = meta.from ?? 0
    const to = meta.to ?? 0
    return `Showing ${from}-${to} of ${meta.total} users`
  }, [meta.from, meta.to, meta.total])

  const handleStatusChange = async () => {
    if (!statusTargetUser) return

    const nextStatus = statusTargetUser.status === 'active' ? 'inactive' : 'active'
    setStatusLoading(true)

    try {
      await patchAdminUserStatus(statusTargetUser.id, nextStatus)
      setStatusTargetUser(null)
      setToast({
        open: true,
        message: `User ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully.`,
        severity: 'success',
      })
      await loadUsers()
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
    if (!resetTargetUser) return

    setResetLoading(true)
    setResetApiErrors(undefined)

    try {
      await resetAdminUserPassword(resetTargetUser.id, payload)
      setResetTargetUser(null)
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

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography variant="h5">Users</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage admin and regular user accounts.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/admin/users/new')}>
          Create User
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={28} />
          </Box>
        ) : errorMessage ? (
          <Box sx={{ p: 2 }}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={loadUsers}>
                  Retry
                </Button>
              }
            >
              {errorMessage}
            </Alert>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover sx={user.status === 'inactive' ? { bgcolor: 'action.hover' } : undefined}>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{user.role}</TableCell>
                      <TableCell>
                        <UserStatusChip status={user.status} />
                      </TableCell>
                      <TableCell>{formatDateTime(user.last_login_at)}</TableCell>
                      <TableCell>{formatDateTime(user.created_at)}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => navigate(`/admin/users/${user.id}`)}>
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={user.status === 'active' ? 'Deactivate' : 'Activate'}>
                            <IconButton size="small" onClick={() => setStatusTargetUser(user)}>
                              <RemoveModeratorOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reset password">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setResetApiErrors(undefined)
                                setResetTargetUser(user)
                              }}
                            >
                              <LockResetRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1}
              sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
            >
              <Typography variant="body2" color="text.secondary">
                {usersCountLabel}
              </Typography>
              <Pagination
                page={meta.current_page}
                count={meta.last_page}
                color="primary"
                shape="rounded"
                onChange={(_event, value) => setPage(value)}
              />
            </Stack>
          </>
        )}
      </Paper>

      <StatusToggleConfirmModal
        open={Boolean(statusTargetUser)}
        user={statusTargetUser}
        loading={statusLoading}
        onClose={() => setStatusTargetUser(null)}
        onConfirm={handleStatusChange}
      />

      <ResetPasswordModal
        key={resetTargetUser?.id ?? 'reset-closed'}
        open={Boolean(resetTargetUser)}
        user={resetTargetUser}
        loading={resetLoading}
        apiErrors={resetApiErrors}
        onClose={() => setResetTargetUser(null)}
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
