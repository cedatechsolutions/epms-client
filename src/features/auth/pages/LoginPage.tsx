import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { isApiError } from '@/shared/api/http'
import RecaptchaWidget from '../components/RecaptchaWidget'
import { useAuthStore } from '../store/authStore'

function resolveRedirectPath(from: unknown): string {
  if (!from || typeof from !== 'object' || !('pathname' in from) || typeof from.pathname !== 'string') {
    return '/admin/dashboard'
  }

  const search = 'search' in from && typeof from.search === 'string' ? from.search : ''
  const hash = 'hash' in from && typeof from.hash === 'string' ? from.hash : ''
  return `${from.pathname}${search}${hash}` || '/admin/dashboard'
}

export default function LoginPage() {
  const recaptchaEnabled = import.meta.env.VITE_RECAPTCHA_ENABLED === 'true'
  const recaptchaSiteKey = (import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '').trim()
  const isRecaptchaConfigured = !recaptchaEnabled || Boolean(recaptchaSiteKey)
  const navigate = useNavigate()
  const location = useLocation()
  const signIn = useAuthStore((state) => state.signIn)
  const isAuthenticating = useAuthStore((state) => state.isAuthenticating)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [recaptchaResetSignal, setRecaptchaResetSignal] = useState(0)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    setErrorMessage(null)

    if (recaptchaEnabled && !recaptchaSiteKey) {
      setErrorMessage('Sign in verification is temporarily unavailable.')
      return
    }

    if (recaptchaEnabled && !captchaToken) {
      setErrorMessage('Complete the reCAPTCHA challenge.')
      return
    }

    try {
      await signIn({ email, password, captchaToken })
      navigate(resolveRedirectPath((location.state as { from?: unknown } | null)?.from), { replace: true })
    } catch (error) {
      if (recaptchaEnabled) {
        setCaptchaToken(null)
        setRecaptchaResetSignal((current) => current + 1)
      }
      setErrorMessage(isApiError(error) ? error.message : 'Unable to sign in. Please try again.')
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f4f7f1] px-4 py-10 text-[#123524] md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-1 items-center justify-center">
        <section className="w-full max-w-[420px] border border-[#d8e1d4] bg-white p-8 shadow-[0_12px_30px_rgba(18,53,36,0.05)] md:p-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#123524]">
              Cavite State University
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#123524]">
              Extension Projects Management System
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#506552]">
              Sign in to continue to the administrative workspace.
            </p>
          </div>

          <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
            {errorMessage ? (
              <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">
                {errorMessage}
              </div>
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
                disabled={isAuthenticating}
                required
                placeholder="Enter your email"
                className="w-full border border-[#cad5c7] bg-white px-4 py-3 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b]"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#123524]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isAuthenticating}
                  required
                  placeholder="Enter your password"
                  className="w-full border border-[#cad5c7] bg-white px-4 py-3 pr-12 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b]"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  disabled={isAuthenticating}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#60755f] transition-colors hover:text-[#123524] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                </button>
              </div>
            </div>

            {recaptchaEnabled ? (
              <div>
                <p className="mb-2 block text-sm font-medium text-[#123524]">Verification</p>
                <RecaptchaWidget
                  siteKey={recaptchaSiteKey}
                  resetSignal={recaptchaResetSignal}
                  onTokenChange={setCaptchaToken}
                />
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isAuthenticating || !isRecaptchaConfigured}
              className="w-full border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#18492e]"
            >
              {isAuthenticating ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </section>
      </div>

      <p className="mt-6 text-center text-sm text-[#8a9989]">CEDA Tech Solutions</p>
    </main>
  )
}
