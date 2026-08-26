import { isApiError } from '@/shared/api/http'

/**
 * Human-friendly message for a failed proposal request.
 *
 * <p>The server's own message is preferred because Module 5a's two failure modes read very
 * differently and both matter to the user: a 409 means the proposal moved on while they were
 * looking at it ("this proposal is no longer awaiting your review"), while a 403 means they never
 * owned that stage. Flattening either into a generic line would hide which one happened.
 */
export function getProgramErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message || 'Something went wrong. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}

/** True when the failure was a stage conflict — the caller should reload before retrying. */
export function isStageConflict(error: unknown): boolean {
  return isApiError(error) && error.status === 409
}
