import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { isApiError } from '@/shared/api/http'
import { resetPassword } from '../api/authApi'
import AuthCard from '../components/AuthCard'

const inputClassName =
  'w-full border border-control-border bg-surface px-4 py-3 pr-12 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') ?? '')
    const passwordConfirmation = String(formData.get('passwordConfirmation') ?? '')

    setErrorMessage(null)

    if (password !== passwordConfirmation) {
      setErrorMessage('Password confirmation must match password.')
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword({ token, password, passwordConfirmation })
      navigate('/login', {
        replace: true,
        state: { notice: 'Your password has been reset. Please sign in with your new password.' },
      })
    } catch (error) {
      setErrorMessage(isApiError(error) ? error.message : 'Unable to reset your password. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <AuthCard
        title="Reset link invalid"
        description="This password reset link is missing or malformed. Request a new one to continue."
        footer={
          <Link to="/forgot-password" className="font-medium text-primary-accent transition-colors hover:text-primary-hover">
            Request a new reset link
          </Link>
        }
      >
        <div className="mt-4 rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">
          No reset token was provided.
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Set a new password"
      description="Choose a new password for your account. It must be at least 8 characters."
      footer={
        <Link to="/login" className="font-medium text-primary-accent transition-colors hover:text-primary-hover">
          Back to sign in
        </Link>
      }
    >
      <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
        {errorMessage ? (
          <div className="rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">{errorMessage}</div>
        ) : null}

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={8}
              required
              disabled={isSubmitting}
              placeholder="Enter a new password"
              className={inputClassName}
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
          <label htmlFor="passwordConfirmation" className="mb-2 block text-sm font-medium text-ink">
            Confirm new password
          </label>
          <input
            id="passwordConfirmation"
            name="passwordConfirmation"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={8}
            required
            disabled={isSubmitting}
            placeholder="Re-enter the new password"
            className="w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full cursor-pointer border border-primary bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
        >
          {isSubmitting ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </AuthCard>
  )
}
