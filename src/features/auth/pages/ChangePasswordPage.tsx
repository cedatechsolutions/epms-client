import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { isApiError } from '@/shared/api/http'
import { changePassword } from '../api/authApi'
import AuthCard from '../components/AuthCard'
import { useAuthStore } from '../store/authStore'

const inputClassName =
  'w-full border border-[#cad5c7] bg-white px-4 py-3 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]'

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
          <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">{errorMessage}</div>
        ) : null}

        <div>
          <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium text-[#123524]">
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
              className={`${inputClassName} pr-12`}
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
          <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-[#123524]">
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
          <label htmlFor="newPasswordConfirmation" className="mb-2 block text-sm font-medium text-[#123524]">
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
          className="w-full cursor-pointer border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : 'Update password'}
        </button>
      </form>
    </AuthCard>
  )
}
