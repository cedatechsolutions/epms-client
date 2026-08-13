import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { isApiError } from '@/shared/api/http'
import { changePassword } from '../api/authApi'
import AuthCard from '../components/AuthCard'
import { useAuthStore } from '../store/authStore'

const inputClassName =
  'w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const mustChangePassword = useAuthStore((state) => state.mustChangePassword)
  const markPasswordChanged = useAuthStore((state) => state.markPasswordChanged)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const currentPassword = String(formData.get('currentPassword') ?? '')
    const newPassword = String(formData.get('newPassword') ?? '')
    const newPasswordConfirmation = String(formData.get('newPasswordConfirmation') ?? '')

    setErrorMessage(null)

    if (newPassword !== newPasswordConfirmation) {
      setErrorMessage('Password confirmation must match the new password.')
      return
    }

    setIsSubmitting(true)
    try {
      await changePassword({ currentPassword, newPassword, newPasswordConfirmation })
      markPasswordChanged()
      navigate('/admin/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(isApiError(error) ? error.message : 'Unable to change your password. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      title={mustChangePassword ? 'Set a new password' : 'Change your password'}
      description={
        mustChangePassword
          ? 'For security, you must set a new password before continuing to the workspace.'
          : 'Update your account password. Enter your current password to confirm.'
      }
    >
      <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
        {errorMessage ? (
          <div className="rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">{errorMessage}</div>
        ) : null}

        <div>
          <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium text-ink">
            Current password
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              name="currentPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              disabled={isSubmitting}
              placeholder="Enter your current password"
              className={`${inputClassName} pr-12 rounded-md`}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              disabled={isSubmitting}
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-icon-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 rounded-r-md"
            >
              {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-ink">
            New password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={8}
            required
            disabled={isSubmitting}
            placeholder="Enter a new password"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="newPasswordConfirmation" className="mb-2 block text-sm font-medium text-ink">
            Confirm new password
          </label>
          <input
            id="newPasswordConfirmation"
            name="newPasswordConfirmation"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={8}
            required
            disabled={isSubmitting}
            placeholder="Re-enter the new password"
            className={inputClassName}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full cursor-pointer border border-primary bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
        >
          {isSubmitting ? 'Saving...' : 'Update password'}
        </button>
      </form>
    </AuthCard>
  )
}
