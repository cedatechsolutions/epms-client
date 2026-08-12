import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { isApiError } from '@/shared/api/http'
import { notify } from '@/shared/toast'
import LoginBrandPanel from '../components/LoginBrandPanel'
import RecaptchaWidget from '../components/RecaptchaWidget'
import { useAuthStore } from '../store/authStore'

const inputClassName =
  'w-full rounded-lg border border-[#cad5c7] bg-white px-4 py-3 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]'

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
  const locationNotice =
    location.state && typeof location.state === 'object' && 'notice' in location.state
      ? String((location.state as { notice?: unknown }).notice ?? '')
      : ''
  const [showPassword, setShowPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [recaptchaResetSignal, setRecaptchaResetSignal] = useState(0)

  // Surface any redirect notice (e.g. after a password reset) as a toast, once.
  useEffect(() => {
    if (locationNotice) {
      notify.success(locationNotice)
    }
  }, [locationNotice])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    if (recaptchaEnabled && !recaptchaSiteKey) {
      notify.warning('Sign in verification is temporarily unavailable.')
      return
    }

    if (recaptchaEnabled && !captchaToken) {
      notify.warning('Complete the reCAPTCHA challenge.')
      return
    }

    try {
      const result = await signIn({ email, password, captchaToken })
      if (result.mustChangePassword) {
        navigate('/change-password', { replace: true })
        return
      }
      navigate(resolveRedirectPath((location.state as { from?: unknown } | null)?.from), { replace: true })
    } catch (error) {
      if (recaptchaEnabled) {
        setCaptchaToken(null)
        setRecaptchaResetSignal((current) => current + 1)
      }
      notify.error(isApiError(error) ? error.message : 'Unable to sign in. Please try again.')
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#123524] lg:grid lg:grid-cols-2">
      <section className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:min-h-screen lg:px-16">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Cavite State University logo" className="h-14 w-14 shrink-0 object-contain" />
            <div>
              <p className="text-md font-semibold tracking-[-0.02em] text-[#123524]">Cavite State University - Bacoor City</p>
              <p className="text-xs text-[#6a7f6d]">Extension Projects Management System</p>
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[#123524]">Sign in</h1>
          <p className="text-sm leading-6 text-[#506552]">
            Sign in to continue to your account.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
                className={inputClassName}
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
                  className={`${inputClassName} pr-12`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  disabled={isAuthenticating}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center rounded-r-lg text-[#60755f] transition-colors hover:text-[#123524] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                </button>
              </div>
            </div>

           
            <div>
              <button
                type="submit"
                disabled={isAuthenticating || !isRecaptchaConfigured}
                className="w-full cursor-pointer rounded-lg border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAuthenticating ? 'Signing in...' : 'Sign in'}
              </button>

              <p className="text- mt-2 text-sm text-[#506552]">
                <Link to="/forgot-password" className="font-medium text-[#1f5d3b] transition-colors hover:text-[#18492e]">
                  Forgot your password?
                </Link>
              </p>
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
          </form>

          {/* The public entry points (survey-code entry, privacy notice, campus contact)
              are currently not rendered here. A working copy lives in
              `../components/LoginPublicPanel.tsx` — restore from there rather than
              re-writing it. Note that with them absent, `/privacy` is reachable only from
              the public survey form. */}
        </div>
      </section>

      <LoginBrandPanel />
    </main>
  )
}
