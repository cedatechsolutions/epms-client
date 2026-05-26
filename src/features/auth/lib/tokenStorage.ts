const AUTH_TOKEN_STORAGE_KEY = 'cems.auth.accessToken'

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)?.trim()
  return token ? token : null
}

export function setStoredAccessToken(token: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

export function clearStoredAccessToken(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}
