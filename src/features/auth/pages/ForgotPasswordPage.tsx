import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { isApiError } from '@/shared/api/http'
import { requestPasswordReset } from '../api/authApi'
import AuthCard from '../components/AuthCard'

const inputClassName =
  'w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()

    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const response = await requestPasswordReset({ email })
      setSuccessMessage(response.message)
    } catch (error) {
      setErrorMessage(isApiError(error) ? error.message : 'Unable to send the reset link. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email associated with your account and we'll send a link to reset your password."
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
        {successMessage ? (
          <div className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-sm text-primary-accent">{successMessage}</div>
        ) : null}

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isSubmitting}
            placeholder="Enter your email"
            className={inputClassName}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full cursor-pointer border border-primary bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
        >
          {isSubmitting ? 'Sending link...' : 'Send reset link'}
        </button>
      </form>
    </AuthCard>
  )
}
