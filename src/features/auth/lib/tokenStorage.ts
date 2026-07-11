const AUTH_TOKEN_STORAGE_KEY = 'cems.auth.accessToken'
const REFRESH_TOKEN_STORAGE_KEY = 'cems.auth.refreshToken'

function readToken(key: string): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const token = window.localStorage.getItem(key)?.trim()
  return token ? token : null
}

function writeToken(key: string, token: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, token)
}

function removeToken(key: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(key)
}

export function getStoredAccessToken(): string | null {
  return readToken(AUTH_TOKEN_STORAGE_KEY)
}

export function setStoredAccessToken(token: string): void {
  writeToken(AUTH_TOKEN_STORAGE_KEY, token)
}

export function getStoredRefreshToken(): string | null {
  return readToken(REFRESH_TOKEN_STORAGE_KEY)
}

export function setStoredRefreshToken(token: string): void {
  writeToken(REFRESH_TOKEN_STORAGE_KEY, token)
}

/** Persists a freshly issued access + refresh token pair. */
export function setStoredTokens(accessToken: string, refreshToken: string): void {
  writeToken(AUTH_TOKEN_STORAGE_KEY, accessToken)
  writeToken(REFRESH_TOKEN_STORAGE_KEY, refreshToken)
}

export function clearStoredAccessToken(): void {
  removeToken(AUTH_TOKEN_STORAGE_KEY)
}

/** Clears both tokens on logout / unrecoverable auth failure. */
export function clearStoredTokens(): void {
  removeToken(AUTH_TOKEN_STORAGE_KEY)
  removeToken(REFRESH_TOKEN_STORAGE_KEY)
}
