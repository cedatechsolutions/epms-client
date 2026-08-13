import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { CAMPUS_CONTACT } from '@/shared/config/campusContact'

/**
 * Login side panel, "public entry points" variant — survey-code entry, campus contact,
 * and the privacy-notice link, laid out on the green field.
 *
 * NOT currently mounted: `LoginPage` renders `LoginBrandPanel` instead. Kept as the
 * alternative treatment for that column; it is self-contained, so swapping the two is a
 * one-line change in `LoginPage`. If this is revived, drop the duplicate survey-code
 * block from the login form column.
 */
export default function LoginPublicPanel() {
  const navigate = useNavigate()
  const [surveyCode, setSurveyCode] = useState('')

  // Client-side only: the survey page itself validates the token and renders the
  // not-found / closed states, so we never probe the API from here.
  const handleSurveyCodeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = surveyCode.trim()
    if (!code) return
    navigate(`/s/${encodeURIComponent(code)}`)
  }

  return (
    <section className="flex flex-col justify-center bg-[#123524] px-6 py-12 text-white sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-[400px] lg:mx-0 lg:max-w-md">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
          For community members
        </p>
        <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.03em]">
          Answering a community needs survey?
        </h2>
        <p className="mt-3 text-sm leading-7 text-white/70">
          You do not need an account. Open the link the extension office gave you, or enter your survey
          code below.
        </p>

        <form className="mt-6" onSubmit={handleSurveyCodeSubmit}>
          <label htmlFor="survey-code-panel" className="mb-2 block text-sm font-medium text-white">
            Survey code
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="survey-code-panel"
              name="survey-code"
              value={surveyCode}
              onChange={(event) => setSurveyCode(event.target.value)}
              placeholder="Enter your survey code"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-white/25 bg-white/10 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/50 focus:border-white"
            />
            {/* Inverted control: it sits on the green panel, which is dark in both themes, so
                white and the dark ink are literal here rather than theme tokens (§3.2). */}
            <button
              type="submit"
              disabled={surveyCode.trim() === ''}
              className="shrink-0 cursor-pointer rounded-lg border border-white bg-white px-5 py-3 text-sm font-medium text-[#123524] transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Open survey
            </button>
          </div>
        </form>

        <div className="mt-10 border-t border-white/15 pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Need help?</p>
          <p className="mt-3 text-sm leading-7 text-white/70">
            {CAMPUS_CONTACT.officeName}
            <br />
            {CAMPUS_CONTACT.campusName}
          </p>
          <p className="mt-2 text-sm leading-7 text-white/70">
            <a
              href={`mailto:${CAMPUS_CONTACT.email}`}
              className="font-medium text-white underline-offset-4 transition-colors hover:underline"
            >
              {CAMPUS_CONTACT.email}
            </a>
            <br />
            {CAMPUS_CONTACT.phone}
          </p>
          <p className="mt-4 text-sm">
            <Link
              to="/privacy"
              className="font-medium text-white underline-offset-4 transition-colors hover:underline"
            >
              Privacy notice
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
