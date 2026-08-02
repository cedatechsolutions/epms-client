/**
 * Best-effort per-device dedupe (spec Module 3 §3): a random token stored in localStorage and sent
 * with the submission. The server enforces one response per token per survey. This is explicitly
 * NOT bulletproof — clearing storage or switching browsers defeats it, and that is accepted.
 */

const TOKEN_PREFIX = 'cems.respondent.'
const SUBMITTED_PREFIX = 'cems.submitted.'

function randomToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Returns this device's token for the given survey, creating and persisting one on first use. */
export function getRespondentToken(surveyToken: string): string {
  const key = `${TOKEN_PREFIX}${surveyToken}`
  try {
    const existing = window.localStorage.getItem(key)
    if (existing) return existing

    const token = randomToken()
    window.localStorage.setItem(key, token)
    return token
  } catch {
    // Private browsing or storage disabled — fall back to a per-session token.
    return randomToken()
  }
}

export function hasSubmitted(surveyToken: string): boolean {
  try {
    return window.localStorage.getItem(`${SUBMITTED_PREFIX}${surveyToken}`) === 'true'
  } catch {
    return false
  }
}

export function markSubmitted(surveyToken: string): void {
  try {
    window.localStorage.setItem(`${SUBMITTED_PREFIX}${surveyToken}`, 'true')
  } catch {
    // Ignore — the server-side dedupe is the real guard.
  }
}
