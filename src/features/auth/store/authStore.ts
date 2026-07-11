import { create } from 'zustand'
import { getCurrentUser, login, logout } from '../api/authApi'
import {
  clearStoredTokens,
  getStoredAccessToken,
  setStoredTokens,
} from '../lib/tokenStorage'
import type { AuthResponse, AuthUser, LoginPayload } from '../types'

type SignInResult = {
  user: AuthUser
  mustChangePassword: boolean
}

type AuthState = {
  accessToken: string | null
  user: AuthUser | null
  mustChangePassword: boolean
  isBootstrapping: boolean
  isAuthenticating: boolean
  bootstrapAuth: () => Promise<void>
  signIn: (payload: LoginPayload) => Promise<SignInResult>
  clearSession: () => void
  signOut: () => Promise<void>
  markPasswordChanged: () => void
}

function toAuthUser(response: AuthResponse | AuthUser): AuthUser {
  return {
    id: response.id,
    email: response.email,
    firstName: response.firstName,
    lastName: response.lastName,
    middleName: response.middleName,
    contactNumber: response.contactNumber,
    roles: response.roles,
    mustChangePassword: response.mustChangePassword ?? false,
  }
}

function resetSessionState() {
  return {
    accessToken: null,
    user: null,
    mustChangePassword: false,
    isAuthenticating: false,
    isBootstrapping: false,
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: getStoredAccessToken(),
  user: null,
  mustChangePassword: false,
  isBootstrapping: true,
  isAuthenticating: false,
  bootstrapAuth: async () => {
    const accessToken = getStoredAccessToken()

    if (!accessToken) {
      set({ ...resetSessionState() })
      return
    }

    set({ accessToken, isBootstrapping: true })

    try {
      const user = await getCurrentUser()
      set({
        accessToken: getStoredAccessToken(),
        user,
        mustChangePassword: user.mustChangePassword ?? false,
        isBootstrapping: false,
      })
    } catch {
      clearStoredTokens()
      set({ ...resetSessionState() })
    }
  },
  signIn: async (payload) => {
    set({ isAuthenticating: true })

    try {
      const response = await login(payload)
      const user = toAuthUser(response)

      setStoredTokens(response.accessToken, response.refreshToken)
      set({
        accessToken: response.accessToken,
        user,
        mustChangePassword: response.mustChangePassword,
        isAuthenticating: false,
        isBootstrapping: false,
      })

      return { user, mustChangePassword: response.mustChangePassword }
    } catch (error) {
      clearStoredTokens()
      set({ ...resetSessionState() })
      throw error
    }
  },
  clearSession: () => {
    clearStoredTokens()
    set({ ...resetSessionState() })
  },
  signOut: async () => {
    try {
      await logout()
    } catch {
      // Local sign-out should still succeed even if the server call fails.
    } finally {
      clearStoredTokens()
      set({ ...resetSessionState() })
    }
  },
  markPasswordChanged: () => set({ mustChangePassword: false }),
}))
