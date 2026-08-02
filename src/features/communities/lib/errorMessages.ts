import { isApiError } from '@/shared/api/http'

/** Human-friendly message for a failed community request, falling back to a generic line. */
export function getCommunityErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message || 'Something went wrong. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}
