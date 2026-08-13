import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { isApiError } from '@/shared/api/http'
import { requestPasswordReset } from '../api/authApi'
import AuthCard from '../components/AuthCard'

const inputClassName =
  'w-full border border-[#cad5c7] bg-white px-4 py-3 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c] rounded-md'

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
        <Link to="/login" className="font-medium text-[#1f5d3b] transition-colors hover:text-[#18492e]">
          Back to sign in
        </Link>
      }
    >
      <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
        {errorMessage ? (
          <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">{errorMessage}</div>
        ) : null}
        {successMessage ? (
          <div className="border border-[#bfd3c0] bg-[#f3f9f2] px-4 py-3 text-sm text-[#1f5d3b]">{successMessage}</div>
        ) : null}

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#123524]">
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
          className="w-full cursor-pointer border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
        >
          {isSubmitting ? 'Sending link...' : 'Send reset link'}
        </button>
      </form>
    </AuthCard>
  )
}
