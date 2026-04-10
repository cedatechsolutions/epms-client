import { useState } from 'react'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Box, Button, Snackbar, Stack, Typography } from '@mui/material'
import Alert from '@mui/material/Alert'
import { useNavigate } from 'react-router'
import type { ApiValidationErrors } from '@/shared/api/http'
import { isApiError } from '@/shared/api/http'
import { createAdminUser } from '../api/adminUsersApi'
import UserForm from '../components/UserForm'
import { getUserRequestErrorMessage } from '../lib/errorMessages'
import type { CreateUserPayload, UpdateUserPayload } from '../types'

type ToastState = {
  open: boolean
  message: string
}

export default function AdminUserCreatePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)
  const [apiFieldErrors, setApiFieldErrors] = useState<ApiValidationErrors | undefined>(undefined)
  const [toast, setToast] = useState<ToastState>({ open: false, message: '' })

  const handleSubmit = async (payload: CreateUserPayload | UpdateUserPayload) => {
    setLoading(true)
    setFormErrorMessage(null)
    setApiFieldErrors(undefined)

    try {
      const user = await createAdminUser(payload as CreateUserPayload)
      setToast({ open: true, message: 'User created successfully.' })
      navigate('/admin/users', {
        state: { toast: `User ${user.full_name} created successfully.` },
      })
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        setApiFieldErrors(error.data?.errors ?? {})
      } else {
        setFormErrorMessage(getUserRequestErrorMessage(error))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography variant="h5">Create User</Typography>
          <Typography variant="body2" color="text.secondary">
            Add a new user account with role and status configuration.
          </Typography>
        </Box>
        <Button variant="text" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/admin/users')}>
          Back to Users
        </Button>
      </Stack>

      <UserForm
        mode="create"
        submitLabel="Create User"
        loading={loading}
        apiErrors={apiFieldErrors}
        errorMessage={formErrorMessage}
        onCancel={() => navigate('/admin/users')}
        onSubmit={handleSubmit}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      >
        <Alert
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
          onClose={() => setToast((current) => ({ ...current, open: false }))}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
