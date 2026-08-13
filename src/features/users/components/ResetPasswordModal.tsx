import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { useMemo, useState } from 'react'
import type { ApiValidationErrors } from '@/shared/api/http'
import type { ResetPasswordPayload, User } from '../types'
import AdminDialog from './AdminDialog'

type ResetPasswordModalProps = {
  open: boolean
  user: User | null
  loading?: boolean
  apiErrors?: ApiValidationErrors
  errorMessage?: string | null
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

function ButtonSpinner({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <span
      className={[
        'h-4 w-4 animate-spin rounded-full border-2',
        tone === 'light' ? 'border-white/35 border-t-white' : 'border-line border-t-primary-accent',
      ].join(' ')}
    />
  )
}

export default function ResetPasswordModal({
  open,
  user,
  loading = false,
  apiErrors,
  errorMessage,
  onClose,
  onSubmit,
}: ResetPasswordModalProps) {
  const [values, setValues] = useState<ResetPasswordFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)

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

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="cursor-pointer border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => void handleConfirm()}
        disabled={loading}
        className="inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
      >
        {loading ? <ButtonSpinner /> : null}
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </div>
  )

  return (
    <AdminDialog
      open={open}
      title="Reset Password"
      description={user ? `Set a new password for ${user.full_name}.` : 'Set a new password.'}
      footer={footer}
      maxWidthClassName="max-w-xl"
      closeDisabled={loading}
      onClose={onClose}
    >
      <div className="space-y-4" aria-busy={loading}>
        {errorMessage ? (
          <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
            {errorMessage}
          </div>
        ) : null}

        <div className="border border-info-border bg-info-bg px-4 py-3 text-sm leading-6 text-info-text">
          Password must contain at least 8 characters.
        </div>

        <label className="space-y-2 text-sm text-cell">
          <span className="font-medium text-ink">New Password</span>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              disabled={loading}
              onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
              className="w-full border border-line px-3 py-2.5 pr-12 text-sm text-ink outline-none transition-colors placeholder:text-muted-soft focus:border-primary-accent focus:bg-row-hover disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md"
              placeholder="Enter new password"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              disabled={loading}
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-icon-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-45 rounded-r-md"
            >
              {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
            </button>
          </div>
          {formErrors.password ? <p className="text-xs text-danger-strong">{formErrors.password}</p> : null}
        </label>

        <label className="space-y-2 text-sm text-cell">
          <span className="font-medium text-ink">Confirm Password</span>
          <div className="relative">
            <input
              type={showPasswordConfirmation ? 'text' : 'password'}
              value={values.password_confirmation}
              disabled={loading}
              onChange={(event) =>
                setValues((current) => ({ ...current, password_confirmation: event.target.value }))
              }
              className="w-full border border-line px-3 py-2.5 pr-12 text-sm text-ink outline-none transition-colors placeholder:text-muted-soft focus:border-primary-accent focus:bg-row-hover disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              aria-label={showPasswordConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}
              aria-pressed={showPasswordConfirmation}
              disabled={loading}
              onClick={() => setShowPasswordConfirmation((current) => !current)}
              className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-icon-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-45 rounded-r-md"
            >
              {showPasswordConfirmation ? (
                <VisibilityOffRoundedIcon fontSize="small" />
              ) : (
                <VisibilityRoundedIcon fontSize="small" />
              )}
            </button>
          </div>
          {formErrors.password_confirmation ? (
            <p className="text-xs text-danger-strong">{formErrors.password_confirmation}</p>
          ) : null}
        </label>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted" role="status" aria-live="polite">
            <ButtonSpinner tone="dark" />
            Saving password change...
          </div>
        ) : null}
      </div>
    </AdminDialog>
  )
}
