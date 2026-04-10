import { useEffect, useMemo, useState } from 'react'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router'
import type { ApiValidationErrors } from '@/shared/api/http'
import { isApiError } from '@/shared/api/http'
import { getAdminUser, updateAdminUser } from '../api/adminUsersApi'
import UserForm from '../components/UserForm'
import { getUserRequestErrorMessage } from '../lib/errorMessages'
import type { UpdateUserPayload, User } from '../types'

export default function AdminUserEditPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null)
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)
  const [apiFieldErrors, setApiFieldErrors] = useState<ApiValidationErrors | undefined>(undefined)

  useEffect(() => {
    if (!id) {
      setLoadErrorMessage('User not found.')
      setIsLoadingUser(false)
      return
    }

    const loadUser = async () => {
      setIsLoadingUser(true)
      setLoadErrorMessage(null)
      try {
        const response = await getAdminUser(id)
        setUser(response)
      } catch (error) {
        setLoadErrorMessage(getUserRequestErrorMessage(error))
      } finally {
        setIsLoadingUser(false)
      }
    }

    void loadUser()
  }, [id])

  const initialValues = useMemo(() => {
    if (!user) return undefined
    return {
      first_name: user.first_name,
      last_name: user.last_name,
      middle_name: user.middle_name ?? '',
      email: user.email,
      password: '',
      role: user.role,
      status: user.status,
    }
  }, [user])

  const handleSubmit = async (payload: UpdateUserPayload) => {
    if (!id) return
    setIsSaving(true)
    setFormErrorMessage(null)
    setApiFieldErrors(undefined)

    try {
      await updateAdminUser(id, payload)
      navigate(`/admin/users/${id}`, {
        state: { toast: 'User updated successfully.' },
      })
    } catch (error) {
      if (isApiError(error) && error.status === 422) {
        setApiFieldErrors(error.data?.errors ?? {})
      } else {
        setFormErrorMessage(getUserRequestErrorMessage(error))
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (loadErrorMessage || !user) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{loadErrorMessage || 'User not found.'}</Alert>
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
          <Typography variant="h5">Edit User</Typography>
          <Typography variant="body2" color="text.secondary">
            Update user profile, role, and status.
          </Typography>
        </Box>
        <Button variant="text" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(`/admin/users/${id}`)}>
          Back to User
        </Button>
      </Stack>

      <UserForm
        mode="edit"
        initialValues={initialValues}
        submitLabel="Save Changes"
        loading={isSaving}
        apiErrors={apiFieldErrors}
        errorMessage={formErrorMessage}
        onCancel={() => navigate(`/admin/users/${id}`)}
        onSubmit={(payload) => handleSubmit(payload as UpdateUserPayload)}
      />
    </Stack>
  )
}
