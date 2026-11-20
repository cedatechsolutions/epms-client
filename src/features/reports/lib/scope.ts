import type { ReportScopeValue } from '../types'

/** Client-side mirror of the server's required-field rule, for an inline message before submitting. */
export function scopeValidationMessage(value: ReportScopeValue): string | null {
  if (value.scope === 'community' && !value.communityId) return 'Choose a community.'
  if (value.scope === 'program' && !value.programId) return 'Choose a program.'
  return null
}

/** The request body for a scope. Fields the chosen scope does not use are left out. */
export function scopePayload(value: ReportScopeValue) {
  return {
    scope: value.scope,
    periodId: value.scope === 'program' ? undefined : value.periodId || undefined,
    communityId: value.scope === 'community' ? value.communityId : undefined,
    programId: value.scope === 'program' ? value.programId : undefined,
  }
}
