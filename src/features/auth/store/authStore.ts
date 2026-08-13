import { create } from 'zustand'
import { getAvatarBlob, getCurrentUser, login, logout } from '../api/authApi'
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
  /** Object URL for the signed-in user's photo, or null when they have none. */
  avatarUrl: string | null
  mustChangePassword: boolean
  isBootstrapping: boolean
  isAuthenticating: boolean
  bootstrapAuth: () => Promise<void>
  signIn: (payload: LoginPayload) => Promise<SignInResult>
  clearSession: () => void
  signOut: () => Promise<void>
  markPasswordChanged: () => void
  /** Replaces the session user after a self-service edit, re-fetching the photo if it changed. */
  setUser: (user: AuthUser) => void
  refreshAvatar: () => Promise<void>
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
    avatarUpdatedAt: response.avatarUpdatedAt ?? null,
    mustChangePassword: response.mustChangePassword ?? false,
  }
}

function resetSessionState() {
  return {
    accessToken: null,
    user: null,
    avatarUrl: null,
    mustChangePassword: false,
    isAuthenticating: false,
    isBootstrapping: false,
  }
}

/** Object URLs are leaked memory until revoked, so every replacement releases the previous one. */
function revokeAvatarUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url)
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: getStoredAccessToken(),
  user: null,
  avatarUrl: null,
  mustChangePassword: false,
  isBootstrapping: true,
  isAuthenticating: false,
  bootstrapAuth: async () => {
    const accessToken = getStoredAccessToken()

    if (!accessToken) {
      revokeAvatarUrl(get().avatarUrl)
      set({ ...resetSessionState() })
      return
    }

    set({ accessToken, isBootstrapping: true })

    try {
      const user = toAuthUser(await getCurrentUser())
      set({
        accessToken: getStoredAccessToken(),
        user,
        mustChangePassword: user.mustChangePassword ?? false,
        isBootstrapping: false,
      })
      // Non-blocking: the shell renders with initials until the photo arrives.
      void get().refreshAvatar()
    } catch {
      clearStoredTokens()
      revokeAvatarUrl(get().avatarUrl)
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
      void get().refreshAvatar()

      return { user, mustChangePassword: response.mustChangePassword }
    } catch (error) {
      clearStoredTokens()
      revokeAvatarUrl(get().avatarUrl)
      set({ ...resetSessionState() })
      throw error
    }
  },
  clearSession: () => {
    clearStoredTokens()
    revokeAvatarUrl(get().avatarUrl)
    set({ ...resetSessionState() })
  },
  signOut: async () => {
    try {
      await logout()
    } catch {
      // Local sign-out should still succeed even if the server call fails.
    } finally {
      clearStoredTokens()
      revokeAvatarUrl(get().avatarUrl)
      set({ ...resetSessionState() })
    }
  },
  markPasswordChanged: () => set({ mustChangePassword: false }),
  setUser: (user) => {
    const previousAvatarKey = get().user?.avatarUpdatedAt ?? null
    // Normalized here because API responses omit null fields entirely.
    const nextUser = toAuthUser(user)
    set({ user: nextUser, mustChangePassword: nextUser.mustChangePassword ?? false })

    if (nextUser.avatarUpdatedAt !== previousAvatarKey) {
      void get().refreshAvatar()
    }
  },
  refreshAvatar: async () => {
    if (!get().user?.avatarUpdatedAt) {
      revokeAvatarUrl(get().avatarUrl)
      set({ avatarUrl: null })
      return
    }

    try {
      const nextUrl = URL.createObjectURL(await getAvatarBlob())
      revokeAvatarUrl(get().avatarUrl)
      set({ avatarUrl: nextUrl })
    } catch {
      // A missing or unreadable photo is not a session failure — fall back to initials.
      revokeAvatarUrl(get().avatarUrl)
      set({ avatarUrl: null })
    }
  },
}))
