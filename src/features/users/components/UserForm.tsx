import { useMemo, useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { ApiValidationErrors } from '@/shared/api/http'
import type { CreateUserPayload, UpdateUserPayload, UserFormValues } from '../types'

type UserFormMode = 'create' | 'edit'

type UserFormProps = {
  mode: UserFormMode
  initialValues?: Partial<UserFormValues>
  apiErrors?: ApiValidationErrors
  submitLabel: string
  loading?: boolean
  errorMessage?: string | null
  onCancel?: () => void
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => void | Promise<void>
}

type FieldErrors = Partial<Record<keyof UserFormValues, string>>

const defaultValues: UserFormValues = {
  first_name: '',
  last_name: '',
  middle_name: '',
  email: '',
  password: '',
  role: 'user',
  status: 'active',
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function buildInitialValues(initialValues?: Partial<UserFormValues>): UserFormValues {
  return {
    ...defaultValues,
    ...initialValues,
  }
}

export default function UserForm({
  mode,
  initialValues,
  apiErrors,
  submitLabel,
  loading = false,
  errorMessage,
  onCancel,
  onSubmit,
}: UserFormProps) {
  const [values, setValues] = useState<UserFormValues>(buildInitialValues(initialValues))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const mergedFieldErrors = useMemo<FieldErrors>(() => {
    return {
      first_name: fieldErrors.first_name || apiErrors?.first_name?.[0],
      last_name: fieldErrors.last_name || apiErrors?.last_name?.[0],
      middle_name: fieldErrors.middle_name || apiErrors?.middle_name?.[0],
      email: fieldErrors.email || apiErrors?.email?.[0],
      password: fieldErrors.password || apiErrors?.password?.[0],
      role: fieldErrors.role || apiErrors?.role?.[0],
      status: fieldErrors.status || apiErrors?.status?.[0],
    }
  }, [apiErrors, fieldErrors])

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {}

    if (!values.first_name.trim()) {
      errors.first_name = 'First name is required.'
    } else if (values.first_name.length > 255) {
      errors.first_name = 'First name must not exceed 255 characters.'
    }

    if (!values.last_name.trim()) {
      errors.last_name = 'Last name is required.'
    } else if (values.last_name.length > 255) {
      errors.last_name = 'Last name must not exceed 255 characters.'
    }

    if (values.middle_name.length > 255) {
      errors.middle_name = 'Middle name must not exceed 255 characters.'
    }

    if (!values.email.trim()) {
      errors.email = 'Email is required.'
    } else if (!emailRegex.test(values.email)) {
      errors.email = 'Enter a valid email address.'
    }

    if (mode === 'create' && !values.password) {
      errors.password = 'Password is required.'
    } else if (values.password && values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }

    return errors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) return

    const basePayload = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      middle_name: values.middle_name.trim() ? values.middle_name.trim() : null,
      email: values.email.trim(),
      role: values.role,
      status: values.status,
    }

    if (mode === 'create') {
      await onSubmit({
        ...basePayload,
        password: values.password,
      })
      return
    }

    const updatePayload: UpdateUserPayload = {
      ...basePayload,
    }

    if (values.password) {
      updatePayload.password = values.password
    }

    await onSubmit(updatePayload)
  }

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: { xs: 2, sm: 3 } }}>
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          <TextField
            label="First Name"
            value={values.first_name}
            size="small"
            onChange={(event) => setValues((current) => ({ ...current, first_name: event.target.value }))}
            error={Boolean(mergedFieldErrors.first_name)}
            helperText={mergedFieldErrors.first_name}
            required
          />
          <TextField
            label="Last Name"
            value={values.last_name}
            size="small"
            onChange={(event) => setValues((current) => ({ ...current, last_name: event.target.value }))}
            error={Boolean(mergedFieldErrors.last_name)}
            helperText={mergedFieldErrors.last_name}
            required
          />
          <TextField
            label="Middle Name"
            value={values.middle_name}
            size="small"
            onChange={(event) => setValues((current) => ({ ...current, middle_name: event.target.value }))}
            error={Boolean(mergedFieldErrors.middle_name)}
            helperText={mergedFieldErrors.middle_name}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          <TextField
            label="Email"
            type="email"
            size="small"
            value={values.email}
            onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
            error={Boolean(mergedFieldErrors.email)}
            helperText={mergedFieldErrors.email}
            required
          />
          <TextField
            label={mode === 'create' ? 'Password' : 'Password (optional)'}
            type="password"
            size="small"
            value={values.password}
            onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
            error={Boolean(mergedFieldErrors.password)}
            helperText={mergedFieldErrors.password || (mode === 'edit' ? 'Leave blank to keep current password.' : '')}
            required={mode === 'create'}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          <FormControl size="small" error={Boolean(mergedFieldErrors.role)}>
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              label="Role"
              value={values.role}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  role: event.target.value as UserFormValues['role'],
                }))
              }
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="user">User</MenuItem>
            </Select>
            {mergedFieldErrors.role ? (
              <Typography variant="caption" color="error.main" sx={{ mt: 0.5, ml: 1.75 }}>
                {mergedFieldErrors.role}
              </Typography>
            ) : null}
          </FormControl>

          <FormControl size="small" error={Boolean(mergedFieldErrors.status)}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              label="Status"
              value={values.status}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  status: event.target.value as UserFormValues['status'],
                }))
              }
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
            {mergedFieldErrors.status ? (
              <Typography variant="caption" color="error.main" sx={{ mt: 0.5, ml: 1.75 }}>
                {mergedFieldErrors.status}
              </Typography>
            ) : null}
          </FormControl>
        </Box>

        <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ pt: 1 }}>
          {onCancel ? (
            <Button variant="text" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
