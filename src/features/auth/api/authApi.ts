import { getRequest, postRequest } from '@/shared/api/http'
import type { AuthResponse, AuthUser, LoginPayload } from '../types'

type ApiResponse = {
  message: string
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return postRequest<AuthResponse, LoginPayload>('/auth/login', payload)
}

export function getCurrentUser(): Promise<AuthUser> {
  return getRequest<AuthUser>('/users/me')
}

export function logout(): Promise<ApiResponse> {
  return postRequest<ApiResponse>('/auth/logout')
}
