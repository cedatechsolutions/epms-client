import { create } from 'zustand'
import { getCurrentUser, login, logout } from '../api/authApi'
import { clearStoredAccessToken, getStoredAccessToken, setStoredAccessToken } from '../lib/tokenStorage'
import type { AuthResponse, AuthUser, LoginPayload } from '../types'

type AuthState = {
  accessToken: string | null
  user: AuthUser | null
  isBootstrapping: boolean
  isAuthenticating: boolean
  bootstrapAuth: () => Promise<void>
  signIn: (payload: LoginPayload) => Promise<AuthUser>
  clearSession: () => void
  signOut: () => Promise<void>
}

function toAuthUser(response: AuthResponse): AuthUser {
  return {
    id: response.id,
    email: response.email,
    firstName: response.firstName,
    lastName: response.lastName,
    middleName: response.middleName,
    contactNumber: response.contactNumber,
    roles: response.roles,
  }
}

function resetSessionState() {
  return {
    accessToken: null,
    user: null,
    isAuthenticating: false,
    isBootstrapping: false,
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: getStoredAccessToken(),
  user: null,
  isBootstrapping: true,
  isAuthenticating: false,
  bootstrapAuth: async () => {
    const accessToken = getStoredAccessToken()

    if (!accessToken) {
      set({
        ...resetSessionState(),
      })
      return
    }

    set({
      accessToken,
      isBootstrapping: true,
    })

    try {
      const user = await getCurrentUser()
      set({
        accessToken,
        user,
        isBootstrapping: false,
      })
    } catch {
      clearStoredAccessToken()
      set({
        ...resetSessionState(),
      })
    }
  },
  signIn: async (payload) => {
    set({
      isAuthenticating: true,
    })

    try {
      const response = await login(payload)
      const user = toAuthUser(response)

      setStoredAccessToken(response.accessToken)
      set({
        accessToken: response.accessToken,
        user,
        isAuthenticating: false,
        isBootstrapping: false,
      })

      return user
    } catch (error) {
      clearStoredAccessToken()
      set({
        ...resetSessionState(),
      })
      throw error
    }
  },
  clearSession: () => {
    clearStoredAccessToken()
    set({
      ...resetSessionState(),
    })
  },
  signOut: async () => {
    try {
      await logout()
    } catch {
      // Local sign-out should still succeed even if the server call fails.
    } finally {
      clearStoredAccessToken()
      set({
        ...resetSessionState(),
      })
    }
  },
}))
