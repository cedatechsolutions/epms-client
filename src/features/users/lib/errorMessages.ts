import { isApiError } from '@/shared/api/http'

export function getUserRequestErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return 'Something went wrong. Please try again.'
  }

  if (error.status === 403) {
    return 'You are not allowed.'
  }

  if (error.status === 404) {
    return 'User not found.'
  }

  if (error.status >= 500) {
    return 'Something went wrong on the server. Please retry.'
  }

  return error.message || 'Request failed.'
}
