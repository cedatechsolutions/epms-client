import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { ApiValidationErrors } from '@/shared/api/http'
import type { ResetPasswordPayload, User } from '../types'

type ResetPasswordModalProps = {
  open: boolean
  user: User | null
  loading?: boolean
  apiErrors?: ApiValidationErrors
  onClose: () => void
  onSubmit: (payload: ResetPasswordPayload) => void | Promise<void>
}

type ResetPasswordFormValues = {
  password: string
  password_confirmation: string
}

type FieldErrors = Partial<Record<keyof ResetPasswordFormValues, string>>

const initialValues: ResetPasswordFormValues = {
  password: '',
  password_confirmation: '',
}

export default function ResetPasswordModal({
  open,
  user,
  loading = false,
  apiErrors,
  onClose,
  onSubmit,
}: ResetPasswordModalProps) {
  const [values, setValues] = useState<ResetPasswordFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const formErrors = useMemo<FieldErrors>(() => {
    return {
      password: fieldErrors.password || apiErrors?.password?.[0],
      password_confirmation:
        fieldErrors.password_confirmation || apiErrors?.password_confirmation?.[0],
    }
  }, [apiErrors, fieldErrors])

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {}

    if (!values.password) {
      errors.password = 'Password is required.'
    } else if (values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }

    if (!values.password_confirmation) {
      errors.password_confirmation = 'Password confirmation is required.'
    } else if (values.password !== values.password_confirmation) {
      errors.password_confirmation = 'Password confirmation must match password.'
    }

    return errors
  }

  const handleConfirm = async () => {
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Reset Password</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {user ? `Set a new password for ${user.full_name}.` : 'Set a new password.'}
          </Typography>
          <Alert severity="info">Password must contain at least 8 characters.</Alert>
          <TextField
            label="New Password"
            type="password"
            size="small"
            value={values.password}
            onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
            error={Boolean(formErrors.password)}
            helperText={formErrors.password}
            fullWidth
          />
          <TextField
            label="Confirm Password"
            type="password"
            size="small"
            value={values.password_confirmation}
            onChange={(event) =>
              setValues((current) => ({ ...current, password_confirmation: event.target.value }))
            }
            error={Boolean(formErrors.password_confirmation)}
            helperText={formErrors.password_confirmation}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Reset Password'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
