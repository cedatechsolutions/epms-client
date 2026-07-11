import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { isApiError } from '@/shared/api/http'
import { resetPassword } from '../api/authApi'
import AuthCard from '../components/AuthCard'

const inputClassName =
  'w-full border border-[#cad5c7] bg-white px-4 py-3 pr-12 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]'

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
          <Link to="/forgot-password" className="font-medium text-[#1f5d3b] transition-colors hover:text-[#18492e]">
            Request a new reset link
          </Link>
        }
      >
        <div className="mt-4 border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">
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
        <Link to="/login" className="font-medium text-[#1f5d3b] transition-colors hover:text-[#18492e]">
          Back to sign in
        </Link>
      }
    >
      <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
        {errorMessage ? (
          <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">{errorMessage}</div>
        ) : null}

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#123524]">
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
              className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-[#60755f] transition-colors hover:text-[#123524] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="passwordConfirmation" className="mb-2 block text-sm font-medium text-[#123524]">
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
            className="w-full border border-[#cad5c7] bg-white px-4 py-3 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full cursor-pointer border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </AuthCard>
  )
}
